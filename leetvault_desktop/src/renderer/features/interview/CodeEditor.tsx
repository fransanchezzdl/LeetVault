import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Editor, { type OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { InterviewLanguage } from '@shared/types/interview';

// Hand the locally bundled Monaco instance to @monaco-editor/react so it
// never tries to fetch the editor from a CDN at runtime — that fetch fails
// inside Electron's renderer (no internet permission for jsdelivr) and the
// loading spinner spins forever.
loader.config({ monaco });

// Disable web workers — Electron's renderer struggles to spin up Monaco's
// language workers from a bundled URL, and we don't need full LSP for a
// coding-interview pad. The fallback main-thread tokenizer is enough.
if (typeof window !== 'undefined') {
  (window as unknown as { MonacoEnvironment?: { getWorker: () => Worker } })
    .MonacoEnvironment = {
    getWorker: (): Worker => {
      const blob = new Blob([''], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    },
  };
}

const MONACO_LANG: Record<InterviewLanguage, string> = {
  python: 'python',
  typescript: 'typescript',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
};

const THEME_NAME = 'leetvault-dark';

interface Props {
  language: InterviewLanguage;
  value: string;
  onChange: (next: string) => void;
  onReady?: () => void;
}

export function CodeEditor({ language, value, onChange, onReady }: Props): JSX.Element {
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const handleMount: OnMount = (_editor, monacoInstance) => {
    monacoInstance.editor.defineTheme(THEME_NAME, {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1A120D',
        'editor.foreground': '#F7EEE4',
        'editorLineNumber.foreground': '#6B5443',
        'editorLineNumber.activeForeground': '#FFA116',
        'editorCursor.foreground': '#FFA116',
        'editor.selectionBackground': '#FFA11633',
        'editor.lineHighlightBackground': '#22150F',
        'editorIndentGuide.background': '#2A1B12',
        'editorIndentGuide.activeBackground': '#382414',
      },
    });
    monacoInstance.editor.setTheme(THEME_NAME);
    onReadyRef.current?.();
  };

  return (
    <Editor
      height="100%"
      width="100%"
      language={MONACO_LANG[language]}
      value={value}
      onChange={(v) => onChangeRef.current(v ?? '')}
      onMount={handleMount}
      theme={THEME_NAME}
      loading={<EditorLoading />}
      options={{
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Code', 'Source Code Pro', monospace",
        fontSize: 13,
        lineHeight: 20,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        renderLineHighlight: 'line',
        tabSize: 2,
        automaticLayout: true,
        wordWrap: 'off',
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}

function EditorLoading(): JSX.Element {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#1A120D]">
      <div className="flex flex-col items-center gap-3 text-fg/[0.68]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        <span className="text-xs uppercase tracking-wide">Loading editor…</span>
      </div>
    </div>
  );
}
