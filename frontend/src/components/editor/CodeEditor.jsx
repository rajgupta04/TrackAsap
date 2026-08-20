import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import {
  getLanguageExtension,
  codeSyntaxLinter,
  THEME_MAP,
} from './editorConfig';

const CodeEditor = ({
  value,
  onChange,
  language = 'cpp',
  theme = 'tokyoNight',
  fontSize = 14,
  height = '100%',
  readOnly = false,
  placeholder = '// Start typing your code...',
}) => {
  const selectedTheme = THEME_MAP[theme]?.theme || THEME_MAP.tokyoNight.theme;

  const extensions = useMemo(() => {
    return [
      getLanguageExtension(language),
      autocompletion({ activateOnTyping: true }),
      linter(codeSyntaxLinter),
      EditorView.lineWrapping,
    ];
  }, [language]);

  return (
    <div
      className="h-full w-full overflow-hidden rounded-xl border border-white/10 bg-dark-900/60 shadow-inner"
      style={{ fontSize: `${fontSize}px` }}
    >
      <CodeMirror
        value={value}
        height={height}
        theme={selectedTheme}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        className="h-full font-mono"
      />
    </div>
  );
};

export default CodeEditor;
