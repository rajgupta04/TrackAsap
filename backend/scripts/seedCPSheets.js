import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to run from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import SheetBucket from '../src/models/SheetBucket.model.js';

const seedCPSheets = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for Seeding CP Sheets');

    // ==========================================
    // 1. CSES Problem Set
    // ==========================================
    const csesRawTopics = [
      {
        topic: 'Introductory Problems',
        difficulty: 'easy',
        list: 'Weird Algorithm (1068), Missing Number (1083), Repetitions (1069), Increasing Array (1094), Permutations (1070), Number Spiral (1071), Two Knights (1072), Two Sets (1092), Bit Strings (1617), Trailing Zeros (1618), Coin Piles (1754), Palindrome Reorder (1755), Gray Code (2205), Tower of Hanoi (2165), Creating Strings (1622), Apple Division (1623), Chessboard and Queens (1624), Digit Queries (2431), Grid Paths (1625)'
      },
      {
        topic: 'Sorting and Searching',
        difficulty: 'medium',
        list: 'Distinct Numbers (1621), Apartments (1084), Ferris Wheel (1090), Concert Tickets (1091), Restaurant Customers (1619), Movie Festival (1629), Sum of Two Values (1640), Maximum Subarray Sum (1643), Stick Lengths (1074), Missing Coin Sum (2183), Collecting Numbers (2216), Collecting Numbers II (2217), Playlist (1141), Towers (1073), Traffic Lights (1163), Josephus Problem I (2162), Josephus Problem II (2163), Nested Ranges Check (2168), Nested Ranges Count (2169), Room Allocation (1164), Factory Machines (1620), Tasks and Deadlines (1630), Reading Books (1631), Sum of Three Values (1641), Sum of Four Values (1642), Nearest Smaller Values (1645), Subarray Sums I (1660), Subarray Sums II (1661), Subarray Divisibility (1662), Subarray Distinct Values (2428), Array Division (1085), Sliding Median (1076), Sliding Cost (1077), Movie Festival II (1632), Maximum Subarray Sum II (1644)'
      },
      {
        topic: 'Dynamic Programming',
        difficulty: 'medium',
        list: 'Dice Combinations (1633), Minimizing Coins (1634), Coin Combinations I (1635), Coin Combinations II (1636), Removing Digits (1637), Grid Paths (1638), Book Shop (1158), Array Description (1746), Counting Towers (2413), Edit Distance (1639), Rectangle Cutting (1744), Money Sums (1745), Removal Game (1097), Two Sets II (1093), Increasing Subsequence (1145), Projects (1140), Elevator Rides (1653), Counting Tilings (2181), Counting Numbers (2220)'
      },
      {
        topic: 'Graph Algorithms',
        difficulty: 'medium',
        list: 'Counting Rooms (1192), Labyrinth (1193), Building Roads (1666), Message Route (1667), Building Teams (1668), Round Trip (1669), Monsters (1194), Shortest Routes I (1671), Shortest Routes II (1672), High Score (1673), Flight Discount (1195), Cycle Finding (1197), Flight Routes (1196), Round Trip II (1678), Course Schedule (1679), Longest Flight Route (1680), Game Routes (1681), Investigation (1202), Planets Queries I (1750), Planets Queries II (1160), Planets Cycles (1751), Road Reparation (1675), Road Construction (1676), Flight Routes Check (1682), Planets and Kingdoms (1683), Giant Pizza (1684), Coin Collector (1686), Mail Delivery (1691), De Bruijn Sequence (1692), Teleporters Path (1693), Hamiltonian Flights (1690), Knight\'s Tour (1689), Download Speed (1694), Police Chase (1695), School Dance (1696), Distinct Routes (1711)'
      },
      {
        topic: 'Range Queries',
        difficulty: 'hard',
        list: 'Static Range Sum (1646), Static Range Minimum Queries (1647), Dynamic Range Sum Queries (1648), Dynamic Range Minimum Queries (1649), Range Xor Queries (1650), Range Update Queries (1651), Forest Queries (1652), Hotel Queries (1143), List Removals (1749), Salary Queries (1144), Prefix Sum Queries (2166), Pizzeria Queries (2206), Subarray Sum Queries (1190), Distinct Values Queries (1734), Increasing Array Queries (2416), Forest Queries II (1652), Range Updates and Sums (1735), Polynomial Queries (1736), Range Queries and Copies (1737)'
      },
      {
        topic: 'Tree Algorithms',
        difficulty: 'hard',
        list: 'Subordinates (1674), Tree Matching (1130), Tree Diameter (1131), Tree Distances I (1132), Tree Distances II (1133), Company Queries I (1687), Company Queries II (1688), Distance Queries (1135), Counting Paths (1136), Subtree Queries (1137), Path Queries (1138), Path Queries II (2134), Distinct Colors (1139), Finding a Centroid (2079), Fixed-Length Paths I (2080), Fixed-Length Paths II (2081)'
      },
      {
        topic: 'Mathematics',
        difficulty: 'medium', // Going with medium, some are hard but let's default to medium for math
        list: 'Josephus Queries (2164), Exponentiation (1095), Exponentiation II (1712), Counting Divisors (1713), Common Divisors (1081), Sum of Divisors (1082), Divisor Analysis (2182), Prime Multiples (2185), Counting Coprime Pairs (2417), Binomial Coefficients (1079), Creating Strings II (1715), Distributing Apples (1716), Christmas Party (1717), Bracket Sequences I (2064), Bracket Sequences II (2187), Counting Necklaces (2209), Counting Grids (2210), Fibonacci Numbers (1722), Throwing Dice (1096), Graph Paths I (1723), Graph Paths II (1724), Dice Probability (1725), Moving Robots (1726), Candy Lottery (1727), Inversion Probability (1728), Stick Game (1729), Nim Game I (1730), Nim Game II (1731), Stair Game (1099)'
      },
      {
        topic: 'String Algorithms',
        difficulty: 'hard',
        list: 'Word Combinations (1731), String Matching (1753), Finding Borders (1732), Finding Periods (1733), Minimal Rotation (1110), Longest Palindrome (1111), Required Substring (1112), Palindrome Queries (2420), Finding Patterns (2102), Counting Patterns (2103), Pattern Positions (2104), Distinct Substrings (2105), Repeating Substring (2106), String Functions (2107), Substring Order I (2108), Substring Order II (2109), Substring Distribution (2110)'
      },
      {
        topic: 'Geometry',
        difficulty: 'hard',
        list: 'Point Location Test (2189), Line Segment Intersection (2190), Polygon Area (2191), Point in Polygon (2192), Polygon Lattice Points (2193), Minimum Euclidean Distance (2194), Convex Hull (2195)'
      },
      {
        topic: 'Advanced Techniques',
        difficulty: 'hard',
        list: 'Meet in the Middle (1628), Hamming Distance (2136), Beautiful Subgrids (2137), Reachable Nodes (2138), Reachability Queries (2143), Cut and Paste (2072), Substring Reversals (2073), Reversals and Sums (2074), Necessary Roads (2076), Necessary Cities (2077), Eulerian Subgraphs (2078), Monster Game I (2084), Monster Game II (2085), Subarray Squares (2086), Houses and Schools (2132), Knuth Division (2133), Apples and Bananas (2111), One Bit Positions (2112), Signal Processing (2113), New Roads Queries (2101), Dynamic Connectivity (2133), Parcel Delivery (2121), Task Assignment (2129), Distinct Routes II (2130)'
      }
    ];

    let csesProblems = [];
    csesRawTopics.forEach((t) => {
      const items = t.list.split(',').map(i => i.trim());
      items.forEach((item, index) => {
        const match = item.match(/(.+)\s\((\d+)\)/);
        if (match) {
          csesProblems.push({
            title: match[1].trim(),
            topic: t.topic,
            difficulty: t.difficulty,
            problemLink: `https://cses.fi/problemset/task/${match[2]}`,
            articleLink: '',
            youtubeLink: '',
            problemKey: `cses-${match[2]}`,
            platform: 'cses',
            tags: [],
            order: index + 1
          });
        }
      });
    });

    const csesSheet = {
      name: 'CSES Problem Set',
      description: 'The gold standard competitive programming problem set by Antti Laaksonen. Covers all fundamental algorithms and data structures.',
      category: 'cp',
      icon: 'Zap',
      color: '#3B82F6',
      problems: csesProblems,
      isActive: true
    };

    // ==========================================
    // 2. AtCoder Educational DP Contest
    // ==========================================
    const atcoderRaw = [
      { letter: 'A', name: 'Frog 1', difficulty: 'easy' },
      { letter: 'B', name: 'Frog 2', difficulty: 'easy' },
      { letter: 'C', name: 'Vacation', difficulty: 'easy' },
      { letter: 'D', name: 'Knapsack 1', difficulty: 'easy' },
      { letter: 'E', name: 'Knapsack 2', difficulty: 'medium' },
      { letter: 'F', name: 'LCS', difficulty: 'medium' },
      { letter: 'G', name: 'Longest Path', difficulty: 'medium' },
      { letter: 'H', name: 'Grid 1', difficulty: 'easy' },
      { letter: 'I', name: 'Coins', difficulty: 'medium' },
      { letter: 'J', name: 'Sushi', difficulty: 'medium' },
      { letter: 'K', name: 'Stones', difficulty: 'medium' },
      { letter: 'L', name: 'Deque', difficulty: 'medium' },
      { letter: 'M', name: 'Candies', difficulty: 'medium' },
      { letter: 'N', name: 'Slimes', difficulty: 'medium' },
      { letter: 'O', name: 'Matching', difficulty: 'hard' },
      { letter: 'P', name: 'Independent Set', difficulty: 'medium' },
      { letter: 'Q', name: 'Flowers', difficulty: 'medium' },
      { letter: 'R', name: 'Walk', difficulty: 'hard' },
      { letter: 'S', name: 'Digit Sum', difficulty: 'hard' },
      { letter: 'T', name: 'Permutation', difficulty: 'hard' },
      { letter: 'U', name: 'Grouping', difficulty: 'hard' },
      { letter: 'V', name: 'Subtree', difficulty: 'hard' },
      { letter: 'W', name: 'Intervals', difficulty: 'hard' },
      { letter: 'X', name: 'Tower', difficulty: 'hard' },
      { letter: 'Y', name: 'Grid 2', difficulty: 'hard' },
      { letter: 'Z', name: 'Frog 3', difficulty: 'hard' }
    ];

    const atcoderProblems = atcoderRaw.map((p, index) => ({
      title: `${p.letter} - ${p.name}`,
      topic: 'Educational DP',
      difficulty: p.difficulty,
      problemLink: `https://atcoder.jp/contests/dp/tasks/dp_${p.letter.toLowerCase()}`,
      articleLink: '',
      youtubeLink: '',
      problemKey: `atcoder-dp-${p.letter.toLowerCase()}`,
      platform: 'atcoder',
      tags: ['dp'],
      order: index + 1
    }));

    const atcoderSheet = {
      name: 'AtCoder Educational DP Contest',
      description: 'The definitive 26-problem DP training set (A-Z). Covers every standard DP pattern from basic to advanced.',
      category: 'dp',
      icon: 'Brain',
      color: '#8B5CF6',
      problems: atcoderProblems,
      isActive: true
    };

    // ==========================================
    // 3. Codeforces EDU - ITMO Academy
    // ==========================================
    const cfEduTopics = [
      {
        topic: 'Binary Search',
        abbrev: 'bs',
        difficulty: 'medium',
        lesson: 6,
        steps: [
          ['Binary Search (1)', 'Binary Search (2)', 'Chips', 'Ropes'],
          ['Packing Rectangles', 'K-th Number in Multiplication Table', 'K Closest Points', 'Binary String'],
          ['Children', 'Equation', 'Maximum Median', 'Splitting Array'],
          ['Minimum Median', 'Maximum Average Segment', 'Closest to the Left', 'Closest to the Right']
        ]
      },
      {
        topic: 'Two Pointers',
        abbrev: 'tp',
        difficulty: 'medium',
        lesson: 9, // Using dummy lesson numbers for links where not specified explicitly
        steps: [
          ['Merging Arrays', 'Number of Segments with Small Sum'],
          ['Segment with Small Sum', 'Number of Segments with Small Sum'], // The second one repeated in prompt
          ['Segments with Small Sum', 'Number of Smaller']
        ]
      },
      {
        topic: 'DSU (Disjoint Sets Union)',
        abbrev: 'dsu',
        difficulty: 'medium',
        lesson: 7,
        steps: [
          ['Disjoint Sets Union', 'Experience'],
          ['Cutting', 'Bipartiteness']
        ]
      },
      {
        topic: 'Segment Tree Part 1',
        abbrev: 'seg1',
        difficulty: 'hard',
        lesson: 4,
        steps: [
          ['Segment Tree for the Sum', 'Segment Tree for the Minimum'],
          ['Number of Minimums on a Segment', 'Number of Inversions on a Segment'],
          ['Addition to Segment', 'Assignment to Segment'],
          ['Sign Alternation', 'Inversions']
        ]
      },
      {
        topic: 'Segment Tree Part 2',
        abbrev: 'seg2',
        difficulty: 'hard',
        lesson: 5,
        steps: [
          ['Segment with Maximum Sum'],
          ['K-th One', 'First element at least x'],
          ['Addition and Minimum', 'Assignment and Minimum'],
          ['Assignment', 'Addition and Sum']
        ]
      }
    ];

    let cfEduProblems = [];
    cfEduTopics.forEach((t) => {
      let order = 1;
      t.steps.forEach((stepArr, stepIndex) => {
        const stepNum = stepIndex + 1;
        stepArr.forEach((problemName, probIndex) => {
          const probNum = probIndex + 1;
          cfEduProblems.push({
            title: `Step ${stepNum}: ${problemName}`,
            topic: t.topic,
            difficulty: t.difficulty,
            // Example structure from prompt: https://codeforces.com/edu/course/2/lesson/6/1/practice
            problemLink: `https://codeforces.com/edu/course/2/lesson/${t.lesson}/${stepNum}/practice`,
            articleLink: '',
            youtubeLink: '',
            problemKey: `cf-edu-${t.abbrev}-${stepNum}-${probNum}`,
            platform: 'codeforces',
            tags: [],
            order: order++
          });
        });
      });
    });

    const cfEduSheet = {
      name: 'Codeforces EDU - ITMO Academy',
      description: 'Structured algorithmic courses by ITMO University with video lectures. Covers Binary Search, Two Pointers, DSU, and Segment Trees.',
      category: 'cp',
      icon: 'GraduationCap',
      color: '#EF4444',
      problems: cfEduProblems,
      isActive: true
    };

    // ==========================================
    // Save to Database
    // ==========================================
    const sheetsToSeed = [csesSheet, atcoderSheet, cfEduSheet];

    for (const sheetData of sheetsToSeed) {
      await SheetBucket.findOneAndUpdate(
        { name: sheetData.name },
        { $set: sheetData },
        { upsert: true, new: true }
      );
      console.log(`✅ Upserted Sheet: ${sheetData.name} with ${sheetData.problems.length} problems`);
    }

    console.log('Seeding Complete!');
    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error seeding CP sheets:', error);
    process.exit(1);
  }
};

seedCPSheets();
