import { createHash, randomUUID } from 'node:crypto';
import { getProviderConfig, s3Request } from 'pico-s3';
import { toS3Options, type S3Config } from './s3-options';

export interface SessionFileSnapshot { exists: boolean; payload: string | null }
export interface SessionFileLease {
    read(): Promise<SessionFileSnapshot>;
    write(payload: string): Promise<void>;
    remove(): Promise<void>;
    release(): Promise<void>;
}

// These errors intentionally retain no Axios request, credentials, body, or cause.
class SessionStoreError extends Error {
    readonly name = 'OpenWAError';
    constructor(message: string, readonly status = 503) { super(message); }
}

const limit = 64 * 1024 * 1024;
const logoutPrefix = 'OPENWA_SESSION_LOGGED_OUT:';
const keyPart = (value: string): string => {
    if (!value || value === '.' || value === '..' || /[\x00-\x1f\x7f\\]/.test(value)) {
        throw new SessionStoreError('SESSION_S3_KEY_INVALID', 400);
    }
    return encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
};

/** PicoS3 transport, with a non-expiring conditional lock and versioned object replacement. */
export async function acquireSessionFile(config: S3Config, filename: string): Promise<SessionFileLease> {
    try {
        return await acquire(config, filename);
    } catch (error) {
        throw error instanceof SessionStoreError ? error : new SessionStoreError('SESSION_S3_ACQUIRE_FAILED');
    }
}

async function acquire(config: S3Config, filename: string): Promise<SessionFileLease> {
    const options = toS3Options(config);
    const directory = (config.directory ?? '_sessionData').replace(/^\/+|\/+$/g, '');
    const encodedDirectory = directory ? directory.split('/').map(keyPart).join('/') : undefined;
    const encodedFilename = filename.split('/').map(keyPart).join('/');
    const extraHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(config.headers ?? {})) {
        // Preserve storage encryption and temporary credentials, never ACLs or request overrides.
        if (!/^x-amz-(server-side-encryption(?:-.+)?|security-token|expected-bucket-owner|request-payer|storage-class)$/i.test(key)
            || typeof value !== 'string' || /[\r\n]/.test(value)) {
            throw new SessionStoreError('SESSION_S3_HEADER_INVALID', 400);
        }
        extraHeaders[key.toLowerCase()] = value;
    }
    if (config.sessionToken) extraHeaders['x-amz-security-token'] = config.sessionToken;
    const readHeaders = Object.fromEntries(Object.entries(extraHeaders).filter(([key]) =>
        key.startsWith('x-amz-server-side-encryption-customer-')
        || ['x-amz-security-token', 'x-amz-expected-bucket-owner', 'x-amz-request-payer'].includes(key)));

    const request = async (name: string, method: 'GET' | 'PUT', body?: string, etag?: string | null) => {
        const object = { ...options, filename: name, directory: encodedDirectory };
        const url = new URL(getProviderConfig(options.provider).url(object));
        if (options.provider === 'AWS') url.hostname = `${options.bucket}.s3.${options.region}.amazonaws.com`;
        const data = body === undefined ? undefined : Buffer.from(body, 'utf8');
        try {
            const response = await s3Request(object, {
                method, url: url.toString(), host: url.host, path: url.pathname,
                data, responseType: 'arraybuffer', timeout: 30_000, maxRedirects: 0,
                maxContentLength: limit, maxBodyLength: limit,
                validateStatus: () => true,
                headers: {
                    ...(method === 'PUT' ? extraHeaders : readHeaders),
                    'x-amz-content-sha256': createHash('sha256').update(data ?? '').digest('hex'),
                    ...(data ? { 'Content-Type': body!.startsWith('{') ? 'application/json' : 'text/plain', 'Content-Length': String(data.length) } : {}),
                    ...(etag === null ? { 'If-None-Match': '*' } : etag ? { 'If-Match': etag } : {}),
                },
            });
            if (method === 'GET' && response.status === 404) return null;
            if (response.status === 409 || response.status === 412) throw new SessionStoreError('SESSION_S3_CONFLICT', 409);
            if (response.status !== 200) throw new SessionStoreError('SESSION_S3_REQUEST_FAILED');
            const version = response.headers.etag;
            if (typeof version !== 'string' || !/^"[^"\r\n]+"$/.test(version)) throw new SessionStoreError('SESSION_S3_ETAG_REQUIRED');
            return { etag: version, body: method === 'GET' ? Buffer.from(response.data).toString('utf8') : body! };
        } catch (error) {
            throw error instanceof SessionStoreError ? error : new SessionStoreError('SESSION_S3_REQUEST_FAILED');
        }
    };

    const lockName = `${encodedFilename}.lock`;
    const owner = randomUUID();
    const previous = await request(lockName, 'GET');
    if (previous) {
        let value: { owner?: unknown; nonce?: unknown };
        try { value = JSON.parse(previous.body); }
        catch { throw new SessionStoreError('SESSION_S3_LOCK_INVALID'); }
        if (!value || value.owner !== null || typeof value.nonce !== 'string') {
            throw new SessionStoreError('SESSION_S3_LOCKED', 409);
        }
    }
    // No expiry or lock stealing: a paused owner must never overlap a new browser.
    const lock = await request(lockName, 'PUT', JSON.stringify({ owner, nonce: randomUUID() }), previous?.etag ?? null);
    if (!lock) throw new SessionStoreError('SESSION_S3_LOCK_FAILED');
    let closed = false;
    let busy = false;
    let uncertain = false;
    let releaseResult: Promise<void> | undefined;
    let current: { etag: string; body: string } | null;
    try {
        current = await request(encodedFilename, 'GET');
    } catch (error) {
        // No payload mutation or browser launch occurred; release only our exact lock.
        try { await request(lockName, 'PUT', JSON.stringify({ owner: null, nonce: randomUUID() }), lock.etag); } catch { /* Retain a failed lock. */ }
        throw error;
    }

    const snapshot = (): SessionFileSnapshot => ({
        exists: current !== null,
        payload: current === null || current.body === 'LOGGED OUT' || current.body.startsWith(logoutPrefix) ? null : current.body,
    });
    const available = () => {
        if (closed || uncertain) throw new SessionStoreError('SESSION_S3_CLOSED');
        if (busy) throw new SessionStoreError('SESSION_S3_BUSY', 409);
    };
    const replace = async (body: string) => {
        available();
        if (typeof body !== 'string' || Buffer.byteLength(body) > limit) throw new SessionStoreError('SESSION_S3_PAYLOAD_INVALID', 400);
        busy = true;
        try {
            current = await request(encodedFilename, 'PUT', body, current?.etag ?? null);
        } catch (error) {
            // An HTTP timeout can still commit remotely. Never retry with a stale ETag or free ownership.
            uncertain = true;
            throw error;
        } finally { busy = false; }
    };
    return {
        read: async () => { available(); return snapshot(); },
        write: replace,
        // A fresh marker prevents fallback to an older local file or configured seed after logout.
        remove: () => replace(`${logoutPrefix}${randomUUID()}`),
        release: () => {
            if (releaseResult) return releaseResult;
            try { available(); } catch (error) { return Promise.reject(error); }
            closed = true;
            releaseResult = request(lockName, 'PUT', JSON.stringify({ owner: null, nonce: randomUUID() }), lock.etag)
                .then(() => undefined, () => { throw new SessionStoreError('SESSION_S3_RELEASE_FAILED'); });
            return releaseResult;
        },
    };
}
