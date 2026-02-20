import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import SheetBucket from './models/SheetBucket.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const graphBucket = {
  name: 'Graph Mastery',
  description: 'Complete graph problems covering BFS, DFS, shortest paths, and more',
  category: 'graph',
  icon: 'Network',
  color: '#8B5CF6',
  problems: [
    // BFS Problems
    { title: '111. Minimum Depth of Binary Tree', topic: 'BFS', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/minimum-depth-of-binary-tree/', platform: 'leetcode', tags: ['bfs', 'tree'], order: 0 },
    { title: '752. Open the Lock', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/open-the-lock/', platform: 'leetcode', tags: ['bfs', 'graph'], order: 1 },
    { title: '207. Course Schedule', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/course-schedule/', platform: 'leetcode', tags: ['bfs', 'topological-sort', 'graph'], order: 2 },
    { title: '279. Perfect Squares', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/perfect-squares/', platform: 'leetcode', tags: ['bfs', 'dp'], order: 3 },
    { title: '310. Minimum Height Trees', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/minimum-height-trees/', platform: 'leetcode', tags: ['bfs', 'tree', 'graph'], order: 4 },
    { title: '785. Is Graph Bipartite?', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/is-graph-bipartite/', platform: 'leetcode', tags: ['bfs', 'dfs', 'graph'], order: 5 },
    { title: '787. Cheapest Flights Within K Stops', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', platform: 'leetcode', tags: ['bfs', 'dijkstra', 'dp'], order: 6 },
    { title: '133. Clone Graph', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/clone-graph/', platform: 'leetcode', tags: ['bfs', 'dfs', 'graph'], order: 7 },
    { title: '199. Binary Tree Right Side View', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/binary-tree-right-side-view/', platform: 'leetcode', tags: ['bfs', 'tree'], order: 8 },
    { title: '200. Number of Islands', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/number-of-islands/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 9 },
    { title: '130. Surrounded Regions', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/surrounded-regions/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 10 },
    { title: '934. Shortest Bridge', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/shortest-bridge/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 11 },
    { title: '994. Rotting Oranges', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/rotting-oranges/', platform: 'leetcode', tags: ['bfs', 'matrix'], order: 12 },
    { title: '1091. Shortest Path in Binary Matrix', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', platform: 'leetcode', tags: ['bfs', 'matrix'], order: 13 },
    { title: '1129. Shortest Path with Alternating Colors', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/shortest-path-with-alternating-colors/', platform: 'leetcode', tags: ['bfs', 'graph'], order: 14 },
    { title: '1519. Number of Nodes in the Sub-Tree With the Same Label', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/number-of-nodes-in-the-sub-tree-with-the-same-label/', platform: 'leetcode', tags: ['bfs', 'dfs', 'tree'], order: 15 },
    { title: '116. Populating Next Right Pointers in Each Node', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node/', platform: 'leetcode', tags: ['bfs', 'tree'], order: 16 },
    { title: '1765. Map of Highest Peak', topic: 'BFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/map-of-highest-peak/', platform: 'leetcode', tags: ['bfs', 'matrix'], order: 17 },
    { title: '127. Word Ladder', topic: 'BFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/word-ladder/', platform: 'leetcode', tags: ['bfs', 'string'], order: 18 },
    { title: '827. Making A Large Island', topic: 'BFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/making-a-large-island/', platform: 'leetcode', tags: ['bfs', 'dfs', 'matrix'], order: 19 },
    { title: '126. Word Ladder II', topic: 'BFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/word-ladder-ii/', platform: 'leetcode', tags: ['bfs', 'backtracking'], order: 20 },
    { title: '847. Shortest Path Visiting All Nodes', topic: 'BFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/shortest-path-visiting-all-nodes/', platform: 'leetcode', tags: ['bfs', 'bitmask', 'dp'], order: 21 },
    { title: '854. K-Similar Strings', topic: 'BFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/k-similar-strings/', platform: 'leetcode', tags: ['bfs', 'string'], order: 22 },
    // DFS Problems
    { title: '104. Maximum Depth of Binary Tree', topic: 'DFS', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', platform: 'leetcode', tags: ['dfs', 'tree'], order: 23 },
    { title: '112. Path Sum', topic: 'DFS', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/path-sum/', platform: 'leetcode', tags: ['dfs', 'tree'], order: 24 },
    { title: '94. Binary Tree Inorder Traversal', topic: 'DFS', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', platform: 'leetcode', tags: ['dfs', 'tree'], order: 25 },
    { title: '79. Word Search', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/word-search/', platform: 'leetcode', tags: ['dfs', 'backtracking', 'matrix'], order: 26 },
    { title: '98. Validate Binary Search Tree', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/validate-binary-search-tree/', platform: 'leetcode', tags: ['dfs', 'tree', 'bst'], order: 27 },
    { title: '236. Lowest Common Ancestor of a Binary Tree', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', platform: 'leetcode', tags: ['dfs', 'tree'], order: 28 },
    { title: '417. Pacific Atlantic Water Flow', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', platform: 'leetcode', tags: ['dfs', 'bfs', 'matrix'], order: 29 },
    { title: '695. Max Area of Island', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/max-area-of-island/', platform: 'leetcode', tags: ['dfs', 'bfs', 'matrix'], order: 30 },
    { title: '547. Number of Provinces', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/number-of-provinces/', platform: 'leetcode', tags: ['dfs', 'union-find', 'graph'], order: 31 },
    { title: '210. Course Schedule II', topic: 'DFS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/course-schedule-ii/', platform: 'leetcode', tags: ['dfs', 'topological-sort', 'graph'], order: 32 },
    { title: '332. Reconstruct Itinerary', topic: 'DFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/reconstruct-itinerary/', platform: 'leetcode', tags: ['dfs', 'eulerian-path', 'graph'], order: 33 },
    { title: '124. Binary Tree Maximum Path Sum', topic: 'DFS', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', platform: 'leetcode', tags: ['dfs', 'tree', 'dp'], order: 34 },
    // Shortest Path
    { title: '743. Network Delay Time', topic: 'Shortest Path', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/network-delay-time/', platform: 'leetcode', tags: ['dijkstra', 'graph'], order: 35 },
    { title: '1334. Find the City With the Smallest Number of Neighbors', topic: 'Shortest Path', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/', platform: 'leetcode', tags: ['floyd-warshall', 'dijkstra', 'graph'], order: 36 },
    { title: '1514. Path with Maximum Probability', topic: 'Shortest Path', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/path-with-maximum-probability/', platform: 'leetcode', tags: ['dijkstra', 'graph'], order: 37 },
    { title: '778. Swim in Rising Water', topic: 'Shortest Path', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/swim-in-rising-water/', platform: 'leetcode', tags: ['dijkstra', 'binary-search', 'matrix'], order: 38 },
    // Union Find
    { title: '684. Redundant Connection', topic: 'Union Find', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/redundant-connection/', platform: 'leetcode', tags: ['union-find', 'graph'], order: 39 },
    { title: '721. Accounts Merge', topic: 'Union Find', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/accounts-merge/', platform: 'leetcode', tags: ['union-find', 'dfs'], order: 40 },
    { title: '1202. Smallest String With Swaps', topic: 'Union Find', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/smallest-string-with-swaps/', platform: 'leetcode', tags: ['union-find', 'sorting'], order: 41 },
  ],
};

const dpBucket = {
  name: 'Dynamic Programming',
  description: 'Master DP with classic patterns: 1D DP, 2D DP, LCS, Knapsack, and more',
  category: 'dp',
  icon: 'Boxes',
  color: '#F59E0B',
  problems: [
    // 1D DP
    { title: '70. Climbing Stairs', topic: '1D DP', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/climbing-stairs/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 0 },
    { title: '746. Min Cost Climbing Stairs', topic: '1D DP', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/min-cost-climbing-stairs/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 1 },
    { title: '198. House Robber', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/house-robber/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 2 },
    { title: '213. House Robber II', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/house-robber-ii/', platform: 'leetcode', tags: ['dp', '1d-dp'], order: 3 },
    { title: '139. Word Break', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/word-break/', platform: 'leetcode', tags: ['dp', 'string'], order: 4 },
    { title: '322. Coin Change', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/coin-change/', platform: 'leetcode', tags: ['dp', 'unbounded-knapsack'], order: 5 },
    { title: '300. Longest Increasing Subsequence', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-increasing-subsequence/', platform: 'leetcode', tags: ['dp', 'binary-search'], order: 6 },
    { title: '152. Maximum Product Subarray', topic: '1D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/maximum-product-subarray/', platform: 'leetcode', tags: ['dp', 'array'], order: 7 },
    // 2D DP
    { title: '62. Unique Paths', topic: '2D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/unique-paths/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 8 },
    { title: '63. Unique Paths II', topic: '2D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/unique-paths-ii/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 9 },
    { title: '64. Minimum Path Sum', topic: '2D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/minimum-path-sum/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 10 },
    { title: '221. Maximal Square', topic: '2D DP', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/maximal-square/', platform: 'leetcode', tags: ['dp', '2d-dp'], order: 11 },
    // LCS Pattern
    { title: '1143. Longest Common Subsequence', topic: 'LCS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-common-subsequence/', platform: 'leetcode', tags: ['dp', 'lcs'], order: 12 },
    { title: '583. Delete Operation for Two Strings', topic: 'LCS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/delete-operation-for-two-strings/', platform: 'leetcode', tags: ['dp', 'lcs'], order: 13 },
    { title: '72. Edit Distance', topic: 'LCS', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/edit-distance/', platform: 'leetcode', tags: ['dp', 'lcs'], order: 14 },
    // Knapsack
    { title: '416. Partition Equal Subset Sum', topic: 'Knapsack', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/partition-equal-subset-sum/', platform: 'leetcode', tags: ['dp', '01-knapsack'], order: 15 },
    { title: '494. Target Sum', topic: 'Knapsack', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/target-sum/', platform: 'leetcode', tags: ['dp', '01-knapsack'], order: 16 },
    { title: '518. Coin Change II', topic: 'Knapsack', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/coin-change-ii/', platform: 'leetcode', tags: ['dp', 'unbounded-knapsack'], order: 17 },
    // Hard DP
    { title: '312. Burst Balloons', topic: 'Interval DP', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/burst-balloons/', platform: 'leetcode', tags: ['dp', 'interval-dp'], order: 18 },
    { title: '10. Regular Expression Matching', topic: 'String DP', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/regular-expression-matching/', platform: 'leetcode', tags: ['dp', 'string'], order: 19 },
    { title: '44. Wildcard Matching', topic: 'String DP', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/wildcard-matching/', platform: 'leetcode', tags: ['dp', 'string'], order: 20 },
    { title: '115. Distinct Subsequences', topic: 'String DP', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/distinct-subsequences/', platform: 'leetcode', tags: ['dp', 'string'], order: 21 },
  ],
};

const arraysBucket = {
  name: 'Arrays & Hashing',
  description: 'Essential array problems with two pointers, sliding window, and hashing techniques',
  category: 'arrays',
  icon: 'LayoutList',
  color: '#10B981',
  problems: [
    // Two Pointers
    { title: '1. Two Sum', topic: 'Hashing', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/two-sum/', platform: 'leetcode', tags: ['array', 'hashmap'], order: 0 },
    { title: '217. Contains Duplicate', topic: 'Hashing', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/contains-duplicate/', platform: 'leetcode', tags: ['array', 'hashset'], order: 1 },
    { title: '242. Valid Anagram', topic: 'Hashing', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/valid-anagram/', platform: 'leetcode', tags: ['string', 'hashmap'], order: 2 },
    { title: '49. Group Anagrams', topic: 'Hashing', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/group-anagrams/', platform: 'leetcode', tags: ['string', 'hashmap'], order: 3 },
    { title: '347. Top K Frequent Elements', topic: 'Hashing', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/top-k-frequent-elements/', platform: 'leetcode', tags: ['array', 'heap', 'bucket-sort'], order: 4 },
    // Two Pointers
    { title: '125. Valid Palindrome', topic: 'Two Pointers', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/valid-palindrome/', platform: 'leetcode', tags: ['string', 'two-pointers'], order: 5 },
    { title: '167. Two Sum II', topic: 'Two Pointers', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', platform: 'leetcode', tags: ['array', 'two-pointers'], order: 6 },
    { title: '15. 3Sum', topic: 'Two Pointers', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/3sum/', platform: 'leetcode', tags: ['array', 'two-pointers'], order: 7 },
    { title: '11. Container With Most Water', topic: 'Two Pointers', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/container-with-most-water/', platform: 'leetcode', tags: ['array', 'two-pointers', 'greedy'], order: 8 },
    { title: '42. Trapping Rain Water', topic: 'Two Pointers', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/trapping-rain-water/', platform: 'leetcode', tags: ['array', 'two-pointers', 'stack'], order: 9 },
    // Sliding Window
    { title: '121. Best Time to Buy and Sell Stock', topic: 'Sliding Window', difficulty: 'easy', problemLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', platform: 'leetcode', tags: ['array', 'dp'], order: 10 },
    { title: '3. Longest Substring Without Repeating Characters', topic: 'Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'leetcode', tags: ['string', 'sliding-window'], order: 11 },
    { title: '424. Longest Repeating Character Replacement', topic: 'Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/longest-repeating-character-replacement/', platform: 'leetcode', tags: ['string', 'sliding-window'], order: 12 },
    { title: '567. Permutation in String', topic: 'Sliding Window', difficulty: 'medium', problemLink: 'https://leetcode.com/problems/permutation-in-string/', platform: 'leetcode', tags: ['string', 'sliding-window'], order: 13 },
    { title: '76. Minimum Window Substring', topic: 'Sliding Window', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/minimum-window-substring/', platform: 'leetcode', tags: ['string', 'sliding-window'], order: 14 },
    { title: '239. Sliding Window Maximum', topic: 'Sliding Window', difficulty: 'hard', problemLink: 'https://leetcode.com/problems/sliding-window-maximum/', platform: 'leetcode', tags: ['array', 'deque', 'sliding-window'], order: 15 },
  ],
};

const seedBuckets = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing buckets
    await SheetBucket.deleteMany({});
    console.log('Cleared existing buckets');

    // Insert new buckets
    const buckets = [graphBucket, dpBucket, arraysBucket];
    
    for (const bucket of buckets) {
      await SheetBucket.create(bucket);
      console.log(`Created bucket: ${bucket.name} with ${bucket.problems.length} problems`);
    }

    console.log('\n✅ Successfully seeded all buckets!');
    console.log(`Total buckets: ${buckets.length}`);
    console.log(`Total problems: ${buckets.reduce((acc, b) => acc + b.problems.length, 0)}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedBuckets();
