import { ApiServer, createApiServer as createSharedApiServer } from '@open-wa/api';
import type { Config } from '@open-wa/config';

export class WAServer extends ApiServer {
  constructor(config: Config, verbose = false) {
    super({ config, verbose });
  }
}

export function createApiServer(config: Config) {
  return createSharedApiServer(config);
}
