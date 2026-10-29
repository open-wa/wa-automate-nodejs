import packageJson from '../package.json' with { type: 'json' };
import { normalizeOptions, optionErrors, pluginChoices } from './options.js';

/** @param {import('./options.js').SetupOptions} input @returns {Record<string, string>} */
export function renderProject(input) {
  const options = normalizeOptions(input);
  const errors = optionErrors(options);
  if (errors.length) throw new Error(errors.join(' '));
  const ext = options.language;
  const name = options.directory.split(/[/\\]/).filter(Boolean).at(-1)?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'my-bot';
  const projectName = /^[a-z0-9]/.test(name) ? name : 'my-bot';
  const configName = `wa.config.${ext}`;
  const calling = options.plugins.includes('voxtral') && options.voxtralMode !== 'voice-notes';
  const env = options.mode === 'easy-api' ? ['# Optional API key. Use at least 8 characters when setting it.', 'WA_API_KEY='] : [];
  const config = [`  sessionId: ${JSON.stringify(projectName)},`];
  if (options.mode === 'easy-api') config.push("  host: '127.0.0.1',", '  apiKey: process.env.WA_API_KEY || undefined,');
  if (options.browser === 'auto') config.push("  browser: { source: 'auto' },");
  else if (options.browser === 'system-chrome') config.push("  browser: { source: 'system', kind: 'chrome', download: 'never' },");
  else config.push(`  browser: { source: 'managed', kind: '${options.browser}', download: 'auto' },`);
  if (calling) { config.push('  licenseKey: process.env.OPENWA_LICENSE_KEY || undefined,'); env.push('# Calling-enabled open-wa license', 'OPENWA_LICENSE_KEY='); }
  if (options.plugins.length) {
    config.push(`  plugins: ${JSON.stringify(options.plugins.map(id => pluginChoices.find(plugin => plugin.value === id).package))},`, '  pluginConfig: {');
    if (options.plugins.some(id => ['jev', 'voxtral'].includes(id))) env.push('# Mistral API key for answer generation and optional Voxtral audio', 'MISTRAL_API_KEY=', '# Jev API key for decisions and chat actions', 'JEV_API_KEY=');
    for (const id of options.plugins) {
      if (id === 'voxtral') config.push(`    voxtral: { mode: '${options.voxtralMode}' },`);
      if (id === 'jev') config.push('    jev: {},');
      if (id === 'webhook') {
        config.push("    webhook: { url: process.env.WEBHOOK_URL, events: ['message.received'] },");
        env.push('# HTTPS endpoint receiving WhatsApp message events', 'WEBHOOK_URL=');
      }
      if (id === 'chatwoot') {
        config.push('    chatwoot: {', '      chatwootUrl: process.env.CHATWOOT_URL,', '      chatwootApiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN,', '      apiHost: process.env.OPENWA_PUBLIC_URL,', '    },');
        env.push('# Chatwoot account URL, e.g. https://app.chatwoot.com/api/v1/accounts/123', 'CHATWOOT_URL=', 'CHATWOOT_API_ACCESS_TOKEN=', '# Your reachable Easy API URL for Chatwoot callbacks', 'OPENWA_PUBLIC_URL=');
      }
    }
    config.push('  },');
  }
  const typeImport = ext === 'ts' ? "import type { CreateOptions } from '@open-wa/wa-automate';\n" : '';
  const configSource = `import { existsSync } from 'node:fs';\n${typeImport}\nif (existsSync('.env')) process.loadEnvFile('.env');\n\nexport default {\n${config.join('\n')}\n}${ext === 'ts' ? ' satisfies CreateOptions' : ''};\n`;
  const assistant = options.plugins.includes('jev');
  const entry = options.mode === 'easy-api' ? undefined : `import { create } from '@open-wa/wa-automate';\nimport config from './${configName}';\n\nconst client = await create(config);\n${assistant ? "console.log('WhatsApp is ready. Send a message from another account to talk to Jev.');" : "console.log('WhatsApp is ready. Send !ping from another account.');\n\nclient.onMessage(async message => {\n  if (!message.fromMe && message.body === '!ping') {\n    await client.sendText(message.from, 'pong');\n  }\n});"}\n\nfor (const signal of ['SIGINT', 'SIGTERM']${ext === 'ts' ? ' as const' : ''}) {\n  process.once(signal, () => {\n    void client.stop(signal).catch(console.error);\n  });\n}\n`;
  const manifest = {
    name: projectName, version: '0.0.0', private: true, type: 'module',
    scripts: { start: options.mode === 'easy-api' ? 'wa-automate' : `node index.${ext}` },
    engines: { node: '>=22.21.1' },
    dependencies: { '@open-wa/wa-automate': packageJson.version },
    ...(ext === 'ts' ? { devDependencies: { '@types/node': '^22.0.0', typescript: '^5.9.0' } } : {}),
  };
  const readme = `# ${projectName}\n\n${options.mode === 'easy-api' ? 'An open-wa Easy API project with the Neo dashboard.' : assistant ? 'A persistent open-wa SDK chat assistant powered by Jev.' : 'A persistent open-wa SDK bot. Send !ping to receive pong.'}\n\n## Start\n\nUse Node.js 22.21.1 or newer. ${options.install ? 'Dependencies are installed by the initializer.' : 'Run npm install first.'}\n${env.length ? '\nCopy .env.example to .env and fill in the values for your selected integrations.\n' : ''}\n\`\`\`bash\nnpm start\n\`\`\`\n\nLink WhatsApp using the QR code. Stop with Ctrl+C.\n${options.mode === 'easy-api' ? '\nOpen http://127.0.0.1:8080/dashboard/ for Neo and http://127.0.0.1:8080/api-docs/ for the HTTP API.\n' : '\nAdd your handlers in index.' + ext + '. SDK mode runs your code without an HTTP server or Neo dashboard. Choose Easy API if you want those controls.\n'}\n## Configuration\n\nEdit ${configName}. ${options.mode === 'sdk' ? 'The bot imports this file and passes its settings to create().' : 'Easy API discovers this file automatically.'}\n\nThe browser choice is ${options.browser}. Browser downloads and selected plugins are installed only when needed at startup and reused later.\n${calling ? '\nVoxtral calls require a calling-enabled open-wa license in OPENWA_LICENSE_KEY.\n' : ''}\nLocal .env files, dependency folders and session data are ignored by Git.\n\n[Setup guide](https://openwa.dev/docs/getting-started/initializer) · [Configure a project](https://openwa.dev/new)\n`;
  /** @type {Record<string, string>} */
  const files = {
    'package.json': `${JSON.stringify(manifest, null, 2)}\n`,
    [configName]: configSource,
    ...(entry ? { [`index.${ext}`]: entry } : {}),
    ...(ext === 'ts' ? { 'tsconfig.json': `${JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true, allowImportingTsExtensions: true, skipLibCheck: true, types: ['node'] }, include: ['*.ts'] }, null, 2)}\n` } : {}),
    '.gitignore': '/node_modules/\n/.open-wa/\n/_IGNORE_*/\n/*.data.json\n.env\n.env.*\n!.env.example\n',
    ...(env.length ? { '.env.example': `${env.join('\n')}\n` } : {}),
    'README.md': readme,
  };
  return files;
}
