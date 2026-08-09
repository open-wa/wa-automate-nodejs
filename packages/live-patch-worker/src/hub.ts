import {
  assertManifest,
  sanitizeAnalytics,
  type LivePatchReleaseManifest,
} from './contracts';

export interface HubEnv {
  PATCH_ANALYTICS?: AnalyticsEngineDataset;
}

const MANIFEST_KEY = 'current_manifest';

export class LivePatchHub implements DurableObject {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: HubEnv,
  ) {
    this.state.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'),
    );
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.endsWith('/current')) {
      const manifest =
        await this.state.storage.get<LivePatchReleaseManifest>(MANIFEST_KEY);
      return Response.json({ manifest: manifest ?? null });
    }
    if (path.endsWith('/release') && request.method === 'POST') {
      const manifest = await request.json();
      assertManifest(manifest);
      const current =
        await this.state.storage.get<LivePatchReleaseManifest>(MANIFEST_KEY);
      if (current?.hash === manifest.hash)
        return Response.json({ published: false, manifest: current });

      await this.state.storage.put(MANIFEST_KEY, manifest);
      const message = JSON.stringify({ type: 'patch.available', manifest });
      for (const socket of this.state.getWebSockets()) socket.send(message);
      return Response.json({ published: true, manifest });
    }
    if (path.endsWith('/stream')) {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected websocket upgrade', { status: 426 });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server, ['live-patch-client']);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('Not found', { status: 404 });
  }

  webSocketMessage(_socket: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== 'string') return;
    try {
      const body = JSON.parse(message) as { analytics?: unknown };
      const analytics = sanitizeAnalytics(body.analytics);
      if (analytics) writeAnalytics(this.env.PATCH_ANALYTICS, analytics);
    } catch {
      // Invalid client telemetry is deliberately ignored.
    }
  }
}

export function writeAnalytics(
  dataset: AnalyticsEngineDataset | undefined,
  analytics: ReturnType<typeof sanitizeAnalytics>,
): void {
  if (!dataset || !analytics) return;
  dataset.writeDataPoint({
    blobs: [
      analytics.hostHash ?? '',
      analytics.waVersion ?? '',
      analytics.coreVersion,
      analytics.nodeVersion,
      analytics.platform,
      analytics.arch,
      analytics.driver,
      analytics.trigger,
      analytics.currentHash ?? '',
      analytics.result ? JSON.stringify(analytics.result).slice(0, 1024) : '',
    ],
    indexes: [analytics.hostHash ?? 'anonymous'],
  });
}
