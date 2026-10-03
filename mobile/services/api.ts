// Offline demo API service for the vendored portfolio build.
// Same public interface as the original api.ts, but every method resolves
// locally from bundled synthetic data — no backend, no network at runtime.

export const API_BASE_URL = 'offline-demo';

export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  topic: string;
  subtopic: string;
}

export interface DeepQuestion {
  id: string;
  prompt: string;
  topic: string;
  difficulty: string;
  rubric_points: string[];
  /** Demo-only: pre-scripted candidate answer shown in the canned voice flow */
  demo_answer: string;
}

export interface CheckAnswerResponse {
  correct: boolean;
  correct_option?: string;
  message: string;
  error?: string;
}

export interface EvaluateAnswerRequest {
  question: string;
  user_answer: string;
  ideal_answer?: string;
}

export interface EvaluateAnswerResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  audio_base64: string;
  audio_size_bytes: number;
}

export interface GetQuestionsParams {
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  subtopic?: string;
  limit?: number;
  randomize?: boolean;
}

export interface GetDeepQuestionsParams {
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
}

// ---------------------------------------------------------------------------
// Multiple-choice question bank (synthetic, generic CS knowledge)
// ---------------------------------------------------------------------------

interface BankQuestion extends Question {
  correct: 'A' | 'B' | 'C' | 'D';
}

