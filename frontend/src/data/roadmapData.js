// Curated Interview Roadmap data with themed worlds and level-based problems
export const WORLDS = [
  {
    id: 'arrays',
    image: 'arrays_kingdom.png',
    name: 'Arrays Kingdom',
    emoji: '🏰',
    difficulty: 2,
    estimatedTime: '4-6 hours',
    description: 'Master index manipulation, hashing, and frequency counting on contiguous memory arrays.',
    theme: {
      bgColor: '#022c22',
      nodeColor: '#10b981',
      accent: 'emerald',
      particleColors: ['#39FF14', '#10b981', '#059669'],
      glowColor: 'rgba(16, 185, 129, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'arr-1', title: 'Contains Duplicate', difficulty: 'easy', url: 'https://leetcode.com/problems/contains-duplicate/', xp: 10, tags: ['Hashing', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-2', title: 'Valid Anagram', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-anagram/', xp: 10, tags: ['Hashing', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-3', title: 'Two Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/two-sum/', xp: 10, tags: ['Array', 'Hash Map'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-4', title: 'Group Anagrams', difficulty: 'medium', url: 'https://leetcode.com/problems/group-anagrams/', xp: 25, tags: ['Hashing', 'Sorting'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-5', title: 'Top K Frequent Elements', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', xp: 25, tags: ['Heap', 'Hash Map'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-6', title: 'Product of Array Except Self', difficulty: 'medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', xp: 25, tags: ['Prefix Sum', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-7', title: 'Valid Sudoku', difficulty: 'medium', url: 'https://leetcode.com/problems/valid-sudoku/', xp: 25, tags: ['Array', 'Matrix'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-8', title: 'Longest Consecutive Sequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', xp: 25, tags: ['HashSet', 'Union Find'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-9', title: 'Encode and Decode Strings', difficulty: 'medium', url: 'https://leetcode.com/problems/encode-and-decode-strings/', xp: 25, tags: ['String', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'arr-10', title: "Pascal's Triangle", difficulty: 'easy', url: 'https://leetcode.com/problems/pascals-triangle/', xp: 10, tags: ['Array', 'Math'], blind75: false, rabbit150: true, running175: true },
      { id: 'arr-11', title: 'Remove Element', difficulty: 'easy', url: 'https://leetcode.com/problems/remove-element/', xp: 10, tags: ['Array', 'Two Pointers'], blind75: false, rabbit150: true, running175: true },
      { id: 'arr-12', title: 'Unique Email Addresses', difficulty: 'easy', url: 'https://leetcode.com/problems/unique-email-addresses/', xp: 10, tags: ['String', 'HashSet'], blind75: false, rabbit150: true, running175: true },
      { id: 'arr-13', title: 'Is Subsequence', difficulty: 'easy', url: 'https://leetcode.com/problems/is-subsequence/', xp: 10, tags: ['Two Pointers', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'arr-14', title: 'Majority Element', difficulty: 'easy', url: 'https://leetcode.com/problems/majority-element/', xp: 10, tags: ['Array', 'Voting'], blind75: false, rabbit150: true, running175: true },
      { id: 'arr-15', title: 'Find Pivot Index', difficulty: 'easy', url: 'https://leetcode.com/problems/find-pivot-index/', xp: 10, tags: ['Array', 'Prefix Sum'], blind75: false, rabbit150: true, running175: true }
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
    image: 'two_pointer_bridge.png',
    name: 'Two Pointer Bridge',
    emoji: '🌉',
    difficulty: 2,
    estimatedTime: '3-5 hours',
    description: 'Cross the bridge of optimization by converging indices from opposite ends or tracking slow-fast paces.',
    theme: {
      bgColor: '#451a03',
      nodeColor: '#f59e0b',
      accent: 'amber',
      particleColors: ['#f59e0b', '#fbbf24', '#d97706'],
      glowColor: 'rgba(245, 158, 129, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 129, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: '2p-1', title: 'Valid Palindrome', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-palindrome/', xp: 10, tags: ['Two Pointers', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: '2p-2', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', xp: 25, tags: ['Two Pointers', 'Binary Search'], blind75: true, rabbit150: true, running175: true },
      { id: '2p-3', title: '3Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/3sum/', xp: 25, tags: ['Two Pointers', 'Sorting'], blind75: true, rabbit150: true, running175: true },
      { id: '2p-4', title: 'Container With Most Water', difficulty: 'medium', url: 'https://leetcode.com/problems/container-with-most-water/', xp: 25, tags: ['Two Pointers', 'Greedy'], blind75: true, rabbit150: true, running175: true },
      { id: '2p-5', title: 'Valid Palindrome II', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-palindrome-ii/', xp: 10, tags: ['Two Pointers', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: '2p-6', title: 'Move Zeroes', difficulty: 'easy', url: 'https://leetcode.com/problems/move-zeroes/', xp: 10, tags: ['Two Pointers', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: '2p-7', title: 'Reverse String', difficulty: 'easy', url: 'https://leetcode.com/problems/reverse-string/', xp: 10, tags: ['Two Pointers', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: '2p-8', title: 'Merge Sorted Array', difficulty: 'easy', url: 'https://leetcode.com/problems/merge-sorted-array/', xp: 10, tags: ['Two Pointers', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: '2p-9', title: 'Squares of a Sorted Array', difficulty: 'easy', url: 'https://leetcode.com/problems/squares-of-a-sorted-array/', xp: 10, tags: ['Two Pointers', 'Sorting'], blind75: false, rabbit150: true, running175: true },
      { id: '2p-10', title: '4Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/4sum/', xp: 25, tags: ['Two Pointers', 'Array'], blind75: false, rabbit150: true, running175: true }
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
    image: 'sliding_window_forest.png',
    name: 'Sliding Window Forest',
    emoji: '🌳',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Peer through dynamic-sized windows of elements to solve continuous subarray challenges.',
    theme: {
      bgColor: '#022d1a',
      nodeColor: '#4ade80',
      accent: 'lime',
      particleColors: ['#a3e635', '#4ade80', '#166534'],
      glowColor: 'rgba(74, 222, 128, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'sw-1', title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', xp: 10, tags: ['Sliding Window', 'Dynamic Programming'], blind75: true, rabbit150: true, running175: true },
      { id: 'sw-2', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', xp: 25, tags: ['Sliding Window', 'HashSet'], blind75: true, rabbit150: true, running175: true },
      { id: 'sw-3', title: 'Longest Repeating Character Replacement', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-repeating-character-replacement/', xp: 25, tags: ['Sliding Window', 'Hash Map'], blind75: true, rabbit150: true, running175: true },
      { id: 'sw-4', title: 'Permutation in String', difficulty: 'medium', url: 'https://leetcode.com/problems/permutation-in-string/', xp: 25, tags: ['Sliding Window', 'Hash Map'], blind75: true, rabbit150: true, running175: true },
      { id: 'sw-5', title: 'Sliding Window Maximum', difficulty: 'hard', url: 'https://leetcode.com/problems/sliding-window-maximum/', xp: 35, tags: ['Sliding Window', 'Deque'], blind75: false, rabbit150: true, running175: true },
      { id: 'sw-6', title: 'Minimum Size Subarray Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/minimum-size-subarray-sum/', xp: 25, tags: ['Sliding Window', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'sw-7', title: 'Fruit Into Baskets', difficulty: 'medium', url: 'https://leetcode.com/problems/fruit-into-baskets/', xp: 25, tags: ['Sliding Window', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'sw-8', title: 'Longest Substring with At Most K Distinct Characters', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/', xp: 25, tags: ['Sliding Window', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'sw-9', title: 'Maximum Number of Vowels in a Substring', difficulty: 'medium', url: 'https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/', xp: 25, tags: ['Sliding Window', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'sw-10', title: 'Number of Subarrays with Bounded Maximum', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-subarrays-with-bounded-maximum/', xp: 25, tags: ['Sliding Window', 'Array'], blind75: false, rabbit150: true, running175: true }
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
    image: 'stack_queue.png',
    name: 'Stack & Queue Cave',
    emoji: '📥',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Explore LIFO and FIFO structures in the depths of recursion and parenthetical matching.',
    theme: {
      bgColor: '#2e1065',
      nodeColor: '#8b5cf6',
      accent: 'violet',
      particleColors: ['#FF10F0', '#8b5cf6', '#6d28d9'],
      glowColor: 'rgba(139, 92, 246, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'st-1', title: 'Valid Parentheses', difficulty: 'easy', url: 'https://leetcode.com/problems/valid-parentheses/', xp: 10, tags: ['Stack', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: 'st-2', title: 'Min Stack', difficulty: 'medium', url: 'https://leetcode.com/problems/min-stack/', xp: 25, tags: ['Stack', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'st-3', title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', xp: 25, tags: ['Stack', 'Math'], blind75: true, rabbit150: true, running175: true },
      { id: 'st-4', title: 'Generate Parentheses', difficulty: 'medium', url: 'https://leetcode.com/problems/generate-parentheses/', xp: 25, tags: ['Backtracking', 'Stack'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-5', title: 'Daily Temperatures', difficulty: 'medium', url: 'https://leetcode.com/problems/daily-temperatures/', xp: 25, tags: ['Monotonic Stack', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-6', title: 'Car Fleet', difficulty: 'medium', url: 'https://leetcode.com/problems/car-fleet/', xp: 25, tags: ['Stack', 'Sorting'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-7', title: 'Implement Queue using Stacks', difficulty: 'easy', url: 'https://leetcode.com/problems/implement-queue-using-stacks/', xp: 10, tags: ['Stack', 'Design'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-8', title: 'Backspace String Compare', difficulty: 'easy', url: 'https://leetcode.com/problems/backspace-string-compare/', xp: 10, tags: ['Stack', 'Two Pointers'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-9', title: 'Remove All Adjacent Duplicates in String', difficulty: 'easy', url: 'https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/', xp: 10, tags: ['Stack', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'st-10', title: 'Simplify Path', difficulty: 'medium', url: 'https://leetcode.com/problems/simplify-path/', xp: 25, tags: ['Stack', 'String'], blind75: false, rabbit150: true, running175: true }
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
    image: 'binary_search_mountain.png',
    name: 'Binary Search Mountain',
    emoji: '🏔️',
    difficulty: 3,
    estimatedTime: '5-7 hours',
    description: 'Scale the logarithmic slopes of sorted spaces to locate targets in O(log N) time.',
    theme: {
      bgColor: '#082f49',
      nodeColor: '#38bdf8',
      accent: 'sky',
      particleColors: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
      glowColor: 'rgba(56, 189, 248, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
    },
    problems: [
      { id: 'bs-1', title: 'Binary Search', difficulty: 'easy', url: 'https://leetcode.com/problems/binary-search/', xp: 10, tags: ['Binary Search', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'bs-2', title: 'Search a 2D Matrix', difficulty: 'medium', url: 'https://leetcode.com/problems/search-a-2d-matrix/', xp: 25, tags: ['Binary Search', 'Matrix'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-3', title: 'Koko Eating Bananas', difficulty: 'medium', url: 'https://leetcode.com/problems/koko-eating-bananas/', xp: 25, tags: ['Binary Search', 'Greedy'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-4', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', xp: 25, tags: ['Binary Search', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'bs-5', title: 'Search in Rotated Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', xp: 25, tags: ['Binary Search', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'bs-6', title: 'Time Based Key-Value Store', difficulty: 'medium', url: 'https://leetcode.com/problems/time-based-key-value-store/', xp: 25, tags: ['Binary Search', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'bs-7', title: 'Search Insert Position', difficulty: 'easy', url: 'https://leetcode.com/problems/search-insert-position/', xp: 10, tags: ['Binary Search', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-8', title: 'First Bad Version', difficulty: 'easy', url: 'https://leetcode.com/problems/first-bad-version/', xp: 10, tags: ['Binary Search', 'Interactive'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-9', title: 'Find Peak Element', difficulty: 'medium', url: 'https://leetcode.com/problems/find-peak-element/', xp: 25, tags: ['Binary Search', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-10', title: 'Capacity To Ship Packages Within D Days', difficulty: 'medium', url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', xp: 25, tags: ['Binary Search', 'Greedy'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-11', title: 'Single Element in a Sorted Array', difficulty: 'medium', url: 'https://leetcode.com/problems/single-element-in-a-sorted-array/', xp: 25, tags: ['Binary Search', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'bs-12', title: 'Search in a Sorted Array of Unknown Size', difficulty: 'medium', url: 'https://leetcode.com/problems/search-in-a-sorted-array-of-unknown-size/', xp: 25, tags: ['Binary Search', 'Array'], blind75: false, rabbit150: true, running175: true }
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
    image: 'fiery_linked_list.png',
    name: 'Linked List River',
    emoji: '🔗',
    difficulty: 3,
    estimatedTime: '4-6 hours',
    description: 'Navigate nodes connected by pointer ribbons. Master list reversing, cycle checking, and merging.',
    theme: {
      bgColor: '#2d060e',
      nodeColor: '#ea580c',
      accent: 'orange',
      particleColors: ['#ff4500', '#ef4444', '#f97316', '#ffd700'],
      glowColor: 'rgba(249, 115, 22, 0.5)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.25) 0%, transparent 70%)',
    },
    problems: [
      { id: 'll-1', title: 'Reverse Linked List', difficulty: 'easy', url: 'https://leetcode.com/problems/reverse-linked-list/', xp: 10, tags: ['Linked List'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-2', title: 'Merge Two Sorted Lists', difficulty: 'easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', xp: 10, tags: ['Linked List', 'Recursion'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-3', title: 'Reorder List', difficulty: 'medium', url: 'https://leetcode.com/problems/reorder-list/', xp: 25, tags: ['Linked List', 'Two Pointers'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-4', title: 'Remove Nth Node From End of List', difficulty: 'medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', xp: 25, tags: ['Linked List', 'Two Pointers'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-5', title: 'Copy List with Random Pointer', difficulty: 'medium', url: 'https://leetcode.com/problems/copy-list-with-random-pointer/', xp: 25, tags: ['Linked List', 'Hash Map'], blind75: false, rabbit150: true, running175: true },
      { id: 'll-6', title: 'Add Two Numbers', difficulty: 'medium', url: 'https://leetcode.com/problems/add-two-numbers/', xp: 25, tags: ['Linked List', 'Math'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-7', title: 'Linked List Cycle', difficulty: 'easy', url: 'https://leetcode.com/problems/linked-list-cycle/', xp: 10, tags: ['Linked List', 'Two Pointers'], blind75: true, rabbit150: true, running175: true },
      { id: 'll-8', title: 'Find the Duplicate Number', difficulty: 'medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/', xp: 25, tags: ['Two Pointers', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'll-9', title: 'Intersection of Two Linked Lists', difficulty: 'easy', url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', xp: 10, tags: ['Linked List', 'Two Pointers'], blind75: false, rabbit150: true, running175: true },
      { id: 'll-10', title: 'Palindrome Linked List', difficulty: 'easy', url: 'https://leetcode.com/problems/palindrome-linked-list/', xp: 10, tags: ['Linked List', 'Two Pointers'], blind75: false, rabbit150: true, running175: true },
      { id: 'll-11', title: 'Remove Linked List Elements', difficulty: 'easy', url: 'https://leetcode.com/problems/remove-linked-list-elements/', xp: 10, tags: ['Linked List'], blind75: false, rabbit150: true, running175: true },
      { id: 'll-12', title: 'Middle of the Linked List', difficulty: 'easy', url: 'https://leetcode.com/problems/middle-of-the-linked-list/', xp: 10, tags: ['Linked List', 'Two Pointers'], blind75: false, rabbit150: true, running175: true }
    ],
    bossLevel: {
      id: 'boss-linked-lists',
      title: 'River Siren',
      description: 'Assemble the multi-way collection pipeline under a strict timeframe.',
      xp: 100,
      problems: [
        { id: 'boss-ll-b1', title: 'Merge k Sorted Lists', difficulty: 'hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', tags: ['Divide & Conquer', 'Heap', 'Linked List'] }
      ]
    }
  },
  {
    id: 'trees',
    image: 'tree_kingdom.png',
    name: 'Tree Kingdom',
    emoji: '🌲',
    difficulty: 4,
    estimatedTime: '6-8 hours',
    description: 'Climb branching hierarchies. Master DFS, BFS, and properties of Binary Search Trees.',
    theme: {
      bgColor: '#052e16',
      nodeColor: '#22c55e',
      accent: 'green',
      particleColors: ['#22c55e', '#86efac', '#15803d'],
      glowColor: 'rgba(34, 197, 94, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'tr-1', title: 'Invert Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/invert-binary-tree/', xp: 10, tags: ['Tree', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-2', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', xp: 10, tags: ['Tree', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-3', title: 'Diameter of Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/', xp: 10, tags: ['Tree', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-4', title: 'Balanced Binary Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/balanced-binary-tree/', xp: 10, tags: ['Tree', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-5', title: 'Same Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/same-tree/', xp: 10, tags: ['Tree', 'Recursion'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-6', title: 'Subtree of Another Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/subtree-of-another-tree/', xp: 10, tags: ['Tree', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-7', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', xp: 25, tags: ['BST', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-8', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', xp: 25, tags: ['Tree', 'BFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-9', title: 'Binary Tree Right Side View', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-tree-right-side-view/', xp: 25, tags: ['Tree', 'BFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-10', title: 'Validate Binary Search Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/', xp: 25, tags: ['BST', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-11', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', xp: 25, tags: ['Tree', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-12', title: 'Kth Smallest Element in a BST', difficulty: 'medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', xp: 25, tags: ['BST', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-13', title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', xp: 35, tags: ['Tree', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-14', title: 'Path Sum', difficulty: 'easy', url: 'https://leetcode.com/problems/path-sum/', xp: 10, tags: ['Tree', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-15', title: 'Sum of Left Leaves', difficulty: 'easy', url: 'https://leetcode.com/problems/sum-of-left-leaves/', xp: 10, tags: ['Tree', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-16', title: 'Convert Sorted Array to Binary Search Tree', difficulty: 'easy', url: 'https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/', xp: 10, tags: ['BST', 'Recursion'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-17', title: 'Binary Tree Paths', difficulty: 'easy', url: 'https://leetcode.com/problems/binary-tree-paths/', xp: 10, tags: ['Tree', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-18', title: 'Count Complete Tree Nodes', difficulty: 'medium', url: 'https://leetcode.com/problems/count-complete-tree-nodes/', xp: 25, tags: ['Tree', 'Binary Search'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-19', title: 'Binary Search Tree Iterator', difficulty: 'medium', url: 'https://leetcode.com/problems/binary-search-tree-iterator/', xp: 25, tags: ['BST', 'Design'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-20', title: 'Inorder Successor in BST', difficulty: 'medium', url: 'https://leetcode.com/problems/inorder-successor-in-bst/', xp: 25, tags: ['BST', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'tr-21', title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', xp: 25, tags: ['Tree', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'tr-22', title: 'Populating Next Right Pointers in Each Node', difficulty: 'medium', url: 'https://leetcode.com/problems/populating-next-right-pointers-in-each-node/', xp: 25, tags: ['Tree', 'BFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'tr-23', title: 'Flatten Binary Tree to Linked List', difficulty: 'medium', url: 'https://leetcode.com/problems/flatten-binary-tree-to-linked-list/', xp: 25, tags: ['Tree', 'DFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'tr-24', title: 'All Nodes Distance K in Binary Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/', xp: 25, tags: ['Tree', 'BFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'tr-25', title: 'Path Sum II', difficulty: 'medium', url: 'https://leetcode.com/problems/path-sum-ii/', xp: 25, tags: ['Tree', 'DFS'], blind75: false, rabbit150: false, running175: true }
    ],
    bossLevel: {
      id: 'boss-trees',
      title: 'Elder Tree Avatar',
      description: 'Find the absolute longest path sum in the ancient tree, or marshal the serialization machinery.',
      xp: 100,
      problems: [
        { id: 'boss-tr-b1', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', tags: ['Tree', 'DFS', 'Dynamic Programming'] }
      ]
    }
  },
  {
    id: 'heaps',
    image: 'heap_castle.png',
    name: 'Heap Castle',
    emoji: '⚡',
    difficulty: 4,
    estimatedTime: '4-6 hours',
    description: 'Storm the fortress of dynamically ordered elements. Maintain min/max statistics efficiently.',
    theme: {
      bgColor: '#083344',
      nodeColor: '#06b6d4',
      accent: 'cyan',
      particleColors: ['#00FFFF', '#06b6d4', '#0e7490'],
      glowColor: 'rgba(6, 182, 212, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'hp-1', title: 'Kth Largest Element in a Stream', difficulty: 'easy', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', xp: 10, tags: ['Heap', 'Design'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-2', title: 'Last Stone Weight', difficulty: 'easy', url: 'https://leetcode.com/problems/last-stone-weight/', xp: 10, tags: ['Heap', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-3', title: 'K Closest Points to Origin', difficulty: 'medium', url: 'https://leetcode.com/problems/k-closest-points-to-origin/', xp: 25, tags: ['Heap', 'Geometry'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-4', title: 'Kth Largest Element in an Array', difficulty: 'medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', xp: 25, tags: ['Heap', 'Divide & Conquer'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-5', title: 'Task Scheduler', difficulty: 'medium', url: 'https://leetcode.com/problems/task-scheduler/', xp: 25, tags: ['Heap', 'Greedy'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-6', title: 'Top K Frequent Words', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-words/', xp: 25, tags: ['Heap', 'Trie'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-7', title: 'Find K Pairs with Smallest Sums', difficulty: 'medium', url: 'https://leetcode.com/problems/find-k-pairs-with-smallest-sums/', xp: 25, tags: ['Heap', 'Sorting'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-8', title: 'Kth Smallest Element in a Sorted Matrix', difficulty: 'medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/', xp: 25, tags: ['Heap', 'Binary Search'], blind75: false, rabbit150: true, running175: true },
      { id: 'hp-9', title: 'Sort Characters By Frequency', difficulty: 'medium', url: 'https://leetcode.com/problems/sort-characters-by-frequency/', xp: 25, tags: ['Heap', 'Sorting'], blind75: false, rabbit150: false, running175: true },
      { id: 'hp-10', title: 'Smallest Range Covering Elements from K Lists', difficulty: 'hard', url: 'https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/', xp: 35, tags: ['Heap', 'Sliding Window'], blind75: false, rabbit150: false, running175: true },
      { id: 'hp-11', title: 'Rearrange String k Distance Apart', difficulty: 'hard', url: 'https://leetcode.com/problems/rearrange-string-k-distance-apart/', xp: 35, tags: ['Heap', 'Greedy'], blind75: false, rabbit150: false, running175: true },
      { id: 'hp-12', title: 'Top K Frequent Elements', difficulty: 'medium', url: 'https://leetcode.com/problems/top-k-frequent-elements/', xp: 25, tags: ['Heap', 'Hashing'], blind75: true, rabbit150: true, running175: true }
    ],
    bossLevel: {
      id: 'boss-heaps',
      title: 'Castle Overlord',
      description: 'Harness two heaps acting in sync to read live running statistics.',
      xp: 100,
      problems: [
        { id: 'boss-hp-b1', title: 'Find Median from Data Stream', difficulty: 'hard', url: 'https://leetcode.com/problems/find-median-from-data-stream/', tags: ['Heap', 'Design'] }
      ]
    }
  },
  {
    id: 'graphs',
    image: 'graph_island.png',
    name: 'Graph Island',
    emoji: '🏝️',
    difficulty: 5,
    estimatedTime: '6-9 hours',
    description: 'Map out relationships. Traverse networks using DFS, BFS, and check connectivity via Union Find.',
    theme: {
      bgColor: '#042f2e',
      nodeColor: '#0d9488',
      accent: 'teal',
      particleColors: ['#0d9488', '#5eead4', '#0f766e'],
      glowColor: 'rgba(13, 148, 136, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'gr-1', title: 'Number of Islands', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-islands/', xp: 25, tags: ['Graph', 'DFS', 'BFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-2', title: 'Max Area of Island', difficulty: 'medium', url: 'https://leetcode.com/problems/max-area-of-island/', xp: 25, tags: ['Graph', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-3', title: 'Clone Graph', difficulty: 'medium', url: 'https://leetcode.com/problems/clone-graph/', xp: 25, tags: ['Graph', 'Hash Map'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-4', title: 'Pacific Atlantic Water Flow', difficulty: 'medium', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', xp: 25, tags: ['Graph', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-5', title: 'Course Schedule', difficulty: 'medium', url: 'https://leetcode.com/problems/course-schedule/', xp: 25, tags: ['Graph', 'Topological Sort'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-6', title: 'Redundant Connection', difficulty: 'medium', url: 'https://leetcode.com/problems/redundant-connection/', xp: 25, tags: ['Graph', 'Union Find'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-7', title: 'Number of Connected Components in an Undirected Graph', difficulty: 'medium', url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', xp: 25, tags: ['Graph', 'Union Find'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-8', title: 'Graph Valid Tree', difficulty: 'medium', url: 'https://leetcode.com/problems/graph-valid-tree/', xp: 25, tags: ['Graph', 'DFS'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-9', title: 'Course Schedule II', difficulty: 'medium', url: 'https://leetcode.com/problems/course-schedule-ii/', xp: 25, tags: ['Graph', 'Topological Sort'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-10', title: 'Rotting Oranges', difficulty: 'medium', url: 'https://leetcode.com/problems/rotting-oranges/', xp: 25, tags: ['Graph', 'BFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-11', title: 'Walls and Gates', difficulty: 'medium', url: 'https://leetcode.com/problems/walls-and-gates/', xp: 25, tags: ['Graph', 'BFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-12', title: 'Network Delay Time', difficulty: 'medium', url: 'https://leetcode.com/problems/network-delay-time/', xp: 25, tags: ['Graph', 'Dijkstra'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-13', title: 'Find Eventual Safe States', difficulty: 'medium', url: 'https://leetcode.com/problems/find-eventual-safe-states/', xp: 25, tags: ['Graph', 'DFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-14', title: 'Is Graph Bipartite?', difficulty: 'medium', url: 'https://leetcode.com/problems/is-graph-bipartite/', xp: 25, tags: ['Graph', 'BFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-15', title: 'Shortest Path in Binary Matrix', difficulty: 'medium', url: 'https://leetcode.com/problems/shortest-path-in-binary-matrix/', xp: 25, tags: ['Graph', 'BFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-16', title: 'All Paths From Source to Target', difficulty: 'medium', url: 'https://leetcode.com/problems/all-paths-from-source-to-target/', xp: 25, tags: ['Graph', 'Backtracking'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-17', title: 'Keys and Rooms', difficulty: 'medium', url: 'https://leetcode.com/problems/keys-and-rooms/', xp: 25, tags: ['Graph', 'DFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-18', title: 'Path with Minimum Effort', difficulty: 'medium', url: 'https://leetcode.com/problems/path-with-minimum-effort/', xp: 25, tags: ['Graph', 'Dijkstra'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-19', title: 'Minimum Height Trees', difficulty: 'medium', url: 'https://leetcode.com/problems/minimum-height-trees/', xp: 25, tags: ['Graph', 'BFS'], blind75: false, rabbit150: false, running175: true },
      { id: 'gr-20', title: 'Accounts Merge', difficulty: 'medium', url: 'https://leetcode.com/problems/accounts-merge/', xp: 25, tags: ['Union Find', 'DFS'], blind75: false, rabbit150: true, running175: true },
      { id: 'gr-21', title: 'Word Search II', difficulty: 'hard', url: 'https://leetcode.com/problems/word-search-ii/', xp: 35, tags: ['Graph', 'Trie'], blind75: true, rabbit150: true, running175: true },
      { id: 'gr-22', title: 'Alien Dictionary', difficulty: 'hard', url: 'https://leetcode.com/problems/alien-dictionary/', xp: 35, tags: ['Graph', 'Topological Sort'], blind75: true, rabbit150: true, running175: true }
    ],
    bossLevel: {
      id: 'boss-graphs',
      title: 'Island Leviathan',
      description: 'Solve the shortest path word transition chain to conquer the island.',
      xp: 100,
      problems: [
        { id: 'boss-gr-b1', title: 'Word Ladder', difficulty: 'hard', url: 'https://leetcode.com/problems/word-ladder/', tags: ['Graph', 'BFS', 'String'] }
      ]
    }
  },
  {
    id: 'dp',
    image: 'dp_temple.png',
    name: 'Dynamic Programming Temple',
    emoji: '🏛️',
    difficulty: 5,
    estimatedTime: '8-12 hours',
    description: 'Sacrifice computation time to space. Solve overlapping subproblems using memoization and tabulations.',
    theme: {
      bgColor: '#3b0764',
      nodeColor: '#a855f7',
      accent: 'purple',
      particleColors: ['#FF10F0', '#a855f7', '#7e22ce'],
      glowColor: 'rgba(168, 85, 247, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'dp-1', title: 'Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/climbing-stairs/', xp: 10, tags: ['DP', 'Math'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-2', title: 'Min Cost Climbing Stairs', difficulty: 'easy', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/', xp: 10, tags: ['DP', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'dp-3', title: 'House Robber', difficulty: 'medium', url: 'https://leetcode.com/problems/house-robber/', xp: 25, tags: ['DP', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-4', title: 'House Robber II', difficulty: 'medium', url: 'https://leetcode.com/problems/house-robber-ii/', xp: 25, tags: ['DP', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-5', title: 'Longest Palindromic Substring', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', xp: 25, tags: ['DP', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-6', title: 'Decode Ways', difficulty: 'medium', url: 'https://leetcode.com/problems/decode-ways/', xp: 25, tags: ['DP', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-7', title: 'Coin Change', difficulty: 'medium', url: 'https://leetcode.com/problems/coin-change/', xp: 25, tags: ['DP', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-8', title: 'Longest Increasing Subsequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-increasing-subsequence/', xp: 25, tags: ['DP', 'Binary Search'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-9', title: 'Longest Common Subsequence', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-common-subsequence/', xp: 25, tags: ['DP', 'String'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-10', title: 'Word Break', difficulty: 'medium', url: 'https://leetcode.com/problems/word-break/', xp: 25, tags: ['DP', 'Trie'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-11', title: 'Combination Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/combination-sum/', xp: 25, tags: ['Backtracking', 'DP'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-12', title: 'Unique Paths', difficulty: 'medium', url: 'https://leetcode.com/problems/unique-paths/', xp: 25, tags: ['DP', 'Matrix'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-13', title: 'Jump Game', difficulty: 'medium', url: 'https://leetcode.com/problems/jump-game/', xp: 25, tags: ['Greedy', 'DP'], blind75: true, rabbit150: true, running175: true },
      { id: 'dp-14', title: 'Partition Equal Subset Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/partition-equal-subset-sum/', xp: 25, tags: ['DP', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'dp-15', title: 'Target Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/target-sum/', xp: 25, tags: ['DP', 'Backtracking'], blind75: false, rabbit150: true, running175: true },
      { id: 'dp-16', title: 'Interleaving String', difficulty: 'hard', url: 'https://leetcode.com/problems/interleaving-string/', xp: 35, tags: ['DP', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'dp-17', title: 'Longest Common Subsequence II', difficulty: 'medium', url: 'https://leetcode.com/problems/longest-common-subsequence/', xp: 25, tags: ['DP', 'String'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-18', title: 'Maximal Square', difficulty: 'medium', url: 'https://leetcode.com/problems/maximal-square/', xp: 25, tags: ['DP', 'Matrix'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-19', title: 'Perfect Squares', difficulty: 'medium', url: 'https://leetcode.com/problems/perfect-squares/', xp: 25, tags: ['DP', 'Math'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-20', title: 'Minimum Path Sum', difficulty: 'medium', url: 'https://leetcode.com/problems/minimum-path-sum/', xp: 25, tags: ['DP', 'Matrix'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-21', title: 'Triangle', difficulty: 'medium', url: 'https://leetcode.com/problems/triangle/', xp: 25, tags: ['DP', 'Array'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-22', title: 'Integer Break', difficulty: 'medium', url: 'https://leetcode.com/problems/integer-break/', xp: 25, tags: ['DP', 'Math'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-23', title: 'Ones and Zeroes', difficulty: 'medium', url: 'https://leetcode.com/problems/ones-and-zeroes/', xp: 25, tags: ['DP', 'Array'], blind75: false, rabbit150: false, running175: true },
      { id: 'dp-24', title: 'Burst Balloons', difficulty: 'hard', url: 'https://leetcode.com/problems/burst-balloons/', xp: 35, tags: ['DP', 'Divide & Conquer'], blind75: false, rabbit150: true, running175: true },
      { id: 'dp-25', title: 'Regular Expression Matching', difficulty: 'hard', url: 'https://leetcode.com/problems/regular-expression-matching/', xp: 35, tags: ['DP', 'String'], blind75: true, rabbit150: true, running175: true }
    ],
    bossLevel: {
      id: 'boss-dp',
      title: 'Temple Priest',
      description: 'Solve the master editing transformation algorithm to obtain the diamond.',
      xp: 100,
      problems: [
        { id: 'boss-dp-b1', title: 'Edit Distance', difficulty: 'hard', url: 'https://leetcode.com/problems/edit-distance/', tags: ['DP', 'String'] }
      ]
    }
  },
  {
    id: 'advanced',
    image: 'crystal_citadel.png',
    name: 'Advanced Algorithms Citadel',
    emoji: '🔮',
    difficulty: 5,
    estimatedTime: '6-8 hours',
    description: 'Assemble complex frameworks: Tries, Intervals, Bit Manipulation, and greedy strategies.',
    theme: {
      bgColor: '#422006',
      nodeColor: '#eab308',
      accent: 'yellow',
      particleColors: ['#eab308', '#fde047', '#a16207'],
      glowColor: 'rgba(234, 179, 8, 0.4)',
      bgOverlay: 'radial-gradient(circle at 50% 30%, rgba(234, 179, 8, 0.15) 0%, transparent 70%)',
    },
    problems: [
      { id: 'adv-1', title: 'Single Number', difficulty: 'easy', url: 'https://leetcode.com/problems/single-number/', xp: 10, tags: ['Bit Manipulation'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-2', title: 'Number of 1 Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/number-of-1-bits/', xp: 10, tags: ['Bit Manipulation'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-3', title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', xp: 25, tags: ['Trie', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-4', title: 'Insert Interval', difficulty: 'medium', url: 'https://leetcode.com/problems/insert-interval/', xp: 25, tags: ['Intervals', 'Array'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-5', title: 'Merge Intervals', difficulty: 'medium', url: 'https://leetcode.com/problems/merge-intervals/', xp: 25, tags: ['Intervals', 'Sorting'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-6', title: 'Non-overlapping Intervals', difficulty: 'medium', url: 'https://leetcode.com/problems/non-overlapping-intervals/', xp: 25, tags: ['Intervals', 'Greedy'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-7', title: 'Design Add and Search Words Data Structure', difficulty: 'medium', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', xp: 25, tags: ['Trie', 'Design'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-8', title: 'Meeting Rooms', difficulty: 'easy', url: 'https://leetcode.com/problems/meeting-rooms/', xp: 10, tags: ['Intervals', 'Sorting'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-9', title: 'Meeting Rooms II', difficulty: 'medium', url: 'https://leetcode.com/problems/meeting-rooms-ii/', xp: 25, tags: ['Intervals', 'Sorting'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-10', title: 'Counting Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/counting-bits/', xp: 10, tags: ['Bit Manipulation', 'DP'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-11', title: 'Reverse Bits', difficulty: 'easy', url: 'https://leetcode.com/problems/reverse-bits/', xp: 10, tags: ['Bit Manipulation'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-12', title: 'Missing Number', difficulty: 'easy', url: 'https://leetcode.com/problems/missing-number/', xp: 10, tags: ['Bit Manipulation', 'Math'], blind75: true, rabbit150: true, running175: true },
      { id: 'adv-13', title: 'Gas Station', difficulty: 'medium', url: 'https://leetcode.com/problems/gas-station/', xp: 25, tags: ['Greedy', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-14', title: 'Hand of Straights', difficulty: 'medium', url: 'https://leetcode.com/problems/hand-of-straights/', xp: 25, tags: ['Greedy', 'Map'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-15', title: 'Subsets', difficulty: 'medium', url: 'https://leetcode.com/problems/subsets/', xp: 25, tags: ['Backtracking', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-16', title: 'Combination Sum II', difficulty: 'medium', url: 'https://leetcode.com/problems/combination-sum-ii/', xp: 25, tags: ['Backtracking', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-17', title: 'Letter Combinations of a Phone Number', difficulty: 'medium', url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', xp: 25, tags: ['Backtracking', 'String'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-18', title: 'N-Queens', difficulty: 'hard', url: 'https://leetcode.com/problems/n-queens/', xp: 35, tags: ['Backtracking', 'Matrix'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-19', title: 'Permutations', difficulty: 'medium', url: 'https://leetcode.com/problems/permutations/', xp: 25, tags: ['Backtracking', 'Array'], blind75: false, rabbit150: true, running175: true },
      { id: 'adv-20', title: 'Partition Labels', difficulty: 'medium', url: 'https://leetcode.com/problems/partition-labels/', xp: 25, tags: ['Two Pointers', 'Greedy'], blind75: false, rabbit150: false, running175: true },
      { id: 'adv-21', title: 'Valid Parenthesis String', difficulty: 'medium', url: 'https://leetcode.com/problems/valid-parenthesis-string/', xp: 25, tags: ['Greedy', 'Stack'], blind75: false, rabbit150: false, running175: true },
      { id: 'adv-22', title: 'Meeting Rooms III', difficulty: 'hard', url: 'https://leetcode.com/problems/meeting-rooms-iii/', xp: 35, tags: ['Intervals', 'Heap'], blind75: false, rabbit150: false, running175: true }
    ],
    bossLevel: {
      id: 'boss-advanced',
      title: 'Citadel Monarch',
      description: 'Navigate the multi-word Trie matrix to conquer the Citadel and complete the roadmap.',
      xp: 100,
      problems: [
        { id: 'boss-adv-b1', title: 'Word Search II', difficulty: 'hard', url: 'https://leetcode.com/problems/word-search-ii/', tags: ['Trie', 'Backtracking', 'DFS'] }
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
