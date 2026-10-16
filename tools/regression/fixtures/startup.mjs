import start from './startup-common.cjs';

await start(name => import(name));
