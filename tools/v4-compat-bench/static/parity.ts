/**
 * v4 → v5 static method parity matrix (issue #3339, task C1).
 *
 * Compares the v4 public Client surface (extracted from @open-wa/legacy's
 * Client.ts, which *is* the v4 implementation) against the v5 schema registry
 * (clientRegistry.getAll()). Produces a deterministic report of which v4
 * methods are covered directly, covered via an alias, missing, or have a
 * different documented arity.
 *
 * Run:
 *   pnpm tsx tools/v4-compat-bench/static/parity.ts          # write report
 *   pnpm tsx tools/v4-compat-bench/static/parity.ts --check  # fail if worse
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, Scope } from 'ts-morph';

// The v5 method surface is read from the BUILT @open-wa/schema dist by relative
// path, so this dev tool does not need to be a workspace member. CI must build
// @open-wa/schema before running this (see the workflow step).
type SchemaModule = {
  clientRegistry: {
    getAll(): Array<{
      meta: { functionName: string; allAliases?: string[]; parameterOrder?: string[] };
    }>;
  };
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');
const LEGACY_CLIENT = path.join(REPO_ROOT, 'packages/legacy/src/api/Client.ts');
const SCHEMA_DIST = path.join(REPO_ROOT, 'packages/schema/dist/index.mjs');
const REPORT_PATH = path.join(HERE, 'v4-parity-report.json');

async function loadClientRegistry(): Promise<SchemaModule['clientRegistry']> {
  const mod = (await import(pathToFileUrl(SCHEMA_DIST))) as SchemaModule;
  return mod.clientRegistry;
}

function pathToFileUrl(p: string): string {
  return new URL(`file://${p}`).href;
}

export type V4Method = { name: string; requiredParams: number };

/** Extract the v4 public Client method surface via ts-morph. */
export function extractV4Methods(clientPath = LEGACY_CLIENT): V4Method[] {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { allowJs: false },
  });
  const source = project.addSourceFileAtPath(clientPath);
  const clientClass = source.getClassOrThrow('Client');

  const methods: V4Method[] = [];
  for (const method of clientClass.getInstanceMethods()) {
    const name = method.getName();
    const scope = method.getScope();
    // Public surface only: no private/protected, no _internal, no getters.
    if (scope === Scope.Private || scope === Scope.Protected) continue;
    if (name.startsWith('_')) continue;

    const requiredParams = method
      .getParameters()
      .filter((p) => !p.isOptional() && !p.hasInitializer() && !p.isRestParameter()).length;

    methods.push({ name, requiredParams });
  }

  // De-dupe (overloads) keeping the max required-param count seen.
  const byName = new Map<string, number>();
  for (const m of methods) {
    byName.set(m.name, Math.max(byName.get(m.name) ?? 0, m.requiredParams));
  }
  return [...byName.entries()]
    .map(([name, requiredParams]) => ({ name, requiredParams }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type V5Method = { functionName: string; aliases: string[]; parameterOrder: string[] };

async function extractV5Methods(): Promise<V5Method[]> {
  const clientRegistry = await loadClientRegistry();
  return clientRegistry
    .getAll()
    .map((def) => ({
      functionName: def.meta.functionName,
      aliases: [...(def.meta.allAliases ?? [])].sort((a, b) => a.localeCompare(b)),
      parameterOrder: def.meta.parameterOrder ?? [],
    }))
    .sort((a, b) => a.functionName.localeCompare(b.functionName));
}

export type ParityReport = {
  generatedFrom: { v4: string; v5: string };
  totals: {
    v4Methods: number;
    v5Methods: number;
    covered: number;
    aliased: number;
    missing: number;
    arityMismatch: number;
  };
  covered: string[];
  aliased: { v4: string; v5: string }[];
  missing: string[];
  arityMismatch: { method: string; v4RequiredParams: number; v5ParameterOrder: number }[];
};

export async function buildReport(): Promise<ParityReport> {
  const v4 = extractV4Methods();
  const v5 = await extractV5Methods();

  const functionNames = new Set(v5.map((m) => m.functionName));
  const aliasToFn = new Map<string, string>();
  for (const m of v5) for (const alias of m.aliases) aliasToFn.set(alias, m.functionName);
  const paramCountByFn = new Map(v5.map((m) => [m.functionName, m.parameterOrder.length]));

  const covered: string[] = [];
  const aliased: { v4: string; v5: string }[] = [];
  const missing: string[] = [];
  const arityMismatch: ParityReport['arityMismatch'] = [];

  for (const method of v4) {
    if (functionNames.has(method.name)) {
      covered.push(method.name);
      const v5Params = paramCountByFn.get(method.name) ?? 0;
      // Only flag when v4 REQUIRES more args than v5 documents in its order —
      // extra optional/object params on either side are expected.
      if (method.requiredParams > v5Params) {
        arityMismatch.push({
          method: method.name,
          v4RequiredParams: method.requiredParams,
          v5ParameterOrder: v5Params,
        });
      }
    } else if (aliasToFn.has(method.name)) {
      aliased.push({ v4: method.name, v5: aliasToFn.get(method.name)! });
    } else {
      missing.push(method.name);
    }
  }

  covered.sort((a, b) => a.localeCompare(b));
  aliased.sort((a, b) => a.v4.localeCompare(b.v4));
  missing.sort((a, b) => a.localeCompare(b));
  arityMismatch.sort((a, b) => a.method.localeCompare(b.method));

  return {
    generatedFrom: {
      v4: 'packages/legacy/src/api/Client.ts',
      v5: '@open-wa/schema clientRegistry.getAll()',
    },
    totals: {
      v4Methods: v4.length,
      v5Methods: v5.length,
      covered: covered.length,
      aliased: aliased.length,
      missing: missing.length,
      arityMismatch: arityMismatch.length,
    },
    covered,
    aliased,
    missing,
    arityMismatch,
  };
}

function serialize(report: ParityReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

async function main() {
  const report = await buildReport();
  const serialized = serialize(report);
  const check = process.argv.includes('--check');

  if (check) {
    let committed: ParityReport;
    try {
      committed = JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as ParityReport;
    } catch {
      throw new Error('No committed v4-parity-report.json. Run without --check first.');
    }

    // Gate: missing and arityMismatch must not GROW vs the committed baseline.
    const regressed =
      report.totals.missing > committed.totals.missing ||
      report.totals.arityMismatch > committed.totals.arityMismatch;

    console.log(
      `v4 parity: ${report.totals.covered} covered, ${report.totals.aliased} aliased, ` +
        `${report.totals.missing} missing, ${report.totals.arityMismatch} arity-mismatch ` +
        `(of ${report.totals.v4Methods} v4 methods).`,
    );

    if (regressed) {
      console.error(
        `::error::v4 parity regressed. missing ${committed.totals.missing}->${report.totals.missing}, ` +
          `arityMismatch ${committed.totals.arityMismatch}->${report.totals.arityMismatch}. ` +
          `Update the report only if the drop is an intentional T2 decision.`,
      );
      process.exit(1);
    }
    return;
  }

  writeFileSync(REPORT_PATH, serialized);
  console.log(`Wrote ${path.relative(REPO_ROOT, REPORT_PATH)}`);
  console.log(
    `${report.totals.covered} covered, ${report.totals.aliased} aliased, ` +
      `${report.totals.missing} missing, ${report.totals.arityMismatch} arity-mismatch.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
