// DEPRECATION WARNING
console.warn(
  '[@open-wa/legacy] This package is deprecated. ' +
  'Please migrate to @open-wa/client. ' +
  'See: https://docs.openwa.dev/migration'
);

import { Client } from './api/Client';
import { SimpleListener } from './api/model';

export * from './api/model';
export * from './api/Client';
export { create } from './controllers/initializer';
export * from '@open-wa/wa-decrypt';
export { ev, Spin } from './controllers/events'
export * from './utils/tools'
export * from './logging/logging'
export * from './structures/preProcessors'
export * from '@open-wa/wa-automate-socket-client';
export { Client, SimpleListener }
//dont need to export this
// export { getConfigWithCase } from './utils/configSchema'
export * from './build/build-postman'