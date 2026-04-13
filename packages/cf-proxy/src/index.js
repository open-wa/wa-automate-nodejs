import { SessionTunnel } from './tunnel-do';
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        // Authentication
        const authHeader = request.headers.get('Authorization');
        const queryToken = url.searchParams.get('token');
        const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;
        // Route matching: /sessions/:sessionId/...
        const match = url.pathname.match(/^\/sessions\/([^\/]+)(.*)$/);
        if (!match) {
            return new Response('Not Found', { status: 404 });
        }
        const sessionId = match[1];
        const subpath = match[2] || '/';
        // Check tokens
        if (subpath.startsWith('/upstream')) {
            if (!env.UPSTREAM_TOKEN || providedToken !== env.UPSTREAM_TOKEN) {
                return new Response('Unauthorized Upstream', { status: 401 });
            }
        }
        else {
            if (!env.CONSUMER_TOKEN || providedToken !== env.CONSUMER_TOKEN) {
                return new Response('Unauthorized Consumer', { status: 401 });
            }
        }
        // Forward to the Durable Object designated for this session ID
        const doId = env.SESSION_TUNNEL.idFromName(sessionId);
        const stub = env.SESSION_TUNNEL.get(doId);
        // Provide the original request to the DO
        return stub.fetch(request);
    }
};
export { SessionTunnel }; // Export required for Durable Object binding
