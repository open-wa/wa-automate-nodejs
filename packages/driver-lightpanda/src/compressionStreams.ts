import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

let prelude: Promise<string> | undefined;

/** Load the installed browser codec; no session data crosses this boundary. */
export function compressionPrelude(): Promise<string> {
    return prelude ??= (async () => {
        const require = createRequire(typeof __filename === 'string' ? __filename : import.meta.url);
        const source = await readFile(resolve(dirname(require.resolve('fflate')), '../umd/index.js'), 'utf8');
        return `${source}\n;(${installCompressionStreams.toString()})();`;
    })();
}

/** Synchronous stream transforms keep compression and key material in Lightpanda. */
export function installCompressionStreams(): void {
    const root = globalThis as any;
    const library = root.fflate;
    const formats: Record<string, any[]> = {
        gzip: [library.Gzip, library.Gunzip],
        deflate: [library.Zlib, library.Unzlib],
        'deflate-raw': [library.Deflate, library.Inflate],
    };
    const makeStream = (decompress: boolean) => class {
        readonly readable: ReadableStream;
        readonly writable: WritableStream;
        constructor(format: string) {
            const Codec = Object.hasOwn(formats, format) && formats[format][decompress ? 1 : 0];
            if (!Codec) throw new TypeError('Unsupported compression format');
            let codec: any, inputLength = 0, outputLength = 0;
            const stream = new TransformStream({
                start(controller) {
                    codec = new Codec((bytes: Uint8Array) => {
                        outputLength += bytes.length;
                        if (outputLength > 48 * 1024 * 1024) throw new RangeError('Compression output exceeds capacity');
                        if (bytes.length) controller.enqueue(bytes.slice());
                    });
                },
                transform(value) {
                    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value)
                        : ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
                            : null;
                    if (!bytes) throw new TypeError('Compression input must be a BufferSource');
                    inputLength += bytes.length;
                    if (inputLength > 48 * 1024 * 1024) throw new RangeError('Compression input exceeds capacity');
                    codec.push(bytes, false);
                },
                // v1 doesn't await async flush; this codec completes synchronously.
                flush() { codec.push(new Uint8Array(0), true); },
            });
            this.readable = stream.readable;
            this.writable = stream.writable;
        }
    };
    root.CompressionStream = makeStream(false);
    root.DecompressionStream = makeStream(true);
}
