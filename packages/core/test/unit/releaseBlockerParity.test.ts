import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import { Transport } from '../../src/transport/Transport.js';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';
import type {
  DisposableHandle,
  IBrowser,
  IDriver,
  IElementHandle,
  IFrame,
  IPage,
  IRequest,
  LaunchOptions,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';

type MatrixEntry = {
  id: string;
  classification: 'restore' | 'downgrade' | 'deprecate';
  releaseBlocker: boolean;
  status: 'gap' | 'present' | 'accepted_non_blocker';
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const legacyRoot = process.env.OPENWA_LEGACY_ROOT ?? '/Users/Mohammed/projects/tools/wa copy/src';

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function readLegacyFile(relativePath: string): string {
  return readFileSync(resolve(legacyRoot, relativePath), 'utf8');
}

function loadMatrix(): MatrixEntry[] {
  return JSON.parse(
    readFileSync(resolve(repoRoot, 'packages/core/test/fixtures/release-blocker-parity-matrix.json'), 'utf8')
  ) as MatrixEntry[];
}

class MinimalPage implements IPage {
  readonly name = 'fake-driver';

  async goto(): Promise<void> {}
  url(): string {
    return 'about:blank';
  }
  async reload(): Promise<void> {}
  mainFrame(): IFrame | null {
    return null;
  }
  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    return fn(arg);
  }
  async evaluateScript<Ret = unknown>(): Promise<Ret> {
    return undefined as Ret;
  }
  async addInitScript(): Promise<DisposableHandle> {
    return {
      dispose(): void {},
    };
  }
  async setViewport(): Promise<void> {}
  async setUserAgent(): Promise<void> {}
  async setRequestInterception(): Promise<void> {}
  async waitForSelector(): Promise<IElementHandle | null> {
    return null;
  }
  async waitForFunction(_script: string, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction<Arg>(_fn: (arg: Arg) => boolean, _arg: Arg, _options?: WaitForFunctionOptions): Promise<void>;
  async waitForFunction(): Promise<void> {}
  async $(): Promise<IElementHandle | null> {
    return null;
  }
  async $$(): Promise<IElementHandle[]> {
    return [];
  }
  async click(): Promise<void> {}
  async type(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return new Uint8Array();
  }
  async exposeFunction(): Promise<void> {}
  on(_event: string, _handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): DisposableHandle {
    return {
      dispose(): void {},
    };
  }
  off(_event: string, _handler: ((payload: IRequest) => void | Promise<void>) | (() => void | Promise<void>)): void {}
  async close(): Promise<void> {}
  isClosed(): boolean {
    return false;
  }
  unwrap(): unknown {
    return this;
  }
}

class MinimalBrowser implements IBrowser {
  readonly name = 'fake-driver';

  async newPage(): Promise<IPage> {
    return new MinimalPage();
  }
  async pages(): Promise<IPage[]> {
    return [];
  }
  async close(): Promise<void> {}
  isConnected(): boolean {
    return true;
  }
  async versionString(): Promise<string> {
    return 'fake';
  }
  unwrap(): unknown {
    return this;
  }
}

class CaptureDriver implements IDriver {
  readonly name = 'fake-driver';
  public capturedLaunchOptions: LaunchOptions | undefined;

  async init(): Promise<void> {}
  async launch(options?: LaunchOptions): Promise<IBrowser> {
    this.capturedLaunchOptions = options;
    return new MinimalBrowser();
  }
  async connect(): Promise<IBrowser> {
    return new MinimalBrowser();
  }
  unwrap(): unknown {
    return this;
  }
}

describe('release-blocker parity matrix', () => {
  it('tracks blocker restores separately from accepted non-blockers', () => {
    const matrix = loadMatrix();

    expect(matrix.filter((entry) => entry.releaseBlocker).map((entry) => entry.id)).toEqual([
      'event_bridge_delivery',
      'frame_navigation_reinjection',
      'post_auth_reinjection_ripe_gate',
      'client_loaded_finalization',
      'user_data_dir_launch_threading',
      'broken_method_integrity_gate',
      'readiness_truth_host_vs_session',
    ]);

    expect(
      matrix
        .filter((entry) => !entry.releaseBlocker)
        .map((entry) => ({ id: entry.id, classification: entry.classification, status: entry.status }))
    ).toEqual([
      {
        id: 'popup_qr_parity',
        classification: 'downgrade',
        status: 'accepted_non_blocker',
      },
      {
        id: 'json_session_restore',
        classification: 'deprecate',
        status: 'accepted_non_blocker',
      },
    ]);
  });
});

describe('release-blocker parity probes', () => {
  it('requires a non-launch browser→node runtime bridge binding after WAPI injection', () => {
    const legacyClientSource = readLegacyFile('api/Client.ts');
    const currentTransportSource = readRepoFile('packages/core/src/transport/Transport.ts');
    const currentInjectionControllerSource = readRepoFile('packages/core/src/transport/InjectionController.ts');

    expect(legacyClientSource).toMatch(/exposeFunction\(funcName, \(obj: any\) =>fn\(obj\)\)/);
    expect(legacyClientSource).toMatch(/WAPI\[`\$\{funcName\}`\]\(obj => window\[funcName\]\(obj\)\)/);

    const nonLaunchBindings = `${currentTransportSource}\n${currentInjectionControllerSource}`.match(
      /exposeFunction\(['"`](?!ProgressBarEvent|CriticalInternalMessage)[^'"`]+['"`]/g
    );

    expect(
      (nonLaunchBindings?.length ?? 0) > 0
      || currentTransportSource.includes('registerRuntimeWapiBridge(')
    ).toBe(true);
  });

  it('requires a frame-navigation reinjection hook like legacy browser.ts', () => {
    const legacyBrowserSource = readLegacyFile('controllers/browser.ts');
    const currentTransportSource = readRepoFile('packages/core/src/transport/Transport.ts');
    const currentDriverSurface = readRepoFile('packages/driver-interface/src/driver.ts');

    expect(legacyBrowserSource).toMatch(/waPage\.on\(["']framenavigated["']/);
    expect(`${currentTransportSource}\n${currentDriverSurface}`).toMatch(/framenavigated|frameNavigated|session\.frame\.navigated/);
  });

  it('requires a post-auth ripe-session gate before reinjection', () => {
    const legacyInitializerSource = readLegacyFile('controllers/initializer.ts');
    const currentCreateClientSource = readRepoFile('packages/core/src/createClient.ts');

    expect(legacyInitializerSource).toMatch(/waitForRipeSession\(/);
    expect(legacyInitializerSource).toMatch(/injectApi\(waPage, spinner, true\)/);
    expect(currentCreateClientSource).toMatch(/waitForRipeSession|ripe session/i);
  });

  it('threads userDataDir through Transport.initialize launch options', async () => {
    const driver = new CaptureDriver();
    const transport = new Transport({
      driver,
      events: { emit: vi.fn() } as unknown as HyperEmitter<OpenWAEventMap>,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as Logger,
      headless: true,
      browserArgs: ['--no-sandbox'],
      userDataDir: '/tmp/release-blocker-profile',
    } as Transport['constructor'] extends new (options: infer T) => Transport ? T : never);

    await transport.initialize();

    expect(driver.capturedLaunchOptions?.userDataDir).toBe('/tmp/release-blocker-profile');
  });

  it('requires a broken-method integrity gate or equivalent capability inventory', () => {
    const legacyIntegritySource = readLegacyFile('controllers/launch_checks.ts');
    const currentCoreSource = `${readRepoFile('packages/core/src/createClient.ts')}\n${readRepoFile('packages/core/src/transport/Transport.ts')}`;

    expect(legacyIntegritySource).toMatch(/BROKEN_METHODS/);
    expect(legacyIntegritySource).toMatch(/checkWAPIHash|integrityCheck/);
    expect(currentCoreSource).toMatch(/broken[_ -]?method|integrityCheck|checkWAPIHash|method inventory/i);
  });
});
