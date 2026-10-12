import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clientRuntimeListenerSurface, clientRuntimeMethodSurface } from '../runtimeSurface';
import { runtimeListenerSurface } from '../../../core/src/transport/runtimeListenerSurface';

type WapiTerminalStatus = 'implemented' | 'stub_false';

function getFixturePath(relativePath: string): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, relativePath);
}

function extractDeclaredClientMethods(clientSource: string): string[] {
  return [...new Set([
    ...[...clientSource.matchAll(/declare\s+([A-Za-z0-9_]+)\s*:/g)].map(match => match[1]),
    ...[...clientSource.matchAll(/^  (?:async )?([A-Za-z0-9_]+)\(/gm)].map(match => match[1]).filter(name => Object.hasOwn(clientRuntimeMethodSurface, name)),
  ])].sort();
}

function extractClientListenerMethods(clientSource: string): string[] {
  return [...clientSource.matchAll(/^\s{2}(on[A-Z][A-Za-z0-9_]+)\(/gm)]
    .map((match) => match[1])
    .sort();
}

function extractWapiTerminalAssignments(wapiSource: string): Map<string, WapiTerminalStatus> {
  const assignments = new Map<string, WapiTerminalStatus>();

  for (const line of wapiSource.split('\n')) {
    const match = line.match(/window\.WAPI\.([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:function\b|\(?[^=]*\)?\s*=>)/);
    if (!match) {
      continue;
    }

    assignments.set(match[1], line.includes('return false;') ? 'stub_false' : 'implemented');
  }

  return assignments;
}

describe('Client runtime surface audit', () => {
  const clientSource = readFileSync(getFixturePath('../Client.ts'), 'utf8');
  const wapiSource = readFileSync(getFixturePath('../../../core/src/transport/assets/wapi.js'), 'utf8');
  const declaredMethods = extractDeclaredClientMethods(clientSource);
  const listenerMethods = extractClientListenerMethods(clientSource);
  const wapiAssignments = extractWapiTerminalAssignments(wapiSource);
  const commonPatches = JSON.parse(readFileSync(getFixturePath('../../../../patches.json'), 'utf8')) as string[];

  it('tracks every declared facade method in the runtime inventory', () => {
    expect(Object.keys(clientRuntimeMethodSurface).sort()).toEqual(declaredMethods);
  });

  it('tracks every listener wrapper in the runtime inventory', () => {
    expect(Object.keys(clientRuntimeListenerSurface).sort()).toEqual(listenerMethods);
  });

  it('checks immutable-asset backing separately from declared live-patch methods', () => {
    for (const [clientMethod, entry] of Object.entries(clientRuntimeMethodSurface)) {
      if (!entry.runtimeMethod) {
        expect(entry.reason).toBeTruthy();
        continue;
      }

      // Live patches install after the immutable asset, so its assignments
      // cannot establish their final runtime implementation.
      if ('runtimeSource' in entry && entry.runtimeSource === 'live-patch') {
        expect(entry.support).toBe('runtime');
        expect(entry.runtimePatch === 'private' ? Boolean(entry.reason) : entry.runtimePatch === 'common' ? commonPatches.some(patch => patch.length > 0) : commonPatches.some(patch => patch.startsWith(`/* OpenWA feature: ${entry.runtimePatch} */\n`))).toBe(true);
        continue;
      }

      const finalStatus = wapiAssignments.get(entry.runtimeMethod);

      if (entry.support === 'runtime') {
        expect(finalStatus, `${clientMethod} -> ${entry.runtimeMethod}`).toBe('implemented');
      } else {
        expect(
          finalStatus === undefined || finalStatus === 'stub_false',
          `${clientMethod} should stay explicitly unsupported until real runtime backing exists`,
        ).toBe(true);
      }
    }
  });

  it('only marks listeners as runtime-backed when core ships matching bridge or navigation support', () => {
    for (const [listenerName, entry] of Object.entries(clientRuntimeListenerSurface)) {
      if (entry.support === 'runtime' || entry.support === 'licensed') {
        expect(entry.runtimeSupportEvent).toBeTruthy();
        if (entry.support === 'runtime') expect(runtimeListenerSurface).toHaveProperty(entry.runtimeSupportEvent as string);
        else expect(entry.reason).toBeTruthy();
        continue;
      }

      expect(entry.runtimeSupportEvent).toBeUndefined();
    }
  });
});
