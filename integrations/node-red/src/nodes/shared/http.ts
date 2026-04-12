import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export async function getJson<T>(url: URL, headers?: Record<string, string>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const requestImpl = url.protocol === 'https:' ? httpsRequest : httpRequest;

    const req = requestImpl(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(headers || {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          const statusCode = res.statusCode ?? 500;

          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`Unable to load JSON: HTTP ${statusCode}${body ? ` - ${body}` : ''}`));
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      },
    );

    req.on('error', reject);
    req.end();
  });
}
