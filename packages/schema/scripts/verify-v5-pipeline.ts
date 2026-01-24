#!/usr/bin/env ts-node
/**
 * E2E verification script for v5 schema-first pipeline
 * Run with: ts-node scripts/verify-v5-pipeline.ts
 */

import { clientRegistry } from '../src/registry';
import '../src/methods';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying v5 Schema-First Pipeline...\n');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, message?: string) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name}${message ? `: ${message}` : ''}`);
        failed++;
    }
}

console.log('📦 Registry Checks:');
const methods = clientRegistry.getAll();
check('Methods registered', methods.length > 100, `Found ${methods.length}`);
check('sendText exists', clientRegistry.has('sendText'));
check('getChat exists', clientRegistry.has('getChat'));
check('getMe exists', clientRegistry.has('getMe'));

let metaComplete = true;
methods.forEach((def) => {
    if (!def.meta.functionName || !def.meta.inputSchema) {
        metaComplete = false;
    }
});
check('All methods have complete metadata', metaComplete);

console.log('\n📄 Generated Files:');
const generatedDir = path.join(__dirname, '../src/generated');

const openApiPath = path.join(generatedDir, 'openapi.json');
check('openapi.json exists', fs.existsSync(openApiPath));

if (fs.existsSync(openApiPath)) {
    try {
        JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
        check('openapi.json is valid JSON', true);
    } catch (e) {
        check('openapi.json is valid JSON', false, (e as Error).message);
    }
}

const typesPath = path.join(generatedDir, 'types.ts');
check('types.ts exists', fs.existsSync(typesPath));

const baseClientPath = path.join(generatedDir, 'BaseClient.ts');
check('BaseClient.ts exists', fs.existsSync(baseClientPath));

console.log('\n🏷️  Namespace Distribution:');
const namespaces = new Map<string, number>();
methods.forEach((def) => {
    const ns = def.meta.namespace || 'core';
    namespaces.set(ns, (namespaces.get(ns) || 0) + 1);
});
namespaces.forEach((count, ns) => {
    console.log(`  📁 ${ns}: ${count} methods`);
});

console.log('\n📊 Summary:');
console.log(`  Total methods: ${methods.length}`);
console.log(`  Passed checks: ${passed}`);
console.log(`  Failed checks: ${failed}`);

if (failed > 0) {
    console.log('\n❌ Pipeline verification FAILED');
    process.exit(1);
} else {
    console.log('\n✅ Pipeline verification PASSED');
    process.exit(0);
}
