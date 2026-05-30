// Raj Special Algo Checklist — 150 LeetCode problems covering ALL DSA patterns
// Matches the "Raj Special Algo Checklist" roadmap image
export const rajSpecialBucket = {
  name: 'Raj Special Algo Checklist',
  description: 'Complete Algorithm Roadmap for DSA — 150 handpicked LeetCode problems covering all 13 pattern categories from basics to advanced topics. Curated for interview mastery.',
  category: 'dsa',
  icon: 'BookCheck',
  color: '#39FF14',
  problems: [
    // ═══════════════════════════════════════════════════════════════
    // 1. BASICS / BRUTE FORCE — Linear Search, Prefix Sum, Frequency
    // ═══════════════════════════════════════════════════════════════
    { title: 'Two Sum', topic: 'Basics / Brute Force', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode', tags: ['array', 'hashmap'], order: 0 },
    { title: 'Contains Duplicate', topic: 'Basics / Brute Force', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/contains-duplicate/', platform: 'leetcode', tags: ['array', 'hashset'], order: 1 },
    { title: 'Majority Element', topic: 'Basics / Brute Force', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/majority-element/', platform: 'leetcode', tags: ['array', 'frequency-counting'], order: 2 },
    { title: 'Range Sum Query - Immutable', topic: 'Basics / Brute Force', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/range-sum-query-immutable/', platform: 'leetcode', tags: ['prefix-sum', 'array'], order: 3 },
    { title: 'Product of Array Except Self', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/product-of-array-except-self/', platform: 'leetcode', tags: ['prefix-sum', 'array'], order: 4 },
    { title: 'Subarray Sum Equals K', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/subarray-sum-equals-k/', platform: 'leetcode', tags: ['prefix-sum', 'hashmap'], order: 5 },
    { title: 'Group Anagrams', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/group-anagrams/', platform: 'leetcode', tags: ['hashing', 'string', 'frequency-counting'], order: 6 },
    { title: 'Top K Frequent Elements', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/top-k-frequent-elements/', platform: 'leetcode', tags: ['hashing', 'frequency-counting', 'heap'], order: 7 },
    { title: 'Spiral Matrix', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/spiral-matrix/', platform: 'leetcode', tags: ['simulation', 'matrix'], order: 8 },
    { title: 'Rotate Image', topic: 'Basics / Brute Force', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/rotate-image/', platform: 'leetcode', tags: ['simulation', 'matrix'], order: 9 },

    // ═══════════════════════════════════════════════════════════════
    // 2. SORTING ALGORITHMS — Merge Sort, Quick Sort, Custom Sort
    // ═══════════════════════════════════════════════════════════════
    { title: 'Sort Colors', topic: 'Sorting Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/sort-colors/', platform: 'leetcode', tags: ['sorting', 'two-pointers'], order: 10 },
    { title: 'Merge Intervals', topic: 'Sorting Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/merge-intervals/', platform: 'leetcode', tags: ['sorting', 'intervals'], order: 11 },
    { title: 'Largest Number', topic: 'Sorting Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/largest-number/', platform: 'leetcode', tags: ['sorting', 'custom-comparator'], order: 12 },
    { title: 'Kth Largest Element in an Array', topic: 'Sorting Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', platform: 'leetcode', tags: ['sorting', 'quickselect', 'heap'], order: 13 },
    { title: 'Sort an Array', topic: 'Sorting Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/sort-an-array/', platform: 'leetcode', tags: ['sorting', 'merge-sort'], order: 14 },

    // ═══════════════════════════════════════════════════════════════
    // 3. SEARCHING ALGORITHMS — Binary Search, Search on Answer
    // ═══════════════════════════════════════════════════════════════
    { title: 'Binary Search', topic: 'Searching Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/binary-search/', platform: 'leetcode', tags: ['binary-search'], order: 15 },
    { title: 'Search Insert Position', topic: 'Searching Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/search-insert-position/', platform: 'leetcode', tags: ['binary-search', 'lower-bound'], order: 16 },
    { title: 'Find First and Last Position of Element in Sorted Array', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', platform: 'leetcode', tags: ['binary-search', 'lower-bound', 'upper-bound'], order: 17 },
    { title: 'Search in Rotated Sorted Array', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', platform: 'leetcode', tags: ['binary-search'], order: 18 },
    { title: 'Find Minimum in Rotated Sorted Array', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', platform: 'leetcode', tags: ['binary-search'], order: 19 },
    { title: 'Search a 2D Matrix', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/search-a-2d-matrix/', platform: 'leetcode', tags: ['binary-search', 'matrix'], order: 20 },
    { title: 'Find Peak Element', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-peak-element/', platform: 'leetcode', tags: ['binary-search'], order: 21 },
    { title: 'Koko Eating Bananas', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/koko-eating-bananas/', platform: 'leetcode', tags: ['binary-search', 'search-on-answer'], order: 22 },
    { title: 'Capacity To Ship Packages Within D Days', topic: 'Searching Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', platform: 'leetcode', tags: ['binary-search', 'search-on-answer'], order: 23 },
    { title: 'Split Array Largest Sum', topic: 'Searching Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/split-array-largest-sum/', platform: 'leetcode', tags: ['binary-search', 'search-on-answer'], order: 24 },
    { title: 'Median of Two Sorted Arrays', topic: 'Searching Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', platform: 'leetcode', tags: ['binary-search'], order: 25 },

    // ═══════════════════════════════════════════════════════════════
    // 4. TWO POINTER & SLIDING WINDOW
    // ═══════════════════════════════════════════════════════════════
    { title: 'Valid Palindrome', topic: 'Two Pointer & Sliding Window', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/valid-palindrome/', platform: 'leetcode', tags: ['two-pointers', 'string'], order: 26 },
    { title: 'Remove Duplicates from Sorted Array', topic: 'Two Pointer & Sliding Window', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', platform: 'leetcode', tags: ['two-pointers'], order: 27 },
    { title: '3Sum', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/3sum/', platform: 'leetcode', tags: ['two-pointers', 'sorting'], order: 28 },
    { title: 'Container With Most Water', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/container-with-most-water/', platform: 'leetcode', tags: ['two-pointers', 'greedy'], order: 29 },
    { title: 'Longest Substring Without Repeating Characters', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode', tags: ['sliding-window', 'hashmap'], order: 30 },
    { title: 'Longest Repeating Character Replacement', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-repeating-character-replacement/', platform: 'leetcode', tags: ['sliding-window'], order: 31 },
    { title: 'Permutation in String', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/permutation-in-string/', platform: 'leetcode', tags: ['sliding-window', 'hashmap'], order: 32 },
    { title: 'Fruit Into Baskets', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/fruit-into-baskets/', platform: 'leetcode', tags: ['sliding-window', 'variable-window'], order: 33 },
    { title: 'Find the Duplicate Number', topic: 'Two Pointer & Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-the-duplicate-number/', platform: 'leetcode', tags: ['fast-slow-pointer', 'cycle-detection'], order: 34 },
    { title: 'Linked List Cycle', topic: 'Two Pointer & Sliding Window', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/linked-list-cycle/', platform: 'leetcode', tags: ['fast-slow-pointer', 'linked-list'], order: 35 },
    { title: 'Trapping Rain Water', topic: 'Two Pointer & Sliding Window', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/trapping-rain-water/', platform: 'leetcode', tags: ['two-pointers'], order: 36 },
    { title: 'Minimum Window Substring', topic: 'Two Pointer & Sliding Window', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/minimum-window-substring/', platform: 'leetcode', tags: ['sliding-window', 'variable-window'], order: 37 },
    { title: 'Sliding Window Maximum', topic: 'Two Pointer & Sliding Window', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/sliding-window-maximum/', platform: 'leetcode', tags: ['sliding-window', 'monotonic-queue'], order: 38 },

    // ═══════════════════════════════════════════════════════════════
    // 5. RECURSION & BACKTRACKING
    // ═══════════════════════════════════════════════════════════════
    { title: 'Subsets', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/subsets/', platform: 'leetcode', tags: ['backtracking', 'recursion'], order: 39 },
    { title: 'Permutations', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/permutations/', platform: 'leetcode', tags: ['backtracking', 'permutation'], order: 40 },
    { title: 'Combination Sum', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/combination-sum/', platform: 'leetcode', tags: ['backtracking', 'combination'], order: 41 },
    { title: 'Combination Sum II', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/combination-sum-ii/', platform: 'leetcode', tags: ['backtracking', 'combination'], order: 42 },
    { title: 'Letter Combinations of a Phone Number', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', platform: 'leetcode', tags: ['backtracking', 'recursion'], order: 43 },
    { title: 'Generate Parentheses', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/generate-parentheses/', platform: 'leetcode', tags: ['backtracking', 'recursion'], order: 44 },
    { title: 'Palindrome Partitioning', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/palindrome-partitioning/', platform: 'leetcode', tags: ['backtracking', 'divide-and-conquer'], order: 45 },
    { title: 'Word Search', topic: 'Recursion & Backtracking', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/word-search/', platform: 'leetcode', tags: ['backtracking', 'matrix'], order: 46 },
    { title: 'N-Queens', topic: 'Recursion & Backtracking', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/n-queens/', platform: 'leetcode', tags: ['backtracking', 'n-queens'], order: 47 },
    { title: 'Sudoku Solver', topic: 'Recursion & Backtracking', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/sudoku-solver/', platform: 'leetcode', tags: ['backtracking', 'recursion'], order: 48 },

    // ═══════════════════════════════════════════════════════════════
    // 6. GREEDY ALGORITHMS
    // ═══════════════════════════════════════════════════════════════
    { title: 'Best Time to Buy and Sell Stock', topic: 'Greedy Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', platform: 'leetcode', tags: ['greedy', 'array'], order: 49 },
    { title: 'Assign Cookies', topic: 'Greedy Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/assign-cookies/', platform: 'leetcode', tags: ['greedy', 'sorting'], order: 50 },
    { title: 'Jump Game', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/jump-game/', platform: 'leetcode', tags: ['greedy'], order: 51 },
    { title: 'Jump Game II', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/jump-game-ii/', platform: 'leetcode', tags: ['greedy'], order: 52 },
    { title: 'Gas Station', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/gas-station/', platform: 'leetcode', tags: ['greedy'], order: 53 },
    { title: 'Non-overlapping Intervals', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/non-overlapping-intervals/', platform: 'leetcode', tags: ['greedy', 'intervals', 'activity-selection'], order: 54 },
    { title: 'Minimum Number of Arrows to Burst Balloons', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/', platform: 'leetcode', tags: ['greedy', 'intervals'], order: 55 },
    { title: 'Task Scheduler', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/task-scheduler/', platform: 'leetcode', tags: ['greedy', 'scheduling'], order: 56 },
    { title: 'Partition Labels', topic: 'Greedy Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/partition-labels/', platform: 'leetcode', tags: ['greedy', 'two-pointers'], order: 57 },
    { title: 'Candy', topic: 'Greedy Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/candy/', platform: 'leetcode', tags: ['greedy'], order: 58 },

    // ═══════════════════════════════════════════════════════════════
    // 7. DYNAMIC PROGRAMMING — 1D, 2D, Knapsack, LIS, Matrix, Bitmask, Digit DP, Trees
    // ═══════════════════════════════════════════════════════════════
    // -- 1D DP --
    { title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/climbing-stairs/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 59 },
    { title: 'House Robber', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/house-robber/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 60 },
    { title: 'House Robber II', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/house-robber-ii/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 61 },
    { title: 'Decode Ways', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/decode-ways/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 62 },
    { title: 'Maximum Product Subarray', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/maximum-product-subarray/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 63 },
    { title: 'Word Break', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/word-break/', platform: 'leetcode', tags: ['dp', '1d-dp', 'trie'], order: 64 },
    // -- 2D DP --
    { title: 'Unique Paths', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/unique-paths/', platform: 'leetcode', tags: ['dp', '2d-dp', 'matrix-dp'], order: 65 },
    { title: 'Minimum Path Sum', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/minimum-path-sum/', platform: 'leetcode', tags: ['dp', '2d-dp', 'matrix-dp'], order: 66 },
    { title: 'Longest Common Subsequence', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-common-subsequence/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 67 },
    { title: 'Edit Distance', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/edit-distance/', platform: 'leetcode', tags: ['dp', '2d-dp', 'string'], order: 68 },
    { title: 'Interleaving String', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/interleaving-string/', platform: 'leetcode', tags: ['dp', '2d-dp', 'string'], order: 69 },
    // -- Knapsack DP --
    { title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/coin-change/', platform: 'leetcode', tags: ['dp', 'knapsack'], order: 70 },
    { title: 'Coin Change II', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/coin-change-ii/', platform: 'leetcode', tags: ['dp', 'knapsack'], order: 71 },
    { title: 'Partition Equal Subset Sum', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/partition-equal-subset-sum/', platform: 'leetcode', tags: ['dp', 'knapsack', '0-1-knapsack'], order: 72 },
    { title: 'Target Sum', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/target-sum/', platform: 'leetcode', tags: ['dp', 'knapsack'], order: 73 },
    { title: 'Perfect Squares', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/perfect-squares/', platform: 'leetcode', tags: ['dp', 'knapsack'], order: 74 },
    // -- LIS --
    { title: 'Longest Increasing Subsequence', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-increasing-subsequence/', platform: 'leetcode', tags: ['dp', 'lis', 'binary-search'], order: 75 },
    { title: 'Russian Doll Envelopes', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/russian-doll-envelopes/', platform: 'leetcode', tags: ['dp', 'lis', 'binary-search'], order: 76 },
    // -- Palindrome DP --
    { title: 'Longest Palindromic Substring', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-palindromic-substring/', platform: 'leetcode', tags: ['dp', 'string'], order: 77 },
    { title: 'Longest Palindromic Subsequence', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-palindromic-subsequence/', platform: 'leetcode', tags: ['dp', '2d-dp', 'string'], order: 78 },
    { title: 'Palindrome Partitioning II', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/palindrome-partitioning-ii/', platform: 'leetcode', tags: ['dp', 'string'], order: 79 },
    // -- Bitmask DP --
    { title: 'Partition to K Equal Sum Subsets', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/partition-to-k-equal-sum-subsets/', platform: 'leetcode', tags: ['dp', 'bitmask-dp', 'backtracking'], order: 80 },
    // -- Stock DP --
    { title: 'Best Time to Buy and Sell Stock with Cooldown', topic: 'Dynamic Programming', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', platform: 'leetcode', tags: ['dp', 'state-machine'], order: 81 },
    { title: 'Best Time to Buy and Sell Stock IV', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/', platform: 'leetcode', tags: ['dp', 'state-machine'], order: 82 },
    // -- Hard DP --
    { title: 'Burst Balloons', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/burst-balloons/', platform: 'leetcode', tags: ['dp', 'interval-dp'], order: 83 },
    { title: 'Regular Expression Matching', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/regular-expression-matching/', platform: 'leetcode', tags: ['dp', '2d-dp', 'string'], order: 84 },
    { title: 'Distinct Subsequences', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/distinct-subsequences/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 85 },
    { title: 'Longest Valid Parentheses', topic: 'Dynamic Programming', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/longest-valid-parentheses/', platform: 'leetcode', tags: ['dp', 'stack'], order: 86 },

    // ═══════════════════════════════════════════════════════════════
    // 8. GRAPH ALGORITHMS — BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall,
    //    Topological Sort, Union Find, MST, Tarjan, Bipartite, Cycle Detection
    // ═══════════════════════════════════════════════════════════════
    // -- BFS / DFS --
    { title: 'Number of Islands', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/number-of-islands/', platform: 'leetcode', tags: ['bfs', 'dfs', 'graph'], order: 87 },
    { title: 'Clone Graph', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/clone-graph/', platform: 'leetcode', tags: ['bfs', 'dfs', 'graph'], order: 88 },
    { title: 'Rotting Oranges', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/rotting-oranges/', platform: 'leetcode', tags: ['bfs', 'matrix'], order: 89 },
    { title: 'Pacific Atlantic Water Flow', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 90 },
    { title: 'Surrounded Regions', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/surrounded-regions/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 91 },
    { title: 'Shortest Path in Binary Matrix', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', platform: 'leetcode', tags: ['bfs', '0-1-bfs'], order: 92 },
    // -- Topological Sort --
    { title: 'Course Schedule', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/course-schedule/', platform: 'leetcode', tags: ['topological-sort', 'cycle-detection', 'graph'], order: 93 },
    { title: 'Course Schedule II', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/course-schedule-ii/', platform: 'leetcode', tags: ['topological-sort', 'graph'], order: 94 },
    // -- Shortest Path --
    { title: 'Network Delay Time', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/network-delay-time/', platform: 'leetcode', tags: ['dijkstra', 'shortest-path'], order: 95 },
    { title: 'Cheapest Flights Within K Stops', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', platform: 'leetcode', tags: ['bellman-ford', 'dijkstra', 'shortest-path'], order: 96 },
    { title: 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/', platform: 'leetcode', tags: ['floyd-warshall', 'shortest-path'], order: 97 },
    // -- Union Find / MST --
    { title: 'Redundant Connection', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/redundant-connection/', platform: 'leetcode', tags: ['union-find', 'cycle-detection'], order: 98 },
    { title: 'Accounts Merge', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/accounts-merge/', platform: 'leetcode', tags: ['union-find', 'dfs'], order: 99 },
    { title: 'Min Cost to Connect All Points', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', platform: 'leetcode', tags: ['mst', 'kruskal', 'prim'], order: 100 },
    // -- Bipartite --
    { title: 'Is Graph Bipartite?', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/is-graph-bipartite/', platform: 'leetcode', tags: ['bfs', 'dfs', 'bipartite'], order: 101 },
    { title: 'Possible Bipartition', topic: 'Graph Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/possible-bipartition/', platform: 'leetcode', tags: ['bfs', 'dfs', 'bipartite'], order: 102 },
    // -- Hard Graphs --
    { title: 'Word Ladder', topic: 'Graph Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/word-ladder/', platform: 'leetcode', tags: ['bfs', 'graph'], order: 103 },
    { title: 'Critical Connections in a Network', topic: 'Graph Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/critical-connections-in-a-network/', platform: 'leetcode', tags: ['tarjan', 'bridges', 'articulation-points'], order: 104 },
    { title: 'Swim in Rising Water', topic: 'Graph Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/swim-in-rising-water/', platform: 'leetcode', tags: ['dijkstra', 'binary-search', 'graph'], order: 105 },
    { title: 'Longest Increasing Path in a Matrix', topic: 'Graph Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/', platform: 'leetcode', tags: ['dfs', 'dp-on-graph', 'topological-sort'], order: 106 },

    // ═══════════════════════════════════════════════════════════════
    // 9. TREE ALGORITHMS — Traversals, BST, LCA, Diameter, Tree DP, Segment/Fenwick
    // ═══════════════════════════════════════════════════════════════
    { title: 'Binary Tree Inorder Traversal', topic: 'Tree Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', platform: 'leetcode', tags: ['tree', 'traversal', 'inorder'], order: 107 },
    { title: 'Binary Tree Level Order Traversal', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', platform: 'leetcode', tags: ['tree', 'traversal', 'level-order'], order: 108 },
    { title: 'Maximum Depth of Binary Tree', topic: 'Tree Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'leetcode', tags: ['tree', 'dfs'], order: 109 },
    { title: 'Symmetric Tree', topic: 'Tree Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/symmetric-tree/', platform: 'leetcode', tags: ['tree', 'dfs'], order: 110 },
    { title: 'Diameter of Binary Tree', topic: 'Tree Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/diameter-of-binary-tree/', platform: 'leetcode', tags: ['tree', 'diameter'], order: 111 },
    { title: 'Validate Binary Search Tree', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/validate-binary-search-tree/', platform: 'leetcode', tags: ['tree', 'bst'], order: 112 },
    { title: 'Lowest Common Ancestor of a Binary Tree', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', platform: 'leetcode', tags: ['tree', 'lca', 'dfs'], order: 113 },
    { title: 'Kth Smallest Element in a BST', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', platform: 'leetcode', tags: ['tree', 'bst', 'inorder'], order: 114 },
    { title: 'Construct Binary Tree from Preorder and Inorder Traversal', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', platform: 'leetcode', tags: ['tree', 'divide-and-conquer'], order: 115 },
    { title: 'Binary Tree Right Side View', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/binary-tree-right-side-view/', platform: 'leetcode', tags: ['tree', 'bfs', 'dfs'], order: 116 },
    { title: 'Flatten Binary Tree to Linked List', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/flatten-binary-tree-to-linked-list/', platform: 'leetcode', tags: ['tree', 'dfs', 'preorder'], order: 117 },
    { title: 'Count Good Nodes in Binary Tree', topic: 'Tree Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/', platform: 'leetcode', tags: ['tree', 'dfs'], order: 118 },
    { title: 'Binary Tree Maximum Path Sum', topic: 'Tree Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', platform: 'leetcode', tags: ['tree', 'tree-dp', 'dfs'], order: 119 },
    { title: 'Serialize and Deserialize Binary Tree', topic: 'Tree Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', platform: 'leetcode', tags: ['tree', 'bfs', 'dfs'], order: 120 },

    // ═══════════════════════════════════════════════════════════════
    // 10. STRING ALGORITHMS — KMP, Rabin-Karp, Z-Algorithm, Trie, Rolling Hash
    // ═══════════════════════════════════════════════════════════════
    { title: 'Find the Index of the First Occurrence in a String', topic: 'String Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/', platform: 'leetcode', tags: ['string', 'kmp'], order: 121 },
    { title: 'Implement Trie (Prefix Tree)', topic: 'String Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/implement-trie-prefix-tree/', platform: 'leetcode', tags: ['trie'], order: 122 },
    { title: 'Design Add and Search Words Data Structure', topic: 'String Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', platform: 'leetcode', tags: ['trie', 'dfs'], order: 123 },
    { title: 'Repeated DNA Sequences', topic: 'String Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/repeated-dna-sequences/', platform: 'leetcode', tags: ['rolling-hash', 'rabin-karp', 'string'], order: 124 },
    { title: 'String to Integer (atoi)', topic: 'String Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/string-to-integer-atoi/', platform: 'leetcode', tags: ['string', 'simulation'], order: 125 },
    { title: 'Longest Happy Prefix', topic: 'String Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/longest-happy-prefix/', platform: 'leetcode', tags: ['kmp', 'z-algorithm', 'rolling-hash'], order: 126 },
    { title: 'Shortest Palindrome', topic: 'String Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/shortest-palindrome/', platform: 'leetcode', tags: ['kmp', 'string'], order: 127 },
    { title: 'Word Search II', topic: 'String Algorithms', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/word-search-ii/', platform: 'leetcode', tags: ['trie', 'backtracking'], order: 128 },

    // ═══════════════════════════════════════════════════════════════
    // 11. MATHEMATICAL ALGORITHMS — Sieve, GCD, Fast Exponentiation, Combinatorics
    // ═══════════════════════════════════════════════════════════════
    { title: 'Count Primes', topic: 'Mathematical Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/count-primes/', platform: 'leetcode', tags: ['math', 'sieve-of-eratosthenes'], order: 129 },
    { title: 'Pow(x, n)', topic: 'Mathematical Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/powx-n/', platform: 'leetcode', tags: ['math', 'fast-exponentiation', 'binary-exponentiation'], order: 130 },
    { title: 'Greatest Common Divisor of Strings', topic: 'Mathematical Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/greatest-common-divisor-of-strings/', platform: 'leetcode', tags: ['math', 'gcd', 'string'], order: 131 },
    { title: 'Factorial Trailing Zeroes', topic: 'Mathematical Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/factorial-trailing-zeroes/', platform: 'leetcode', tags: ['math', 'factorial'], order: 132 },
    { title: 'Next Permutation', topic: 'Mathematical Algorithms', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/next-permutation/', platform: 'leetcode', tags: ['math', 'combinatorics', 'two-pointers'], order: 133 },
    { title: 'Happy Number', topic: 'Mathematical Algorithms', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/happy-number/', platform: 'leetcode', tags: ['math', 'cycle-detection'], order: 134 },

    // ═══════════════════════════════════════════════════════════════
    // 12. BIT MANIPULATION — XOR, Bitmasking, Set/Clear/Toggle, Subset Gen
    // ═══════════════════════════════════════════════════════════════
    { title: 'Single Number', topic: 'Bit Manipulation', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/single-number/', platform: 'leetcode', tags: ['bit-manipulation', 'xor'], order: 135 },
    { title: 'Number of 1 Bits', topic: 'Bit Manipulation', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/number-of-1-bits/', platform: 'leetcode', tags: ['bit-manipulation'], order: 136 },
    { title: 'Counting Bits', topic: 'Bit Manipulation', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/counting-bits/', platform: 'leetcode', tags: ['bit-manipulation', 'dp'], order: 137 },
    { title: 'Missing Number', topic: 'Bit Manipulation', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/missing-number/', platform: 'leetcode', tags: ['bit-manipulation', 'xor'], order: 138 },
    { title: 'Sum of Two Integers', topic: 'Bit Manipulation', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/sum-of-two-integers/', platform: 'leetcode', tags: ['bit-manipulation', 'xor', 'bit-tricks'], order: 139 },
    { title: 'Single Number II', topic: 'Bit Manipulation', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/single-number-ii/', platform: 'leetcode', tags: ['bit-manipulation', 'bitmasking'], order: 140 },
    { title: 'Reverse Bits', topic: 'Bit Manipulation', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/reverse-bits/', platform: 'leetcode', tags: ['bit-manipulation', 'toggle-bits'], order: 141 },

    // ═══════════════════════════════════════════════════════════════
    // 13. ADVANCED TOPICS — Monotonic Stack, Monotonic Queue, Heap/PQ
    // ═══════════════════════════════════════════════════════════════
    { title: 'Daily Temperatures', topic: 'Advanced Topics', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/daily-temperatures/', platform: 'leetcode', tags: ['monotonic-stack'], order: 142 },
    { title: 'Online Stock Span', topic: 'Advanced Topics', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/online-stock-span/', platform: 'leetcode', tags: ['monotonic-stack'], order: 143 },
    { title: 'Asteroid Collision', topic: 'Advanced Topics', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/asteroid-collision/', platform: 'leetcode', tags: ['stack'], order: 144 },
    { title: 'Find Median from Data Stream', topic: 'Advanced Topics', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/find-median-from-data-stream/', platform: 'leetcode', tags: ['heap', 'priority-queue'], order: 145 },
    { title: 'Merge k Sorted Lists', topic: 'Advanced Topics', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/merge-k-sorted-lists/', platform: 'leetcode', tags: ['heap', 'priority-queue', 'linked-list'], order: 146 },
    { title: 'Largest Rectangle in Histogram', topic: 'Advanced Topics', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', platform: 'leetcode', tags: ['monotonic-stack'], order: 147 },
    { title: 'Maximal Rectangle', topic: 'Advanced Topics', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/maximal-rectangle/', platform: 'leetcode', tags: ['monotonic-stack', 'dp', 'matrix'], order: 148 },
    { title: 'Reconstruct Itinerary', topic: 'Advanced Topics', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/reconstruct-itinerary/', platform: 'leetcode', tags: ['dfs', 'eulerian-path', 'graph'], order: 149 },
  ],
};
