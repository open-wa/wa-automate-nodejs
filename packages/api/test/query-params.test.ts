import { describe, expect, it, vi } from 'vitest';
import { getHttpMethodDefinitions } from '@open-wa/schema';
import '@open-wa/schema/methods';
import { createApiMiddleware } from '../src/createApiMiddleware';

function endpoint(name: string, method: ReturnType<typeof vi.fn>) {
  const definition = getHttpMethodDefinitions('/api').find(value => value.functionName === name)!;
  const app = createApiMiddleware({ [name]: method }, { config: { sessionId: 'query-test' } as any, methodDefinitions: [definition] });
  return { app, definition, path: definition.path.slice('/api'.length) };
}
describe('schema-typed HTTP query parameters', () => {
  it('loads Neo chat messages with true and false GET flags', async () => {
    const invoke = vi.fn().mockResolvedValue([]);
    const { app, path } = endpoint('getAllMessages', invoke);
    const response = await app.request(`${path}?chatId=447700900123%40c.us&includeMe=true&includeNotifications=false`);
    expect(response.status).toBe(200);
    expect(invoke).toHaveBeenCalledWith('447700900123@c.us', true, false);
  });
  it('preserves a string value that happens to spell false', async () => {
    const invoke = vi.fn().mockResolvedValue(true);
    const { app, path, definition } = endpoint('setMyStatus', invoke);
    const response = await app.request(`${path}?statusText=false`, { method: definition.httpMethod });
    expect(response.status).toBe(200);
    expect(invoke).toHaveBeenCalledWith('false');
  });
  it('rejects invalid boolean text before invoking the client', async () => {
    const invoke = vi.fn().mockResolvedValue([]);
    const { app, path } = endpoint('getAllMessages', invoke);
    const response = await app.request(`${path}?chatId=447700900123%40c.us&includeMe=not-a-boolean`);
    expect(response.status).toBe(400);
    expect(invoke).not.toHaveBeenCalled();
  });
});
