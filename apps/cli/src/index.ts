#!/usr/bin/env node
// @ts-nocheck
/**
 * @open-wa/cli - WhatsApp CLI
 * 
 * This is the entry point for the CLI package.
 * During migration, this file will gradually take over CLI responsibilities
 * from packages/core/src/cli/index.ts
 * 
 * For now, we simply require the CLI module from core which auto-executes.
 */

// The CLI module auto-starts when imported (calls start() at the end)
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@open-wa/core/cli');
