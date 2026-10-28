import { constants } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { toPublicError } from '@open-wa/driver-interface';
import { getCliOutputSink, promptChoice } from './cli/output-sink';

export type BrowserChoice = 'chrome' | 'chromium' | 'lightpanda';
export { findSystemBrowser } from '@open-wa/create/browser';
const choiceFile = join(homedir(), '.cache', 'open-wa', 'browser-choice.json');

export async function readBrowserChoice(): Promise<{ kind: BrowserChoice; executablePath: string } | undefined> {
    const { Effect, Schema } = await import('effect');
    const recordSchema = Schema.fromJsonString(Schema.Struct({
        kind: Schema.Literals(['chrome', 'chromium', 'lightpanda']),
        executablePath: Schema.String,
    }));
    const io = <A>(operation: () => PromiseLike<A>) => Effect.tryPromise({ try: operation, catch: toPublicError });
    return Effect.runPromise(Effect.gen(function* () {
        const record = yield* Schema.decodeUnknownEffect(recordSchema)(yield* io(() => readFile(choiceFile, 'utf8')));
        const executable = yield* io(() => stat(record.executablePath));
        if (!executable.isFile()) return undefined;
        yield* io(() => access(record.executablePath, constants.X_OK));
        return record;
    }).pipe(Effect.catch(() => Effect.succeed(undefined))));
}

export async function writeBrowserChoice(kind: BrowserChoice, executablePath: string): Promise<void> {
    const { Effect } = await import('effect');
    const io = <A>(operation: () => PromiseLike<A>) => Effect.tryPromise({ try: operation, catch: toPublicError });
    const program = Effect.gen(function* () {
        const directory = dirname(choiceFile);
        yield* io(() => mkdir(directory, { recursive: true }));
        const staging = yield* Effect.acquireRelease(
            io(() => mkdtemp(join(directory, '.browser-choice-'))),
            path => io(() => rm(path, { recursive: true, force: true })).pipe(Effect.orDie),
        );
        const temporary = join(staging, 'browser-choice.json');
        yield* io(() => writeFile(temporary, JSON.stringify({ kind, executablePath }), { encoding: 'utf8', flag: 'wx' }));
        yield* io(() => rename(temporary, choiceFile));
    });
    await Effect.runPromise(Effect.scoped(Effect.uninterruptible(program))).catch(cause => { throw toPublicError(cause); });
}

export async function chooseBrowser(): Promise<BrowserChoice> {
    const sink = getCliOutputSink();
    const choice = await (sink.promptChoice ?? promptChoice)(
        'Google Chrome was not found. Which browser would you like to download?',
        [
            'Chrome for Testing — recommended; highest compatibility, including video and media.',
            'Chromium — middle ground; proprietary video/audio codecs may be unavailable.',
            'Lightpanda — lightweight basic automation; low compatibility, experimental WhatsApp support, no video or rendering.',
        ],
    );
    return (['chrome', 'chromium', 'lightpanda'] as const)[choice];
}
