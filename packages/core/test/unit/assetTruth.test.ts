import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CORE_TRANSPORT_ASSETS,
  LEGACY_WAPI_HELPER_GLOBAL_REQUIREMENTS,
  ScriptLoader,
  auditWapiHelperAssetRequirements,
} from '../../src/transport/ScriptLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const transportRoot = resolve(repoRoot, 'packages/core/src/transport');

describe('transport asset truth', () => {
  it('keeps the shipped wapi asset free of legacy helper globals', () => {
    const source = readFileSync(resolve(transportRoot, 'assets/wapi.js'), 'utf8');
    const audit = auditWapiHelperAssetRequirements(source);

    expect(audit.requiredLegacyHelpers).toEqual(LEGACY_WAPI_HELPER_GLOBAL_REQUIREMENTS);
    expect(audit.requiredLegacyHelpers).toEqual([]);
    // Known legacy dependencies in wapi.js that should be removed in future:
    // - axios: used for HTTP requests (should migrate to native fetch)
    // - jsSHA: used for SHA-256 hashing (should migrate to native crypto.subtle)
    // - Base64: used for base64 encoding (should migrate to native atob/btoa)
    expect(audit.forbiddenMatches).toEqual(['axios', 'jsSHA', 'Base64']);
  });

  it('loads only the active transport asset set', async () => {
    const loader = new ScriptLoader();

    await loader.loadAll();

    expect(loader.getManifest().map((entry) => entry.name).sort()).toEqual([...CORE_TRANSPORT_ASSETS].sort());
    expect(loader.has('wapi.js')).toBe(true);
  });

  it('documents that deferred init patch no longer uses a separate internal-event-handler script', async () => {
    const transportSource = readFileSync(resolve(transportRoot, 'Transport.ts'), 'utf8');
    const initPatchSource = readFileSync(resolve(transportRoot, 'initPatchScripts.ts'), 'utf8');

    expect(transportSource).not.toContain('injectInternalEventHandler');
    expect(initPatchSource).not.toContain('internal_event_handler_injected');
    expect(transportSource).toContain("registerRuntimeWapiBridge(");
  });
});
