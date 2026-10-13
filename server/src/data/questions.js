// Curated question bank. We store only titles + links to the original source; we do not copy
// problem statements. These are practice SUGGESTIONS, not predictions of any employer's interview.
// Links were written from memory: run `npm run check-links` locally to verify them before publishing.
//
// Each entry: { slug, title, topic (primary skill slug), difficulty, type, source, url, skills: [tag slugs] }

const LC = 'LeetCode';
const lc = (slug, title, difficulty, topic, extra = []) => ({
  slug: `lc-${slug}`, title, topic, difficulty, type: 'coding', source: LC,
  url: `https://leetcode.com/problems/${slug}/`, skills: [topic, ...extra, 'dsa'],
});
const lcsql = (slug, title, difficulty, extra = []) => ({
  slug: `lc-${slug}`, title, topic: 'sql', difficulty, type: 'sql', source: LC,
  url: `https://leetcode.com/problems/${slug}/`, skills: ['sql', ...extra],
});
const cf = (contest, idx, title, topic, extra = []) => ({
  slug: `cf-${contest}${idx.toLowerCase()}`, title, topic, difficulty: 'easy', type: 'coding', source: 'Codeforces',
  url: `https://codeforces.com/problemset/problem/${contest}/${idx}`, skills: [topic, ...extra, 'dsa'],
});
const concept = (slug, title, difficulty, topic, source, url, extra = []) => ({
  slug: `c-${slug}`, title, topic, difficulty, type: 'concept', source, url, skills: [topic, ...extra],
});

