import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPatches, validateLicense } from '../../src/transport/httpClient.js';

/** Build a Response-like object good enough for httpClient. */
function res(
  status: number,
  body: string,
  contentType = 'application/json',
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `S${status}`,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    json: async () => JSON.parse(body),
    text: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('httpClient retry semantics', () => {
  it('retries a 5xx then succeeds', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(res(500, 'err'))
      .mockResolvedValueOnce(res(200, JSON.stringify(['patch();'])));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPatches('https://cdn.example/patches', {}, { retries: 2 });
    expect(result.data).toEqual(['patch();']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a 4xx', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(res(404, 'nope'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPatches('https://cdn.example/patches', {}, { retries: 3 })).rejects.toThrow(
      /404/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the fallback URL after the primary fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(res(500, 'err')) // primary attempt 1
      .mockResolvedValueOnce(res(500, 'err')) // primary attempt 2 (retry)
      .mockResolvedValueOnce(res(200, JSON.stringify(['ok();']), 'text/plain')); // fallback
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPatches(
      'https://cdn.example/patches',
      {},
      { retries: 1, fallbackUrl: 'https://raw.example/patches' },
    );
    expect(result.data).toEqual(['ok();']);
  });

  it('validateLicense returns false for empty/false payloads', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(res(200, JSON.stringify('false'))));
    await expect(
      validateLicense('https://lic.example', { key: 'k', number: 'n' }),
    ).resolves.toBe(false);
  });

  it('validateLicense returns the payload string on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(res(200, JSON.stringify('unlock();'))),
    );
    await expect(
      validateLicense('https://lic.example', { key: 'k', number: 'n' }),
    ).resolves.toBe('unlock();');
  });
});
