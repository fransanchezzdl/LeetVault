import { useEffect, useMemo, useState } from 'react';
import * as monaco from 'monaco-editor';

// Same palette as the interview CodeEditor so colorized snippets match.
monaco.editor.defineTheme('leetvault-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1A120D',
    'editor.foreground': '#F7EEE4',
  },
});
monaco.editor.setTheme('leetvault-dark');

const LANG_PATTERNS: [string, RegExp][] = [
  ['python', /^\s*(def |class \w+[:(]|from \w+ import |import \w+$)|self\./m],
  ['go', /^(package |func )|:=/m],
  ['rust', /\bfn \w+\s*\(|let mut |impl |&mut /],
  ['java', /public\s+(final\s+)?class|System\.out|@Override/],
  ['cpp', /#include\s*[<"]|std::|\bcout\b/],
  ['typescript', /:\s*(number|string|boolean|void)\b|interface \w+/],
  ['javascript', /\b(function|const|let|var)\b|=>/],
];

export const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  cpp: 'C++',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
};

export function detectLanguage(code: string): string {
  for (const [lang, pattern] of LANG_PATTERNS) {
    if (pattern.test(code)) return lang;
  }
  return 'plaintext';
}

export function HighlightedCode({ code }: { code: string }): JSX.Element {
  const language = useMemo(() => detectLanguage(code), [code]);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    void monaco.editor
      .colorize(code, language, { tabSize: 4 })
      .then((h) => {
        if (!cancelled) setHtml(h);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <pre className="overflow-x-auto rounded-md border border-glass-stroke/10 bg-[#1A120D] p-3 font-mono text-xs leading-5 text-fgSoft scroll-thin">
      {html ? (
        <code dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code>{code}</code>
      )}
    </pre>
  );
}
