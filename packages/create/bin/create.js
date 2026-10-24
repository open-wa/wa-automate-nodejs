#!/usr/bin/env node
import { initProject } from '../src/index.js';

initProject(process.argv.slice(2)).catch(error => {
  console.error(`Could not create the project: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
