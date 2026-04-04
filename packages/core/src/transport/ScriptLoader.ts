import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const CORE_TRANSPORT_ASSETS = [
  'init_patch.js',
  'prog_observer.js',
  'wapi.js',
  'launch.js',
] as const;

export const LEGACY_WAPI_HELPER_GLOBAL_REQUIREMENTS: readonly string[] = [];

const WAPI_FORBIDDEN_LEGACY_HELPER_PATTERNS = [
  { helper: 'axios', pattern: /\baxios(?:\.\w+|\s*\()/ },
  { helper: 'jsSHA', pattern: /\bjsSHA\b/ },
  { helper: 'Base64', pattern: /window\.Base64\b/ },
  { helper: 'QRCode', pattern: /\bQRCode\s*\(/ },
  { helper: 'CryptoJS', pattern: /\bCryptoJS\./ },
  { helper: 'objectHash', pattern: /\bobjectHash\./ },
] as const;

export function auditWapiHelperAssetRequirements(wapiSource: string): {
  requiredLegacyHelpers: readonly string[];
  forbiddenMatches: string[];
} {
  const forbiddenMatches = WAPI_FORBIDDEN_LEGACY_HELPER_PATTERNS
    .filter(({ pattern }) => pattern.test(wapiSource))
    .map(({ helper }) => helper);

  return {
    requiredLegacyHelpers: LEGACY_WAPI_HELPER_GLOBAL_REQUIREMENTS,
    forbiddenMatches,
  };
}

/**
 * ScriptLoader — loads browser-injectable JS assets from the `assets/` directory.
 *
 * Mirrors the legacy `ScriptLoader` pattern from `wa-automate-nodejs/src/controllers/script_preloader.ts`.
 * Assets are read from disk once and cached in memory for the lifetime of the process.
 *
 * @example
 * ```ts
 * const loader = new ScriptLoader();
 * await loader.loadAll();
 * const initPatchJS = loader.get('init_patch.js');
 * ```
 */
export class ScriptLoader {
  /** Ordered list of asset filenames to preload */
  private readonly scripts: string[];

  /** Cached file contents keyed by filename */
  private contentRegistry: Map<string, string> = new Map();

  /** Resolved base directory for asset files */
  private readonly assetsDir: string;

  constructor(scripts?: string[]) {
    this.scripts = scripts ?? [...CORE_TRANSPORT_ASSETS];

    // In source, this file lives in src/transport and assets sit beside it in ./assets.
    // In bundled output, assets are copied to dist/transport/assets by copy-launch-script.mjs.
    const candidates = [
      join(__dirname, 'assets'),
      join(__dirname, 'transport', 'assets'),
    ];

    const resolved = candidates.find((candidate) => existsSync(candidate));
    if (!resolved) {
      throw new Error(`ScriptLoader could not resolve asset directory from candidates: ${candidates.join(', ')}`);
    }

    this.assetsDir = resolved;
  }

  /**
   * Load all registered scripts into memory.
   * Returns the full content registry.
   */
  async loadAll(): Promise<Map<string, string>> {
    await Promise.all(this.scripts.map((name) => this.load(name)));
    return this.contentRegistry;
  }

  /**
   * Load a single script by filename. Returns its content.
   * Uses the cache if the script has already been loaded.
   */
  async load(scriptName: string): Promise<string> {
    const cached = this.contentRegistry.get(scriptName);
    if (cached) {
      return cached;
    }

    const filePath = join(this.assetsDir, scriptName);
    const content = await readFile(filePath, 'utf8');

    if (scriptName === 'wapi.js') {
      const audit = auditWapiHelperAssetRequirements(content);
      if (audit.forbiddenMatches.length > 0) {
        throw new Error(
          `ScriptLoader: wapi.js still depends on legacy helper globals: ${audit.forbiddenMatches.join(', ')}`
        );
      }
    }

    this.contentRegistry.set(scriptName, content);
    return content;
  }

  /**
   * Get a previously loaded script. Throws if not yet loaded.
   */
  get(scriptName: string): string {
    const content = this.contentRegistry.get(scriptName);
    if (content === undefined) {
      throw new Error(
        `ScriptLoader: "${scriptName}" not loaded. Call load() or loadAll() first.`
      );
    }
    return content;
  }

  /**
   * Check if a script has been loaded.
   */
  has(scriptName: string): boolean {
    return this.contentRegistry.has(scriptName);
  }

  /**
   * Clear all cached scripts (useful for testing / hot-reload scenarios).
   */
  flush(): void {
    this.contentRegistry.clear();
  }

  /**
   * Get a snapshot of all loaded scripts and their byte lengths.
   */
  getManifest(): Array<{ name: string; bytes: number }> {
    return Array.from(this.contentRegistry.entries()).map(([name, content]) => ({
      name,
      bytes: content.length,
    }));
  }
}
