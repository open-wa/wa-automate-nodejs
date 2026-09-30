import { open } from 'node:fs/promises';
import { Effect } from 'effect';
import { portableFailure, portableIO, type PortableSessionFailure } from './portableSessionEffects';

export interface SessionEncryptionOptions {
  /** Base64-encoded 32-byte encryption key. Omit to use the baked default. */
  sessionDataEncryptionKey?: string;
  /** Mounted secret containing the base64 key; mutually exclusive with the inline key. */
  sessionDataEncryptionKeyFile?: string;
}

export interface SessionEncryptionCredentials { key?: string }

/** Load secrets for the lexical pre-init bridge. No session cryptography runs on the host. */
export function resolveSessionEncryption(options: SessionEncryptionOptions): Effect.Effect<SessionEncryptionCredentials, PortableSessionFailure> {
  return Effect.gen(function* () {
    const invalid = () => portableFailure('PORTABLE_SESSION_ENCRYPTION_CONFIG_INVALID');
    const select = (value: unknown, file: unknown) => {
      if (value !== undefined || file !== undefined) return { value, file };
      for (const prefix of ['OPENWA_', 'WA_']) {
        const name = `${prefix}SESSION_DATA_ENCRYPTION_KEY`;
        if (process.env[name] !== undefined || process.env[`${name}_FILE`] !== undefined) {
          return { value: process.env[name], file: process.env[`${name}_FILE`] };
        }
      }
      return { value: undefined, file: undefined };
    };
    const read = (source: { value: unknown; file: unknown }) => Effect.gen(function* () {
      if (source.value !== undefined && source.file !== undefined) return yield* Effect.fail(invalid());
      if (source.file === undefined) return source.value;
      if (typeof source.file !== 'string' || !source.file.trim()) return yield* Effect.fail(invalid());
      const filename = source.file;
      return yield* portableIO('PORTABLE_SESSION_ENCRYPTION_KEY_FILE_FAILED', async () => {
        const handle = await open(filename, 'r');
        const bytes = Buffer.alloc(4097);
        try {
          if (!(await handle.stat()).isFile()) throw new Error();
          let length = 0;
          while (length < bytes.length) {
            const next = await handle.read(bytes, length, bytes.length - length, null);
            if (!next.bytesRead) break;
            length += next.bytesRead;
          }
          if (length > 4096) throw new Error();
          return bytes.subarray(0, length).toString('utf8').trim();
        } finally { bytes.fill(0); await handle.close(); }
      });
    });
    const current = yield* read(select(options.sessionDataEncryptionKey, options.sessionDataEncryptionKeyFile));
    return yield* Effect.try({
      try: () => {
        const key = (value: unknown): string => {
          if (typeof value !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(value)) throw invalid();
          const bytes = Buffer.from(value, 'base64');
          try { if (bytes.length !== 32 || bytes.toString('base64') !== value) throw invalid(); }
          finally { bytes.fill(0); }
          return value;
        };
        return { key: current === undefined ? undefined : key(current) };
      },
      catch: invalid,
    });
  });
}
