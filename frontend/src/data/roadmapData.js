// Curated Interview Roadmap data with themed worlds and level-based problems
export const WORLDS = [
  {
    id: 'arrays',
    name: 'Arrays Kingdom',
    emoji: '🟢',
    difficulty: 2,
    estimatedTime: '4-6 hours',
    description: 'Master index manipulation, hashing, and frequency counting on contiguous memory arrays.',
    theme: {
      gradient: 'from-emerald-950/80 via-emerald-900/60 to-dark-950',
      nodeColor: '#10b981',
      accent: 'emerald',
      particleColors: ['#39FF14', '#10b981', '#059669'],
      glowColor: 'rgba(16, 185, 129, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'arr-1', title: 'Contains Duplicate', difficulty: 'easy', url: 'https://leetcode.com/problems/contains-duplicate/', xp: 10, tags: ['Hashing', 'Array'] },
      { id: 'arr-2', title: 'Valid Anagram', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-anagram/', xp: 10, tags: ['Hashing', 'String'] },
      { id: 'arr-3', title: 'Two Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/two-sum/', xp: 10, tags: ['Array', 'Hash Map'] },
      { id: 'arr-4', title: 'Group Anagrams', difficulty: 'medium', url: 'https://leetcode.com/problems/group-anagrams/', xp: 25, tags: ['Hashing', 'Sorting'] },
      { id: 'arr-5', title: 'Top K Frequent Elements', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', xp: 25, tags: ['Heap', 'Hash Map'] },
      { id: 'arr-6', title: 'Product of Array Except Self', difficulty: 'medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', xp: 25, tags: ['Prefix Sum', 'Array'] },
      { id: 'arr-7', title: 'Valid Sudoku', difficulty: 'medium', url: 'https://leetcode.com/problems/valid-sudoku/', xp: 25, tags: ['Array', 'Matrix'] },
      { id: 'arr-8', title: 'Longest Consecutive Sequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', xp: 25, tags: ['HashSet', 'Union Find'] }
    ],
    bossLevel: {
      id: 'boss-arrays',
      title: 'Array Master General',
      description: 'Defeat the Array Guardian by solving the ultimate frequency-based boundary problem.',
      xp: 100,
      problems: [
        { id: 'arr-b1', title: 'First Missing Positive', difficulty: 'hard', url: 'https://leetcode.com/problems/first-missing-positive/', tags: ['Cyclic Sort', 'Array'] }
      ]
    }
  },
  {
    id: 'two-pointers',
    name: 'Two Pointer Bridge',
    emoji: '🟡',
    difficulty: 2,
    estimatedTime: '3-5 hours',
    description: 'Cross the bridge of optimization by converging indices from opposite ends or tracking slow-fast paces.',
    theme: {
      gradient: 'from-amber-950/80 via-amber-900/60 to-dark-950',
      nodeColor: '#f59e0b',
      accent: 'amber',
      particleColors: ['#f59e0b', '#fbbf24', '#d97706'],
      glowColor: 'rgba(245, 158, 129, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 129, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: '2p-1', title: 'Valid Palindrome', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-palindrome/', xp: 10, tags: ['Two Pointers', 'String'] },
      { id: '2p-2', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', xp: 25, tags: ['Two Pointers', 'Binary Search'] },
      { id: '2p-3', title: '3Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/3sum/', xp: 25, tags: ['Two Pointers', 'Sorting'] },
      { id: '2p-4', title: 'Container With Most Water', difficulty: 'medium', url: 'https://leetcode.com/problems/container-with-most-water/', xp: 25, tags: ['Two Pointers', 'Greedy'] }
    ],
    bossLevel: {
      id: 'boss-two-pointers',
      title: 'Bridge Colossus',
      description: 'Solve the legendary boundary collection challenge under torrential rain.',
      xp: 100,
      problems: [
        { id: '2p-b1', title: 'Trapping Rain Water', difficulty: 'hard', url: 'https://leetcode.com/problems/trapping-rain-water/', tags: ['Two Pointers', 'Monotonic Stack'] }
      ]
    }
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window Forest',
    emoji: '🔵',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Peer through dynamic-sized windows of elements to solve continuous subarray challenges.',
    theme: {
      gradient: 'from-blue-950/80 via-blue-900/60 to-dark-950',
      nodeColor: '#3b82f6',
      accent: 'blue',
      particleColors: ['#00FFFF', '#3b82f6', '#1d4ed8'],
      glowColor: 'rgba(59, 130, 246, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'sw-1', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', xp: 10, tags: ['Sliding Window', 'Dynamic Programming'] },
      { id: 'sw-2', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', xp: 25, tags: ['Sliding Window', 'HashSet'] },
      { id: 'sw-3', title: 'Longest Repeating Character Replacement', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', xp: 25, tags: ['Sliding Window', 'Hash Map'] },
      { id: 'sw-4', title: 'Permutation in String', difficulty: 'medium', url: 'https://leetcode.com/problems/permutation-in-string/', xp: 25, tags: ['Sliding Window', 'Hash Map'] }
    ],
    bossLevel: {
      id: 'boss-sliding-window',
      title: 'Forest Leviathan',
      description: 'Uncover the minimal containing substring template to unlock the path.',
      xp: 100,
      problems: [
        { id: 'sw-b1', title: 'Minimum Window Substring', difficulty: 'hard', url: 'https://leetcode.com/problems/minimum-window-substring/', tags: ['Sliding Window', 'Hash Map'] }
      ]
    }
  },
  {
    id: 'stacks',
    name: 'Stack & Queue Cave',
    emoji: '🟣',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Explore LIFO and FIFO structures in the depths of recursion and parenthetical matching.',
    theme: {
      gradient: 'from-violet-950/80 via-violet-900/60 to-dark-950',
      nodeColor: '#8b5cf6',
      accent: 'violet',
      particleColors: ['#FF10F0', '#8b5cf6', '#6d28d9'],
      glowColor: 'rgba(139, 92, 246, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'st-1', title: 'Valid Parentheses', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-parentheses/', xp: 10, tags: ['Stack', 'String'] },
      { id: 'st-2', title: 'Min Stack', difficulty: 'medium', url: 'https://leetcode.com/problems/min-stack/', xp: 25, tags: ['Stack', 'Design'] },
      { id: 'st-3', title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', xp: 25, tags: ['Stack', 'Math'] },
      { id: 'st-4', title: 'Generate Parentheses', difficulty: 'medium', url: 'https://leetcode.com/problems/generate-parentheses/', xp: 25, tags: ['Backtracking', 'Stack'] },
      { id: 'st-5', title: 'Daily Temperatures', difficulty: 'medium', url: 'https://leetcode.com/problems/daily-temperatures/', xp: 25, tags: ['Monotonic Stack', 'Array'] },
      { id: 'st-6', title: 'Car Fleet', difficulty: 'medium', url: 'https://leetcode.com/problems/car-fleet/', xp: 25, tags: ['Stack', 'Sorting'] }
    ],
    bossLevel: {
      id: 'boss-stacks',
      title: 'Cave Sentinel',
      description: 'Solve the classic max histogram area problem to emerge from the cave.',
      xp: 100,
      problems: [
        { id: 'st-b1', title: 'Largest Rectangle in Histogram', difficulty: 'hard', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', tags: ['Monotonic Stack', 'Array'] }
      ]
    }
  },
  {
    id: 'binary-search',
    name: 'Binary Search Mountain',
    emoji: '🟠',
    difficulty: 3,
    estimatedTime: '5-7 hours',
    description: 'Scale the logarithmic slopes of sorted spaces to locate targets in O(log N) time.',
    theme: {
      gradient: 'from-orange-950/80 via-orange-900/60 to-dark-950',
      nodeColor: '#f97316',
      accent: 'orange',
      particleColors: ['#f97316', '#fdba74', '#ea580c'],
      glowColor: 'rgba(249, 115, 22, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'bs-1', title: 'Binary Search', difficulty: 'easy', url: 'https://leetcode.com/problems/binary-search/', xp: 10, tags: ['Binary Search', 'Array'] },
      { id: 'bs-2', title: 'Search a 2D Matrix', difficulty: 'medium', url: 'https://leetcode.com/problems/search-a-2d-matrix/', xp: 25, tags: ['Binary Search', 'Matrix'] },
      { id: 'bs-3', title: 'Koko Eating Bananas', difficulty: 'medium', url: 'https://leetcode.com/problems/koko-eating-bananas/', xp: 25, tags: ['Binary Search', 'Greedy'] },
      { id: 'bs-4', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', xp: 25, tags: ['Binary Search', 'Array'] },
      { id: 'bs-5', title: 'Search in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', xp: 25, tags: ['Binary Search', 'Array'] },
      { id: 'bs-6', title: 'Time Based Key-Value Store', difficulty: 'medium', url: 'https://leetcode.com/problems/time-based-key-value-store/', xp: 25, tags: ['Binary Search', 'Design'] }
    ],
    bossLevel: {
      id: 'boss-binary-search',
      title: 'Mountain Hermit',
      description: 'Climb the peak by solving the double median sorting task.',
      xp: 100,
      problems: [
        { id: 'bs-b1', title: 'Median of Two Sorted Arrays', difficulty: 'hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', tags: ['Binary Search', 'Divide & Conquer'] }
      ]
    }
  },
  {
    id: 'linked-lists',
    name: 'Linked List River',
    emoji: '🔴',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Navigate nodes connected by pointer ribbons. Master list reversing, cycle checking, and merging.',
    theme: {
      gradient: 'from-rose-950/80 via-rose-900/60 to-dark-950',
      nodeColor: '#f43f5e',
      accent: 'rose',
      particleColors: ['#f43f5e', '#fda4af', '#e11d48'],
      glowColor: 'rgba(244, 63, 94, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'll-1', title: 'Reverse Linked List', difficulty: 'easy', url: 'https://leetcode.com/problems/reverse-linked-list/', xp: 10, tags: ['Linked List'] },
      { id: 'll-2', title: 'Merge Two Sorted Lists', difficulty: 'easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', xp: 10, tags: ['Linked List', 'Recursion'] },
      { id: 'll-3', title: 'Reorder List', difficulty: 'medium', url: 'https://leetcode.com/problems/reorder-list/', xp: 25, tags: ['Linked List', 'Two Pointers'] },
      { id: 'll-4', title: 'Remove Nth Node From End of List', difficulty: 'medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', xp: 25, tags: ['Linked List', 'Two Pointers'] },
      { id: 'll-5', title: 'Copy List with Random Pointer', difficulty: 'medium', url: 'https://leetcode.com/problems/copy-list-with-random-pointer/', xp: 25, tags: ['Linked List', 'Hash Map'] },
      { id: 'll-6', title: 'Add Two Numbers', difficulty: 'medium', url: 'https://leetcode.com/problems/add-two-numbers/', xp: 25, tags: ['Linked List', 'Math'] },
      { id: 'll-7', title: 'Linked List Cycle', difficulty: 'easy', url: 'https://leetcode.com/problems/linked-list-cycle/', xp: 10, tags: ['Linked List', 'Two Pointers'] },
      { id: 'll-8', title: 'Find the Duplicate Number', difficulty: 'medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/', xp: 25, tags: ['Two Pointers', 'Array'] }
    ],
    bossLevel: {
      id: 'boss-linked-lists',
      title: 'River Siren',
      description: 'Assemble the multi-way collection pipeline under a strict timeframe.',
      xp: 100,
      problems: [
        { id: 'll-b1', title: 'Merge k Sorted Lists', difficulty: 'hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', tags: ['Divide & Conquer', 'Heap', 'Linked List'] }
      ]
    }
  },
  {
    id: 'trees',
    name: 'Tree Kingdom',
    emoji: '🌲',
    difficulty: 4,
    estimatedTime: '6-8 hours',
    description: 'Climb branching hierarchies. Master DFS, BFS, and properties of Binary Search Trees.',
    theme: {
      gradient: 'from-green-950/80 via-green-900/60 to-dark-950',
      nodeColor: '#22c55e',
      accent: 'green',
      particleColors: ['#22c55e', '#86efac', '#15803d'],
      glowColor: 'rgba(34, 197, 94, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'tr-1', title: 'Invert Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/invert-binary-tree/', xp: 10, tags: ['Tree', 'DFS'] },
      { id: 'tr-2', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', xp: 10, tags: ['Tree', 'DFS'] },
      { id: 'tr-3', title: 'Diameter of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/', xp: 10, tags: ['Tree', 'DFS'] },
      { id: 'tr-4', title: 'Balanced Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/balanced-binary-tree/', xp: 10, tags: ['Tree', 'DFS'] },
      { id: 'tr-5', title: 'Same Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/same-tree/', xp: 10, tags: ['Tree', 'Recursion'] },
      { id: 'tr-6', title: 'Subtree of Another Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/subtree-of-another-tree/', xp: 10, tags: ['Tree', 'DFS'] },
      { id: 'tr-7', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', xp: 25, tags: ['BST', 'DFS'] },
      { id: 'tr-8', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', xp: 25, tags: ['Tree', 'BFS'] },
      { id: 'tr-9', title: 'Binary Tree Right Side View', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-tree-right-side-view/', xp: 25, tags: ['Tree', 'BFS'] },
      { id: 'tr-10', title: 'Validate Binary Search Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/', xp: 25, tags: ['BST', 'DFS'] }
    ],
    bossLevel: {
      id: 'boss-trees',
      title: 'Elder Tree Avatar',
      description: 'Find the absolute longest path sum in the ancient tree, or marshal the serialization machinery.',
      xp: 100,
      problems: [
        { id: 'tr-b1', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', tags: ['Tree', 'DFS', 'Dynamic Programming'] }
      ]
    }
  },
  {
    id: 'heaps',
    name: 'Heap Castle',
    emoji: '⚡',
    difficulty: 4,
    estimatedTime: '4-6 hours',
    description: 'Storm the fortress of dynamically ordered elements. Maintain min/max statistics efficiently.',
    theme: {
      gradient: 'from-cyan-950/80 via-cyan-900/60 to-dark-950',
      nodeColor: '#06b6d4',
      accent: 'cyan',
      particleColors: ['#00FFFF', '#06b6d4', '#0e7490'],
      glowColor: 'rgba(6, 182, 212, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'hp-1', title: 'Kth Largest Element in a Stream', difficulty: 'easy', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', xp: 10, tags: ['Heap', 'Design'] },
      { id: 'hp-2', title: 'Last Stone Weight', difficulty: 'easy', url: 'https://leetcode.com/problems/last-stone-weight/', xp: 10, tags: ['Heap', 'Array'] },
      { id: 'hp-3', title: 'K Closest Points to Origin', difficulty: 'medium', url: 'https://leetcode.com/problems/k-closest-points-to-origin/', xp: 25, tags: ['Heap', 'Geometry'] },
      { id: 'hp-4', title: 'Kth Largest Element in an Array', difficulty: 'medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', xp: 25, tags: ['Heap', 'Divide & Conquer'] },
      { id: 'hp-5', title: 'Task Scheduler', difficulty: 'medium', url: 'https://leetcode.com/problems/task-scheduler/', xp: 25, tags: ['Heap', 'Greedy'] }
    ],
    bossLevel: {
      id: 'boss-heaps',
      title: 'Castle Overlord',
      description: 'Harness two heaps acting in sync to read live running statistics.',
      xp: 100,
      problems: [
        { id: 'hp-b1', title: 'Find Median from Data Stream', difficulty: 'hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/', tags: ['Heap', 'Design'] }
      ]
    }
  },
  {
    id: 'graphs',
    name: 'Graph Island',
    emoji: '🌍',
    difficulty: 5,
    estimatedTime: '6-9 hours',
    description: 'Map out relationships. Traverse networks using DFS, BFS, and check connectivity via Union Find.',
    theme: {
      gradient: 'from-teal-950/80 via-teal-900/60 to-dark-950',
      nodeColor: '#0d9488',
      accent: 'teal',
      particleColors: ['#0d9488', '#5eead4', '#0f766e'],
      glowColor: 'rgba(13, 148, 136, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'gr-1', title: 'Number of Islands', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-islands/', xp: 25, tags: ['Graph', 'DFS', 'BFS'] },
      { id: 'gr-2', title: 'Max Area of Island', difficulty: 'medium', url: 'https://leetcode.com/problems/max-area-of-island/', xp: 25, tags: ['Graph', 'DFS'] },
      { id: 'gr-3', title: 'Clone Graph', difficulty: 'medium', url: 'https://leetcode.com/problems/clone-graph/', xp: 25, tags: ['Graph', 'Hash Map'] },
      { id: 'gr-4', title: 'Pacific Atlantic Water Flow', difficulty: 'medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', xp: 25, tags: ['Graph', 'DFS'] },
      { id: 'gr-5', title: 'Course Schedule', difficulty: 'medium', url: 'https://leetcode.com/problems/course-schedule/', xp: 25, tags: ['Graph', 'Topological Sort'] },
      { id: 'gr-6', title: 'Redundant Connection', difficulty: 'medium', url: 'https://leetcode.com/problems/redundant-connection/', xp: 25, tags: ['Graph', 'Union Find'] }
    ],
    bossLevel: {
      id: 'boss-graphs',
      title: 'Island Leviathan',
      description: 'Solve the shortest path word transition chain to conquer the island.',
      xp: 100,
      problems: [
        { id: 'gr-b1', title: 'Word Ladder', difficulty: 'hard', url: 'https://leetcode.com/problems/word-ladder/', tags: ['Graph', 'BFS', 'String'] }
      ]
    }
  },
  {
    id: 'dp',
    name: 'Dynamic Programming Temple',
    emoji: '💎',
    difficulty: 5,
    estimatedTime: '8-12 hours',
    description: 'Sacrifice computation time to space. Solve overlapping subproblems using memoization and tabulations.',
    theme: {
      gradient: 'from-purple-950/80 via-purple-900/60 to-dark-950',
      nodeColor: '#a855f7',
      accent: 'purple',
      particleColors: ['#FF10F0', '#a855f7', '#7e22ce'],
      glowColor: 'rgba(168, 85, 247, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'dp-1', title: 'Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/climbing-stairs/', xp: 10, tags: ['DP', 'Math'] },
      { id: 'dp-2', title: 'Min Cost Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/', xp: 10, tags: ['DP', 'Array'] },
      { id: 'dp-3', title: 'House Robber', difficulty: 'medium', url: 'https://leetcode.com/problems/house-robber/', xp: 25, tags: ['DP', 'Array'] },
      { id: 'dp-4', title: 'House Robber II', difficulty: 'medium', url: 'https://leetcode.com/problems/house-robber-ii/', xp: 25, tags: ['DP', 'Array'] },
      { id: 'dp-5', title: 'Longest Palindromic Substring', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', xp: 25, tags: ['DP', 'String'] },
      { id: 'dp-6', title: 'Decode Ways', difficulty: 'medium', url: 'https://leetcode.com/problems/decode-ways/', xp: 25, tags: ['DP', 'String'] },
      { id: 'dp-7', title: 'Coin Change', difficulty: 'medium', url: 'https://leetcode.com/problems/coin-change/', xp: 25, tags: ['DP', 'Array'] },
      { id: 'dp-8', title: 'Longest Increasing Subsequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', xp: 25, tags: ['DP', 'Binary Search'] }
    ],
    bossLevel: {
      id: 'boss-dp',
      title: 'Temple Priest',
      description: 'Solve the master editing transformation algorithm to obtain the diamond.',
      xp: 100,
      problems: [
        { id: 'dp-b1', title: 'Edit Distance', difficulty: 'hard', url: 'https://leetcode.com/problems/edit-distance/', tags: ['DP', 'String'] }
      ]
    }
  },
  {
    id: 'advanced',
    name: 'Advanced Algorithms Citadel',
    emoji: '🧠',
    difficulty: 5,
    estimatedTime: '6-8 hours',
    description: 'Assemble complex frameworks: Tries, Intervals, Bit Manipulation, and greedy strategies.',
    theme: {
      gradient: 'from-yellow-950/80 via-yellow-900/60 to-dark-950',
      nodeColor: '#eab308',
      accent: 'yellow',
      particleColors: ['#eab308', '#fde047', '#a16207'],
      glowColor: 'rgba(234, 179, 8, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(234, 179, 8, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'adv-1', title: 'Single Number', difficulty: 'easy', url: 'https://leetcode.com/problems/single-number/', xp: 10, tags: ['Bit Manipulation'] },
      { id: 'adv-2', title: 'Number of 1 Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/number-of-1-bits/', xp: 10, tags: ['Bit Manipulation'] },
      { id: 'adv-3', title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', xp: 25, tags: ['Trie', 'Design'] },
      { id: 'adv-4', title: 'Insert Interval', difficulty: 'medium', url: 'https://leetcode.com/problems/insert-interval/', xp: 25, tags: ['Intervals', 'Array'] },
      { id: 'adv-5', title: 'Merge Intervals', difficulty: 'medium', url: 'https://leetcode.com/problems/merge-intervals/', xp: 25, tags: ['Intervals', 'Sorting'] },
      { id: 'adv-6', title: 'Non-overlapping Intervals', difficulty: 'medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/', xp: 25, tags: ['Intervals', 'Greedy'] }
    ],
    bossLevel: {
      id: 'boss-advanced',
      title: 'Citadel Monarch',
      description: 'Navigate the multi-word Trie matrix to conquer the Citadel and complete the roadmap.',
      xp: 100,
      problems: [
        { id: 'adv-b1', title: 'Word Search II', difficulty: 'hard', url: 'https://leetcode.com/problems/word-search-ii/', tags: ['Trie', 'Backtracking', 'DFS'] }
      ]
    }
  }
];

export const RANKS = [
  { minXP: 0, title: 'Rookie', emoji: '🪵', color: 'text-slate-400' },
  { minXP: 500, title: 'Explorer', emoji: '🥉', color: 'text-amber-600' },
  { minXP: 1500, title: 'Solver', emoji: '🥈', color: 'text-slate-300' },
  { minXP: 3500, title: 'Interview Warrior', emoji: '🥇', color: 'text-yellow-400 font-bold' },
  { minXP: 6000, title: 'Elite Engineer', emoji: '💎', color: 'text-purple-400 font-extrabold neon-text' },
  { minXP: 9000, title: 'SDE Candidate', emoji: '🚀', color: 'text-cyan-400 font-extrabold neon-text' },
  { minXP: 13000, title: 'FAANG Ready', emoji: '👑', color: 'text-rose-400 font-extrabold neon-text animate-pulse' }
];

export const getRankByXP = (xp) => {
  let currentRank = RANKS[0];
  for (let i = 1; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXP) {
      currentRank = RANKS[i];
    } else {
      break;
    }
  }
  return currentRank;
};

export const getNextRank = (xp) => {
  for (let i = 0; i < RANKS.length; i++) {
    if (xp < RANKS[i].minXP) {
      return RANKS[i];
    }
  }
  return null; // Already max rank
};
