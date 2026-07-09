import { useEffect } from 'react';
import { IpcChannels } from '@shared/ipc-channels';
import { useInterview } from './store';
import { speak, stopSpeaking } from './voice';

/**
 * Subscribes to interview streaming events and routes them into the store.
 * Mount once on the LivePanel (or anywhere that hosts the live UI).
 */
export function useInterviewStreamSubscription(): void {
  const appendAssistantDelta = useInterview((s) => s.appendAssistantDelta);
  const finalizeAssistant = useInterview((s) => s.finalizeAssistant);
  const setStreamError = useInterview((s) => s.setStreamError);
  const setSending = useInterview((s) => s.setSending);

  useEffect(() => {
    const offStream = window.lv.on(IpcChannels.Events.InterviewStream, (p) => {
      if (p.error) {
        setStreamError(p.error);
        setSending(false);
        return;
      }
      if (p.delta) appendAssistantDelta(p.delta);
      if (p.done) setSending(false);
    });
    const offMsg = window.lv.on(IpcChannels.Events.InterviewMessage, (p) => {
      finalizeAssistant(p.text);
      const state = useInterview.getState();
      if (state.ttsEnabled) {
        state.setTtsError(null);
        void speak(p.text, (msg) => useInterview.getState().setTtsError(msg));
      }
    });
    return () => {
      offStream();
      offMsg();
      stopSpeaking();
    };
  }, [appendAssistantDelta, finalizeAssistant, setStreamError, setSending]);
}

/**
 * Ticks the live timer every second when in live phase with a non-null timer.
 * Calls `onExpire` exactly once when remaining hits 0.
 */
export function useInterviewTimer(onExpire: () => void): void {
  const phase = useInterview((s) => s.phase);
  const remaining = useInterview((s) => s.timerRemainingSec);
  const setRemaining = useInterview((s) => s.setTimerRemaining);

  useEffect(() => {
    if (phase !== 'live' || remaining == null) return;
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const id = window.setInterval(() => {
      const cur = useInterview.getState().timerRemainingSec;
      if (cur == null) return;
      if (cur <= 1) {
        setRemaining(0);
        onExpire();
      } else {
        setRemaining(cur - 1);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, remaining, setRemaining, onExpire]);
}

export function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
