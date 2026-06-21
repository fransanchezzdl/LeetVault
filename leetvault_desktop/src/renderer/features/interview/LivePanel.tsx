import { useCallback, useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useQueryClient } from '@tanstack/react-query';
import { ChatPanel } from './ChatPanel';
import { CodeEditor } from './CodeEditor';
import { HeaderBar } from './HeaderBar';
import { useInterview } from './store';
import { useInterviewStreamSubscription, useInterviewTimer } from './hooks';

export function LivePanel(): JSX.Element {
  useInterviewStreamSubscription();

  const sessionId = useInterview((s) => s.sessionId);
  const code = useInterview((s) => s.code);
  const language = useInterview((s) => s.language);
  const setCode = useInterview((s) => s.setCode);
  const startedAt = useInterview((s) => s.startedAt);
  const setFinishing = useInterview((s) => s.setFinishing);
  const finishToEvaluation = useInterview((s) => s.finishToEvaluation);
  const resetToSetup = useInterview((s) => s.resetToSetup);
  const setStreamError = useInterview((s) => s.setStreamError);
  const markEditorReady = useInterview((s) => s.markEditorReady);

  const queryClient = useQueryClient();
  const [finishError, setFinishError] = useState<string | null>(null);

  const runFinish = useCallback(async (): Promise<void> => {
    if (!sessionId || !startedAt) return;
    setFinishError(null);
    setFinishing(true);
    try {
      const durationSec = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      const res = await window.lv.interview.finish({
        sessionId,
        finalCode: code,
        language,
        durationSec,
      });
      if (!res) {
        setFinishError('Session not found.');
        setFinishing(false);
        return;
      }
      finishToEvaluation({
        evaluation: res.evaluation,
        evaluationRaw: res.evaluationRaw,
        problemFull: res.problemFull,
      });
      void queryClient.invalidateQueries({ queryKey: ['stats', 'interview'] });
    } catch (e) {
      setFinishError(e instanceof Error ? e.message : 'Failed to finish');
      setFinishing(false);
    }
  }, [
    sessionId,
    startedAt,
    code,
    language,
    setFinishing,
    finishToEvaluation,
    queryClient,
  ]);

  useInterviewTimer(runFinish);

  const handleAbort = useCallback((): void => {
    if (sessionId) void window.lv.interview.abort(sessionId);
    resetToSetup();
  }, [sessionId, resetToSetup]);

  // Clear stale stream errors when sessionId changes.
  useEffect(() => {
    setStreamError(null);
  }, [sessionId, setStreamError]);

  return (
    <div className="flex h-full flex-col">
      <HeaderBar onFinish={runFinish} onAbort={handleAbort} />
      {finishError ? (
        <div className="border-b border-diff-hard/40 bg-diff-hard/10 px-4 py-2 text-xs text-diff-hard">
          {finishError}
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <Group orientation="horizontal" className="h-full w-full">
          <Panel defaultSize={42} minSize={25} className="min-w-0">
            <div className="h-full border-r border-glass-stroke/40 bg-bg-300/40">
              <ChatPanel />
            </div>
          </Panel>
          <Separator className="w-1 cursor-col-resize bg-glass-stroke/30 hover:bg-brand-500/50" />
          <Panel defaultSize={58} minSize={30} className="min-w-0">
            <div className="h-full bg-[#1A120D]">
              <CodeEditor
                language={language}
                value={code}
                onChange={setCode}
                onReady={markEditorReady}
              />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
