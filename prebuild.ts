/**
 * Copies assets needed into dist directory.
 * Should be executed after build.
 *
 * Used in development only.
 */

import * as shell from 'shelljs';

shell.cp('-R', './src/lib', 'dist');
shell.cp('./src/api/Client.ts', 'dist/api');
// shell.cp('-R', './src/api', 'dist');