const MCQ_BANK: BankQuestion[] = [
  // --- Operating Systems & Concurrency ---
  {
    id: 'os-1',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Processes',
    difficulty: 'easy',
    question_text: 'What is the main difference between a process and a thread?',
    option_a: 'Threads share the same address space; processes have separate address spaces',
    option_b: 'Processes are faster to create than threads',
    option_c: 'Threads cannot run concurrently',
    option_d: 'Processes always share memory with each other',
    correct: 'A',
  },
  {
    id: 'os-2',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Synchronization',
    difficulty: 'medium',
    question_text: 'Which condition is NOT required for a deadlock to occur?',
    option_a: 'Mutual exclusion',
    option_b: 'Hold and wait',
    option_c: 'Preemption of held resources',
    option_d: 'Circular wait',
    correct: 'C',
  },
  {
    id: 'os-3',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Synchronization',
    difficulty: 'easy',
    question_text: 'What does a mutex guarantee?',
    option_a: 'Threads execute in FIFO order',
    option_b: 'Only one thread can hold the lock at a time',
    option_c: 'No thread will ever block',
    option_d: 'Memory is automatically freed after use',
    correct: 'B',
  },
  {
    id: 'os-4',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Scheduling',
    difficulty: 'medium',
    question_text: 'What is a context switch?',
    option_a: 'Moving a program from disk to memory',
    option_b: 'Compiling code for a different CPU architecture',
    option_c: 'Saving the state of one process/thread and restoring another to run on the CPU',
    option_d: 'Switching a socket between TCP and UDP',
    correct: 'C',
  },
  {
    id: 'os-5',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Memory',
    difficulty: 'medium',
    question_text: 'What is the purpose of virtual memory?',
    option_a: 'To give each process the illusion of a large, private address space',
    option_b: 'To make RAM physically larger',
    option_c: 'To store files permanently',
    option_d: 'To speed up the CPU clock',
    correct: 'A',
  },
  {
    id: 'os-6',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Synchronization',
    difficulty: 'hard',
    question_text: 'A race condition occurs when:',
    option_a: 'Two threads run on different cores',
    option_b: 'The outcome depends on the unsynchronized timing of concurrent operations',
    option_c: 'A process uses more CPU than allowed',
    option_d: 'The scheduler always picks the same thread',
    correct: 'B',
  },
  {
    id: 'os-7',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Memory',
    difficulty: 'hard',
    question_text: 'What happens on a page fault?',
    option_a: 'The program always crashes',
    option_b: 'The CPU cache is flushed',
    option_c: 'The OS kills the process immediately',
    option_d: 'The OS loads the missing page into memory, possibly evicting another page',
    correct: 'D',
  },
  {
    id: 'os-8',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Scheduling',
    difficulty: 'easy',
    question_text: 'Which scheduling policy can starve a low-priority job indefinitely?',
    option_a: 'Round robin with equal time slices',
    option_b: 'First-come first-served',
    option_c: 'Strict priority scheduling without aging',
    option_d: 'Lottery scheduling',
    correct: 'C',
  },
  {
    id: 'os-9',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Concurrency',
    difficulty: 'medium',
    question_text: 'What is the difference between concurrency and parallelism?',
    option_a: 'Concurrency means tasks make progress over overlapping time periods; parallelism means tasks execute at the same instant on different cores',
    option_b: 'They describe the same thing with different words',
    option_c: 'Concurrency requires multiple cores, parallelism does not',
    option_d: 'Parallelism applies only to processes, concurrency only to threads',
    correct: 'A',
  },
  {
    id: 'os-10',
    topic: 'Operating Systems & Concurrency',
    subtopic: 'Kernel',
    difficulty: 'hard',
    question_text: 'What happens when a program makes a system call?',
    option_a: 'The compiler inlines the kernel routine into the program at build time',
    option_b: 'The program restarts with kernel privileges',
    option_c: 'The CPU traps into kernel mode, the kernel performs the operation, then control returns to user mode',
    option_d: 'The call is handled entirely in user space by the C library',
    correct: 'C',
  },

  // --- Programming Languages & Software Engineering ---
  {
    id: 'pl-1',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Typing',
    difficulty: 'easy',
    question_text: 'What is the difference between static and dynamic typing?',
    option_a: 'Static typing checks types at compile time; dynamic typing checks at runtime',
    option_b: 'Static typing is only used in interpreted languages',
    option_c: 'Dynamic typing prevents all type errors',
    option_d: 'Static typing means variables can never change value',
    correct: 'A',
  },
  {
    id: 'pl-2',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Memory Management',
    difficulty: 'medium',
    question_text: 'What does a garbage collector do?',
    option_a: 'Deletes unused source files',
    option_b: 'Automatically reclaims memory that is no longer reachable by the program',
    option_c: 'Compresses variables to save space',
    option_d: 'Removes dead code at compile time',
    correct: 'B',
  },
  {
    id: 'pl-3',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Paradigms',
    difficulty: 'easy',
    question_text: 'Which of these is a core idea of functional programming?',
    option_a: 'Mutating shared global state',
    option_b: 'Inheritance hierarchies',
    option_c: 'Pure functions without side effects',
    option_d: 'Manual memory allocation',
    correct: 'C',
  },
  {
    id: 'pl-4',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Compilation',
    difficulty: 'medium',
    question_text: 'What is the role of a compiler front end?',
    option_a: 'Executing the program line by line',
    option_b: 'Linking object files into an executable',
    option_c: 'Managing the heap at runtime',
    option_d: 'Parsing source code and producing an intermediate representation',
    correct: 'D',
  },
  {
    id: 'pl-5',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Testing',
    difficulty: 'easy',
    question_text: 'What is the main purpose of a unit test?',
    option_a: 'Verify a small piece of code behaves correctly in isolation',
    option_b: 'Measure production traffic',
    option_c: 'Test the whole system end to end',
    option_d: 'Benchmark hardware performance',
    correct: 'A',
  },
  {
    id: 'pl-6',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Concurrency',
    difficulty: 'hard',
    question_text: 'Why are immutable data structures useful in concurrent programs?',
    option_a: 'They use less memory than mutable ones',
    option_b: 'They can be shared between threads without locks because they never change',
    option_c: 'They are always faster to update',
    option_d: 'They prevent deadlocks in the scheduler',
    correct: 'B',
  },
  {
    id: 'pl-7',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Design',
    difficulty: 'medium',
    question_text: 'What does the DRY principle stand for?',
    option_a: 'Deploy, Rollback, Yield',
    option_b: 'Debug, Refactor, Yell',
    option_c: "Don't Repeat Yourself",
    option_d: 'Data, Runtime, YAML',
    correct: 'C',
  },
  {
    id: 'pl-8',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Version Control',
    difficulty: 'easy',
    question_text: 'In git, what does a merge conflict mean?',
    option_a: 'The repository is corrupted',
    option_b: 'Two commits have the same hash',
    option_c: 'The remote server is unreachable',
    option_d: 'Two branches changed the same lines and git needs a human to choose',
    correct: 'D',
  },
  {
    id: 'pl-9',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Design',
    difficulty: 'medium',
    question_text: 'What does dependency injection give you?',
    option_a: 'Missing packages are installed automatically at startup',
    option_b: 'A component receives its dependencies from outside instead of constructing them, so they can be swapped or faked in tests',
    option_c: 'Interfaces become unnecessary',
    option_d: 'Objects are allocated on the stack instead of the heap',
    correct: 'B',
  },
  {
    id: 'pl-10',
    topic: 'Programming Languages & Software Engineering',
    subtopic: 'Compilation',
    difficulty: 'hard',
    question_text: 'What is the difference between an interpreter and a JIT compiler?',
    option_a: 'A JIT compiler runs before the program starts, an interpreter runs after it finishes',
    option_b: 'A JIT compiler always produces a standalone executable on disk',
    option_c: 'An interpreter executes source or bytecode directly, while a JIT compiles hot paths to machine code at runtime using profiling data',
    option_d: 'Interpreters can only run dynamically typed languages',
    correct: 'C',
  },

  // --- Memory, Pointers & Architecture ---
  {
    id: 'mem-1',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Pointers',
    difficulty: 'easy',
    question_text: 'What is a dangling pointer?',
    option_a: 'A pointer that references memory that has already been freed',
    option_b: 'A pointer stored on the heap',
    option_c: 'A pointer with value zero',
    option_d: 'A pointer to a function',
    correct: 'A',
  },
  {
    id: 'mem-2',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Stack vs Heap',
    difficulty: 'easy',
    question_text: 'Which is true about stack vs heap allocation?',
    option_a: 'Heap allocation is automatically freed when a function returns',
    option_b: 'Stack allocation is automatic and freed when the function returns; heap allocation is manual or garbage-collected',
    option_c: 'The stack is slower than the heap',
    option_d: 'Only integers can live on the stack',
    correct: 'B',
  },
  {
    id: 'mem-3',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Caching',
    difficulty: 'medium',
    question_text: 'Why do CPU caches improve performance?',
    option_a: 'They increase the CPU clock speed',
    option_b: 'They compress instructions',
    option_c: 'They exploit locality: recently and nearby accessed data is likely to be used again',
    option_d: 'They eliminate the need for RAM',
    correct: 'C',
  },
  {
    id: 'mem-4',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Memory Bugs',
    difficulty: 'medium',
    question_text: 'What is a buffer overflow?',
    option_a: 'Running out of heap memory',
    option_b: 'A cache miss on every access',
    option_c: 'Allocating a buffer larger than needed',
    option_d: 'Writing past the end of allocated memory, corrupting adjacent data',
    correct: 'D',
  },
  {
    id: 'mem-5',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Memory Bugs',
    difficulty: 'easy',
    question_text: 'What is a memory leak?',
    option_a: 'Allocated memory that is never freed and can no longer be used',
    option_b: 'Data escaping to another process',
    option_c: 'RAM physically overheating',
    option_d: 'A pointer pointing to the stack',
    correct: 'A',
  },
  {
    id: 'mem-6',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Architecture',
    difficulty: 'hard',
    question_text: 'What is the difference between big-endian and little-endian?',
    option_a: 'The number of bits in a byte',
    option_b: 'The order in which bytes of a multi-byte value are stored in memory',
    option_c: 'The direction the stack grows',
    option_d: 'Whether integers are signed or unsigned',
    correct: 'B',
  },
  {
    id: 'mem-7',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Pointers',
    difficulty: 'medium',
    question_text: 'In C, what does dereferencing a NULL pointer cause?',
    option_a: 'The value 0 is returned',
    option_b: 'The compiler fixes it automatically',
    option_c: 'Undefined behavior, typically a crash (segmentation fault)',
    option_d: 'A new object is allocated',
    correct: 'C',
  },
  {
    id: 'mem-8',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Architecture',
    difficulty: 'hard',
    question_text: 'What is instruction pipelining?',
    option_a: 'Running the same instruction on multiple cores',
    option_b: 'Streaming instructions over a network',
    option_c: 'Storing instructions in the cache',
    option_d: 'Overlapping the execution stages of multiple instructions to increase throughput',
    correct: 'D',
  },
  {
    id: 'mem-9',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Pointers',
    difficulty: 'medium',
    question_text: 'What is the difference between a shallow copy and a deep copy?',
    option_a: 'A shallow copy duplicates the top-level object but shares the objects it points to; a deep copy duplicates the whole graph',
    option_b: 'A shallow copy duplicates everything recursively',
    option_c: 'A deep copy is always faster because it touches less memory',
    option_d: 'They differ only in memory alignment',
    correct: 'A',
  },
  {
    id: 'mem-10',
    topic: 'Memory, Pointers & Architecture',
    subtopic: 'Caching',
    difficulty: 'hard',
    question_text: 'In a row-major language, why is walking a 2D array row by row usually much faster than column by column?',
    option_a: 'The compiler skips bounds checks when the loop goes over rows',
    option_b: 'Rows are held in CPU registers, columns are not',
    option_c: 'Column access requires a system call for each element',
    option_d: 'Each row is contiguous, so row-wise access reuses whole cache lines while column-wise access strides across memory and misses',
    correct: 'D',
  },

  // --- Data Structures & Algorithms ---
  {
    id: 'dsa-1',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Hash Tables',
    difficulty: 'easy',
    question_text: 'What is the average-case time complexity of lookup in a hash table?',
    option_a: 'O(1)',
    option_b: 'O(log n)',
    option_c: 'O(n)',
    option_d: 'O(n log n)',
    correct: 'A',
  },
  {
    id: 'dsa-2',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Sorting',
    difficulty: 'easy',
    question_text: 'What is the worst-case time complexity of quicksort?',
    option_a: 'O(n)',
    option_b: 'O(n log n)',
    option_c: 'O(n²)',
    option_d: 'O(log n)',
    correct: 'C',
  },
  {
    id: 'dsa-3',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Trees',
    difficulty: 'medium',
    question_text: 'Which traversal of a binary search tree visits nodes in sorted order?',
    option_a: 'Pre-order',
    option_b: 'In-order',
    option_c: 'Post-order',
    option_d: 'Level-order',
    correct: 'B',
  },
  {
    id: 'dsa-4',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Graphs',
    difficulty: 'medium',
    question_text: 'Which algorithm finds the shortest path in a weighted graph with non-negative edges?',
    option_a: 'Depth-first search',
    option_b: 'Bubble sort',
    option_c: 'Binary search',
    option_d: "Dijkstra's algorithm",
    correct: 'D',
  },
  {
    id: 'dsa-5',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Stacks & Queues',
    difficulty: 'easy',
    question_text: 'A queue follows which ordering principle?',
    option_a: 'First in, first out (FIFO)',
    option_b: 'Last in, first out (LIFO)',
    option_c: 'Random order',
    option_d: 'Sorted order',
    correct: 'A',
  },
  {
    id: 'dsa-6',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Dynamic Programming',
    difficulty: 'hard',
    question_text: 'What two properties make a problem suitable for dynamic programming?',
    option_a: 'Sorted input and unique elements',
    option_b: 'Overlapping subproblems and optimal substructure',
    option_c: 'Small input size and no recursion',
    option_d: 'Constant memory and linear time',
    correct: 'B',
  },
  {
    id: 'dsa-7',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Linked Lists',
    difficulty: 'medium',
    question_text: 'What is the time complexity of inserting at the head of a singly linked list?',
    option_a: 'O(n)',
    option_b: 'O(log n)',
    option_c: 'O(1)',
    option_d: 'O(n²)',
    correct: 'C',
  },
  {
    id: 'dsa-8',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Heaps',
    difficulty: 'hard',
    question_text: 'Which data structure efficiently supports "extract the minimum element" repeatedly?',
    option_a: 'Unsorted array',
    option_b: 'Hash table',
    option_c: 'Singly linked list',
    option_d: 'Min-heap',
    correct: 'D',
  },
  {
    id: 'dsa-9',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Graphs',
    difficulty: 'medium',
    question_text: 'What is the difference between breadth-first and depth-first search?',
    option_a: 'BFS uses a stack and DFS uses a queue',
    option_b: 'BFS explores level by level with a queue and finds a fewest-edge path in an unweighted graph; DFS follows one branch as deep as it goes using a stack',
    option_c: 'DFS always finds the shortest path',
    option_d: 'Both visit nodes in exactly the same order',
    correct: 'B',
  },
  {
    id: 'dsa-10',
    topic: 'Data Structures & Algorithms',
    subtopic: 'Heaps',
    difficulty: 'hard',
    question_text: 'You need the k largest items from a stream of n values, where k is much smaller than n and the stream does not fit in memory. What is the best approach?',
    option_a: 'Sort all n values and take the last k, O(n log n)',
    option_b: 'Scan for the maximum k times, O(nk)',
    option_c: 'Keep a min-heap of size k and replace the root whenever a larger value arrives, O(n log k)',
    option_d: 'Insert everything into a hash table and read the k largest keys, O(n)',
    correct: 'C',
  },

  // --- Networking & HTTP ---
  {
    id: 'net-1',
    topic: 'Networking & HTTP',
    subtopic: 'HTTP',
    difficulty: 'easy',
    question_text: 'What does HTTP status code 404 mean?',
    option_a: 'The server understood the request but refuses to authorize it',
    option_b: 'The requested resource was not found on the server',
    option_c: 'The server hit an internal error while handling the request',
    option_d: 'The resource moved permanently to a new URL',
    correct: 'B',
  },
  {
    id: 'net-2',
    topic: 'Networking & HTTP',
    subtopic: 'Transport',
    difficulty: 'easy',
    question_text: 'What is the main difference between TCP and UDP?',
    option_a: 'TCP is connection-oriented and guarantees ordered, reliable delivery; UDP does neither',
    option_b: 'UDP is encrypted and TCP is not',
    option_c: 'TCP works only on a local network',
    option_d: 'UDP guarantees delivery but not ordering',
    correct: 'A',
  },
  {
    id: 'net-3',
    topic: 'Networking & HTTP',
    subtopic: 'DNS',
    difficulty: 'easy',
    question_text: 'What does DNS do?',
    option_a: 'Encrypts traffic between the browser and the server',
    option_b: 'Assigns an IP address to a device joining a network',
    option_c: 'Translates domain names into IP addresses',
    option_d: 'Chooses routes between autonomous systems on the internet',
    correct: 'C',
  },
  {
    id: 'net-4',
    topic: 'Networking & HTTP',
    subtopic: 'HTTP',
    difficulty: 'medium',
    question_text: 'Which HTTP method is defined as both safe and idempotent?',
    option_a: 'POST',
    option_b: 'PATCH',
    option_c: 'CONNECT',
    option_d: 'GET',
    correct: 'D',
  },
  {
    id: 'net-5',
    topic: 'Networking & HTTP',
    subtopic: 'HTTP',
    difficulty: 'medium',
    question_text: 'What is the difference between a 301 and a 302 response?',
    option_a: '301 is a permanent redirect that clients may cache and reuse; 302 is temporary',
    option_b: '302 is permanent and 301 is temporary',
    option_c: '301 means the server is down, 302 means the resource moved',
    option_d: 'They are treated identically by every client',
    correct: 'A',
  },
  {
    id: 'net-6',
    topic: 'Networking & HTTP',
    subtopic: 'HTTP',
    difficulty: 'medium',
    question_text: 'HTTP is described as stateless. What does that mean?',
    option_a: 'A connection can never be reused for a second request',
    option_b: 'The server keeps no memory of earlier requests, so each request must carry everything needed to handle it',
    option_c: 'The server is not allowed to write to a database',
    option_d: 'Cookies cannot be used',
    correct: 'B',
  },
  {
    id: 'net-7',
    topic: 'Networking & HTTP',
    subtopic: 'TLS',
    difficulty: 'medium',
    question_text: 'What does TLS add to an HTTP connection?',
    option_a: 'Faster page loads through payload compression',
    option_b: 'Guaranteed packet ordering and retransmission',
    option_c: 'Encryption, integrity checking, and authentication of the server',
    option_d: 'Automatic retries when a request fails',
    correct: 'C',
  },
  {
    id: 'net-8',
    topic: 'Networking & HTTP',
    subtopic: 'Transport',
    difficulty: 'hard',
    question_text: 'What does the TCP three-way handshake accomplish?',
    option_a: 'It compresses the payload before transmission',
    option_b: 'It encrypts the connection before any data flows',
    option_c: 'It resolves the hostname to an IP address',
    option_d: 'Both sides agree on initial sequence numbers and confirm each can send and receive',
    correct: 'D',
  },
  {
    id: 'net-9',
    topic: 'Networking & HTTP',
    subtopic: 'HTTP',
    difficulty: 'hard',
    question_text: 'What problem does HTTP/2 multiplexing solve?',
    option_a: 'It removes the need for TLS',
    option_b: 'Many requests and responses share one connection, so a slow response no longer blocks the others at the HTTP layer',
    option_c: 'It compresses response bodies with gzip',
    option_d: 'It caches responses on the client automatically',
    correct: 'B',
  },
  {
    id: 'net-10',
    topic: 'Networking & HTTP',
    subtopic: 'Browser',
    difficulty: 'hard',
    question_text: 'What is CORS for?',
    option_a: 'It encrypts requests sent to another origin',
    option_b: 'It speeds up requests to third-party APIs',
    option_c: 'It lets a server opt in to browsers allowing cross-origin requests the same-origin policy would otherwise block',
    option_d: 'It blocks all traffic from other domains at the network level',
    correct: 'C',
  },

  // --- Databases & SQL ---
  {
    id: 'db-1',
    topic: 'Databases & SQL',
    subtopic: 'SQL',
    difficulty: 'easy',
    question_text: 'What does a SQL JOIN do?',
    option_a: 'Combines rows from two tables based on a related column',
    option_b: 'Appends the rows of one table to the end of another',
    option_c: 'Removes duplicate rows from a result set',
    option_d: 'Merges two database files into one',
    correct: 'A',
  },
  {
    id: 'db-2',
    topic: 'Databases & SQL',
    subtopic: 'Keys',
    difficulty: 'easy',
    question_text: 'What is a primary key?',
    option_a: 'A password that protects the table',
    option_b: 'A column or set of columns that uniquely identifies each row in a table',
    option_c: 'A column that points at a row in another table',
    option_d: 'Whichever column was defined first',
    correct: 'B',
  },
  {
    id: 'db-3',
    topic: 'Databases & SQL',
    subtopic: 'Indexing',
    difficulty: 'easy',
    question_text: 'Why would you add an index to a column?',
    option_a: 'To reduce the disk space the table uses',
    option_b: 'To make inserts into the table faster',
    option_c: 'To make lookups and filters on that column faster',
    option_d: 'To back the column up automatically',
    correct: 'C',
  },
  {
    id: 'db-4',
    topic: 'Databases & SQL',
    subtopic: 'Transactions',
    difficulty: 'medium',
    question_text: 'What does ACID stand for?',
    option_a: 'Availability, Concurrency, Integrity, Distribution',
    option_b: 'Access, Control, Isolation, Delivery',
    option_c: 'Atomicity, Concurrency, Indexing, Durability',
    option_d: 'Atomicity, Consistency, Isolation, Durability',
    correct: 'D',
  },
  {
    id: 'db-5',
    topic: 'Databases & SQL',
    subtopic: 'Modeling',
    difficulty: 'medium',
    question_text: 'What problem does normalization solve?',
    option_a: 'It makes every query faster',
    option_b: 'It stores each fact in one place, so an update cannot leave copies disagreeing with each other',
    option_c: 'It compresses tables on disk',
    option_d: 'It converts a relational schema into a document store',
    correct: 'B',
  },
  {
    id: 'db-6',
    topic: 'Databases & SQL',
    subtopic: 'SQL',
    difficulty: 'medium',
    question_text: 'What is the difference between WHERE and HAVING?',
    option_a: 'HAVING only works on indexed columns',
    option_b: 'WHERE can only appear in a SELECT statement',
    option_c: 'WHERE filters rows before grouping; HAVING filters groups after aggregation',
    option_d: 'They are interchangeable',
    correct: 'C',
  },
  {
    id: 'db-7',
    topic: 'Databases & SQL',
    subtopic: 'Performance',
    difficulty: 'medium',
    question_text: 'What is the N+1 query problem?',
    option_a: 'A query that returns one more row than expected',
    option_b: 'Loading a list with one query, then firing one more query per row instead of a single join or a batched fetch',
    option_c: 'A query that has to run N+1 times before the planner uses an index',
    option_d: 'An off-by-one error in a LIMIT clause',
    correct: 'B',
  },
  {
    id: 'db-8',
    topic: 'Databases & SQL',
    subtopic: 'Transactions',
    difficulty: 'hard',
    question_text: 'What does the READ COMMITTED isolation level guarantee?',
    option_a: 'It rules out every concurrency anomaly',
    option_b: 'It behaves identically to READ UNCOMMITTED',
    option_c: 'It prevents phantom reads only',
    option_d: 'It prevents dirty reads, but non-repeatable reads and phantom reads are still possible',
    correct: 'D',
  },
  {
    id: 'db-9',
    topic: 'Databases & SQL',
    subtopic: 'Scaling',
    difficulty: 'hard',
    question_text: 'What is the difference between replication and sharding?',
    option_a: 'Replication copies the same data to multiple nodes for redundancy and read capacity; sharding splits different subsets of the data across nodes',
    option_b: 'Sharding copies data for backups, replication splits it up',
    option_c: 'They are two names for the same technique',
    option_d: 'Replication only works within a single machine',
    correct: 'A',
  },
  {
    id: 'db-10',
    topic: 'Databases & SQL',
    subtopic: 'SQL',
    difficulty: 'hard',
    question_text: 'What does a LEFT JOIN return that an INNER JOIN does not?',
    option_a: 'Every possible pairing of rows from both tables',
    option_b: 'Rows from the left table with no match on the right, padded with NULLs',
    option_c: 'Rows from the right table with no match on the left',
    option_d: 'Only the rows that match in both tables',
    correct: 'B',
  },

  // --- Security & Cryptography ---
  {
    id: 'sec-1',
    topic: 'Security & Cryptography',
    subtopic: 'Web Security',
    difficulty: 'easy',
    question_text: 'What is SQL injection?',
    option_a: 'Sending so many queries that the database falls over',
    option_b: 'Untrusted input concatenated into a query, letting an attacker change what the query does',
    option_c: 'Adding an index to speed a query up',
    option_d: 'Encrypting a column so the database cannot read it',
    correct: 'B',
  },
  {
    id: 'sec-2',
    topic: 'Security & Cryptography',
    subtopic: 'Passwords',
    difficulty: 'easy',
    question_text: 'How should user passwords be stored?',
    option_a: 'Encrypted with AES so they can be decrypted and emailed back on request',
    option_b: 'In plain text, protected by a firewall',
    option_c: 'Hashed with a deliberately slow, salted algorithm such as bcrypt or Argon2',
    option_d: 'Hashed with MD5, because it is fast',
    correct: 'C',
  },
  {
    id: 'sec-3',
    topic: 'Security & Cryptography',
    subtopic: 'Auth',
    difficulty: 'easy',
    question_text: 'What is the difference between authentication and authorization?',
    option_a: 'Authentication proves who you are, authorization decides what you are allowed to do',
    option_b: 'They are two words for the same check',
    option_c: 'Authentication applies to APIs, authorization applies to web pages',
    option_d: 'Authorization always runs first, then authentication',
    correct: 'A',
  },
  {
    id: 'sec-4',
    topic: 'Security & Cryptography',
    subtopic: 'Web Security',
    difficulty: 'medium',
    question_text: 'What is cross-site scripting (XSS)?',
    option_a: 'Intercepting traffic between the client and the server',
    option_b: 'Brute-forcing a session identifier until one works',
    option_c: "An attacker getting script into a page so other users' browsers execute it",
    option_d: 'A server sending more cookies than the browser will store',
    correct: 'C',
  },
  {
    id: 'sec-5',
    topic: 'Security & Cryptography',
    subtopic: 'Web Security',
    difficulty: 'medium',
    question_text: 'What makes a CSRF attack possible?',
    option_a: "The browser automatically attaching the victim's cookies to a request triggered from the attacker's site",
    option_b: 'The server storing passwords in plain text',
    option_c: "The attacker already knowing the victim's password",
    option_d: 'A missing index on the sessions table',
    correct: 'A',
  },
  {
    id: 'sec-6',
    topic: 'Security & Cryptography',
    subtopic: 'Cryptography',
    difficulty: 'medium',
    question_text: 'What is the difference between symmetric and asymmetric encryption?',
    option_a: 'Asymmetric encryption is always faster on large payloads',
    option_b: 'Symmetric encryption uses one shared secret key; asymmetric uses a public and private key pair',
    option_c: 'Symmetric encryption cannot be broken',
    option_d: 'Asymmetric encryption needs no keys at all',
    correct: 'B',
  },
  {
    id: 'sec-7',
    topic: 'Security & Cryptography',
    subtopic: 'Passwords',
    difficulty: 'medium',
    question_text: 'Why is a salt added before hashing a password?',
    option_a: 'It makes the hash function run faster',
    option_b: 'It encrypts the password so it can be recovered later',
    option_c: 'It shortens the value that has to be stored',
    option_d: 'It makes identical passwords hash differently, so precomputed rainbow tables are useless',
    correct: 'D',
  },
  {
    id: 'sec-8',
    topic: 'Security & Cryptography',
    subtopic: 'Cryptography',
    difficulty: 'hard',
    question_text: 'What does a digital signature prove?',
    option_a: 'That the message is encrypted and unreadable to anyone else',
    option_b: 'That nobody read the message in transit',
    option_c: 'That the message came from the holder of the private key and has not been altered',
    option_d: 'That the message was delivered to the recipient',
    correct: 'C',
  },
  {
    id: 'sec-9',
    topic: 'Security & Cryptography',
    subtopic: 'Auth',
    difficulty: 'hard',
    question_text: 'Why pair a short-lived access token with a longer-lived refresh token?',
    option_a: 'Two tokens are harder for an attacker to guess than one',
    option_b: 'A stolen access token is only useful for a few minutes, while the refresh token is sent rarely and can be revoked centrally',
    option_c: 'It removes the need to serve the API over HTTPS',
    option_d: 'It lets the client encrypt its own requests',
    correct: 'B',
  },
  {
    id: 'sec-10',
    topic: 'Security & Cryptography',
    subtopic: 'Cryptography',
    difficulty: 'hard',
    question_text: 'Why compare secrets such as API tokens with a constant-time comparison?',
    option_a: 'It is faster than a normal string comparison',
    option_b: 'It stops the secret from being written to logs',
    option_c: 'It avoids integer overflow on long strings',
    option_d: 'A normal comparison returns early at the first mismatch, and the timing difference leaks the secret one character at a time',
    correct: 'D',
  },
];

