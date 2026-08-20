import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark } from '@uiw/codemirror-theme-github';
import { nord } from '@uiw/codemirror-theme-nord';
import jsBeautify from 'js-beautify';

export const LANG_OPTIONS = [
  { value: 'cpp', label: 'C++', color: '#00599C', filename: 'main.cpp' },
  { value: 'python', label: 'Python 3', color: '#3B82F6', filename: 'solution.py' },
  { value: 'java', label: 'Java', color: '#f97316', filename: 'Main.java' },
  { value: 'javascript', label: 'JavaScript', color: '#EAB308', filename: 'index.js' },
  { value: 'c', label: 'C', color: '#5C6BC0', filename: 'main.c' },
];

export const THEME_OPTIONS = [
  { value: 'tokyoNight', label: 'Tokyo Night', theme: tokyoNight },
  { value: 'dracula', label: 'Dracula', theme: dracula },
  { value: 'githubDark', label: 'GitHub Dark', theme: githubDark },
  { value: 'nord', label: 'Nord', theme: nord },
];

export const THEME_MAP = Object.fromEntries(THEME_OPTIONS.map((t) => [t.value, t]));

export const DEFAULT_TEMPLATES = {
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your code here
    return 0;
}`,
  python: `#!/usr/bin/env python3
import sys

def solve():
    # Read from standard input
    pass

if __name__ == "__main__":
    solve()`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
    }
}`,
  javascript: `const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    // Process input
});`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your code here
    return 0;
}`,
};

export const getLanguageExtension = (lang) => {
  switch (lang) {
    case 'cpp':
    case 'c':
      return cpp();
    case 'java':
      return java();
    case 'python':
      return python();
    case 'javascript':
      return javascript();
    case 'sql':
      return sql();
    default:
      return cpp();
  }
};

export const codeSyntaxLinter = (view) => {
  const diagnostics = [];
  const doc = view.state.doc.toString();
  const stack = [];
  const openPairs = { '{': '}', '(': ')', '[': ']' };
  const closePairs = { '}': '{', ')': '(', ']': '[' };

  for (let pos = 0; pos < doc.length; pos++) {
    const ch = doc[pos];
    if (openPairs[ch]) {
      stack.push({ ch, pos });
    } else if (closePairs[ch]) {
      if (stack.length === 0 || stack[stack.length - 1].ch !== closePairs[ch]) {
        diagnostics.push({
          from: pos,
          to: pos + 1,
          severity: 'error',
          message: `Unmatched '${ch}'`,
        });
      } else {
        stack.pop();
      }
    }
  }

  for (const unclosed of stack) {
    diagnostics.push({
      from: unclosed.pos,
      to: unclosed.pos + 1,
      severity: 'error',
      message: `Unclosed '${unclosed.ch}'`,
    });
  }
  return diagnostics;
};

export const formatCode = (code, lang) => {
  if (!code || !code.trim()) return code;
  try {
    if (lang === 'javascript' || lang === 'python') {
      return jsBeautify.js(code, { indent_size: 4, space_in_empty_paren: false });
    }
    const lines = code.split('\n');
    let indentLevel = 0;
    const formattedLines = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        continue;
      }
      if (trimmed.startsWith('}') || trimmed.startsWith(')') || trimmed.startsWith(']')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      formattedLines.push('    '.repeat(indentLevel) + trimmed);
      const openCount = (trimmed.match(/[{(\[]/g) || []).length;
      const closeCount = (trimmed.match(/[})\]]/g) || []).length;
      indentLevel = Math.max(0, indentLevel + openCount - closeCount);
    }
    return formattedLines.join('\n');
  } catch {
    return code;
  }
};
