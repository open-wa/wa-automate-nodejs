import * as shell from 'shelljs';

// shell.cp('./node_modules/typedoc-plugin-pages/dist/theme/v2/templates/markdown-page.hbs', './node_modules/typedoc-neo-theme/bin/default/templates');
shell.cp('./docs-source/layouts/default.hbs', './node_modules/typedoc-plugin-pages/dist/theme/v2/layouts');