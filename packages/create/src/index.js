import { spawn } from 'node:child_process';
import { lstat, mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { choices, defaults, flags, normalizeOptions, optionErrors, pluginChoices } from './options.js';
import { renderProject } from './templates.js';
import { findSystemBrowser } from './browser.js';

async function exists(path) {
  try { await lstat(path); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function install(directory) {
  const npmPath = process.env.npm_execpath;
  const npmCli = npmPath && /[\\/]npm-cli\.js$/.test(npmPath) ? npmPath
    : process.platform === 'win32' ? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js') : undefined;
  const args = ['install', '--no-audit', '--no-fund'];
  await new Promise((accept, reject) => {
    const child = spawn(npmCli ? process.execPath : 'npm', npmCli ? [npmCli, ...args] : args, { cwd: directory, stdio: 'inherit' });
    child.once('error', () => reject(new Error('npm could not start. Keep the generated files and run npm install inside the project.')));
    child.once('exit', code => code === 0 ? accept() : reject(new Error('Dependency installation did not finish. Keep the generated files, resolve the npm error, then run npm install inside the project.')));
  });
}

/** @param {string[]} args */
export async function initProject(args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    ...Object.fromEntries(Object.keys(flags).map(key => [key, { type: 'string' }])),
    yes: { type: 'boolean', short: 'y' }, help: { type: 'boolean', short: 'h' },
    install: { type: 'boolean' }, 'no-install': { type: 'boolean' },
  } });
  if (values.help) {
    console.log(`Usage: npm init @open-wa@latest [directory] -- [options]\n\n${Object.entries(flags).map(([key, flag]) => `  --${key.padEnd(15)} ${flag.description}`).join('\n')}\n  --yes, -y         Use defaults for missing choices\n  --no-install      Write files without installing dependencies\n\nConfigure visually: https://openwa.dev/new`);
    return;
  }
  if (positionals.length > 1) throw new Error('Choose one project directory.');
  if (values.install && values['no-install']) throw new Error('Choose either --install or --no-install.');
  const partial = {};
  for (const [flag, definition] of Object.entries(flags)) {
    if (values[flag] === undefined) continue;
    partial[definition.key] = flag === 'plugins' ? values[flag] === 'none' ? [] : values[flag].split(',').filter(Boolean) : values[flag];
  }
  if (positionals[0]) partial.directory = positionals[0];
  if (values['no-install'] || values.install) partial.install = !values['no-install'];
  let options = normalizeOptions(partial);
  const initialErrors = optionErrors(options);
  if (initialErrors.length) throw new Error(initialErrors.join('\n'));
  const missing = ['directory', 'mode', 'language', 'browser', 'plugins'].filter(key => partial[key] === undefined);
  if (!values.yes && !process.stdin.isTTY && (missing.length || (options.plugins.includes('voxtral') && partial.voxtralMode === undefined))) {
    throw new Error('An interactive terminal is required for missing choices. Pass --yes to use defaults, or copy a complete command from https://openwa.dev/new.');
  }
  if (!values.yes && process.stdin.isTTY) {
    const p = await import('@clack/prompts');
    p.intro('Create your open-wa project');
    const ask = async pending => {
      const value = await pending;
      if (p.isCancel(value)) { p.cancel('Setup cancelled.'); return undefined; }
      return value;
    };
    if (partial.directory === undefined) {
      const directory = await ask(p.text({ message: 'Project folder', initialValue: options.directory,
        validate: value => optionErrors({ ...options, directory: value ?? '' })[0] }));
      if (directory === undefined) return;
      options.directory = directory;
    }
    for (const key of ['mode', 'language', 'browser']) {
      if (partial[key] !== undefined) continue;
      const detected = key === 'browser' ? await findSystemBrowser('chrome') : undefined;
      if (detected) p.log.info(`Chrome found: ${detected}`);
      const value = await ask(p.select({ message: { mode: 'What would you like to create?', language: 'Which language?', browser: 'Which browser should this project use?' }[key],
        initialValue: key === 'browser' && !detected ? 'chrome' : options[key],
        options: choices[key].map(choice => ({ value: choice.value, label: choice.label, hint: choice.description,
          disabled: choice.value === 'system-chrome' && !detected })) }));
      if (value === undefined) return;
      options[key] = value;
    }
    if (partial.plugins === undefined) {
      const plugins = await ask(p.multiselect({ message: 'Which plugins would you like to set up?', required: false,
        options: pluginChoices.map(plugin => ({ value: plugin.value, label: plugin.label,
          hint: plugin.modes.includes(options.mode) ? plugin.description : 'Needs Easy API', disabled: !plugin.modes.includes(options.mode) })) }));
      if (plugins === undefined) return;
      options.plugins = plugins;
    }
    if (options.plugins.includes('voxtral') && partial.voxtralMode === undefined) {
      const mode = await ask(p.select({ message: 'What should Voxtral handle?', initialValue: options.voxtralMode,
        options: choices.voxtralMode.map(choice => ({ value: choice.value, label: choice.label, hint: choice.description })) }));
      if (mode === undefined) return;
      options.voxtralMode = mode;
    }
    if (partial.install === undefined) {
      const shouldInstall = await ask(p.confirm({ message: 'Install project dependencies now?', initialValue: true }));
      if (shouldInstall === undefined) return;
      options.install = shouldInstall;
    }
  }
  const errors = optionErrors(options);
  if (errors.length) throw new Error(errors.join('\n'));
  if (options.browser === 'system-chrome' && !await findSystemBrowser('chrome')) {
    throw new Error('Chrome was not found. Install Chrome or choose --browser chrome or --browser chromium to download a browser at startup.');
  }
  const directory = resolve(options.directory);
  const files = renderProject(options);
  const conflicts = [];
  for (const file of Object.keys(files)) if (await exists(resolve(directory, file))) conflicts.push(file);
  if (conflicts.length) throw new Error(`These files already exist: ${conflicts.join(', ')}. Choose another folder. No files were changed.`);
  await mkdir(directory, { recursive: true });
  const created = [];
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = resolve(directory, name);
      await writeFile(path, content, { flag: 'wx' });
      created.push(path);
    }
  } catch (error) {
    await Promise.all(created.map(path => unlink(path)));
    throw error;
  }
  console.log(`Created ${directory}\n${Object.keys(files).map(file => `  ${file}`).join('\n')}`);
  if (options.install) await install(directory);
  console.log(`\nNext:\n  cd ${options.directory}\n${options.install ? '' : '  npm install\n'}${files['.env.example'] ? '  Copy .env.example to .env and fill in your integration settings\n' : ''}  npm start\n\nBrowsers and configured plugins are downloaded only when needed at startup.\n`);
}
