import type { Client } from './Client';

/** Invoke the current patch payload, including licensed methods when installed. */
export async function invokePatch<T>(client: Client, method: string, args: unknown[]): Promise<T> {
  const result = await client.evaluate(async ({ method, args }) => {
    const api = (globalThis as unknown as { WAPI?: Record<string, (...args: unknown[]) => unknown> }).WAPI;
    const action = api?.[method];
    if (typeof action !== 'function') {
      throw new Error(`WAPI.${method} is unavailable. This session needs the corresponding current patch or licensed payload.`);
    }
    return await Reflect.apply(action, api, args);
  }, { method, args });
  if (typeof result === 'string' && result.startsWith('ERROR:')) throw new Error(result);
  return result as T;
}
