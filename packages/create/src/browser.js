import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

/** @param {'chrome' | 'chromium'} kind @returns {Promise<string | undefined>} */
export async function findSystemBrowser(kind) {
  const app = kind === 'chrome' ? 'Google Chrome' : 'Chromium';
  const names = process.platform === 'win32' ? ['chrome.exe']
    : kind === 'chrome' ? ['google-chrome-stable', 'google-chrome', 'chrome'] : ['chromium', 'chromium-browser'];
  const candidates = process.platform === 'darwin'
    ? ['/Applications', join(homedir(), 'Applications')].map(root => join(root, `${app}.app`, 'Contents', 'MacOS', app))
    : process.platform === 'win32'
      ? [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']].filter(Boolean)
        .map(root => kind === 'chrome' ? join(root, 'Google', 'Chrome', 'Application', 'chrome.exe') : join(root, 'Chromium', 'Application', 'chrome.exe'))
      : kind === 'chrome' ? ['/opt/google/chrome/chrome'] : [];
  candidates.push(...(process.env.PATH ?? '').split(delimiter).filter(Boolean).flatMap(root => names.map(name => join(root, name))));
  for (const candidate of candidates) {
    try {
      if (!(await stat(candidate)).isFile()) continue;
      await access(candidate, constants.X_OK);
      return candidate;
    } catch { }
  }
  return undefined;
}
