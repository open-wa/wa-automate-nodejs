/**
 * Copies assets needed into dist directory.
 * Should be executed after build.
 *
 * Used in development only.
 */

import * as shell from 'shelljs';

shell.cp('-R', './src/lib', 'dist');
shell.cp('./src/api/Client.ts', 'dist/api/_client_ts');
shell.cp('./src/controllers/popup/index.html', 'dist/controllers/popup/index.html');