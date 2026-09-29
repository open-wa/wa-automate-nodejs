import { spawn } from 'node:child_process';
import { lstat, mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import packageJson from '../../package.json';
import { getCliOutputSink } from './output-sink';

const starter = `import { create } from '@open-wa/wa-automate';

const recipient = 'REPLACE_WITH_RECIPIENT_CHAT_ID';
const message = 'Hello from open-wa!';

// Use an existing chat with someone expecting your message.
if (recipient === 'REPLACE_WITH_RECIPIENT_CHAT_ID') {
  throw new Error('Set recipient to an international phone number followed by @c.us, without + or spaces.');
}

const client = await create();

try {
  await client.sendText(recipient, message);
  console.log('Message submitted. Check the receiving chat.');
} finally {
  await client.stop();
}
`;

async function exists(path: string): Promise<boolean> {
    try {
        await lstat(path);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
        throw error;
    }
}

async function install(directory: string): Promise<void> {
    const command = process.versions.bun ? process.execPath : 'bun';
    await new Promise<void>((accept, reject) => {
        const child = spawn(command, ['install'], { cwd: directory, stdio: 'inherit' });
        child.once('error', () => reject(new Error('Bun is required to install this project. Install Bun from https://bun.sh, then run bun install in the generated directory.')));
        child.once('exit', (code) => code === 0
            ? accept()
            : reject(new Error('Dependency installation did not finish. The generated files are safe to keep; run bun install in the project to retry.')));
    });
}

/** Create a Bun/TypeScript application without overwriting existing files. */
export async function initProject(args: string[]): Promise<void> {
    const sink = getCliOutputSink();
    if (args.includes('--help') || args.includes('-h')) {
        sink.write({ level: 'info', message: 'Usage: bunx --bun @open-wa/wa-automate init <directory> [--no-install]\nUse . for the current directory. Existing starter files are never overwritten.' });
        return;
    }
    const positional = args.filter((arg) => !arg.startsWith('-'));
    if (positional.length > 1 || args.some((arg) => arg.startsWith('-') && arg !== '--no-install')) {
        throw new Error('Usage: bunx --bun @open-wa/wa-automate init <directory> [--no-install]');
    }
    const directory = resolve(positional[0] ?? '.');
    const name = basename(directory).toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/^[._-]+/, '') || 'my-bot';
    const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
    const files: Record<string, string> = {
        'package.json': json({
            name, version: '0.0.0', private: true, type: 'module',
            scripts: { start: 'bun run index.ts' },
            dependencies: { '@open-wa/wa-automate': packageJson.version },
            devDependencies: { '@types/bun': 'latest' },
        }),
        'index.ts': starter,
        'tsconfig.json': json({ compilerOptions: {
            target: 'ESNext', module: 'Preserve', moduleResolution: 'bundler',
            strict: true, noEmit: true, skipLibCheck: true, types: ['bun'],
        } }),
        '.gitignore': '/node_modules/\n/.open-wa/\n/_IGNORE_*/\n/*.data.json\n.env\n.env.*\n',
    };
    const conflicts: string[] = [];
    for (const file of Object.keys(files)) {
        if (await exists(resolve(directory, file))) conflicts.push(file);
    }
    if (conflicts.length) {
        throw new Error(`Cannot initialize ${directory}: ${conflicts.join(', ')} already exist. Use a new directory, or add open-wa to your existing project with bun add @open-wa/wa-automate. No files were changed.`);
    }
    await mkdir(directory, { recursive: true });
    const created: string[] = [];
    try {
        for (const [name, content] of Object.entries(files)) {
            const path = resolve(directory, name);
            await writeFile(path, content, { flag: 'wx' });
            created.push(path);
        }
    } catch (error) {
        await Promise.all(created.map((path) => unlink(path)));
        throw error;
    }
    sink.write({ level: 'info', message: `Created ${directory}. WhatsApp login stays in private storage under your home directory, separate for each project.` });
    if (!args.includes('--no-install')) await install(directory);
    const quotedDirectory = `'${directory.replace(/'/g, "'\\''")}'`;
    sink.write({ level: 'info', message: `Next:\n  cd ${quotedDirectory}\n${args.includes('--no-install') ? '  bun install\n' : ''}  Edit the recipient in index.ts\n  bun run start\n\nEach run sends one message. Check the receiving chat before retrying an uncertain send.` });
}
