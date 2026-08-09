import { LivePatchHub, writeAnalytics } from './hub';
import { sanitizeAnalytics } from './contracts';

export interface Env {
  LIVE_PATCH_HUB: DurableObjectNamespace;
  PUBLISH_TOKEN: string;
  PATCH_ANALYTICS?: AnalyticsEngineDataset;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: corsHeaders });
}

async function readCurrent(stub: DurableObjectStub): Promise<any | null> {
  const response = await stub.fetch('https://hub/current');
  return ((await response.json()) as { manifest: unknown }).manifest;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    const stub = env.LIVE_PATCH_HUB.get(
      env.LIVE_PATCH_HUB.idFromName('global'),
    );

    if (url.pathname === '/v1/releases' && request.method === 'POST') {
      if (
        request.headers.get('Authorization') !== `Bearer ${env.PUBLISH_TOKEN}`
      ) {
        return json({ error: 'Unauthorized' }, 401);
      }
      return stub.fetch('https://hub/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: await request.text(),
      });
    }

    if (url.pathname === '/v1/patches/stream') {
      return stub.fetch(new Request('https://hub/stream', request));
    }

    if (url.pathname === '/v1/patches/check' && request.method === 'POST') {
      const analytics = sanitizeAnalytics(
        await request.json().catch(() => null),
      );
      if (!analytics) return json({ error: 'Invalid analytics envelope' }, 400);
      writeAnalytics(env.PATCH_ANALYTICS, analytics);
      const manifest = await readCurrent(stub);
      if (!manifest || manifest.hash === analytics.currentHash)
        return new Response(null, { status: 204, headers: corsHeaders });
      return json({ updated: true, manifest });
    }

    if (url.pathname === '/v1/patches/outcome' && request.method === 'POST') {
      const analytics = sanitizeAnalytics(
        await request.json().catch(() => null),
      );
      if (!analytics) return json({ error: 'Invalid analytics envelope' }, 400);
      writeAnalytics(env.PATCH_ANALYTICS, analytics);
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return json({ error: 'Not found' }, 404);
  },
};

export { LivePatchHub };
