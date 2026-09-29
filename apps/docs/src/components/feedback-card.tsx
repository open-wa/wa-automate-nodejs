import { useEffect, useRef, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { CURRENT_VERSION, REPO_URL } from '@/lib/site';

const FEEDBACK_TIMEOUT_MS = 8_000;

export function FeedbackCard({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const requestRef = useRef<AbortController | null>(null);
  const [submitted, setSubmitted] = useState<'yes' | 'no' | null>(null);
  const [pending, setPending] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setSubmitted(null);
    setPending(null);
    setError(null);

    return () => {
      requestRef.current?.abort();
    };
  }, [pathname]);

  async function submit(answer: 'yes' | 'no') {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);
    setPending(answer);
    setError(null);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          page: pathname,
          version: CURRENT_VERSION,
          answer,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Feedback submission failed (${response.status}).`);
      }
      if (requestRef.current === controller) setSubmitted(answer);
    } catch (submissionError) {
      if (requestRef.current === controller) {
        setError(
          submissionError instanceof DOMException && submissionError.name === 'AbortError'
            ? 'Feedback submission timed out.'
            : submissionError instanceof Error
              ? submissionError.message
              : 'Feedback could not be recorded.',
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setPending(null);
      }
    }
  }

  const issueHref = (() => {
    const params = new URLSearchParams({
      title: 'Documentation correction',
      body: `The page ${pathname} was not helpful.\n\nDocs version: ${CURRENT_VERSION}`,
    });
    return `${REPO_URL}/issues/new?${params.toString()}`;
  })();

  return (
    <div className={cn("mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-muted p-5", className)}>

      <div className="relative z-10 flex w-full flex-col items-center gap-4 sm:flex-row">
        <div className="flex-1 text-center sm:text-left">
          <h4 className="mb-1 text-base font-semibold text-foreground">Was this helpful?</h4>
          <p className="text-sm text-muted-foreground">
            Your answer includes the page path and docs version.
          </p>
        </div>

        <div className="flex gap-3">
          {submitted ? (
            <div className="text-center text-sm font-semibold text-primary sm:text-left">
              <p>Submitted as {submitted === 'yes' ? 'helpful' : 'not helpful'}.</p>
              {submitted === 'no' ? (
                <a
                  href={issueHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-bold underline underline-offset-2"
                >
                  Report what was missing
                </a>
              ) : null}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submit('yes')}
                disabled={pending !== null}
                className="flex items-center gap-2 min-h-10 rounded-[10px] border border-border bg-card px-4 py-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ThumbsUp className="size-4 text-primary" />
                <span className="text-sm font-bold">{pending === 'yes' ? 'Sending…' : 'Yes'}</span>
              </button>
              <button
                type="button"
                onClick={() => submit('no')}
                disabled={pending !== null}
                className="flex items-center gap-2 min-h-10 rounded-[10px] border border-border bg-card px-4 py-2 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ThumbsDown className="size-4 text-destructive" />
                <span className="text-sm font-bold">{pending === 'no' ? 'Sending…' : 'No'}</span>
              </button>
            </>
          )}
        </div>
      </div>
      {error ? (
        <p role="alert" className="relative z-10 w-full border-t border-destructive/30 pt-3 text-center text-sm font-semibold text-destructive sm:text-left">
          {error}{' '}
          <a href={issueHref} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Open an issue instead
          </a>
        </p>
      ) : null}
    </div>
  );
}
