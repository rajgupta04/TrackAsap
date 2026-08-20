import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import JudgeProblem from '../src/models/JudgeProblem.model.js';
import { executeCode } from '../src/services/judgeEngine.js';

dotenv.config();

const normalizeOutput = (str = '') => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/,\s+/g, ',');
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') return input;
  if (typeof input === 'object') return JSON.stringify(input);
  return String(input);
};

const testAll = async () => {
  try {
    await connectDB();
    console.log('MongoDB Connected for full testbench audit...\n');

    const problems = await JudgeProblem.find().sort({ title: 1 });
    console.log(`Found ${problems.length} problems to test.\n`);

    const languages = ['python', 'javascript', 'java', 'cpp'];
    let totalTests = 0;
    let passedTests = 0;
    const failures = [];

    for (const prob of problems) {
      console.log(`🔍 Testing: "${prob.title}" (${prob.slug})`);

      for (const lang of languages) {
        const solutionCode = prob.solutions?.[lang];
        if (!solutionCode) {
          console.log(`   ❌ [${lang}] No official solution found!`);
          failures.push({ problem: prob.slug, lang, reason: 'No official solution' });
          continue;
        }

        const driver = prob.driverCode?.[lang] || '';
        let executableCode = driver ? `${solutionCode}\n\n${driver}` : solutionCode;

        if (lang === 'java' && !/^\s*import\s+java\.util/m.test(executableCode)) {
          executableCode = `import java.util.*;\nimport java.io.*;\n${executableCode}`;
        }
        if (lang === 'cpp' && !/using\s+namespace\s+std/m.test(executableCode)) {
          executableCode = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n#include <unordered_set>\nusing namespace std;\n${executableCode}`;
        }

        const allCases = [...(prob.visibleTestcases || []), ...(prob.hiddenTestcases || [])];
        if (allCases.length === 0) {
          console.log(`   ⚠️ [${lang}] No testcases defined!`);
          continue;
        }

        let langPassed = true;
        let failDetails = null;

        for (let i = 0; i < allCases.length; i++) {
          const tc = allCases[i];
          totalTests++;
          const res = await executeCode(executableCode, lang, sanitizeInput(tc.input), 4000);

          if (res.isError) {
            langPassed = false;
            failDetails = `Execution Error: ${res.stderr || res.compile_output}`;
            break;
          }

          const actual = normalizeOutput(res.stdout);
          const expected = normalizeOutput(tc.expectedOutput);

          if (actual !== expected) {
            langPassed = false;
            failDetails = `Mismatch at case #${i + 1}. Expected: "${expected}", Got: "${actual}". Raw stdout: "${res.stdout}"`;
            break;
          }
        }

        if (langPassed) {
          passedTests++;
          console.log(`   ✔ [${lang}] All ${allCases.length} cases PASSED!`);
        } else {
          console.log(`   ❌ [${lang}] FAILED: ${failDetails}`);
          failures.push({ problem: prob.slug, lang, reason: failDetails });
        }
      }
      console.log('');
    }

    console.log(`========================================`);
    console.log(`SUMMARY: ${passedTests} passed out of ${problems.length * languages.length} language testbenches.`);
    if (failures.length > 0) {
      console.log(`FAILURES (${failures.length}):`);
      failures.forEach(f => console.log(` - [${f.lang}] ${f.problem}: ${f.reason}`));
    } else {
      console.log(`🎉 ALL 10 PROBLEMS PASSED 100% ACROSS ALL 4 LANGUAGES!`);
    }
    console.log(`========================================`);

    process.exit(0);
  } catch (err) {
    console.error('Audit Error:', err);
    process.exit(1);
  }
};

testAll();
