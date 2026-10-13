// Skill taxonomy. `aliases` are matched case-insensitively on word boundaries
// (see services/analyzer.js). `caseSensitive` aliases must match exactly.
// `implies` lists skills that are reasonably implied (stored as importance "inferred").
// `learn` is only used for human-readable descriptions.

export const CATEGORIES = ['DSA', 'Language', 'Web', 'SQL/DBMS', 'CS Fundamentals', 'Tools & DevOps'];

const s = (slug, name, category, aliases, description, extra = {}) => ({
  slug, name, category, aliases: [...(extra.noNameAlias ? [] : [name.toLowerCase()]), ...aliases], description, ...extra,
});

export const SKILLS = [
  // ---------- DSA ----------
  s('dsa', 'Data Structures & Algorithms', 'DSA',
    ['data structures and algorithms', 'data structures', 'algorithms', 'dsa', 'problem solving', 'problem-solving', 'competitive programming', 'coding challenges'],
    'General DSA fluency: choosing the right structure and reasoning about trade-offs.',
    { implies: ['arrays', 'strings', 'hashing', 'complexity'] }),
  s('arrays', 'Arrays', 'DSA', ['array', 'arrays and strings'], 'Traversal, prefix sums, in-place manipulation.'),
  s('strings', 'Strings', 'DSA', ['string manipulation', 'string'], 'Parsing, pattern matching, anagram/palindrome problems.'),
  s('hashing', 'Hashing', 'DSA', ['hash map', 'hashmap', 'hash table', 'hash tables', 'dictionary', 'hash set'], 'Hash maps/sets for O(1) lookups and counting.'),
  s('two-pointers', 'Two Pointers', 'DSA', ['two pointer', 'two-pointer'], 'Converging/parallel pointers over sequences.'),
  s('sliding-window', 'Sliding Window', 'DSA', ['sliding window'], 'Moving window over arrays/strings.'),
  s('linked-list', 'Linked Lists', 'DSA', ['linked list', 'linkedlist'], 'Pointer manipulation, cycle detection, reversal.'),
  s('stack-queue', 'Stacks & Queues', 'DSA', ['stack and queue', 'stacks and queues', 'queue', 'queues', 'deque'], 'LIFO/FIFO structures, monotonic stack.'),
  s('recursion', 'Recursion & Backtracking', 'DSA', ['recursion', 'backtracking', 'recursive'], 'Recursive decomposition and search with pruning.'),
  s('trees', 'Trees', 'DSA', ['binary tree', 'binary trees', 'binary search tree', 'bst', 'tree traversal', 'trie'], 'Traversals, BST properties, tree DP.'),
  s('graphs', 'Graphs', 'DSA', ['graph', 'bfs', 'dfs', 'breadth-first', 'depth-first', 'shortest path', 'dijkstra', 'topological sort'], 'BFS/DFS, shortest paths, topological ordering.'),
  s('binary-search', 'Binary Search', 'DSA', ['binary search'], 'Searching on sorted data and on answer spaces.'),
  s('sorting', 'Sorting', 'DSA', ['sorting', 'merge sort', 'quick sort', 'quicksort', 'searching and sorting'], 'Sorting algorithms and sort-based solutions.'),
  s('dp', 'Dynamic Programming', 'DSA', ['dynamic programming', 'memoization', 'memoisation', 'tabulation'], 'Overlapping subproblems and optimal substructure.'),
  s('heaps', 'Heaps / Priority Queues', 'DSA', ['heap', 'heaps', 'priority queue', 'priority queues'], 'Top-K and scheduling problems.'),
  s('greedy', 'Greedy Algorithms', 'DSA', ['greedy'], 'Locally optimal choices that yield global optimum.'),
  s('complexity', 'Time & Space Complexity', 'DSA', ['big o', 'big-o', 'time complexity', 'space complexity', 'complexity analysis', 'asymptotic'], 'Analyzing and communicating algorithm cost.'),

  // ---------- Languages ----------
  s('javascript', 'JavaScript', 'Language', ['js', 'es6', 'ecmascript', 'vanilla js'], 'Closures, async/await, prototypes, event loop.'),
  s('typescript', 'TypeScript', 'Language', [], 'Static typing on top of JavaScript.', { implies: ['javascript'] }),
  s('python', 'Python', 'Language', [], 'Python fundamentals, data structures, idioms.'),
  s('java', 'Java', 'Language', ['core java', 'jdk', 'jvm'], 'Core Java, collections, JVM basics.', { implies: ['oop'] }),
  s('cpp', 'C++', 'Language', ['c/c++', 'c plus plus', 'cpp', 'stl'], 'C++ fundamentals and the STL.', { implies: ['oop'] }),
  s('go', 'Go', 'Language', ['golang', 'go language'], 'Go syntax, goroutines, channels.', { noNameAlias: true }),
  s('oop', 'Object-Oriented Programming', 'Language', ['oop', 'oops', 'object oriented', 'object-oriented', 'design patterns', 'solid principles'], 'Encapsulation, inheritance, polymorphism, SOLID.'),

  // ---------- Web ----------
  s('html-css', 'HTML & CSS', 'Web', ['html', 'css', 'html5', 'css3', 'flexbox', 'responsive design', 'sass', 'scss'], 'Semantic HTML, layout, responsive design.'),
  s('react', 'React', 'Web', ['react.js', 'reactjs', 'react js', 'redux'], 'Components, state, effects, rendering model.', { implies: ['javascript', 'html-css'] }),
  s('nextjs', 'Next.js', 'Web', ['next.js', 'next js'], 'React framework: routing, SSR/SSG.', { implies: ['react'] }),
  s('angular', 'Angular', 'Web', ['angularjs', 'angular.js'], 'Angular components, services, RxJS.', { implies: ['typescript'] }),
  s('vue', 'Vue.js', 'Web', ['vue', 'vuejs', 'vue js'], 'Vue reactivity and components.', { implies: ['javascript'] }),
  s('nodejs', 'Node.js', 'Web', ['node.js', 'nodejs', 'node js'], 'Event loop, modules, async I/O on the server.', { implies: ['javascript'] }),
  s('express', 'Express.js', 'Web', ['expressjs', 'express.js'], 'Routing, middleware, error handling.', { implies: ['nodejs', 'rest-api'] }),
  s('rest-api', 'REST APIs', 'Web', ['restful', 'rest apis', 'rest api', 'api design', 'api development', 'http apis', 'web services', 'microservices'], 'HTTP methods, status codes, resource design.'),
  s('graphql', 'GraphQL', 'Web', [], 'Schemas, queries, resolvers.', { implies: ['rest-api'] }),
  s('spring-boot', 'Spring Boot', 'Web', ['spring framework', 'springboot'], 'Java backend framework.', { implies: ['java', 'rest-api'] }),
  s('django-flask', 'Django / Flask', 'Web', ['django', 'flask', 'fastapi'], 'Python web frameworks.', { implies: ['python', 'rest-api'] }),
  s('auth', 'Authentication & Security', 'Web', ['authentication', 'authorization', 'jwt', 'oauth', 'oauth2', 'session management', 'owasp', 'web security'], 'Sessions, tokens, hashing, common vulnerabilities.'),
  s('frontend', 'Frontend Development', 'Web', ['front-end', 'front end', 'frontend development', 'ui development', 'web development'], 'Building user interfaces for the browser.', { implies: ['html-css', 'javascript'] }),
  s('backend', 'Backend Development', 'Web', ['back-end', 'back end', 'backend development', 'server-side', 'server side'], 'Building services, APIs and data access layers.', { implies: ['rest-api', 'sql'] }),

  // ---------- SQL / DBMS ----------
  s('sql', 'SQL', 'SQL/DBMS', ['structured query language', 'sql queries', 'joins', 't-sql', 'pl/sql'], 'SELECT, JOINs, aggregation, subqueries.', { implies: ['dbms'] }),
  s('postgresql', 'PostgreSQL', 'SQL/DBMS', ['postgres', 'psql'], 'PostgreSQL features and administration basics.', { implies: ['sql'] }),
  s('mysql', 'MySQL', 'SQL/DBMS', ['mariadb'], 'MySQL usage.', { implies: ['sql'] }),
  s('nosql', 'NoSQL / MongoDB', 'SQL/DBMS', ['mongodb', 'nosql', 'redis', 'dynamodb', 'cassandra', 'firebase'], 'Document/key-value stores and when to use them.'),
  s('dbms', 'DBMS Concepts', 'SQL/DBMS', ['dbms', 'database management', 'rdbms', 'relational database', 'relational databases', 'databases', 'database design', 'normalization', 'normalisation', 'schema design', 'er diagram', 'orm', 'sequelize', 'prisma', 'hibernate'], 'Keys, normalization, transactions, indexing.'),
  s('transactions', 'Transactions & Indexing', 'SQL/DBMS', ['acid', 'transactions', 'indexing', 'indexes', 'query optimization', 'query optimisation'], 'ACID, isolation levels, index design.', { implies: ['dbms'] }),

  // ---------- CS Fundamentals ----------
  s('os', 'Operating Systems', 'CS Fundamentals', ['operating system', 'operating systems', 'multithreading', 'concurrency', 'multi-threading', 'deadlock'], 'Processes, threads, scheduling, memory, deadlocks.'),
  s('networking', 'Computer Networks', 'CS Fundamentals', ['computer networks', 'computer networking', 'networking', 'tcp/ip', 'dns', 'osi model'], 'TCP/IP, HTTP, DNS, TLS basics.'),
  s('system-design', 'System Design', 'CS Fundamentals', ['system design', 'low level design', 'low-level design', 'high level design', 'high-level design', 'scalability', 'scalable systems', 'distributed systems', 'caching', 'load balancing'], 'Scalability, caching, trade-offs, component design.'),

  // ---------- Tools & DevOps ----------
  s('git', 'Git & GitHub', 'Tools & DevOps', ['git', 'github', 'gitlab', 'version control', 'bitbucket'], 'Branching, merging, rebasing, pull requests.'),
  s('docker', 'Docker & Containers', 'Tools & DevOps', ['docker', 'containerization', 'kubernetes', 'k8s'], 'Images, containers, compose, orchestration basics.'),
  s('cloud', 'Cloud (AWS/Azure/GCP)', 'Tools & DevOps', ['aws', 'azure', 'gcp', 'google cloud', 'cloud computing', 'cloud platforms', 'ec2', 's3', 'lambda', 'serverless'], 'Core cloud services and deployment.'),
  s('cicd', 'CI/CD', 'Tools & DevOps', ['ci/cd', 'cicd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'github actions', 'jenkins', 'devops'], 'Automated build, test and deploy pipelines.'),
  s('testing', 'Testing', 'Tools & DevOps', ['unit testing', 'unit tests', 'integration testing', 'test-driven', 'tdd', 'jest', 'junit', 'pytest', 'automated testing'], 'Unit/integration tests and test design.'),
  s('linux', 'Linux & Shell', 'Tools & DevOps', ['unix', 'bash', 'shell scripting', 'command line', 'command-line'], 'Command line, processes, file permissions.'),
];

export const SKILL_BY_SLUG = Object.fromEntries(SKILLS.map((x) => [x.slug, x]));