// ---------------------------------------------------------------------------
// Deep interview question bank + canned evaluations (synthetic)
// ---------------------------------------------------------------------------

interface DeepBankEntry extends DeepQuestion {
  demo_evaluation: Omit<EvaluateAnswerResponse, 'audio_base64' | 'audio_size_bytes'>;
}

const DEEP_BANK: DeepBankEntry[] = [
  {
    id: 'deep-ds-1',
    topic: 'Data Structures & Complexity (Conceptual)',
    difficulty: 'medium',
    prompt: 'Explain how a hash table works and what happens when two keys collide.',
    rubric_points: [
      'Hash function maps keys to bucket indices',
      'Average O(1) lookup, insert, delete',
      'Collision resolution: chaining or open addressing',
      'Load factor and resizing',
    ],
    demo_answer:
      "A hash table stores key-value pairs by running the key through a hash function to get an index into an array of buckets. On average that makes lookups, inserts, and deletes O(1). When two keys hash to the same bucket, that's a collision — you can handle it with chaining, where each bucket holds a linked list of entries, or open addressing, where you probe for the next free slot. As the table fills up, the load factor rises and collisions get more common, so the table resizes and rehashes everything into a bigger array.",
    demo_evaluation: {
      score: 4,
      feedback:
        'Strong answer. You covered the hash function, average-case complexity, and both major collision strategies, and you connected load factor to resizing. To reach a 5, mention the worst case — when many keys collide, operations degrade toward O(n) — and how a good hash function keeps that unlikely.',
      strengths: [
        'Explained both chaining and open addressing',
        'Connected load factor to resizing behavior',
        'Correct average-case complexity',
      ],
      improvements: [
        'Mention worst-case O(n) behavior under heavy collisions',
        'Note what makes a good hash function (uniform distribution)',
      ],
    },
  },
  {
    id: 'deep-ds-2',
    topic: 'Data Structures & Complexity (Conceptual)',
    difficulty: 'medium',
    prompt: 'When would you choose a linked list over an array, and what are the trade-offs?',
    rubric_points: [
      'Arrays: O(1) random access, contiguous memory, cache-friendly',
      'Linked lists: O(1) insert/delete at known position',
      'Linked lists lose cache locality and pay pointer overhead',
      'Resizing costs of arrays vs allocation per node',
    ],
    demo_answer:
      "I'd reach for a linked list when I need cheap inserts and deletes in the middle of a sequence and I already have a handle on the node — that's O(1), versus shifting elements in an array. Arrays win at random access, O(1) by index, and they're contiguous in memory so they're much more cache-friendly. Linked lists pay a pointer per node and scatter nodes across the heap, so iterating one is often slower in practice even when the big-O looks the same. Honestly, on modern hardware arrays win most of the time; linked lists shine in things like LRU caches combined with a hash map.",
    demo_evaluation: {
      score: 5,
      feedback:
        'Excellent. You went beyond textbook complexity and talked about cache locality and real hardware behavior, which is exactly what interviewers want to hear. The LRU cache example shows practical judgment. This is a complete answer.',
      strengths: [
        'Discussed cache locality, not just big-O',
        'Gave a concrete real-world use case (LRU cache)',
        'Acknowledged that arrays usually win in practice',
      ],
      improvements: [
        'Could briefly mention doubly vs singly linked variants',
      ],
    },
  },
  {
    id: 'deep-ds-3',
    topic: 'Data Structures & Complexity (Conceptual)',
    difficulty: 'hard',
    prompt: 'What does amortized time complexity mean? Explain using a dynamic array as an example.',
    rubric_points: [
      'Amortized = average cost per operation over a worst-case sequence',
      'Dynamic array doubles capacity when full',
      'Occasional O(n) copy, but amortized O(1) append',
      'Difference from average-case analysis',
    ],
    demo_answer:
      "Amortized complexity averages the cost of operations over a whole sequence, so occasional expensive operations get spread across many cheap ones. The classic example is appending to a dynamic array: most appends are O(1), but when the array is full you allocate double the capacity and copy everything over, which is O(n). Because doubling means the expensive copies happen exponentially less often, the total cost of n appends is O(n), so each append is amortized O(1). It's different from average-case analysis — amortized is a guarantee over any sequence, not an assumption about random inputs.",
    demo_evaluation: {
      score: 5,
      feedback:
        'Outstanding answer. You nailed the definition, walked through the doubling argument correctly, and — the part most candidates miss — distinguished amortized analysis from average-case analysis. Nothing significant missing here.',
      strengths: [
        'Correct doubling/copy argument for amortized O(1)',
        'Distinguished amortized from average-case analysis',
        'Clear, structured explanation',
      ],
      improvements: [
        'For extra depth, you could name the accounting or potential method',
      ],
    },
  },
  {
    id: 'deep-sys-1',
    topic: 'System Design, Backend & Data',
    difficulty: 'medium',
    prompt: 'How would you design a URL shortener like bit.ly? Walk through the core components.',
    rubric_points: [
      'API for create/redirect',
      'Short code generation (hash or counter + base62)',
      'Database schema and read-heavy access pattern',
      'Caching layer for hot URLs',
      'Scale considerations: redirects vastly outnumber writes',
    ],
    demo_answer:
      "The core is two endpoints: POST to create a short link and GET to redirect. For the short code I'd use an auto-incrementing ID encoded in base62, which guarantees uniqueness without collision checks — six characters covers around 56 billion URLs. The store is a simple mapping table from code to long URL. The key insight is the workload is extremely read-heavy: redirects massively outnumber creates, so I'd put a cache like Redis in front of the database for hot links and serve redirects with a 301 or 302 depending on whether we want click analytics. To scale writes, the ID generator can be range-partitioned across nodes.",
    demo_evaluation: {
      score: 4,
      feedback:
        "Very solid design. You identified the read-heavy workload — that's the insight this question is really testing — and your base62 counter approach is the standard clean answer. You touched on 301 vs 302 and analytics, which is a nice detail. To strengthen it, discuss what happens at the database layer at scale: partitioning or replication for the mapping table, and how you'd handle expiring or abusive links.",
      strengths: [
        'Identified the read-heavy access pattern and added caching',
        'Collision-free base62 counter approach',
        '301 vs 302 trade-off tied to analytics',
      ],
      improvements: [
        'Discuss database partitioning/replication at scale',
        'Mention link expiration and abuse handling',
      ],
    },
  },
  {
    id: 'deep-sys-2',
    topic: 'System Design, Backend & Data',
    difficulty: 'medium',
    prompt: 'What is database indexing, and what are the trade-offs of adding indexes?',
    rubric_points: [
      'Index = auxiliary structure (typically B-tree) for fast lookups',
      'Speeds up reads on indexed columns',
      'Slows down writes; extra storage',
      'Choosing indexes based on query patterns',
    ],
    demo_answer:
      "An index is an auxiliary data structure, usually a B-tree, that lets the database find rows matching a condition without scanning the whole table — it turns O(n) scans into O(log n) lookups on the indexed columns. The trade-off is that every insert, update, and delete now has to maintain the index too, so writes get slower, and each index costs storage. So you index based on your actual query patterns — columns that show up in WHERE clauses and joins — rather than indexing everything. Composite indexes also matter: column order determines which queries they can serve.",
    demo_evaluation: {
      score: 4,
      feedback:
        'Clear and accurate. You explained the mechanism, both sides of the trade-off, and tied index choice to query patterns. The composite index point shows real experience. For a perfect score, mention covering indexes and that the query planner may ignore an index when selectivity is poor.',
      strengths: [
        'Explained B-tree mechanism and complexity correctly',
        'Covered write-amplification and storage costs',
        'Composite index column-order detail',
      ],
      improvements: [
        'Mention covering indexes',
        'Note that low-selectivity columns may not benefit from indexing',
      ],
    },
  },
  {
    id: 'deep-sys-3',
    topic: 'System Design, Backend & Data',
    difficulty: 'hard',
    prompt: 'Explain the CAP theorem and how it influences real-world database choices.',
    rubric_points: [
      'Consistency, Availability, Partition tolerance — pick two under partition',
      'Partitions are unavoidable in distributed systems',
      'CP vs AP system examples',
      'Real systems offer tunable consistency',
    ],
    demo_answer:
      "CAP says a distributed system can't simultaneously guarantee consistency, availability, and partition tolerance. Since network partitions are a fact of life, the real choice during a partition is between consistency and availability. A CP system like a strongly consistent database will refuse requests rather than serve stale data; an AP system like Cassandra keeps serving but might return stale reads that reconcile later. In practice it's a spectrum, not a binary — systems like DynamoDB and Cassandra let you tune consistency per query, trading latency for freshness. The theorem mostly matters as a framing: you decide what your product can tolerate — stale reads or downtime — and pick accordingly.",
    demo_evaluation: {
      score: 5,
      feedback:
        "Excellent. You made the crucial point that partition tolerance isn't optional, so CAP is really a C-vs-A decision during partitions, and you grounded it with real systems and tunable consistency. Framing it as a product decision at the end is exactly the maturity interviewers look for.",
      strengths: [
        'Correctly framed CAP as C-vs-A under partitions',
        'Real system examples with tunable consistency',
        'Connected the theorem to product requirements',
      ],
      improvements: [
        'Could mention PACELC as the more complete modern framing',
      ],
    },
  },
  {
    id: 'deep-pl-1',
    topic: 'Programming Language & Debugging',
    difficulty: 'medium',
    prompt: 'A web service suddenly starts responding slowly in production. How do you debug it?',
    rubric_points: [
      'Check monitoring/metrics first (latency, error rate, saturation)',
      'Correlate with recent deploys or config changes',
      'Narrow down: app, database, network, or dependency',
      'Profiling and logs to find the bottleneck',
      'Mitigate first (rollback), root-cause after',
    ],
    demo_answer:
      "First I'd look at monitoring: latency percentiles, error rates, CPU and memory saturation — and check whether the slowdown correlates with a deploy or config change, because if it does, rolling back is the fastest fix and I can root-cause afterwards. If not, I'd narrow the layer: is the app itself slow, or is it waiting on the database or a downstream service? Traces or slow-query logs usually answer that. From there I'd profile the hot path — maybe a missing index, a connection pool exhausted, or a cache that stopped hitting. The main principle is mitigate first, then investigate, and change one thing at a time so you can see what actually helped.",
    demo_evaluation: {
      score: 5,
      feedback:
        "This is exactly how senior engineers debug production issues. You started with observability instead of guessing, prioritized mitigation over root-causing, and gave concrete plausible culprits. The 'change one thing at a time' discipline at the end rounds it out perfectly.",
      strengths: [
        'Metrics-first, systematic narrowing approach',
        'Mitigate-then-investigate prioritization',
        'Concrete likely culprits: indexes, pools, caches',
      ],
      improvements: [
        'Could mention capturing a snapshot (heap/profile) before rollback so evidence survives',
      ],
    },
  },
  {
    id: 'deep-pl-2',
    topic: 'Programming Language & Debugging',
    difficulty: 'medium',
    prompt: 'What is the difference between pass-by-value and pass-by-reference? How does this show up in a language you know?',
    rubric_points: [
      'By value: callee gets a copy',
      'By reference: callee can modify the original',
      "Object references passed by value ('call by sharing') in Java/Python/JS",
      'Concrete example of a mutation bug',
    ],
    demo_answer:
      "Pass-by-value gives the function a copy, so changes don't affect the caller's variable. Pass-by-reference gives it the original. The subtlety in languages like Python or JavaScript is that they pass object references by value — sometimes called call-by-sharing. So if I pass a list to a function and it appends to it, the caller sees the change, because both variables point at the same object. But if the function reassigns the parameter to a new list, the caller doesn't see that, because only the local copy of the reference changed. That distinction is behind a lot of subtle mutation bugs, which is why defensive copies or immutable data are common.",
    demo_evaluation: {
      score: 5,
      feedback:
        'Excellent answer. The append-vs-reassign example is precisely the distinction that trips people up, and naming call-by-sharing shows you understand the model rather than repeating a mnemonic. Tying it to defensive copies makes it practical.',
      strengths: [
        'Correct call-by-sharing explanation',
        'Concrete append vs reassignment example',
        'Connected the concept to real bug patterns',
      ],
      improvements: [
        'Could contrast with a language with true references, like C++ &',
      ],
    },
  },
  {
    id: 'deep-pl-3',
    topic: 'Programming Language & Debugging',
    difficulty: 'hard',
    prompt: 'Explain what a memory leak looks like in a garbage-collected language and how you would track one down.',
    rubric_points: [
      'GC only frees unreachable objects — leaks are unwanted reachability',
      'Common causes: caches, listeners, closures, global collections',
      'Symptoms: growing heap, rising GC time, eventual OOM',
      'Heap snapshots / profilers to find retained objects and paths to GC roots',
    ],
    demo_answer:
      "Even with garbage collection you can leak: the GC only frees what's unreachable, so a leak is memory that's still reachable but will never be used again. Classic causes are unbounded caches, event listeners that never get unregistered, and closures or global maps holding references. Symptoms are a heap that grows across GC cycles, rising GC pause times, and eventually an out-of-memory crash. To track it down I'd take heap snapshots at intervals, diff them to see which object types are growing, then follow the retention path from those objects back to a GC root — that path tells you exactly who's holding the reference and where to break it.",
    demo_evaluation: {
      score: 5,
      feedback:
        'Superb. You corrected the common misconception that GC prevents leaks, listed the realistic culprits, and described the exact snapshot-diff-retention-path workflow a profiler is built for. This is a hire-signal answer.',
      strengths: [
        'Reachability-based definition of GC leaks',
        'Realistic causes: listeners, caches, closures',
        'Concrete heap-snapshot diffing methodology',
      ],
      improvements: [
        'Could name a concrete tool (Chrome DevTools, VisualVM) for the workflow',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Service implementation (offline)
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toQuestion(entry: BankQuestion): Question {
  const { correct, ...question } = entry;
  return question;
}

class ApiService {
  async getQuestions(params?: GetQuestionsParams): Promise<Question[]> {
    await delay(400); // brief, finite "loading" so the UI reads naturally
    let pool = MCQ_BANK.filter((q) => !params?.topic || q.topic === params.topic);
    if (params?.difficulty) {
      const filtered = pool.filter((q) => q.difficulty === params.difficulty);
      if (filtered.length > 0) pool = filtered;
    }
    if (params?.randomize) pool = shuffle(pool);
    if (params?.limit) pool = pool.slice(0, params.limit);
    return pool.map(toQuestion);
  }

  async getQuestionById(questionId: string): Promise<Question> {
    await delay(150);
    const entry = MCQ_BANK.find((q) => q.id === questionId);
    if (!entry) throw new Error(`Question not found: ${questionId}`);
    return toQuestion(entry);
  }

  async checkAnswer(questionId: string, selectedOption: 'A' | 'B' | 'C' | 'D'): Promise<CheckAnswerResponse> {
    await delay(250);
    const entry = MCQ_BANK.find((q) => q.id === questionId);
    if (!entry) {
      return { correct: false, message: 'Question not found', error: 'not_found' };
    }
    const correct = entry.correct === selectedOption;
    return {
      correct,
      correct_option: correct ? undefined : entry.correct,
      message: correct ? 'Correct!' : `The correct answer is ${entry.correct}.`,
    };
  }

  async testConnection(): Promise<boolean> {
    return true; // offline demo is always "connected"
  }

  async evaluateAnswer(request: EvaluateAnswerRequest): Promise<EvaluateAnswerResponse> {
    // Simulate the AI grading round-trip (Whisper -> Gemini -> ElevenLabs in the real app)
    await delay(1200);
    const entry = DEEP_BANK.find((q) => q.prompt === request.question);
    const evaluation = entry?.demo_evaluation ?? {
      score: 4,
      feedback:
        'Good answer with clear structure. In the live app, Gemini grades your actual response against the rubric; this demo shows a representative evaluation.',
      strengths: ['Clear structure', 'Correct core concepts'],
      improvements: ['Add a concrete example'],
    };
    return { ...evaluation, audio_base64: '', audio_size_bytes: 0 };
  }

  async getDeepQuestions(params?: GetDeepQuestionsParams): Promise<DeepQuestion[]> {
    await delay(400);
    let pool = DEEP_BANK.filter((q) => !params?.topic || q.topic === params.topic);
    if (params?.limit) pool = pool.slice(0, params.limit);
    return pool.map(({ demo_evaluation, ...question }) => question);
  }
}

export const apiService = new ApiService();
