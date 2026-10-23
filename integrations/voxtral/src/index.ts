import { createPlugin } from '@open-wa/plugin-sdk';
import { configSchema } from './config';
import { VoxtralService } from './service';
import { createVoxtralRoutes } from './routes';
import { version } from '../package.json';

export const voxtralPlugin = createPlugin({
  meta: { name: 'voxtral', version, description: 'Conversational WhatsApp voice notes and live calls with Mistral Voxtral.' },
  configSchema,
  init: async input => {
    const service = await VoxtralService.create(input);
    return {
      'client.ready': async () => service.clientReady(),
      'message.received': async ({ message }) => service.message(message),
      routeAuth: 'host',
      routes: () => createVoxtralRoutes(service),
      pages: [{ path: '/', title: 'Voxtral', icon: '🎙️', description: 'Assistant settings and usage.', module: 'dashboard.js' }],
      chat: { module: 'chat.js' },
      dispose: () => service.dispose(),
    };
  },
});
export default voxtralPlugin;
export { configSchema, settingsSchema, normalizeSettings } from './config';
export type { VoxtralConfig, Settings } from './config';
