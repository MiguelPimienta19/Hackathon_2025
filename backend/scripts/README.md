# Supabase to Snowflake Data Pipeline

Simple data pipeline that syncs your Supabase questions table to Snowflake for analytics.

## Setup (5 minutes)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Get Your Snowflake Credentials

You need these 5 things from your Snowflake account:

1. **Account**: `your-account.region` (e.g., `xy12345.us-east-1`)
   - Find it in your Snowflake URL: `https://YOUR-ACCOUNT.snowflakecomputing.com`

2. **User**: Your Snowflake username

3. **Password**: Your Snowflake password

4. **Warehouse**: Name of your compute warehouse (e.g., `COMPUTE_WH`)
   - Create one in Snowflake: `CREATE WAREHOUSE COMPUTE_WH;`

5. **Database**: Name of your database (e.g., `ANALYTICS`)
   - Create one in Snowflake: `CREATE DATABASE ANALYTICS;`

### 3. Add Credentials to .env.local

Open `/.env.local` and replace the placeholders:

```bash
# Replace these with your actual Snowflake credentials:
SNOWFLAKE_ACCOUNT=xy12345.us-east-1
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=ANALYTICS
SNOWFLAKE_SCHEMA=PUBLIC
SNOWFLAKE_TABLE=QUESTIONS
```

## Usage

### Run the Pipeline

```bash
cd backend
python scripts/supabase_to_snowflake.py
```

That's it! The script will:
1. Fetch all questions from your Supabase database
2. Create a `QUESTIONS` table in Snowflake (if it doesn't exist)
3. Sync all data to Snowflake

### Run Automatically (Optional)

To run every day at 2 AM, add this to your crontab:

```bash
0 2 * * * cd /Users/alexanderrankine/Desktop/Hackathon_2025/backend && python scripts/supabase_to_snowflake.py >> logs/pipeline.log 2>&1
```

## What Gets Synced

All fields from your `questions` table:
- id
- question_text
- option_a, option_b, option_c, option_d
- correct_option
- difficulty
- topic
- subtopic

Plus a `synced_at` timestamp for each record.

## Quick Start with Snowflake (Free Trial)

Don't have Snowflake yet? Get started in 2 minutes:

1. Go to https://signup.snowflake.com/
2. Sign up for a free trial (no credit card required)
3. Choose AWS/Azure/GCP and a region
4. Once logged in, run these commands in the Snowflake worksheet:

```sql
-- Create warehouse
CREATE WAREHOUSE COMPUTE_WH WITH WAREHOUSE_SIZE = 'XSMALL';

-- Create database
CREATE DATABASE ANALYTICS;

-- Use the database
USE DATABASE ANALYTICS;
USE SCHEMA PUBLIC;

-- Done! Now run the pipeline script
```

## Troubleshooting

**Connection Error**: Check your `SNOWFLAKE_ACCOUNT` format. It should be `account.region` (e.g., `xy12345.us-east-1`)

**Authentication Failed**: Verify your username/password are correct

**No Data**: Make sure you have questions in your Supabase table

## Analytics Queries

Once your data is in Snowflake, try these queries:

```sql
-- Count questions by difficulty
SELECT difficulty, COUNT(*) as count
FROM QUESTIONS
GROUP BY difficulty;

-- Count questions by topic
SELECT topic, COUNT(*) as count
FROM QUESTIONS
GROUP BY topic
ORDER BY count DESC;

-- Find recently synced data
SELECT *
FROM QUESTIONS
WHERE synced_at >= DATEADD(day, -1, CURRENT_TIMESTAMP());
```

## Need Help?

The script will show detailed progress and any errors. If something fails, it will tell you exactly what's missing.
