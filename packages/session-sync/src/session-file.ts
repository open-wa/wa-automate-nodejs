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

/** Shared PicoS3 session storage with unconditional, last-write-wins replacement. */
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

    const request = async (name: string, method: 'GET' | 'PUT', body?: string) => {
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
                },
            });
            if (method === 'GET' && response.status === 404) return null;
            if (response.status === 409 || response.status === 412) throw new SessionStoreError('SESSION_S3_CONFLICT', 409);
            if (response.status !== 200) throw new SessionStoreError('SESSION_S3_REQUEST_FAILED');
            return method === 'GET' ? Buffer.from(response.data).toString('utf8') : body!;
        } catch (error) {
            throw error instanceof SessionStoreError ? error : new SessionStoreError('SESSION_S3_REQUEST_FAILED');
        }
    };

    let closed = false;
    let busy = false;
    let uncertain = false;
    let current = await request(encodedFilename, 'GET');

    const snapshot = (): SessionFileSnapshot => ({
        exists: current !== null,
        payload: current === null || current === 'LOGGED OUT' || current.startsWith(logoutPrefix) ? null : current,
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
            current = await request(encodedFilename, 'PUT', body);
        } catch (error) {
            // An HTTP timeout can still commit remotely; do not report a later save as successful.
            uncertain = true;
            throw error;
        } finally { busy = false; }
    };
    return {
        read: async () => { available(); return snapshot(); },
        write: replace,
        // A fresh marker prevents fallback to an older local file or configured seed after logout.
        remove: () => replace(`${logoutPrefix}${randomUUID()}`),
        release: async () => {
            closed = true;
        },
    };
}
