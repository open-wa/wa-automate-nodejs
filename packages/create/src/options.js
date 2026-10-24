/** @typedef {'easy-api' | 'sdk'} ProjectMode */
/** @typedef {'js' | 'ts'} Language */
/** @typedef {'auto' | 'system-chrome' | 'chrome' | 'chromium'} Browser */
/** @typedef {'voice-notes' | 'calls' | 'both'} VoxtralMode */
/** @typedef {{directory: string, mode: ProjectMode, language: Language, browser: Browser, plugins: string[], voxtralMode: VoxtralMode, install: boolean}} SetupOptions */

export const choices = {
  mode: [
    { value: 'easy-api', label: 'Easy API', description: 'HTTP API and the Neo dashboard.' },
    { value: 'sdk', label: 'SDK', description: 'A persistent bot you control in code.' },
  ],
  language: [
    { value: 'js', label: 'JavaScript', description: 'Plain .js files, ready to run with Node.js.' },
    { value: 'ts', label: 'TypeScript', description: '.ts files with editor types; Node.js runs them directly.' },
  ],
  browser: [
    { value: 'auto', label: 'Detect at startup', description: 'Reuse Chrome or a cached browser; ask if none is available.' },
    { value: 'system-chrome', label: 'Use installed Chrome', description: 'Find Chrome on this computer. Never download a browser.' },
    { value: 'chrome', label: 'Download Chrome', description: 'Download and cache Chrome for Testing when needed. Recommended for calls and media.' },
    { value: 'chromium', label: 'Download Chromium', description: 'Download and cache Chromium. Some audio/video codecs may be unavailable.' },
  ],
  voxtralMode: [
    { value: 'voice-notes', label: 'Voice notes', description: 'Answer incoming voice notes with spoken replies.' },
    { value: 'calls', label: 'Calls', description: 'Answer live audio calls. Requires an open-wa calling license.' },
    { value: 'both', label: 'Voice notes and calls', description: 'Share the assistant and recent context across both.' },
  ],
};

export const pluginChoices = [
  { value: 'voxtral', label: 'Voxtral', description: 'A conversational voice assistant using your Mistral account.', package: '@open-wa/integration-voxtral', modes: ['easy-api', 'sdk'] },
  { value: 'webhook', label: 'Webhooks', description: 'Forward WhatsApp events to your HTTP endpoint.', package: '@open-wa/integration-webhook', modes: ['easy-api', 'sdk'] },
  { value: 'chatwoot', label: 'Chatwoot', description: 'Connect a Chatwoot inbox through Easy API webhook routes.', package: '@open-wa/integration-chatwoot', modes: ['easy-api'] },
];

/** @type {SetupOptions} */
export const defaults = { directory: 'my-bot', mode: 'easy-api', language: 'js', browser: 'auto', plugins: [], voxtralMode: 'voice-notes', install: true };

export const flags = {
  mode: { key: 'mode', description: 'easy-api or sdk' },
  language: { key: 'language', description: 'js or ts' },
  browser: { key: 'browser', description: 'auto, system-chrome, chrome or chromium' },
  plugins: { key: 'plugins', description: 'Comma-separated voxtral, webhook, chatwoot; or none' },
  'voxtral-mode': { key: 'voxtralMode', description: 'voice-notes, calls or both' },
};

/** @param {Partial<SetupOptions>} input @returns {SetupOptions} */
export function normalizeOptions(input = {}) {
  return { ...defaults, ...input, plugins: [...new Set(input.plugins ?? defaults.plugins)] };
}

/** @param {SetupOptions} options @returns {string[]} */
export function optionErrors(options) {
  const errors = [];
  if (!options.directory || options.directory.startsWith('-') || !/^[a-zA-Z0-9._/\\-]+$/.test(options.directory)) errors.push('Use a folder name or path containing letters, numbers, dots, dashes, underscores or slashes; it must not start with a dash.');
  for (const key of ['mode', 'language', 'browser', 'voxtralMode']) {
    if (!choices[key].some(choice => choice.value === options[key])) errors.push(`Choose a supported ${key}.`);
  }
  for (const id of options.plugins) {
    const plugin = pluginChoices.find(item => item.value === id);
    if (!plugin) errors.push(`Unknown plugin: ${id}.`);
    else if (!plugin.modes.includes(options.mode)) errors.push(`${plugin.label} needs Easy API webhook routes. Choose Easy API or remove ${plugin.label}.`);
  }
  return errors;
}

/** @param {SetupOptions} options */
export function buildCommand(options) {
  const errors = optionErrors(options);
  if (errors.length) throw new Error(errors.join(' '));
  const args = ['npm init @open-wa@latest', options.directory, '--'];
  for (const [flag, definition] of Object.entries(flags)) {
    if (flag === 'voxtral-mode' && !options.plugins.includes('voxtral')) continue;
    const value = options[definition.key];
    args.push(`--${flag}`, Array.isArray(value) ? value.join(',') || 'none' : String(value));
  }
  if (!options.install) args.push('--no-install');
  args.push('--yes');
  return args.join(' ');
}

/** @param {Record<string, unknown>} search @returns {SetupOptions} */
export function readBuilderSearch(search) {
  const options = normalizeOptions();
  if (typeof search.directory === 'string' && /^[a-zA-Z0-9._/\\-]+$/.test(search.directory)) options.directory = search.directory;
  for (const key of ['mode', 'language', 'browser', 'voxtralMode']) {
    if (choices[key].some(choice => choice.value === search[key])) options[key] = search[key];
  }
  const plugins = Array.isArray(search.plugins) ? search.plugins : typeof search.plugins === 'string' ? search.plugins.split(',') : [];
  options.plugins = pluginChoices.filter(plugin => plugins.includes(plugin.value)).map(plugin => plugin.value);
  if (search.install === false || search.install === 'false') options.install = false;
  return options;
}