export const QUESTIONS = [
  // ===== Arrays =====
  lc('two-sum', 'Two Sum', 'easy', 'hashing', ['arrays']),
  lc('contains-duplicate', 'Contains Duplicate', 'easy', 'arrays', ['hashing']),
  lc('best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'easy', 'arrays'),
  lc('move-zeroes', 'Move Zeroes', 'easy', 'arrays', ['two-pointers']),
  lc('majority-element', 'Majority Element', 'easy', 'arrays', ['hashing']),
  lc('rotate-array', 'Rotate Array', 'medium', 'arrays'),
  lc('product-of-array-except-self', 'Product of Array Except Self', 'medium', 'arrays'),
  lc('maximum-subarray', 'Maximum Subarray', 'medium', 'arrays', ['dp']),
  lc('merge-intervals', 'Merge Intervals', 'medium', 'arrays', ['sorting']),
  lc('trapping-rain-water', 'Trapping Rain Water', 'hard', 'arrays', ['two-pointers']),
  cf(4, 'A', 'Watermelon', 'arrays'),
  cf(158, 'A', 'Next Round', 'arrays'),

  // ===== Strings =====
  lc('valid-anagram', 'Valid Anagram', 'easy', 'strings', ['hashing']),
  lc('valid-palindrome', 'Valid Palindrome', 'easy', 'strings', ['two-pointers']),
  lc('group-anagrams', 'Group Anagrams', 'medium', 'strings', ['hashing']),
  lc('longest-palindromic-substring', 'Longest Palindromic Substring', 'medium', 'strings', ['dp']),
  lc('string-to-integer-atoi', 'String to Integer (atoi)', 'medium', 'strings'),
  lc('minimum-window-substring', 'Minimum Window Substring', 'hard', 'strings', ['sliding-window', 'hashing']),
  cf(71, 'A', 'Way Too Long Words', 'strings'),
  cf(112, 'A', 'Petya and Strings', 'strings'),
  cf(281, 'A', 'Word Capitalization', 'strings'),

  // ===== Hashing =====
  lc('top-k-frequent-elements', 'Top K Frequent Elements', 'medium', 'hashing', ['heaps']),
  lc('subarray-sum-equals-k', 'Subarray Sum Equals K', 'medium', 'hashing', ['arrays']),
  lc('longest-consecutive-sequence', 'Longest Consecutive Sequence', 'medium', 'hashing', ['arrays']),
  lc('lru-cache', 'LRU Cache', 'medium', 'hashing', ['linked-list', 'system-design', 'oop']),

  // ===== Two pointers =====
  lc('two-sum-ii-input-array-is-sorted', 'Two Sum II – Input Array Is Sorted', 'medium', 'two-pointers', ['arrays']),
  lc('remove-duplicates-from-sorted-array', 'Remove Duplicates from Sorted Array', 'easy', 'two-pointers', ['arrays']),
  lc('3sum', '3Sum', 'medium', 'two-pointers', ['arrays', 'sorting']),
  lc('container-with-most-water', 'Container With Most Water', 'medium', 'two-pointers', ['arrays', 'greedy']),

  // ===== Sliding window =====
  lc('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'medium', 'sliding-window', ['strings', 'hashing']),
  lc('minimum-size-subarray-sum', 'Minimum Size Subarray Sum', 'medium', 'sliding-window', ['arrays']),
  lc('permutation-in-string', 'Permutation in String', 'medium', 'sliding-window', ['strings', 'hashing']),
  lc('longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'medium', 'sliding-window', ['strings']),
  lc('sliding-window-maximum', 'Sliding Window Maximum', 'hard', 'sliding-window', ['heaps', 'stack-queue']),

  // ===== Linked list =====
  lc('reverse-linked-list', 'Reverse Linked List', 'easy', 'linked-list'),
  lc('merge-two-sorted-lists', 'Merge Two Sorted Lists', 'easy', 'linked-list'),
  lc('linked-list-cycle', 'Linked List Cycle', 'easy', 'linked-list', ['two-pointers']),
  lc('middle-of-the-linked-list', 'Middle of the Linked List', 'easy', 'linked-list', ['two-pointers']),
  lc('remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'medium', 'linked-list', ['two-pointers']),
  lc('add-two-numbers', 'Add Two Numbers', 'medium', 'linked-list'),
  lc('reorder-list', 'Reorder List', 'medium', 'linked-list'),
  lc('copy-list-with-random-pointer', 'Copy List with Random Pointer', 'medium', 'linked-list', ['hashing']),

  // ===== Stacks & queues =====
  lc('valid-parentheses', 'Valid Parentheses', 'easy', 'stack-queue', ['strings']),
  lc('implement-queue-using-stacks', 'Implement Queue using Stacks', 'easy', 'stack-queue'),
  lc('min-stack', 'Min Stack', 'medium', 'stack-queue'),
  lc('daily-temperatures', 'Daily Temperatures', 'medium', 'stack-queue', ['arrays']),
  lc('evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'medium', 'stack-queue'),
  lc('largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'hard', 'stack-queue', ['arrays']),

  // ===== Recursion / backtracking =====
  lc('subsets', 'Subsets', 'medium', 'recursion'),
  lc('permutations', 'Permutations', 'medium', 'recursion'),
  lc('combination-sum', 'Combination Sum', 'medium', 'recursion'),
  lc('generate-parentheses', 'Generate Parentheses', 'medium', 'recursion', ['strings']),
  lc('word-search', 'Word Search', 'medium', 'recursion', ['graphs']),
  lc('n-queens', 'N-Queens', 'hard', 'recursion'),

  // ===== Trees =====
  lc('maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'easy', 'trees', ['recursion']),
  lc('invert-binary-tree', 'Invert Binary Tree', 'easy', 'trees', ['recursion']),
  lc('same-tree', 'Same Tree', 'easy', 'trees', ['recursion']),
  lc('diameter-of-binary-tree', 'Diameter of Binary Tree', 'easy', 'trees', ['recursion']),
  lc('binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'medium', 'trees', ['graphs', 'stack-queue']),
  lc('validate-binary-search-tree', 'Validate Binary Search Tree', 'medium', 'trees'),
  lc('kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'medium', 'trees'),
  lc('lowest-common-ancestor-of-a-binary-search-tree', 'Lowest Common Ancestor of a BST', 'medium', 'trees'),
  lc('binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'hard', 'trees', ['recursion']),
  lc('serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'hard', 'trees'),

  // ===== Graphs =====
  lc('number-of-islands', 'Number of Islands', 'medium', 'graphs'),
  lc('clone-graph', 'Clone Graph', 'medium', 'graphs', ['hashing']),
  lc('course-schedule', 'Course Schedule', 'medium', 'graphs'),
  lc('rotting-oranges', 'Rotting Oranges', 'medium', 'graphs', ['stack-queue']),
  lc('pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'medium', 'graphs'),
  lc('network-delay-time', 'Network Delay Time', 'medium', 'graphs', ['heaps']),
  lc('word-ladder', 'Word Ladder', 'hard', 'graphs', ['strings']),

  // ===== Binary search =====
  lc('binary-search', 'Binary Search', 'easy', 'binary-search'),
  lc('search-a-2d-matrix', 'Search a 2D Matrix', 'medium', 'binary-search', ['arrays']),
  lc('search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'medium', 'binary-search', ['arrays']),
  lc('find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'medium', 'binary-search', ['arrays']),
  lc('koko-eating-bananas', 'Koko Eating Bananas', 'medium', 'binary-search'),
  lc('median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'hard', 'binary-search', ['arrays']),

  // ===== Sorting =====
  lc('sort-colors', 'Sort Colors', 'medium', 'sorting', ['arrays', 'two-pointers']),
  lc('sort-an-array', 'Sort an Array', 'medium', 'sorting', ['arrays']),
  lc('kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'medium', 'sorting', ['heaps']),

  // ===== Dynamic programming =====
  lc('climbing-stairs', 'Climbing Stairs', 'easy', 'dp'),
  lc('house-robber', 'House Robber', 'medium', 'dp'),
  lc('coin-change', 'Coin Change', 'medium', 'dp'),
  lc('longest-increasing-subsequence', 'Longest Increasing Subsequence', 'medium', 'dp', ['binary-search']),
  lc('unique-paths', 'Unique Paths', 'medium', 'dp'),
  lc('word-break', 'Word Break', 'medium', 'dp', ['strings']),
  lc('decode-ways', 'Decode Ways', 'medium', 'dp', ['strings']),
  lc('partition-equal-subset-sum', 'Partition Equal Subset Sum', 'medium', 'dp'),
  lc('longest-common-subsequence', 'Longest Common Subsequence', 'medium', 'dp', ['strings']),
  lc('edit-distance', 'Edit Distance', 'hard', 'dp', ['strings']),

  // ===== Heaps =====
  lc('last-stone-weight', 'Last Stone Weight', 'easy', 'heaps'),
  lc('kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'easy', 'heaps'),
  lc('task-scheduler', 'Task Scheduler', 'medium', 'heaps', ['greedy']),
  lc('merge-k-sorted-lists', 'Merge k Sorted Lists', 'hard', 'heaps', ['linked-list']),
  lc('find-median-from-data-stream', 'Find Median from Data Stream', 'hard', 'heaps'),

  // ===== Greedy =====
  lc('jump-game', 'Jump Game', 'medium', 'greedy', ['arrays']),
  lc('jump-game-ii', 'Jump Game II', 'medium', 'greedy', ['arrays']),
  lc('gas-station', 'Gas Station', 'medium', 'greedy', ['arrays']),
  lc('partition-labels', 'Partition Labels', 'medium', 'greedy', ['strings']),
  lc('non-overlapping-intervals', 'Non-overlapping Intervals', 'medium', 'greedy', ['sorting']),

  // ===== Complexity =====
  concept('big-o', 'Explain Big-O, Big-Omega and Big-Theta with examples', 'easy', 'complexity', 'Big-O Cheat Sheet', 'https://www.bigocheatsheet.com/'),

  // ===== SQL (LeetCode Database problems) =====
  lcsql('combine-two-tables', 'Combine Two Tables', 'easy'),
  lcsql('duplicate-emails', 'Duplicate Emails', 'easy', ['dbms']),
  lcsql('customers-who-never-order', 'Customers Who Never Order', 'easy'),
  lcsql('employees-earning-more-than-their-managers', 'Employees Earning More Than Their Managers', 'easy'),
  lcsql('rising-temperature', 'Rising Temperature', 'easy'),
  lcsql('delete-duplicate-emails', 'Delete Duplicate Emails', 'easy'),
  lcsql('second-highest-salary', 'Second Highest Salary', 'medium'),
  lcsql('nth-highest-salary', 'Nth Highest Salary', 'medium'),
  lcsql('rank-scores', 'Rank Scores', 'medium'),
  lcsql('consecutive-numbers', 'Consecutive Numbers', 'medium'),
  lcsql('department-highest-salary', 'Department Highest Salary', 'medium'),
  concept('sql-learn', 'Work through the interactive SQL lessons (SELECT, JOINs, aggregates)', 'easy', 'sql', 'SQLBolt', 'https://sqlbolt.com/'),
  concept('pg-join', 'Explain INNER vs LEFT vs FULL JOIN with an example each', 'easy', 'sql', 'PostgreSQL Docs', 'https://www.postgresql.org/docs/current/tutorial-join.html'),
  concept('pg-intro', 'Follow the PostgreSQL tutorial: create tables, insert and query data', 'easy', 'postgresql', 'PostgreSQL Docs', 'https://www.postgresql.org/docs/current/tutorial.html', ['sql']),
  concept('pg-index', 'When does an index help, and when does it hurt?', 'medium', 'transactions', 'PostgreSQL Docs', 'https://www.postgresql.org/docs/current/indexes.html', ['dbms', 'postgresql']),
  concept('pg-tx', 'What do the ACID properties guarantee? Show a transaction', 'medium', 'transactions', 'PostgreSQL Docs', 'https://www.postgresql.org/docs/current/tutorial-transactions.html', ['dbms', 'postgresql']),
  concept('mysql-docs', 'Skim the MySQL reference manual: data types and JOIN syntax', 'easy', 'mysql', 'MySQL Docs', 'https://dev.mysql.com/doc/refman/8.0/en/tutorial.html', ['sql']),
  concept('dbms-norm', 'What is normalization? Walk through 1NF, 2NF and 3NF', 'medium', 'dbms', 'GeeksforGeeks', 'https://www.geeksforgeeks.org/normal-forms-in-dbms/'),
  concept('dbms-keys', 'Primary key vs foreign key vs unique key vs candidate key', 'easy', 'dbms', 'GeeksforGeeks', 'https://www.geeksforgeeks.org/difference-between-primary-key-and-foreign-key/'),
  concept('mongo-docs', 'SQL vs NoSQL: when would you choose a document store?', 'medium', 'nosql', 'MongoDB Docs', 'https://www.mongodb.com/docs/manual/'),

  // ===== JavaScript =====
  concept('js-closures', 'What is a closure? Give a practical use', 'easy', 'javascript', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures'),
  concept('js-promises', 'Promises vs async/await: how do they work and handle errors?', 'medium', 'javascript', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises'),
  concept('js-event-loop', 'Explain the event loop, call stack and microtask queue', 'medium', 'javascript', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop'),
  concept('ts-handbook', 'Read the TypeScript handbook intro: types, interfaces, generics', 'easy', 'typescript', 'TypeScript Docs', 'https://www.typescriptlang.org/docs/handbook/intro.html'),

  // ===== Other languages =====
  concept('py-tutorial', 'Python tutorial: data structures, comprehensions and modules', 'easy', 'python', 'Python Docs', 'https://docs.python.org/3/tutorial/'),
  concept('java-tutorial', 'Java tutorial: classes, collections and exceptions', 'easy', 'java', 'Oracle Java Tutorials', 'https://docs.oracle.com/javase/tutorial/'),
  concept('cpp-ref', 'Review the C++ STL containers and when to use each', 'medium', 'cpp', 'cppreference', 'https://en.cppreference.com/w/cpp/container'),
  concept('go-tour', 'Take the Tour of Go: slices, goroutines and channels', 'easy', 'go', 'Go Docs', 'https://go.dev/tour/'),
  concept('oop-pillars', 'Explain the four pillars of OOP with examples', 'easy', 'oop', 'Oracle Java Tutorials', 'https://docs.oracle.com/javase/tutorial/java/concepts/'),

  // ===== Web =====
  concept('html-css-flex', 'Lay out a page with Flexbox', 'easy', 'html-css', 'MDN', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox'),
  concept('css-grid', 'When would you pick CSS Grid over Flexbox?', 'medium', 'html-css', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout'),
  concept('react-usestate', 'How does useState work and why is state immutable?', 'easy', 'react', 'React Docs', 'https://react.dev/reference/react/useState'),
  concept('react-useeffect', 'useEffect: dependency array, cleanup and common pitfalls', 'medium', 'react', 'React Docs', 'https://react.dev/reference/react/useEffect'),
  concept('react-usememo', 'When should you memoize with useMemo / useCallback?', 'hard', 'react', 'React Docs', 'https://react.dev/reference/react/useMemo'),
  concept('react-learn', 'Work through the official React tutorial and Learn guide', 'easy', 'react', 'React Docs', 'https://react.dev/learn'),
  concept('next-learn', 'Complete the Next.js learn course', 'medium', 'nextjs', 'Next.js Docs', 'https://nextjs.org/learn'),
  concept('vue-guide', 'Read the Vue introduction and reactivity fundamentals', 'easy', 'vue', 'Vue Docs', 'https://vuejs.org/guide/introduction.html'),
  concept('angular-docs', 'Overview of Angular components, services and dependency injection', 'medium', 'angular', 'Angular Docs', 'https://angular.dev/overview'),
  concept('node-event-loop', 'How does the Node.js event loop differ from the browser\'s?', 'medium', 'nodejs', 'Node.js Docs', 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick', ['javascript']),
  concept('node-learn', 'Node.js learn: modules, file system and async patterns', 'easy', 'nodejs', 'Node.js Docs', 'https://nodejs.org/en/learn'),
  concept('express-middleware', 'What is middleware in Express? Write a logging middleware', 'easy', 'express', 'Express Docs', 'https://expressjs.com/en/guide/using-middleware.html', ['nodejs']),
  concept('express-errors', 'How are errors handled in Express?', 'medium', 'express', 'Express Docs', 'https://expressjs.com/en/guide/error-handling.html', ['nodejs']),
  concept('http-methods', 'GET vs POST vs PUT vs PATCH vs DELETE: semantics and idempotency', 'easy', 'rest-api', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods', ['networking']),
  concept('http-status', 'Which status codes would you return for common API outcomes?', 'easy', 'rest-api', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status', ['networking']),
  concept('cors', 'What is CORS and why does the browser enforce it?', 'medium', 'rest-api', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', ['auth', 'networking']),
  concept('graphql-learn', 'GraphQL basics: queries, mutations and schemas', 'medium', 'graphql', 'GraphQL.org', 'https://graphql.org/learn/'),
  concept('spring-guides', 'Build a REST service with the Spring guides', 'medium', 'spring-boot', 'Spring', 'https://spring.io/guides'),
  concept('django-tutorial', 'Django tutorial: models, views and the admin', 'easy', 'django-flask', 'Django Docs', 'https://docs.djangoproject.com/en/stable/intro/tutorial01/'),
  concept('flask-quickstart', 'Flask quickstart: routing, requests and templates', 'easy', 'django-flask', 'Flask Docs', 'https://flask.palletsprojects.com/en/stable/quickstart/'),
  concept('jwt-intro', 'How does JWT authentication work? Pros and cons vs sessions', 'medium', 'auth', 'jwt.io', 'https://jwt.io/introduction'),
  concept('frontend-ref', 'Review web fundamentals: DOM, events and the rendering pipeline', 'medium', 'frontend', 'MDN', 'https://developer.mozilla.org/en-US/docs/Learn_web_development', ['html-css', 'javascript']),
  concept('backend-ref', 'Design a small CRUD API: routes, validation and persistence', 'medium', 'backend', 'MDN', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side', ['rest-api', 'sql']),

  // ===== CS fundamentals =====
  concept('os-ostep', 'Operating Systems: Three Easy Pieces – processes, scheduling, memory', 'medium', 'os', 'OSTEP', 'https://pages.cs.wisc.edu/~remzi/OSTEP/'),
  concept('os-deadlock', 'Explain deadlock, its four conditions and how to prevent it', 'medium', 'os', 'GeeksforGeeks', 'https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/'),
  concept('net-http', 'What happens when you type a URL in the browser and press Enter?', 'medium', 'networking', 'MDN', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'),
  concept('net-osi', 'Compare the OSI and TCP/IP models', 'easy', 'networking', 'GeeksforGeeks', 'https://www.geeksforgeeks.org/layers-of-osi-model/'),
  concept('sysdesign-primer', 'Read the System Design Primer: scalability, caching, load balancing', 'hard', 'system-design', 'GitHub', 'https://github.com/donnemartin/system-design-primer'),

  // ===== Tools =====
  concept('git-book', 'Explain git merge vs rebase and resolve a conflict', 'easy', 'git', 'Pro Git', 'https://git-scm.com/book/en/v2'),
  concept('docker-start', 'Containerize a small app: write a Dockerfile and run it', 'medium', 'docker', 'Docker Docs', 'https://docs.docker.com/get-started/'),
  concept('cloud-aws', 'Getting started with core AWS services (compute, storage, networking)', 'medium', 'cloud', 'AWS', 'https://aws.amazon.com/getting-started/'),
  concept('cicd-gha', 'Set up a CI pipeline that runs tests on every push', 'medium', 'cicd', 'GitHub Docs', 'https://docs.github.com/en/actions', ['git']),
  concept('testing-jest', 'Write unit tests: arrange/act/assert, mocking and coverage', 'easy', 'testing', 'Jest Docs', 'https://jestjs.io/docs/getting-started'),
  concept('linux-journey', 'Learn essential Linux commands, permissions and pipes', 'easy', 'linux', 'Linux Journey', 'https://linuxjourney.com/'),
];
