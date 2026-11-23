import { describe, expect, it } from 'vitest';
import type { BrowserCookie, IPage } from '@open-wa/driver-interface';
import { PortableSessionController } from '../../src/transport/portableSession';

const checkpoint = JSON.stringify({ auth: 'sealed-auth', data: 'sealed-data' });

function fakePage(saved: unknown) {
  const exposed = new Map<string, (...args: any[]) => any>();
  const set: BrowserCookie[] = [];
  let initScript = '';
  const page = {
    name: 'puppeteer',
    exposeFunction: async (name: string, fn: (...args: any[]) => any) => { exposed.set(name, fn); },
    addInitScript: async (script: string) => { initScript = script; return { dispose: async () => undefined }; },
    evaluateScript: async () => saved,
    cookies: async () => [
      { name: 'wa_ul', value: 'other', domain: '.web.whatsapp.com', path: '/' },
      { name: 'wa_web_access_token', value: 'server-login', domain: '.web.whatsapp.com', path: '/', expires: 1_900_000_000 },
    ],
    setCookies: async (cookies: BrowserCookie[]) => { set.push(...cookies); },
  } as unknown as IPage;
  return { page, exposed, set, token: () => /const token = "([^"]+)"/.exec(initScript)?.[1] };
}

async function installed(saved: unknown, stored: string | null = checkpoint) {
  const lease = { read: async () => stored, write: async () => undefined, remove: async () => undefined, release: async () => undefined };
  const controller = new PortableSessionController({ acquire: async () => lease }, 'shop');
  const fake = fakePage(saved);
  await controller.install(fake.page, 'https://web.whatsapp.com', 'void 0;');
  return { controller, ...fake };
}

describe('WhatsApp login cookie', () => {
  it('puts the saved login cookie back as an httpOnly cookie for the WhatsApp host', async () => {
    const { controller, set } = await installed({ value: 'server-login', expires: 1_900_000_000 });
    expect(await controller.restoreWebSession()).toBe(true);
    expect(set).toEqual([{ name: 'wa_web_access_token', value: 'server-login', domain: '.web.whatsapp.com', path: '/',
      expires: 1_900_000_000, httpOnly: true, secure: true, sameSite: 'Lax' }]);
  });

  it('sets nothing when the checkpoint holds no cookie or the value is malformed', async () => {
    for (const saved of [null, { value: '' }, { value: 'a;b' }]) {
      const { controller, set } = await installed(saved);
      expect(await controller.restoreWebSession()).toBe(false);
      expect(set).toEqual([]);
    }
  });

  it('sets nothing without a saved login', async () => {
    const { controller, set } = await installed({ value: 'server-login' }, null);
    expect(await controller.restoreWebSession()).toBe(false);
    expect(set).toEqual([]);
  });

  it('gives the page only the login cookie, and only through the capability', async () => {
    const { controller, exposed, token } = await installed(null);
    const read = exposed.get('OpenWA_PortableWebSession')!;
    await expect(read('wrong-token', '')).rejects.toBeTruthy();
    await expect(read(token(), '')).resolves.toEqual({ value: 'server-login', expires: 1_900_000_000 });
    await controller.release();
  });
});
