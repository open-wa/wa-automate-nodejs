import { z } from 'zod';

export const growthEventSchema = z.discriminatedUnion('event', [
  z.strictObject({ event: z.literal('quick_start_open'), source: z.literal('quickstart') }),
  z.strictObject({
    event: z.literal('setup_command_copy'),
    source: z.enum(['homepage', 'quickstart', 'project_builder']),
    setup: z.enum(['undecided', 'easy-api', 'sdk']),
  }),
  z.strictObject({
    event: z.literal('guide_next_step_click'),
    source: z.enum(['mcp', 'webhooks', 'n8n', 'api_comparison']),
    target: z.enum(['quickstart', 'easy_api', 'sdk', 'docker', 'workflow']),
  }),
]);

export type GrowthEvent = z.infer<typeof growthEventSchema>;

export const GROWTH_METRICS_PREFERENCE = 'openwa.growth-metrics.v1';

export function growthMetricsEnabled(): boolean {
  try {
    return window.localStorage.getItem(GROWTH_METRICS_PREFERENCE) === 'on';
  } catch {
    return false;
  }
}

export function recordGrowthEvent(event: GrowthEvent): void {
  if (!growthMetricsEnabled()) return;
  void fetch('/api/growth-metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true,
  }).catch(() => {});
}

const guideDestinations = {
  '/docs/getting-started/quickstart': 'quickstart',
  '/docs/getting-started/easy-api': 'easy_api',
  '/docs/getting-started/custom-code': 'sdk',
  '/docs/getting-started/docker': 'docker',
  '/downloads/openwa-n8n-whatsapp.json': 'workflow',
} as const;

export type GrowthGuide = Extract<GrowthEvent, { event: 'guide_next_step_click' }>['source'];

export function recordGuideLink(source: GrowthGuide, clicked: EventTarget): void {
  if (!(clicked instanceof Element)) return;
  const link = clicked.closest('a[href]');
  if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return;
  const path = link.pathname.replace(/\/$/, '');
  if (!Object.hasOwn(guideDestinations, path)) return;
  recordGrowthEvent({
    event: 'guide_next_step_click',
    source,
    target: guideDestinations[path as keyof typeof guideDestinations],
  });
}
