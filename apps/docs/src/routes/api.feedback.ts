import { createFileRoute } from '@tanstack/react-router';

type FeedbackDatabase = {
  prepare(sql: string): {
    bind(...values: string[]): { run(): Promise<unknown> };
  };
};

type FeedbackBindings = {
  DOCS_FEEDBACK_DB?: FeedbackDatabase;
  DOCS_FEEDBACK_WEBHOOK_URL?: string;
};

const FEEDBACK_TIMEOUT_MS = 5_000;
const MAX_PAGE_LENGTH = 512;
const MAX_VERSION_LENGTH = 128;

type FeedbackPayload = {
  page: string;
  version: string;
  answer: 'yes' | 'no';
};

function isFeedbackPayload(value: unknown): value is FeedbackPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.page === 'string' &&
    payload.page.length > 0 &&
    payload.page.length <= MAX_PAGE_LENGTH &&
    payload.page.startsWith('/') &&
    !payload.page.includes('?') &&
    !payload.page.includes('#') &&
    !/[\u0000-\u001f\u007f]/.test(payload.page) &&
    typeof payload.version === 'string' &&
    payload.version.length > 0 &&
    payload.version.length <= MAX_VERSION_LENGTH &&
    !/[\u0000-\u001f\u007f]/.test(payload.version) &&
    (payload.answer === 'yes' || payload.answer === 'no')
  );
}

async function getFeedbackBindings(): Promise<FeedbackBindings> {
  try {
    const workerModule = await import('cloudflare:workers');
    return workerModule.env as unknown as FeedbackBindings;
  } catch {
    // Vite's local Node server has no Cloudflare binding module. Environment
    // variables still make the configured webhook usable during local work.
    return process.env as unknown as FeedbackBindings;
  }
}

export const Route = createFileRoute('/api/feedback')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: 'Feedback payload must be JSON.' }, { status: 400 });
        }

        if (!isFeedbackPayload(payload)) {
          return Response.json(
            {
              error:
                'Feedback requires a local page path without a query or fragment, a bounded docs version, and a yes/no answer.',
            },
            { status: 400 },
          );
        }

        const bindings = await getFeedbackBindings();
        const submittedAt = new Date().toISOString();

        if (bindings.DOCS_FEEDBACK_DB) {
          try {
            await bindings.DOCS_FEEDBACK_DB.prepare(
              'INSERT INTO docs_feedback (page, version, answer, submitted_at) VALUES (?, ?, ?, ?)',
            )
              .bind(payload.page, payload.version, payload.answer, submittedAt)
              .run();
          } catch {
            return Response.json(
              { error: 'The documentation feedback database could not record this answer.' },
              { status: 503 },
            );
          }

          return Response.json({ ok: true, persistence: 'database' });
        }

        const destination = bindings.DOCS_FEEDBACK_WEBHOOK_URL;
        if (!destination) {
          return Response.json(
            { error: 'The documentation feedback database is not configured.' },
            { status: 503 },
          );
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);

        try {
          const response = await fetch(destination, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              page: payload.page,
              version: payload.version,
              answer: payload.answer,
              submittedAt,
            }),
            signal: controller.signal,
          });
          if (!response.ok) {
            return Response.json(
              { error: `The feedback destination returned ${response.status}.` },
              { status: 502 },
            );
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return Response.json(
              { error: 'The feedback destination timed out.' },
              { status: 504 },
            );
          }
          return Response.json(
            { error: 'The feedback destination could not be reached.' },
            { status: 502 },
          );
        } finally {
          clearTimeout(timeout);
        }

        return Response.json({ ok: true, persistence: 'webhook' });
      },
    },
  },
});
