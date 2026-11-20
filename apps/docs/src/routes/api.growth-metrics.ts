import { createFileRoute } from '@tanstack/react-router';
import { growthEventSchema } from '@/lib/growth-metrics';
import { CURRENT_VERSION } from '@/lib/site';

type MetricsBindings = {
  DOCS_FEEDBACK_DB?: {
    prepare(sql: string): {
      bind(...values: string[]): { run(): Promise<unknown> };
    };
  };
};

const MAX_BODY_CHARS = 256;

export const Route = createFileRoute('/api/growth-metrics')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get('origin') !== new URL(request.url).origin) {
          return new Response(null, { status: 403 });
        }

        if (Number(request.headers.get('content-length')) > MAX_BODY_CHARS) {
          return new Response(null, { status: 413 });
        }
        if (request.headers.get('content-type') !== 'application/json') {
          return new Response(null, { status: 415 });
        }
        const body = await request.text();
        if (body.length > MAX_BODY_CHARS) return new Response(null, { status: 413 });
        let payload: unknown;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response(null, { status: 400 });
        }
        const event = growthEventSchema.safeParse(payload);
        if (!event.success) return new Response(null, { status: 400 });

        const data = event.data;
        try {
          const { env } = await import('cloudflare:workers');
          const database = (env as MetricsBindings).DOCS_FEEDBACK_DB;
          if (!database) return new Response(null, { status: 503 });
          await database.prepare(`
            INSERT INTO docs_growth_daily (day, docs_version, event, source, setup, target, total)
            VALUES (date('now'), ?, ?, ?, ?, ?, 1)
            ON CONFLICT (day, docs_version, event, source, setup, target)
            DO UPDATE SET total = total + 1
          `).bind(
            CURRENT_VERSION,
            data.event,
            data.source,
            'setup' in data ? data.setup : '',
            'target' in data ? data.target : '',
          ).run();
        } catch {
          return new Response(null, { status: 503 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
