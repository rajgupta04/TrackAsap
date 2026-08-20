import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import JudgeProblem from '../src/models/JudgeProblem.model.js';
import User from '../src/models/User.model.js';
import RoadmapWorld from '../src/models/RoadmapWorld.model.js';

const ARRAY_PROBLEMS = [
  // 1. Contains Duplicate (Lucky)
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    description: `**Lucky** is organizing a secret treasure hunt across the royal palace. He assigns a unique badge number to every explorer from an array \`nums\`. 

However, Lucky suspects that an imposter snuck in with a duplicate badge! He needs you to quickly scan the array:
* Return \`true\` if any badge number appears **at least twice** in the array.
* Return \`false\` if every explorer has a distinct badge.

---

### Input Format
* An array of integers \`nums\`.

### Output Format
* Return \`true\` if any value appears at least twice, otherwise \`false\`.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['Array', 'Hash Table', 'Sorting', 'Blind 75'],
    hints: [
      'A brute force approach would check all pairs in O(n^2).',
      'Can we sort the array first in O(n log n)?',
      'Can we use a hash set to achieve O(n) time and O(n) space?'
    ],
    editorial: `### 💡 Intuition & Approach
The goal is to determine if any element appears more than once in the array.

#### 1. Hash Set Approach (Optimal)
We iterate through \`nums\` while maintaining a hash set of previously seen elements:
* For each number, check if it already exists in our set.
* If it does, we immediately return \`true\`.
* Otherwise, insert the number into the set.
* If the loop finishes without finding duplicates, return \`false\`.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Single pass through the array with $O(1)$ average hash set lookups and insertions.
* **Space Complexity:** $O(N)$ — To store up to $N$ unique elements in the hash set.`,
    starterCode: {
      python: `class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your code here\n        return false;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your code here\n        return false;\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        seen = set()\n        for x in nums:\n            if x in seen:\n                return True\n            seen.add(x)\n        return False\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        Set<Integer> seen = new HashSet<>();\n        for (int num : nums) {\n            if (!seen.add(num)) return true;\n        }\n        return false;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        unordered_set<int> seen;\n        for (int num : nums) {\n            if (seen.count(num)) return true;\n            seen.insert(num);\n        }\n        return false;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    const seen = new Set();\n    for (const num of nums) {\n        if (seen.has(num)) return true;\n        seen.add(num);\n    }\n    return false;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        data = json.loads(raw)\n        print("true" if Solution().containsDuplicate(data) else "false")\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = JSON.parse(input);\n    console.log(containsDuplicate(nums) ? "true" : "false");\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = line.isEmpty() ? new int[0] : Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        System.out.println(new Solution().containsDuplicate(nums) ? "true" : "false");\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <sstream>\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    cout << (Solution().containsDuplicate(nums) ? "true" : "false") << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [1, 2, 3, 1]', output: 'true', explanation: 'Lucky finds badge 1 repeated twice.' },
      { input: 'nums = [1, 2, 3, 4]', output: 'false', explanation: 'All badges are unique.' }
    ],
    visibleTestcases: [
      { input: '[1, 2, 3, 1]', expectedOutput: 'true' },
      { input: '[1, 2, 3, 4]', expectedOutput: 'false' }
    ],
    hiddenTestcases: [
      { input: '[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]', expectedOutput: 'true' },
      { input: '[42]', expectedOutput: 'false' },
      { input: '[-1, -2, -3, -1]', expectedOutput: 'true' }
    ]
  },

  // 2. Valid Anagram (Anas & Kunal)
  {
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    description: `**Anas** and **Kunal** are competing in an ancient spellcasting contest! 

Anas casts a mysterious incantation \`s\`, and Kunal attempts to counter it with a counter-spell \`t\`. A counter-spell is valid if and only if it is an **anagram** of Anas's spell (meaning Kunal rearranged the exact letters of \`s\` using each letter the exact same number of times).

Help the referee determine if Kunal's spell \`t\` is a valid anagram of \`s\`.

---

### Input Format
* Two strings \`s\` and \`t\`.

### Output Format
* Return \`true\` if \`t\` is an anagram of \`s\`, otherwise \`false\`.`,
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    tags: ['Hash Table', 'String', 'Sorting', 'Blind 75'],
    hints: [
      'What if the inputs have different lengths?',
      'Can you count frequencies of each character using an array of size 26 or a hash map?'
    ],
    editorial: `### 💡 Intuition & Approach
An anagram requires both strings to have identical character frequencies.

#### Frequency Counting (Optimal)
1. If \`s.length != t.length\`, they cannot be anagrams — return \`false\`.
2. Use a fixed-size integer array of length 26 to count letter occurrences.
3. For each character at index \`i\`:
   * Increment the counter for \`s[i]\`.
   * Decrement the counter for \`t[i]\`.
4. Finally, verify that all 26 counters are \`0\`.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Where $N$ is the length of string $s$.
* **Space Complexity:** $O(1)$ — Only a constant size table of 26 integers is used.`,
    starterCode: {
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your code here\n        return false;\n    }\n}\n`,
      cpp: `#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        // Write your code here\n        return false;\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        if len(s) != len(t):\n            return False\n        counts = [0] * 26\n        for i in range(len(s)):\n            counts[ord(s[i]) - ord('a')] += 1\n            counts[ord(t[i]) - ord('a')] -= 1\n        return all(c == 0 for c in counts)\n`,
      java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        if (s.length() != t.length()) return false;\n        int[] count = new int[26];\n        for (int i = 0; i < s.length(); i++) {\n            count[s.charAt(i) - 'a']++;\n            count[t.charAt(i) - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n}\n`,
      cpp: `#include <string>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        if (s.length() != t.length()) return false;\n        vector<int> count(26, 0);\n        for (size_t i = 0; i < s.length(); i++) {\n            count[s[i] - 'a']++;\n            count[t[i] - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n};\n`,
      javascript: `/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    if (s.length !== t.length) return false;\n    const counts = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        counts[s.charCodeAt(i) - 97]++;\n        counts[t.charCodeAt(i) - 97]--;\n    }\n    return counts.every(c => c === 0);\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        lines = [x.strip() for x in raw.split('\\n') if x.strip()]\n        s = lines[0].replace('\"', '')\n        t = lines[1].replace('\"', '') if len(lines) > 1 else ''\n        print("true" if Solution().isAnagram(s, t) else "false")\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const lines = input.split('\\n').map(l => l.trim().replace(/\"/g, '')).filter(Boolean);\n    console.log(isAnagram(lines[0] || '', lines[1] || '') ? "true" : "false");\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String s = sc.nextLine().trim().replace("\\\"", "");\n        String t = sc.hasNextLine() ? sc.nextLine().trim().replace("\\\"", "") : "";\n        System.out.println(new Solution().isAnagram(s, t) ? "true" : "false");\n    }\n}\n`,
      cpp: `#include <iostream>\nint main() {\n    string s, t;\n    if (!(cin >> s >> t)) return 0;\n    if (s.front() == '\"') s = s.substr(1, s.length() - 2);\n    if (t.front() == '\"') t = t.substr(1, t.length() - 2);\n    cout << (Solution().isAnagram(s, t) ? "true" : "false") << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Kunal used all letters of Anas spell.' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: 'Spell letter frequencies do not match.' }
    ],
    visibleTestcases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true' },
      { input: 'rat\ncar', expectedOutput: 'false' }
    ],
    hiddenTestcases: [
      { input: 'a\na', expectedOutput: 'true' },
      { input: 'ab\na', expectedOutput: 'false' },
      { input: 'listen\nsilent', expectedOutput: 'true' }
    ]
  },

  // 3. Two Sum (Lakshya)
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    description: `**Lakshya** is shopping at the Grand Cyber Bazaar! He is carrying a magical voucher with exact value \`target\`.

In the store, there is an array of artifacts with prices given by \`nums\`. Lakshya wants to buy **exactly two artifacts** such that the sum of their prices equals his voucher \`target\`.

Find the **0-based indices** of the two items Lakshya should buy. You may assume each testcase has exactly one valid pair of items and you cannot buy the same item twice.

---

### Input Format
* An array of integers \`nums\`.
* An integer \`target\`.

### Output Format
* Return an array of two integers \`[index1, index2]\`.`,
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    tags: ['Array', 'Hash Table', 'Blind 75'],
    hints: [
      'A brute force approach checks every pair in O(n^2).',
      'For each number x, can we check if (target - x) exists in a hash map in O(1)?'
    ],
    editorial: `### 💡 Intuition & Approach
We need to find two distinct indices $i$ and $j$ such that \`nums[i] + nums[j] == target\`.

#### One-Pass Hash Map (Optimal)
Instead of searching through all pairs ($O(N^2)$), we use a Hash Map storing \`{ value: index }\`:
1. For each element \`nums[i]\`, compute its complement: \`diff = target - nums[i]\`.
2. Check if \`diff\` is already in our map:
   * If yes, return \`[map[diff], i]\`.
   * If no, store \`map[nums[i]] = i\` and proceed.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Single pass through the array with $O(1)$ lookups.
* **Space Complexity:** $O(N)$ — To store the hash map of indices.`,
    starterCode: {
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[0];\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                return new int[]{ map.get(diff), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> map;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (map.count(diff)) {\n                return { map[diff], i };\n            }\n            map[nums[i]] = i;\n        }\n        return {};\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) {\n            return [map.get(diff), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        lines = [x.strip() for x in raw.split('\\n') if x.strip()]\n        nums = json.loads(lines[0])\n        target = int(lines[1])\n        res = Solution().twoSum(nums, target)\n        print(json.dumps(res))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const lines = input.split('\\n').map(l => l.trim()).filter(Boolean);\n    const nums = JSON.parse(lines[0]);\n    const target = parseInt(lines[1], 10);\n    const res = twoSum(nums, target);\n    console.log(JSON.stringify(res));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line1 = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = Arrays.stream(line1.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        int target = sc.nextInt();\n        int[] res = new Solution().twoSum(nums, target);\n        System.out.println(Arrays.toString(res).replace(" ", ""));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <sstream>\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    int target; cin >> target;\n    vector<int> res = Solution().twoSum(nums, target);\n    cout << "[" << res[0] << "," << res[1] << "]" << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Lakshya picks items at index 0 ($2) and index 1 ($7).' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Lakshya picks items at index 1 ($2) and index 2 ($4).' }
    ],
    visibleTestcases: [
      { input: '[2, 7, 11, 15]\n9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4]\n6', expectedOutput: '[1, 2]' }
    ],
    hiddenTestcases: [
      { input: '[3, 3]\n6', expectedOutput: '[0, 1]' },
      { input: '[-1, -2, -3, -4, -5]\n-8', expectedOutput: '[2, 4]' }
    ]
  },

  // 4. Group Anagrams (Kunal)
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: 'Medium',
    description: `**Kunal** discovered a forgotten cipher archive containing a list of cryptic scrolls \`strs\`. 

Ancient lore says that scrolls with the exact same character frequencies belong to the same secret clan. Kunal needs your help to group all anagram scrolls together so he can decipher the clan messages!

You can return the grouped clans in **any order**.

---

### Input Format
* An array of strings \`strs\`.

### Output Format
* Return a 2D array of strings where each inner array contains grouped anagrams.`,
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    tags: ['Array', 'Hash Table', 'String', 'Sorting', 'Blind 75'],
    hints: [
      'Two strings are anagrams if their sorted representations are equal.',
      'Use the sorted string as a key in a hash map mapping to a list of original words.'
    ],
    editorial: `### 💡 Intuition & Approach
Two strings are anagrams if and only if sorting their characters yields the exact same string.

#### Categorize by Sorted String
1. Maintain a Hash Map where the key is the sorted canonical version of a word and the value is a list of original words.
2. For each string \`s\` in \`strs\`:
   * Sort its characters: e.g. \`"eat" -> "aet"\`.
   * Append \`s\` to \`map["aet"]\`.
3. Return all lists from the map values.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N \cdot K \log K)$ — Where $N$ is number of strings and $K$ is maximum length of a string.
* **Space Complexity:** $O(N \cdot K)$ — To store the hash map and resulting grouped lists.`,
    starterCode: {
      python: `class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}\n`,
      cpp: `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your code here\n        return {};\n    }\n};\n`
    },
    solutions: {
      python: `from collections import defaultdict\n\nclass Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        groups = defaultdict(list)\n        for s in strs:\n            key = ''.join(sorted(s))\n            groups[key].append(s)\n        return list(groups.values())\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        Map<String, List<String>> map = new HashMap<>();\n        for (String s : strs) {\n            char[] chars = s.toCharArray();\n            Arrays.sort(chars);\n            String key = new String(chars);\n            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);\n        }\n        return new ArrayList<>(map.values());\n    }\n}\n`,
      cpp: `#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        unordered_map<string, vector<string>> map;\n        for (string& s : strs) {\n            string key = s;\n            sort(key.begin(), key.end());\n            map[key].push_back(s);\n        }\n        vector<vector<string>> result;\n        for (auto& pair : map) {\n            result.push_back(pair.second);\n        }\n        return result;\n    }\n};\n`,
      javascript: `/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    const map = new Map();\n    for (const s of strs) {\n        const key = s.split('').sort().join('');\n        if (!map.has(key)) map.set(key, []);\n        map.get(key).push(s);\n    }\n    return Array.from(map.values());\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        strs = json.loads(raw)\n        res = Solution().groupAnagrams(strs)\n        normalized = [sorted(g) for g in res]\n        normalized.sort()\n        print(json.dumps(normalized))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const strs = JSON.parse(input);\n    const res = groupAnagrams(strs);\n    const normalized = res.map(g => g.slice().sort()).sort();\n    console.log(JSON.stringify(normalized));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().trim();\n        if (line.startsWith("[")) line = line.substring(1);\n        if (line.endsWith("]")) line = line.substring(0, line.length() - 1);\n        line = line.trim();\n        String[] strs;\n        if (line.isEmpty()) {\n            strs = new String[0];\n        } else {\n            String[] tokens = line.split(",(?=(?:[^\\"]*\\"[^\\"]*\\")*[^\\"]*$)");\n            strs = new String[tokens.length];\n            for (int i = 0; i < tokens.length; i++) {\n                String s = tokens[i].trim();\n                if (s.startsWith("\\"") && s.endsWith("\\"") && s.length() >= 2) {\n                    s = s.substring(1, s.length() - 1);\n                }\n                strs[i] = s;\n            }\n        }\n        List<List<String>> res = new Solution().groupAnagrams(strs);\n        for (List<String> g : res) Collections.sort(g);\n        res.sort(Comparator.comparing(Object::toString));\n        StringBuilder sb = new StringBuilder("[");\n        for (int i = 0; i < res.size(); i++) {\n            sb.append("[");\n            List<String> g = res.get(i);\n            for (int j = 0; j < g.size(); j++) {\n                sb.append("\\"").append(g.get(j)).append("\\"").append(j + 1 < g.size() ? ", " : "");\n            }\n            sb.append("]").append(i + 1 < res.size() ? ", " : "");\n        }\n        sb.append("]");\n        System.out.println(sb.toString());\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<string> strs;\n    stringstream ss(line); char ch;\n    while (ss >> ch) { if (ch == '\"') { string s; getline(ss, s, '\"'); strs.push_back(s); } }\n    Solution sol;\n    vector<vector<string>> res = sol.groupAnagrams(strs);\n    for (auto& g : res) sort(g.begin(), g.end());\n    sort(res.begin(), res.end());\n    cout << "[";\n    for (size_t i = 0; i < res.size(); i++) {\n        cout << "[";\n        for (size_t j = 0; j < res[i].size(); j++) cout << "\\"" << res[i][j] << "\\"" << (j + 1 < res[i].size() ? ", " : "");\n        cout << "]" << (i + 1 < res.size() ? ", " : "");\n    }\n    cout << "]" << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: 'Kunal grouped scrolls by character compositions.' },
      { input: 'strs = [""]', output: '[[""]]', explanation: 'Single empty scroll.' }
    ],
    visibleTestcases: [
      { input: '["eat", "tea", "tan", "ate", "nat", "bat"]', expectedOutput: '[["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]' },
      { input: '[""]', expectedOutput: '[[""]]' }
    ],
    hiddenTestcases: [
      { input: '["a"]', expectedOutput: '[["a"]]' },
      { input: '["ab", "ba", "abc", "cba", "bca"]', expectedOutput: '[["ab", "ba"], ["abc", "bca", "cba"]]' }
    ]
  },

  // 5. Top K Frequent Elements (Anas)
  {
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    difficulty: 'Medium',
    description: `**Anas** is monitoring server access traffic on the TrackAsap arena. He receives a huge stream of user ping IDs logged in array \`nums\`.

To optimize database caching, Anas must identify the **\`k\` most frequent user IDs** in the logs.

You may return the answer in **any order**.

---

### Input Format
* An array of integers \`nums\`.
* An integer \`k\`.

### Output Format
* Return an array of the \`k\` most frequent integers.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is in the range [1, the number of unique elements in the array].', 'It is guaranteed that the answer is unique.'],
    tags: ['Array', 'Hash Table', 'Heap (Priority Queue)', 'Bucket Sort', 'Blind 75'],
    hints: [
      'First count frequencies using a hash map.',
      'Then you can use a min-heap of size k in O(n log k), or Bucket Sort in O(n) linear time!'
    ],
    editorial: `### 💡 Intuition & Approach
Given $N$ numbers, we want to extract the $K$ numbers with the highest frequencies.

#### Bucket Sort Approach (O(N) Optimal)
1. Count frequencies of each number using a Hash Map.
2. Notice that the maximum frequency of any number cannot exceed $N$.
3. Create an array of buckets \`buckets[0...N]\`, where \`buckets[f]\` stores all numbers having exact frequency \`f\`.
4. Traverse the buckets from $N$ down to $0$ and gather numbers until we have collected $K$ elements.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Creating counts and filling buckets both take linear time.
* **Space Complexity:** $O(N)$ — To store the frequency map and buckets.`,
    starterCode: {
      python: `class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        // Write your code here\n        return new int[0];\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_map>\n#include <queue>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        // Write your code here\n        return {};\n    }\n};\n`
    },
    solutions: {
      python: `from collections import Counter\n\nclass Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        count = Counter(nums)\n        buckets = [[] for _ in range(len(nums) + 1)]\n        for num, freq in count.items():\n            buckets[freq].append(num)\n        res = []\n        for i in range(len(buckets) - 1, 0, -1):\n            for num in buckets[i]:\n                res.append(num)\n                if len(res) == k:\n                    return res\n        return res\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        Map<Integer, Integer> count = new HashMap<>();\n        for (int n : nums) count.put(n, count.getOrDefault(n, 0) + 1);\n\n        List<Integer>[] buckets = new List[nums.length + 1];\n        for (int key : count.keySet()) {\n            int freq = count.get(key);\n            if (buckets[freq] == null) buckets[freq] = new ArrayList<>();\n            buckets[freq].add(key);\n        }\n\n        int[] res = new int[k];\n        int idx = 0;\n        for (int i = buckets.length - 1; i >= 0 && idx < k; i--) {\n            if (buckets[i] != null) {\n                for (int n : buckets[i]) {\n                    res[idx++] = n;\n                    if (idx == k) return res;\n                }\n            }\n        }\n        return res;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        unordered_map<int, int> count;\n        for (int n : nums) count[n]++;\n\n        vector<vector<int>> buckets(nums.size() + 1);\n        for (auto& p : count) buckets[p.second].push_back(p.first);\n\n        vector<int> res;\n        for (int i = buckets.size() - 1; i >= 0 && res.size() < k; i--) {\n            for (int n : buckets[i]) {\n                res.push_back(n);\n                if (res.size() == k) return res;\n            }\n        }\n        return res;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    const count = new Map();\n    for (const n of nums) count.set(n, (count.get(n) || 0) + 1);\n\n    const buckets = Array.from({ length: nums.length + 1 }, () => []);\n    for (const [num, freq] of count.entries()) {\n        buckets[freq].push(num);\n    }\n\n    const res = [];\n    for (let i = buckets.length - 1; i >= 0 && res.length < k; i--) {\n        for (const n of buckets[i]) {\n            res.push(n);\n            if (res.length === k) return res;\n        }\n    }\n    return res;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        lines = [x.strip() for x in raw.split('\\n') if x.strip()]\n        nums = json.loads(lines[0])\n        k = int(lines[1])\n        res = sorted(Solution().topKFrequent(nums, k))\n        print(json.dumps(res))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const lines = input.split('\\n').map(l => l.trim()).filter(Boolean);\n    const nums = JSON.parse(lines[0]);\n    const k = parseInt(lines[1], 10);\n    const res = topKFrequent(nums, k).sort((a, b) => a - b);\n    console.log(JSON.stringify(res));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        int k = sc.nextInt();\n        int[] res = new Solution().topKFrequent(nums, k);\n        Arrays.sort(res);\n        System.out.println(Arrays.toString(res).replace(" ", ""));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    int k; if (cin >> k) {\n        Solution sol;\n        vector<int> res = sol.topKFrequent(nums, k);\n        sort(res.begin(), res.end());\n        cout << "[";\n        for (size_t i = 0; i < res.size(); i++) cout << res[i] << (i + 1 < res.size() ? ", " : "");\n        cout << "]" << endl;\n    }\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1, 2]', explanation: 'User 1 appeared 3 times and User 2 appeared 2 times.' },
      { input: 'nums = [1], k = 1', output: '[1]', explanation: 'Only 1 user ID exists.' }
    ],
    visibleTestcases: [
      { input: '[1, 1, 1, 2, 2, 3]\n2', expectedOutput: '[1, 2]' },
      { input: '[1]\n1', expectedOutput: '[1]' }
    ],
    hiddenTestcases: [
      { input: '[4, 1, -1, 2, -1, 2, 3]\n2', expectedOutput: '[-1, 2]' }
    ]
  },

  // 6. Product of Array Except Self (Lucky & Lakshya)
  {
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    description: `**Lucky** and **Lakshya** are designing a power generator for their spaceship. The generator consists of \`n\` energy cells, where cell \`i\` operates at multiplier \`nums[i]\`.

To avoid system resonance, cell \`i\` must output a power level equal to the **product of all multipliers in the generator EXCEPT cell \`i\` itself**.

Due to spaceship hardware constraints, you must calculate all output powers in **O(n) time without using the division operation**!

---

### Input Format
* An array of integers \`nums\`.

### Output Format
* Return an array of integers where the \`i-th\` element is the product of all elements except \`nums[i]\`.`,
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30', 'The product of any prefix or suffix of nums fits in a 32-bit integer.'],
    tags: ['Array', 'Prefix Sum', 'Blind 75'],
    hints: [
      'Think about prefix products (product of all elements before i) and suffix products (product of all elements after i).',
      'Can you do it in O(1) extra space by writing prefix products directly to output and tracking postfix product with a single variable?'
    ],
    editorial: `### 💡 Intuition & Approach
For any index \`i\`, the product of all elements except \`nums[i]\` is:
$$\\text{answer}[i] = (\\text{product of elements before } i) \\times (\\text{product of elements after } i)$$

#### Prefix & Postfix Running Products
1. Initialize the output array \`res\` with size $N$.
2. **Left-to-Right Pass:** Store the running prefix product directly into \`res[i]\`.
3. **Right-to-Left Pass:** Maintain a single \`postfix\` accumulator variable and multiply \`res[i] *= postfix\` while updating \`postfix *= nums[i]\`.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Two passes across the array.
* **Space Complexity:** $O(1)$ — Auxiliary space (the returned output array does not count towards extra memory).`,
    starterCode: {
      python: `class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your code here\n        return new int[0];\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your code here\n        return {};\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        n = len(nums)\n        res = [1] * n\n        prefix = 1\n        for i in range(n):\n            res[i] = prefix\n            prefix *= nums[i]\n        postfix = 1\n        for i in range(n - 1, -1, -1):\n            res[i] *= postfix\n            postfix *= nums[i]\n        return res\n`,
      java: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        int n = nums.length;\n        int[] res = new int[n];\n        res[0] = 1;\n        for (int i = 1; i < n; i++) {\n            res[i] = res[i - 1] * nums[i - 1];\n        }\n        int postfix = 1;\n        for (int i = n - 1; i >= 0; i--) {\n            res[i] *= postfix;\n            postfix *= nums[i];\n        }\n        return res;\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        int n = nums.size();\n        vector<int> res(n, 1);\n        for (int i = 1; i < n; i++) {\n            res[i] = res[i - 1] * nums[i - 1];\n        }\n        int postfix = 1;\n        for (int i = n - 1; i >= 0; i--) {\n            res[i] *= postfix;\n            postfix *= nums[i];\n        }\n        return res;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    const n = nums.length;\n    const res = new Array(n).fill(1);\n    for (let i = 1; i < n; i++) {\n        res[i] = res[i - 1] * nums[i - 1];\n    }\n    let postfix = 1;\n    for (let i = n - 1; i >= 0; i--) {\n        res[i] *= postfix;\n        postfix *= nums[i];\n    }\n    return res;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        nums = json.loads(raw)\n        res = Solution().productExceptSelf(nums)\n        print(json.dumps(res))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = JSON.parse(input);\n    console.log(JSON.stringify(productExceptSelf(nums)));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        int[] res = new Solution().productExceptSelf(nums);\n        System.out.println(Arrays.toString(res).replace(" ", ""));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    Solution sol;\n    vector<int> res = sol.productExceptSelf(nums);\n    cout << "[";\n    for (size_t i = 0; i < res.size(); i++) cout << res[i] << (i + 1 < res.size() ? ", " : "");\n    cout << "]" << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'Cell 1: 2*3*4=24, Cell 2: 1*3*4=12, Cell 3: 1*2*4=8, Cell 4: 1*2*3=6.' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]', explanation: 'Cell with 0 produces product 9 for its position.' }
    ],
    visibleTestcases: [
      { input: '[1, 2, 3, 4]', expectedOutput: '[24, 12, 8, 6]' },
      { input: '[-1, 1, 0, -3, 3]', expectedOutput: '[0, 0, 9, 0, 0]' }
    ],
    hiddenTestcases: [
      { input: '[2, 3]', expectedOutput: '[3, 2]' },
      { input: '[1, 1, 1, 1]', expectedOutput: '[1, 1, 1, 1]' }
    ]
  },

  // 7. Longest Consecutive Sequence (Kunal)
  {
    title: 'Longest Consecutive Sequence',
    slug: 'longest-consecutive-sequence',
    difficulty: 'Medium',
    description: `**Kunal** is logging daily training streaks for all athletes in the academy. The training day timestamps are scrambled in an unsorted array \`nums\`.

Kunal wants to find the **length of the longest unbroken consecutive sequence** of days present in the array.

Can you help Kunal solve this in **O(n)** linear time?

---

### Input Format
* An array of integers \`nums\`.

### Output Format
* Return an integer representing the length of the longest consecutive sequence.`,
    constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    tags: ['Array', 'Hash Table', 'Union Find', 'Blind 75'],
    hints: [
      'Insert all numbers into a HashSet in O(n).',
      'For each number x, only start counting if (x - 1) is NOT in the set! This ensures each sequence is only traversed once in O(n) total time.'
    ],
    editorial: `### 💡 Intuition & Approach
We need to find the longest sequence of numbers that can be arranged consecutively without gaps (e.g. $[1, 2, 3, 4]$).

#### Hash Set Sequence Starting Points (O(N) Optimal)
1. Insert all numbers from \`nums\` into a Hash Set for $O(1)$ presence check.
2. A number \`x\` is the **start of a sequence** if and only if \`x - 1\` is NOT in the set.
3. For each start number \`x\`, increment \`curr = x + 1\` repeatedly while \`curr\` exists in the set, tracking the streak length.
4. Because each number is only visited as part of at most one consecutive expansion, every number is visited $O(1)$ times!

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Linear scan with constant set lookups.
* **Space Complexity:** $O(N)$ — To store the hash set.`,
    starterCode: {
      python: `class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int longestConsecutive(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        num_set = set(nums)\n        longest = 0\n        for num in num_set:\n            if num - 1 not in num_set:\n                curr = num\n                streak = 1\n                while curr + 1 in num_set:\n                    curr += 1\n                    streak += 1\n                longest = max(longest, streak)\n        return longest\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int longestConsecutive(int[] nums) {\n        Set<Integer> set = new HashSet<>();\n        for (int n : nums) set.add(n);\n        int longest = 0;\n        for (int num : set) {\n            if (!set.contains(num - 1)) {\n                int curr = num;\n                int streak = 1;\n                while (set.contains(curr + 1)) {\n                    curr++;\n                    streak++;\n                }\n                longest = Math.max(longest, streak);\n            }\n        }\n        return longest;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <unordered_set>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        unordered_set<int> set(nums.begin(), nums.end());\n        int longest = 0;\n        for (int num : set) {\n            if (!set.count(num - 1)) {\n                int curr = num;\n                int streak = 1;\n                while (set.count(curr + 1)) {\n                    curr++;\n                    streak++;\n                }\n                longest = max(longest, streak);\n            }\n        }\n        return longest;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar longestConsecutive = function(nums) {\n    const set = new Set(nums);\n    let longest = 0;\n    for (const num of set) {\n        if (!set.has(num - 1)) {\n            let curr = num;\n            let streak = 1;\n            while (set.has(curr + 1)) {\n                curr++;\n                streak++;\n            }\n            longest = Math.max(longest, streak);\n        }\n    }\n    return longest;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        nums = json.loads(raw)\n        print(Solution().longestConsecutive(nums))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = JSON.parse(input);\n    console.log(longestConsecutive(nums));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = line.isEmpty() ? new int[0] : Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        System.out.println(new Solution().longestConsecutive(nums));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    Solution sol;\n    cout << sol.longestConsecutive(nums) << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'Longest streak is [1, 2, 3, 4] with length 4.' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9', explanation: 'Longest streak is [0, 1, 2, 3, 4, 5, 6, 7, 8] with length 9.' }
    ],
    visibleTestcases: [
      { input: '[100, 4, 200, 1, 3, 2]', expectedOutput: '4' },
      { input: '[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]', expectedOutput: '9' }
    ],
    hiddenTestcases: [
      { input: '[]', expectedOutput: '0' },
      { input: '[1, 2, 0, 1]', expectedOutput: '3' }
    ]
  },

  // 8. Majority Element (Lakshya)
  {
    title: 'Majority Element',
    slug: 'majority-element',
    difficulty: 'Easy',
    description: `**Lakshya** is overseeing the annual election of the TrackAsap Council! 

Each member cast a vote recorded as an integer candidate ID in array \`nums\`. An official winner is guaranteed to have won the **majority**, meaning they received strictly more than \`⌊n / 2⌋\` votes.

Help Lakshya determine the victorious candidate ID in linear time and O(1) space!

---

### Input Format
* An array of integers \`nums\` of size \`n\`.

### Output Format
* Return the majority integer element.`,
    constraints: ['n == nums.length', '1 <= n <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9'],
    tags: ['Array', 'Hash Table', 'Divide and Conquer', 'Boyer-Moore Voting'],
    hints: [
      'Could you solve it in linear time and in O(1) space?',
      'Look into Boyer-Moore Voting Algorithm.'
    ],
    editorial: `### 💡 Intuition & Approach
The majority element appears $> \\lfloor N / 2 \\rfloor$ times.

#### Boyer-Moore Voting Algorithm (O(1) Space Optimal)
1. Maintain two variables: \`candidate\` and \`count = 0\`.
2. Iterate through each number:
   * If \`count == 0\`, set \`candidate = num\`.
   * If \`num == candidate\`, increment \`count += 1\`.
   * Otherwise, decrement \`count -= 1\`.
3. Because the majority element appears more than all other elements combined, it is guaranteed to survive as the final candidate!

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(N)$ — Single pass through the array.
* **Space Complexity:** $O(1)$ — Only two scalar variables used.`,
    starterCode: {
      python: `class Solution:\n    def majorityElement(self, nums: list[int]) -> int:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int majorityElement(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def majorityElement(self, nums: list[int]) -> int:\n        candidate = None\n        count = 0\n        for num in nums:\n            if count == 0:\n                candidate = num\n            count += (1 if num == candidate else -1)\n        return candidate\n`,
      java: `class Solution {\n    public int majorityElement(int[] nums) {\n        int candidate = nums[0];\n        int count = 0;\n        for (int num : nums) {\n            if (count == 0) candidate = num;\n            count += (num == candidate) ? 1 : -1;\n        }\n        return candidate;\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        int candidate = nums[0];\n        int count = 0;\n        for (int num : nums) {\n            if (count == 0) candidate = num;\n            count += (num == candidate) ? 1 : -1;\n        }\n        return candidate;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    let candidate = nums[0];\n    let count = 0;\n    for (const num of nums) {\n        if (count === 0) candidate = num;\n        count += (num === candidate) ? 1 : -1;\n    }\n    return candidate;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        nums = json.loads(raw)\n        print(Solution().majorityElement(nums))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = JSON.parse(input);\n    console.log(majorityElement(nums));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        System.out.println(new Solution().majorityElement(nums));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    Solution sol;\n    cout << sol.majorityElement(nums) << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [3,2,3]', output: '3', explanation: 'Candidate 3 received 2 out of 3 votes.' },
      { input: 'nums = [2,2,1,1,1,2,2]', output: '2', explanation: 'Candidate 2 received 4 out of 7 votes.' }
    ],
    visibleTestcases: [
      { input: '[3, 2, 3]', expectedOutput: '3' },
      { input: '[2, 2, 1, 1, 1, 2, 2]', expectedOutput: '2' }
    ],
    hiddenTestcases: [
      { input: '[1]', expectedOutput: '1' },
      { input: '[6, 5, 5]', expectedOutput: '5' }
    ]
  },

  // 9. Pascal's Triangle (Anas)
  {
    title: "Pascal's Triangle",
    slug: 'pascals-triangle',
    difficulty: 'Easy',
    description: `**Anas** is constructing a mystical energy pyramid with \`numRows\` tiers.

According to ancient architectural lore:
* The apex tier contains a single power stone with value \`1\`.
* Every subsequent tier begins and ends with \`1\`.
* Each interior stone's power is equal to the **sum of the two stones resting directly above it**.

Help Anas generate the complete power grid for the pyramid!

---

### Input Format
* An integer \`numRows\`.

### Output Format
* Return the first \`numRows\` of Pascal's triangle as a 2D array of integers.`,
    constraints: ['1 <= numRows <= 30'],
    tags: ['Array', 'Dynamic Programming', 'Math'],
    hints: [
      'Each row starts and ends with 1.',
      'Row[i][j] = Row[i-1][j-1] + Row[i-1][j].'
    ],
    editorial: `### 💡 Intuition & Approach
In Pascal's Triangle:
* The first and last elements of each row $i$ are always \`1\`.
* Any interior element at column $j$ is calculated as:
$$\\text{triangle}[i][j] = \\text{triangle}[i - 1][j - 1] + \\text{triangle}[i - 1][j]$$

#### Iterative Construction
1. Create an empty list of rows \`triangle\`.
2. For row index $i$ from $0$ up to $\\text{numRows} - 1$:
   * Create a row array of length $i + 1$ initialized with \`1\`.
   * For column $j$ from $1$ up to $i - 1$:
     * Set \`row[j] = triangle[i-1][j-1] + triangle[i-1][j]\`.
   * Append \`row\` to \`triangle\`.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $O(\\text{numRows}^2)$ — The total number of elements generated is $1 + 2 + \\dots + \\text{numRows} = \\frac{\\text{numRows}(\\text{numRows} + 1)}{2}$.
* **Space Complexity:** $O(1)$ — Auxiliary space (ignoring the returned 2D array).`,
    starterCode: {
      python: `class Solution:\n    def generate(self, numRows: int) -> list[list[int]]:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number} numRows\n * @return {number[][]}\n */\nvar generate = function(numRows) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> generate(int numRows) {\n        // Write your code here\n        return new ArrayList<>();\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> generate(int numRows) {\n        // Write your code here\n        return {};\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def generate(self, numRows: int) -> list[list[int]]:\n        triangle = []\n        for i in range(numRows):\n            row = [1] * (i + 1)\n            for j in range(1, i):\n                row[j] = triangle[i - 1][j - 1] + triangle[i - 1][j]\n            triangle.append(row)\n        return triangle\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> generate(int numRows) {\n        List<List<Integer>> triangle = new ArrayList<>();\n        for (int i = 0; i < numRows; i++) {\n            List<Integer> row = new ArrayList<>();\n            for (int j = 0; j <= i; j++) {\n                if (j == 0 || j == i) {\n                    row.add(1);\n                } else {\n                    row.add(triangle.get(i - 1).get(j - 1) + triangle.get(i - 1).get(j));\n                }\n            }\n            triangle.add(row);\n        }\n        return triangle;\n    }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> generate(int numRows) {\n        vector<vector<int>> triangle;\n        for (int i = 0; i < numRows; i++) {\n            vector<int> row(i + 1, 1);\n            for (int j = 1; j < i; j++) {\n                row[j] = triangle[i - 1][j - 1] + triangle[i - 1][j];\n            }\n            triangle.push_back(row);\n        }\n        return triangle;\n    }\n};\n`,
      javascript: `/**\n * @param {number} numRows\n * @return {number[][]}\n */\nvar generate = function(numRows) {\n    const triangle = [];\n    for (let i = 0; i < numRows; i++) {\n        const row = new Array(i + 1).fill(1);\n        for (let j = 1; j < i; j++) {\n            row[j] = triangle[i - 1][j - 1] + triangle[i - 1][j];\n        }\n        triangle.push(row);\n    }\n    return triangle;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        n = int(raw)\n        print(json.dumps(Solution().generate(n)))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    console.log(JSON.stringify(generate(parseInt(input, 10))));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        System.out.println(new Solution().generate(n).toString().replace(" ", ""));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int numRows; if (!(cin >> numRows)) return 0;\n    Solution sol;\n    vector<vector<int>> res = sol.generate(numRows);\n    cout << "[";\n    for (size_t i = 0; i < res.size(); i++) {\n        cout << "[";\n        for (size_t j = 0; j < res[i].size(); j++) cout << res[i][j] << (j + 1 < res[i].size() ? ", " : "");\n        cout << "]" << (i + 1 < res.size() ? ", " : "");\n    }\n    cout << "]" << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'numRows = 5', output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]', explanation: 'Anas 5-tier pyramid grid.' },
      { input: 'numRows = 1', output: '[[1]]', explanation: 'Single apex stone.' }
    ],
    visibleTestcases: [
      { input: '5', expectedOutput: '[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]' },
      { input: '1', expectedOutput: '[[1]]' }
    ],
    hiddenTestcases: [
      { input: '2', expectedOutput: '[[1], [1, 1]]' },
      { input: '3', expectedOutput: '[[1], [1, 1], [1, 2, 1]]' }
    ]
  },

  // 10. First Missing Positive (BOSS LEVEL - Grand Archmage Raj)
  {
    title: 'First Missing Positive',
    slug: 'first-missing-positive',
    difficulty: 'Hard',
    description: `**Raj, the Grand Archmage of Arrays Kingdom**, guards the Sacred Gate of Positive Integers.

A malicious hacker infiltrated the kingdom's vault and scattered the numbered keys \`nums\` in arbitrary order, some even corrupted into negative numbers!

To re-seal the fortress, Raj must identify the **smallest positive key integer (starting from 1)** that is missing from the scattered array.

Because the castle's RAM shields are failing, Raj must solve this in **O(n) time and O(1) auxiliary space**!

---

### Input Format
* An unsorted array of integers \`nums\`.

### Output Format
* Return the smallest missing positive integer.`,
    constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
    tags: ['Array', 'Hash Table', 'Cyclic Sort', 'Boss Level', 'Blind 75'],
    hints: [
      'Think about placing each number x at index (x - 1) if 1 <= x <= n.',
      'After swapping elements into their correct positions, the first index i where nums[i] != i + 1 is your answer!'
    ],
    editorial: `### 💡 Intuition & Approach
We have an array of length $N$. The missing positive number **must** fall in the range $[1, N + 1]$.

#### Cyclic In-Place Placement ($O(N)$ Time & $O(1)$ Space)
We can use the array itself as a hash map by placing each number \`x\` (if $1 \\le x \\le N$) into its corresponding index \`x - 1\`:

1. **Phase 1: Rearrange Elements**
   * Loop $i$ from $0$ to $N - 1$:
   * While \`1 <= nums[i] <= N\` and \`nums[nums[i] - 1] != nums[i]\`:
     * Swap \`nums[i]\` with \`nums[nums[i] - 1]\`.

2. **Phase 2: Locate the Missing Positive**
   * Loop $i$ from $0$ to $N - 1$:
   * The first index $i$ where \`nums[i] != i + 1\` indicates that \`i + 1\` is the smallest missing positive integer!

3. **Phase 3: Fallback**
   * If all indices $0$ to $N - 1$ contain numbers $1$ to $N$, return $N + 1$.

#### ⏱️ Complexity Analysis
* **Time Complexity:** $\\mathcal{O}(N)$ — Each element is swapped into its correct place at most once.
* **Space Complexity:** $\\mathcal{O}(1)$ — In-place modifications without allocating extra data structures.`,
    starterCode: {
      python: `class Solution:\n    def firstMissingPositive(self, nums: list[int]) -> int:\n        # Write your code here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstMissingPositive = function(nums) {\n    // Write your code here\n};\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int firstMissingPositive(int[] nums) {\n        // Write your code here\n        return 1;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int firstMissingPositive(vector<int>& nums) {\n        // Write your code here\n        return 1;\n    }\n};\n`
    },
    solutions: {
      python: `class Solution:\n    def firstMissingPositive(self, nums: list[int]) -> int:\n        n = len(nums)\n        for i in range(n):\n            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:\n                correct_idx = nums[i] - 1\n                nums[i], nums[correct_idx] = nums[correct_idx], nums[i]\n        for i in range(n):\n            if nums[i] != i + 1:\n                return i + 1\n        return n + 1\n`,
      java: `class Solution {\n    public int firstMissingPositive(int[] nums) {\n        int n = nums.length;\n        for (int i = 0; i < n; i++) {\n            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {\n                int temp = nums[nums[i] - 1];\n                nums[nums[i] - 1] = nums[i];\n                nums[i] = temp;\n            }\n        }\n        for (int i = 0; i < n; i++) {\n            if (nums[i] != i + 1) return i + 1;\n        }\n        return n + 1;\n    }\n}\n`,
      cpp: `#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int firstMissingPositive(vector<int>& nums) {\n        int n = nums.size();\n        for (int i = 0; i < n; i++) {\n            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {\n                swap(nums[i], nums[nums[i] - 1]);\n            }\n        }\n        for (int i = 0; i < n; i++) {\n            if (nums[i] != i + 1) return i + 1;\n        }\n        return n + 1;\n    }\n};\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar firstMissingPositive = function(nums) {\n    const n = nums.length;\n    for (let i = 0; i < n; i++) {\n        while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {\n            const targetIdx = nums[i] - 1;\n            const temp = nums[targetIdx];\n            nums[targetIdx] = nums[i];\n            nums[i] = temp;\n        }\n    }\n    for (let i = 0; i < n; i++) {\n        if (nums[i] !== i + 1) return i + 1;\n    }\n    return n + 1;\n};\n`
    },
    driverCode: {
      python: `import sys, json\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        nums = json.loads(raw)\n        print(Solution().firstMissingPositive(nums))\n`,
      javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nif (input) {\n    const nums = JSON.parse(input);\n    console.log(firstMissingPositive(nums));\n}\n`,
      java: `public class Main {\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String line = sc.nextLine().replace("[", "").replace("]", "").trim();\n        int[] nums = line.isEmpty() ? new int[0] : Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();\n        System.out.println(new Solution().firstMissingPositive(nums));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\nint main() {\n    string line; if (!getline(cin, line)) return 0;\n    vector<int> nums;\n    stringstream ss(line); char ch; int val;\n    while (ss >> ch) { if (isdigit(ch) || ch == '-') { ss.putback(ch); if (ss >> val) nums.push_back(val); } }\n    Solution sol;\n    cout << sol.firstMissingPositive(nums) << endl;\n    return 0;\n}\n`
    },
    examples: [
      { input: 'nums = [1,2,0]', output: '3', explanation: 'Raj finds 1 and 2 present. The smallest missing positive is 3.' },
      { input: 'nums = [3,4,-1,1]', output: '2', explanation: 'Raj finds 1, but 2 is missing.' },
      { input: 'nums = [7,8,9,11,12]', output: '1', explanation: 'Key 1 is completely absent.' }
    ],
    visibleTestcases: [
      { input: '[1, 2, 0]', expectedOutput: '3' },
      { input: '[3, 4, -1, 1]', expectedOutput: '2' },
      { input: '[7, 8, 9, 11, 12]', expectedOutput: '1' }
    ],
    hiddenTestcases: [
      { input: '[1]', expectedOutput: '2' },
      { input: '[2]', expectedOutput: '1' },
      { input: '[1, 2, 3, 4, 5]', expectedOutput: '6' }
    ]
  }
];

const seedArraysKingdom = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for Arrays Kingdom seeding...');

    let rajUser = await User.findOne({ email: /rajguptaaesthetic/i });
    if (!rajUser) {
      rajUser = await User.findOne({ role: 'admin' }) || await User.findOne();
    }
    if (rajUser) {
      rajUser.name = 'Raj';
      await rajUser.save();
    }
    console.log(`Setting Problem Setter Author: ${rajUser?.name || 'Raj'} (${rajUser?._id})`);

    const createdProblemsMap = {};

    for (let i = 0; i < ARRAY_PROBLEMS.length; i++) {
      const p = ARRAY_PROBLEMS[i];
      const payload = {
        ...p,
        author: rajUser?._id,
        status: 'published',
        timeLimitMs: 1500,
        memoryLimitMb: 256,
        acceptanceRate: 100,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
      };

      const saved = await JudgeProblem.findOneAndUpdate(
        { slug: p.slug },
        { $set: payload },
        { upsert: true, new: true }
      );
      createdProblemsMap[p.slug] = saved;
      console.log(`✔ [${i + 1}/${ARRAY_PROBLEMS.length}] Seeded: "${saved.title}" (slug: ${saved.slug})`);
    }

    const world = await RoadmapWorld.findOne({ id: 'arrays' });
    if (world && world.problems) {
      let linkedCount = 0;
      for (const row of world.problems) {
        const match = Object.values(createdProblemsMap).find(
          cp => cp.title.toLowerCase() === row.title.toLowerCase()
        );
        if (match) {
          row.judgeSlug = match.slug;
          row.judgeProblem = match._id;
          row.url = `/solve/${match.slug}`;
          linkedCount++;
        }
      }

      if (world.bossLevel?.problems?.length > 0 && createdProblemsMap['first-missing-positive']) {
        const bossMatch = createdProblemsMap['first-missing-positive'];
        world.bossLevel.problems[0].judgeSlug = bossMatch.slug;
        world.bossLevel.problems[0].judgeProblem = bossMatch._id;
        world.bossLevel.problems[0].url = `/solve/${bossMatch.slug}`;
        linkedCount++;
      }

      await world.save();
      console.log(`\n🎉 Successfully auto-linked ${linkedCount} problems in "Arrays Kingdom" in Cosmos DB!`);
    }

    console.log('\n🚀 ALL DONE! Arrays Kingdom has full editorials & solutions in all 4 languages with Author: Raj!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Arrays Kingdom Error:', err);
    process.exit(1);
  }
};

seedArraysKingdom();
