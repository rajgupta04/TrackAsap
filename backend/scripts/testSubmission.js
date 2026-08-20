import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import connectDB from '../src/config/db.js';
import User from '../src/models/User.model.js';
import JudgeProblem from '../src/models/JudgeProblem.model.js';
import { submitCode } from '../src/controllers/judge.controller.js';

const run = async () => {
  await connectDB();
  const user = await User.findOne();
  const problem = await JudgeProblem.findOne({ slug: 'contains-duplicate' }).select('+hiddenTestcases');

  // Test: Clean LeetCode style (function only)
  const cleanCode = `import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int x : nums) {
            if (!set.add(x)) return true;
        }
        return false;
    }
}`;

  const req = {
    user,
    body: {
      problemId: problem._id,
      code: cleanCode,
      language: 'java'
    }
  };

  const res = {
    status: (s) => ({ json: (d) => console.log('Status:', s, d) }),
    json: (d) => console.log('Submission Output:', d)
  };

  await submitCode(req, res);
  process.exit(0);
};

run();
