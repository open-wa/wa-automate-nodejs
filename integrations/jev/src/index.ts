import { createPlugin } from '@open-wa/plugin-sdk';
import { configSchema } from './config';
import { JevService } from './service';
import { createJevRoutes } from './routes';
export const jevPlugin = createPlugin({
  meta: { name: 'jev', version: '5.6.6', description: 'Intelligent WhatsApp chat actions and shared conversation state for Voxtral.' },
  configSchema,
  init: async input => {
    const service = await JevService.create(input);
    return {
      'client.ready': async () => service.clientReady(),
      'message.received': async ({ message }) => service.message(message),
      routes: () => createJevRoutes(service), routeAuth: 'host',
      pages: [{ path: '/', title: 'Jev', icon: '🧭', description: 'Chat assistant settings and decision evidence.', module: 'dashboard.js' }],
      chat: { module: 'chat.js' }, dispose: () => service.dispose(),
    };
  },
});
export default jevPlugin;
export { configSchema, settingsSchema } from './config';
export type { JevConfig, AgentSettings } from './config';
