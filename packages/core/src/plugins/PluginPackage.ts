import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Logger } from '@open-wa/logger';
import { version as hostVersion } from '../../package.json';

type Resolver = (specifier: string) => string;
const resolvers = new Map<string, Promise<Resolver>>();
const installations = new Map<string, Promise<string>>();
const packagePattern = /^(@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)(?:@([a-zA-Z0-9.*+~^<>=|_ -]+))?$/;

async function atomicWrite(path: string, content: string): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

/** Resolve with ESM import conditions from the project or installed cache. */
async function writeResolver(directory: string): Promise<Resolver> {
  const path = join(directory, 'resolve.js');
  await atomicWrite(path, 'export default specifier => import.meta.resolve(specifier);\n');
  return (await import(pathToFileURL(path).href)).default;
}

function projectResolver(cwd: string): Promise<Resolver> {
  let pending = resolvers.get(cwd);
  if (!pending) {
    pending = (async () => {
      const directory = join(cwd, '.open-wa', 'plugins', 'resolver');
      await mkdir(directory, { recursive: true });
      await atomicWrite(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
      return writeResolver(directory);
    })();
    resolvers.set(cwd, pending);
    pending.catch(() => resolvers.delete(cwd));
  }
  return pending;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function install(directory: string, ref: string): Promise<void> {
  const args = ['install', '--prefix', directory, '--omit=dev', '--no-audit', '--no-fund', '--no-progress'];
  const npmPath = process.env.npm_execpath;
  const npmCli = npmPath && /[\\/]npm-cli\.js$/.test(npmPath)
    ? npmPath
    : process.platform === 'win32'
      ? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
      : undefined;

  await new Promise<void>((accept, reject) => {
    const child = spawn(npmCli ? process.execPath : 'npm', npmCli ? [npmCli, ...args] : args, {
      cwd: directory,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.once('error', error => reject(new Error(
      `Could not install plugin "${ref}": ${error.message}. Make npm available and restart Easy API.`,
    )));
    child.once('exit', (code, signal) => code === 0 ? accept() : reject(new Error(
      `Could not install plugin "${ref}" (npm ${signal ? `received ${signal}` : `exited with code ${code}`}). Check the npm output and registry access, then restart Easy API.`,
    )));
  });
}

async function cachedPackage(cwd: string, name: string, version: string, logger: Logger): Promise<string> {
  const ref = `${name}@${version}`;
  const root = join(cwd, '.open-wa', 'plugins', 'packages');
  const directory = join(root, createHash('sha256').update(ref).digest('hex').slice(0, 24));
  let pending = installations.get(directory);
  if (!pending) {
    pending = (async () => {
      if (!await exists(join(directory, 'package.json'))) {
        await mkdir(root, { recursive: true });
        const staging = await mkdtemp(join(root, '.install-'));
        try {
          await writeFile(join(staging, 'package.json'), JSON.stringify({
            private: true,
            type: 'module',
            dependencies: { [name]: version },
          }));
          logger.info('plugin_installing', { ref });
          await install(staging, ref);
          // Publish a complete installation so another session never imports
          // partially installed dependencies. Concurrent installers may race.
          try {
            await rename(staging, directory);
          } catch (error) {
            if (!['EEXIST', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
          }
          logger.info('plugin_installed', { ref });
        } finally {
          await rm(staging, { recursive: true, force: true });
        }
      }
      const resolvePackage = await writeResolver(directory);
      return resolvePackage(name);
    })();
    installations.set(directory, pending);
    void pending.finally(() => installations.delete(directory)).catch(() => {});
  }
  return pending;
}

/** Only configured npm packages can reach the installer; local files never do. */
export async function resolvePlugin(ref: string, logger: Logger): Promise<string> {
  if (ref.startsWith('file:')) return new URL(ref).href;
  const cwd = process.cwd();
  if (isAbsolute(ref) || ref.startsWith('./') || ref.startsWith('../')) {
    return pathToFileURL(resolve(cwd, ref)).href;
  }

  const match = packagePattern.exec(ref);
  if (!match) throw new Error(`Invalid plugin reference "${ref}". Use an npm package name or a local file path.`);
  const [, name, requestedVersion] = match;
  if (!requestedVersion) {
    const resolvePackage = await projectResolver(cwd);
    try {
      return resolvePackage(name);
    } catch (error) {
      // Resolve before import: an installed plugin's own load errors must not
      // trigger an installation or hide a missing transitive dependency.
      if ((error as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') throw error;
    }
  }

  const version = requestedVersion ?? (name.startsWith('@open-wa/integration-') ? hostVersion : 'latest');
  return cachedPackage(cwd, name, version, logger);
}
