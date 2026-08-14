---
name: 📝 Problem Content
about: Write problem description and/or test cases for a DSA question
title: '[CONTENT] Problem: '
labels: 'content needed, good first issue'
assignees: ''
---

## 📝 Problem Info

- **Problem ID:** (e.g. `arr-1`, `2p-3`, `bs-4`)
- **Problem Title:** (e.g. Two Sum)
- **LeetCode URL:** (e.g. https://leetcode.com/problems/two-sum/)
- **Difficulty:** Easy / Medium / Hard
- **Topics/Tags:** (e.g. Array, Hash Map)

---

## ✍️ What I'm Contributing (check all that apply)

- [ ] Problem Description (statement, constraints, examples)
- [ ] Test Cases (input/output pairs)
- [ ] Solution Explanation (approach, time/space complexity)
- [ ] Diagram / Visual Explanation

---

## 📄 Problem Description
<!-- Write a clean, original problem statement. Do NOT copy from LeetCode verbatim. -->

### Statement
<!-- The problem statement in your own words -->

### Constraints
```
- 1 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
```

### Examples
```
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
```

---

## 🧪 Test Cases

| # | Input | Expected Output | Type |
|---|---|---|---|
| 1 | `nums = [2,7,11,15], target = 9` | `[0,1]` | Basic |
| 2 | `nums = [3,3], target = 6` | `[0,1]` | Edge (duplicates) |
| 3 | `nums = [1], target = 1` | `[]` | Edge (single element) |
| 4 | (large input, ~10^4 elements) | (expected output) | Stress |

---

## 💡 Solution Approach (Optional)
<!-- Brief explanation of the optimal approach -->

**Approach:** Hash Map
**Time Complexity:** O(n)
**Space Complexity:** O(n)

---

## 📝 Checklist
- [ ] Problem description is in my own words (not copied from LC)
- [ ] At least 3-5 test cases including edge cases
- [ ] At least 1 stress/large test case
- [ ] Constraints are specified
- [ ] Examples have clear explanations
