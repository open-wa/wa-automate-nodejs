/**
 * HTTP Client for remote patch/license operations.
 *
 * Isolates all network concerns from Transport.ts so they can be tested and mocked independently.
 * Uses native `fetch` — no axios dependency.
 *
 * Internals use Effect for retry + typed errors (see EFFECT.md); the exported
 * functions stay Promise-based and return the same `FetchAttemptResult`/throw
 * behavior as before. The per-attempt timeout is enforced by AbortController.
 */
import { Cause, Data, Effect, Exit, Schedule } from 'effect';

export interface PatchFetchParams {
  waVersion?: string;
  waAutomateVersion?: string;
}

export interface PatchFetchResult {
  data: string[];
  tag: string;
}

export interface LicenseValidationBody {
  key: string;
  number: string;
  [debugField: string]: unknown;
}

export interface HttpClientOptions {
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;

/**
 * Fetch patches from a remote endpoint.
 *
 * Mirrors legacy `getPatch()`:
 * - GET `patchesUrl?wv=X&wav=Y`
 * - Response: JSON array of evaluatable JS strings
 * - If no `etag` header, compute MD5 short hash
 * - On failure: try fallback URL if provided
 */
export async function fetchPatches(
  primaryUrl: string,
  params: PatchFetchParams,
  options?: HttpClientOptions & { fallbackUrl?: string },
): Promise<PatchFetchResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const fallbackUrl = options?.fallbackUrl;

  const queryParams = new URLSearchParams();
  if (params.waVersion) queryParams.set('wv', params.waVersion);
  if (params.waAutomateVersion) queryParams.set('wav', params.waAutomateVersion);

  const primaryFullUrl = queryParams.toString()
    ? `${primaryUrl}?${queryParams.toString()}`
    : primaryUrl;

  // Try primary URL (with retry)
  const primaryResult = await fetchWithRetry(primaryFullUrl, timeoutMs, retries);

  if (primaryResult.ok) {
    return parsePatchResponse(primaryResult);
  }

  // Fallback to GitHub raw URL if provided
  if (fallbackUrl) {
    const fallbackFullUrl = `${fallbackUrl}?v=${Date.now()}`;
    const fallbackResult = await fetchWithRetry(fallbackFullUrl, timeoutMs, retries);

    if (fallbackResult.ok) {
      return parsePatchResponse(fallbackResult);
    }

    throw new Error(
      `Patch fetch failed on both primary (${primaryUrl}) and fallback (${fallbackUrl}): ${fallbackResult.error}`,
    );
  }

  throw new Error(`Patch fetch failed: ${primaryResult.error}`);
}

/**
 * Validate a license key with the remote key server.
 *
 * Mirrors legacy `getLicense()`:
 * - POST `licenseCheckUrl` with `{ key, number, ...debugInfo }`
 * - Response: executable JS string payload, or empty/false if invalid
 */
export async function validateLicense(
  url: string,
  body: LicenseValidationBody,
  options?: HttpClientOptions,
): Promise<string | false> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? DEFAULT_RETRIES;

  const result = await fetchWithRetry(
    url,
    timeoutMs,
    retries,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!result.ok) {
    throw new Error(`License validation request failed: ${result.error}`);
  }

  const data = result.data;

  // Legacy: empty data or falsy data means invalid key
  if (!data || data === 'false' || data === 'null') {
    return false;
  }

  return typeof data === 'string' ? data : String(data);
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

interface FetchAttemptResult {
  ok: boolean;
  data?: unknown;
  headers?: Headers;
  error?: string;
  statusCode?: number;
}

// Typed failure channel for the internal Effect. 4xx is non-retryable; timeout
// and network errors and 5xx are retryable.
class HttpTimeoutError extends Data.TaggedError('HttpTimeoutError')<{
  readonly timeoutMs: number;
}> {}
class HttpNetworkError extends Data.TaggedError('HttpNetworkError')<{
  readonly cause: unknown;
}> {}
class HttpStatusError extends Data.TaggedError('HttpStatusError')<{
  readonly status: number;
  readonly statusText: string;
}> {}

type HttpError = HttpTimeoutError | HttpNetworkError | HttpStatusError;

function isRetryable(error: HttpError): boolean {
  if (error._tag === 'HttpStatusError') return error.status >= 500;
  return true; // timeout + network errors retry
}

function errorMessage(error: HttpError, timeoutMs: number): string {
  switch (error._tag) {
    case 'HttpTimeoutError':
      return `Request timed out after ${timeoutMs}ms`;
    case 'HttpStatusError':
      return `HTTP ${error.status} ${error.statusText}`;
    case 'HttpNetworkError':
      return error.cause instanceof Error ? error.cause.message : String(error.cause);
  }
}

/** One fetch attempt: fails with a typed error, succeeds with the parsed body. */
function fetchOnce(url: string, timeoutMs: number, init?: RequestInit) {
  return Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    },
    catch: (cause): HttpError =>
      cause instanceof DOMException && cause.name === 'AbortError'
        ? new HttpTimeoutError({ timeoutMs })
        : new HttpNetworkError({ cause }),
  }).pipe(
    Effect.flatMap((response) => {
      if (!response.ok) {
        return Effect.fail(
          new HttpStatusError({ status: response.status, statusText: response.statusText }),
        );
      }
      return Effect.tryPromise({
        try: async (): Promise<{ data: unknown; headers: Headers }> => {
          const contentType = response.headers.get('content-type') ?? '';
          const data = contentType.includes('application/json')
            ? await response.json()
            : await response.text();
          return { data, headers: response.headers };
        },
        catch: (cause): HttpError => new HttpNetworkError({ cause }),
      });
    }),
  );
}

async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  maxRetries: number,
  init?: RequestInit,
): Promise<FetchAttemptResult> {
  const program = fetchOnce(url, timeoutMs, init).pipe(
    Effect.retry({
      times: maxRetries,
      while: isRetryable,
      schedule: Schedule.exponential('250 millis'),
    }),
  );

  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) {
    return { ok: true, data: exit.value.data, headers: exit.value.headers };
  }

  const error = Cause.squash(exit.cause) as HttpError;
  return {
    ok: false,
    error: errorMessage(error, timeoutMs),
    statusCode: error._tag === 'HttpStatusError' ? error.status : undefined,
  };
}

async function parsePatchResponse(result: FetchAttemptResult): Promise<PatchFetchResult> {
  let data = result.data;

  // The CDN and GitHub raw endpoints return content-type: text/plain,
  // so fetchWithRetry reads the body as text instead of parsing JSON.
  // If data is a string, try to JSON.parse it (mirrors legacy axios.get() behavior).
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error(`Patch response is not valid JSON: ${(data as string).slice(0, 100)}...`);
    }
  }

  // Ensure data is an array of strings
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected patch response format: expected array, got ${typeof data}`);
  }

  // Compute tag from etag header, or fall back to MD5-ish hash
  let tag: string;
  const etag = result.headers?.get('etag');

  if (etag) {
    tag = etag.replace(/"/g, '').slice(-5);
  } else {
    // Match legacy: crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').slice(-5)
    const { createHash } = await import('node:crypto');
    tag = createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
      .slice(-5);
  }

  return { data: data as string[], tag };
}
