"""
Simple Data Pipeline: Supabase → Snowflake
Fetches data from Supabase and loads it into Snowflake using Python connector
"""

import os
import sys
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.supabase import get_supabase_client

try:
    import snowflake.connector
    from snowflake.connector import DictCursor
except ImportError:
    print("✗ snowflake-connector-python not installed")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


class SnowflakeClient:
    """Simple Snowflake client using official Python connector"""

    def __init__(self, account: str, user: str, password: str, warehouse: str, database: str, schema: str):
        self.account = account.strip('"')  # Remove quotes if present
        self.user = user.strip('"')
        self.password = password.strip('"')
        self.warehouse = warehouse.strip('"')
        self.database = database.strip('"')
        self.schema = schema.strip('"')
        self.conn = None
        self.cursor = None

    def connect(self) -> bool:
        """Connect to Snowflake"""
        try:
            # Handle both password and SSO authentication
            conn_params = {
                'account': self.account,
                'user': self.user,
                'warehouse': self.warehouse
            }

            # If password is 'externalbrowser', use SSO
            if self.password.lower() == 'externalbrowser':
                conn_params['authenticator'] = 'externalbrowser'
            else:
                conn_params['password'] = self.password

            self.conn = snowflake.connector.connect(**conn_params)
            self.cursor = self.conn.cursor(DictCursor)

            # Set context manually to handle special characters
            self.cursor.execute(f'USE DATABASE "{self.database}"')
            self.cursor.execute(f'USE SCHEMA "{self.schema}"')

            # Test connection
            self.cursor.execute("SELECT CURRENT_VERSION()")
            version = self.cursor.fetchone()
            print(f"✓ Connected to Snowflake (version {version['CURRENT_VERSION()']})")
            return True

        except Exception as e:
            print(f"✗ Failed to connect to Snowflake: {e}")
            return False

    def execute_query(self, query: str, params: tuple = None) -> bool:
        """Execute a SQL query"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return True
        except Exception as e:
            print(f"✗ Query failed: {e}")
            return False

    def create_table_if_not_exists(self, table_name: str):
        """Create the questions table in Snowflake if it doesn't exist"""
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id VARCHAR(255) PRIMARY KEY,
            question_text TEXT,
            option_a TEXT,
            option_b TEXT,
            option_c TEXT,
            option_d TEXT,
            correct_option VARCHAR(1),
            difficulty VARCHAR(20),
            topic VARCHAR(255),
            subtopic VARCHAR(255),
            synced_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
        """

        if self.execute_query(create_table_query):
            print(f"✓ Table {table_name} is ready")
            return True
        return False

    def insert_data_batch(self, table_name: str, records: List[Dict[str, Any]]):
        """Insert data into Snowflake table using batch insert"""
        if not records:
            print("No records to insert")
            return

        print(f"Syncing {len(records)} records to Snowflake...")

        # Use MERGE for upsert functionality
        merge_query = f"""
        MERGE INTO {table_name} t
        USING (SELECT %s as id) s
        ON t.id = s.id
        WHEN NOT MATCHED THEN
            INSERT (id, question_text, option_a, option_b, option_c, option_d,
                   correct_option, difficulty, topic, subtopic)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        success_count = 0
        for record in records:
            try:
                # Extract values in the correct order
                values = (
                    record.get('id', ''),
                    record.get('id', ''),
                    record.get('question_text', ''),
                    record.get('option_a', ''),
                    record.get('option_b', ''),
                    record.get('option_c', ''),
                    record.get('option_d', ''),
                    record.get('correct_option', ''),
                    record.get('difficulty', ''),
                    record.get('topic', ''),
                    record.get('subtopic', '')
                )

                self.cursor.execute(merge_query, values)
                success_count += 1

                if success_count % 10 == 0:
                    print(f"  ✓ Synced {success_count}/{len(records)} records...")

            except Exception as e:
                print(f"  ✗ Failed to sync record {record.get('id', 'unknown')}: {e}")

        # Commit all changes
        self.conn.commit()
        print(f"✓ Successfully synced {success_count}/{len(records)} records")

    def close(self):
        """Close the connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()


def fetch_supabase_data() -> List[Dict[str, Any]]:
    """Fetch all questions from Supabase"""
    print("Fetching data from Supabase...")

    try:
        supabase = get_supabase_client()
        response = supabase.table("questions").select("*").execute()

        if response.data:
            print(f"✓ Fetched {len(response.data)} records from Supabase")
            return response.data
        else:
            print("✗ No data found in Supabase")
            return []

    except Exception as e:
        print(f"✗ Error fetching from Supabase: {e}")
        return []


def run_pipeline():
    """Main pipeline function"""
    print("\n" + "="*60)
    print("Data Pipeline: Supabase → Snowflake")
    print("="*60 + "\n")

    # Load environment variables
    load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

    # Get Snowflake credentials from environment
    sf_account = os.getenv("SNOWFLAKE_ACCOUNT")
    sf_user = os.getenv("SNOWFLAKE_USER")
    sf_password = os.getenv("SNOWFLAKE_PASSWORD")
    sf_warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")
    sf_database = os.getenv("SNOWFLAKE_DATABASE")
    sf_schema = os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC")
    sf_table = os.getenv("SNOWFLAKE_TABLE", "QUESTIONS")

    # Validate credentials
    if not all([sf_account, sf_user, sf_warehouse, sf_database]):
        print("✗ Missing Snowflake credentials in .env.local")
        print("\nRequired environment variables:")
        print("  - SNOWFLAKE_ACCOUNT")
        print("  - SNOWFLAKE_USER")
        print("  - SNOWFLAKE_PASSWORD (or 'externalbrowser' for SSO)")
        print("  - SNOWFLAKE_WAREHOUSE")
        print("  - SNOWFLAKE_DATABASE")
        print("  - SNOWFLAKE_SCHEMA (optional, defaults to PUBLIC)")
        print("  - SNOWFLAKE_TABLE (optional, defaults to QUESTIONS)")
        return

    # Step 1: Fetch data from Supabase
    data = fetch_supabase_data()
    if not data:
        print("\nNo data to sync. Exiting.")
        return

    # Step 2: Connect to Snowflake
    print("\nConnecting to Snowflake...")
    snowflake = SnowflakeClient(
        account=sf_account,
        user=sf_user,
        password=sf_password or 'externalbrowser',
        warehouse=sf_warehouse,
        database=sf_database,
        schema=sf_schema
    )

    if not snowflake.connect():
        print("\nFailed to connect to Snowflake. Check your credentials.")
        print("\nTip: If using SSO, set SNOWFLAKE_PASSWORD='externalbrowser'")
        return

    try:
        # Step 3: Create table if it doesn't exist
        print("\nPreparing Snowflake table...")
        snowflake.create_table_if_not_exists(sf_table)

        # Step 4: Insert data
        print()
        snowflake.insert_data_batch(sf_table, data)

        print("\n" + "="*60)
        print(f"✓ Pipeline completed successfully at {datetime.now()}")
        print("="*60 + "\n")

    finally:
        snowflake.close()


if __name__ == "__main__":
    run_pipeline()
