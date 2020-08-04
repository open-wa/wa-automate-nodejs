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
shell.cp('./node_modules/typedoc-plugin-pages/dist/theme/v2/templates/markdown-page.hbs', './node_modules/typedoc-neo-theme/bin/default/templates');