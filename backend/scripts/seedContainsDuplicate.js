import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import JudgeProblem from '../src/models/JudgeProblem.model.js';
import User from '../src/models/User.model.js';
import RoadmapWorld from '../src/models/RoadmapWorld.model.js';

const seedProblem = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected...');

    // Find admin user or first user
    let user = await User.findOne({ role: 'admin' });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      console.error('No user found in database.');
      process.exit(1);
    }

    console.log(`Using Author: ${user.name} (${user.email})`);

    const problemData = {
      title: 'Contains Duplicate',
      slug: 'contains-duplicate',
      difficulty: 'Easy',
      description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.

An array contains a duplicate if there exists at least one pair of indices \`i\` and \`j\` such that \`i != j\` and \`nums[i] == nums[j]\`.`,
      constraints: [
        '1 <= nums.length <= 10^5',
        '-10^9 <= nums[i] <= 10^9'
      ],
      tags: ['Array', 'Hash Table', 'Sorting', 'Blind 75'],
      hints: [
        'A brute force approach would check all pairs in O(n^2).',
        'Can we sort the array first in O(n log n)?',
        'Can we use a hash set to achieve O(n) time and O(n) space?'
      ],
      starterCode: {
        python: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        # Write your code here
        pass
`,
        javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {
    // Write your code here
};
`,
        java: `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Write your code here
        return false;
    }
}
`,
        cpp: `#include <vector>
#include <unordered_set>
using namespace std;

class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        // Write your code here
        return false;
    }
};
`,
      },
      driverCode: {
        python: `import sys, json

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        data = json.loads(raw)
        sol = Solution()
        res = sol.containsDuplicate(data)
        print("true" if res else "false")
`,
        javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const nums = JSON.parse(input);
    const res = containsDuplicate(nums);
    console.log(res ? "true" : "false");
}
`,
        java: `public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().trim();
        line = line.replace("[", "").replace("]", "").trim();
        int[] nums = line.isEmpty() ? new int[0] : Arrays.stream(line.split(",")).map(String::trim).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();
        Solution sol = new Solution();
        boolean res = sol.containsDuplicate(nums);
        System.out.println(res ? "true" : "false");
    }
}
`,
        cpp: `#include <iostream>
#include <sstream>

int main() {
    string line;
    if (!getline(cin, line)) return 0;
    vector<int> nums;
    stringstream ss(line);
    char ch;
    int val;
    while (ss >> ch) {
        if (isdigit(ch) || ch == '-') {
            ss.putback(ch);
            if (ss >> val) nums.push_back(val);
        }
    }
    Solution sol;
    bool res = sol.containsDuplicate(nums);
    cout << (res ? "true" : "false") << endl;
    return 0;
}
`,
      },
      examples: [
        {
          input: '[1, 2, 3, 1]',
          output: 'true',
          explanation: 'The number 1 occurs at indices 0 and 3.'
        },
        {
          input: '[1, 2, 3, 4]',
          output: 'false',
          explanation: 'All elements are distinct.'
        }
      ],
      visibleTestcases: [
        {
          input: '[1, 2, 3, 1]',
          expectedOutput: 'true'
        },
        {
          input: '[1, 2, 3, 4]',
          expectedOutput: 'false'
        }
      ],
      hiddenTestcases: [
        {
          input: '[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]',
          expectedOutput: 'true'
        },
        {
          input: '[42]',
          expectedOutput: 'false'
        },
        {
          input: '[-1, -2, -3, -1]',
          expectedOutput: 'true'
        }
      ],
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      author: user._id,
      status: 'published',
      acceptanceRate: 100,
      totalSubmissions: 0,
      acceptedSubmissions: 0,
    };

    const savedProblem = await JudgeProblem.findOneAndUpdate(
      { slug: 'contains-duplicate' },
      { $set: problemData },
      { upsert: true, new: true }
    );

    console.log(`\n✔ Successfully created & published "${savedProblem.title}" (slug: ${savedProblem.slug}, id: ${savedProblem._id})`);

    // Also update Arrays Kingdom in Cosmos DB to link this problem directly!
    const world = await RoadmapWorld.findOne({ id: 'arrays' });
    if (world && world.problems?.length > 0) {
      const pIndex = world.problems.findIndex(p => p.title.toLowerCase().includes('contains duplicate') || p.id === 'arr-1');
      if (pIndex !== -1) {
        world.problems[pIndex].judgeSlug = 'contains-duplicate';
        world.problems[pIndex].judgeProblem = savedProblem._id;
        world.problems[pIndex].url = `/solve/contains-duplicate`;
        await world.save();
        console.log(`✔ Auto-linked Level #${pIndex + 1} (${world.problems[pIndex].title}) in "${world.name}" to /solve/contains-duplicate!`);
      }
    }

    console.log('\n🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating problem:', error);
    process.exit(1);
  }
};

seedProblem();
