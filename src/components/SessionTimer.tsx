'use client';
/*
  Purpose: Full-screen session timer used to guide focused work sessions.
  Features:
  - Start/Pause/Finish controls
  - Mid-session prompt at a configurable minute (default 10)
  - Emits finish event to trigger JournalModal
  Notes:
  - Visuals are Tailwind-based, avoiding extra UI deps. Accessible labels included.
*/
import * as React from 'react';
import { Button } from '@/components/ui/button';

export type SessionTimerProps = {
  open: boolean;
  onClose: () => void;
  durationMins?: number; // default 25
  midPromptAt?: number; // default 10
  title?: string;
  onFinish: (payload: { elapsedSec: number }) => void;
};

export function SessionTimer({
  open,
  onClose,
  durationMins = 25,
  midPromptAt = 10,
  title = 'Session',
  onFinish,
}: SessionTimerProps) {
  const [running, setRunning] = React.useState(false);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const totalSec = durationMins * 60;
  const midPromptSec = midPromptAt * 60;

  React.useEffect(() => {
    if (!open) {
      setRunning(false);
      setElapsedSec(0);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const remaining = Math.max(0, totalSec - elapsedSec);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const showMidPrompt = elapsedSec >= midPromptSec && elapsedSec < midPromptSec + 6; // small window
  const finished = elapsedSec >= totalSec;

  React.useEffect(() => {
    if (finished) {
      setRunning(false);
      onFinish({ elapsedSec });
    }
  }, [finished, elapsedSec, onFinish]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session Timer"
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-lg font-semibold">{title}</div>
        <Button variant="outline" onClick={onClose} aria-label="Close Session">
          Close
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-6xl tabular-nums" aria-live="polite">
          {mm}:{ss}
        </div>
        {showMidPrompt && (
          <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            Next 5 minutes: isolate the weak link.
          </div>
        )}
        <div className="flex items-center gap-3">
          {!running ? (
            <Button onClick={() => setRunning(true)} aria-label="Start Session">
              {elapsedSec === 0 ? 'Start' : 'Resume'}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setRunning(false)} aria-label="Pause Session">
              Pause
            </Button>
          )}
          <Button variant="destructive" onClick={() => onFinish({ elapsedSec })} aria-label="Finish Session">
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
