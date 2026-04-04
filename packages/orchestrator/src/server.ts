import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import publicIp from 'public-ip';
import pm2 from 'pm2';
import {
  create,
  restart,
  logs,
  deleteSession,
  list,
  reload,
  reloadAll,
  update,
  updateAndReloadAll,
  stop,
  start,
  reloadOrchAuth,
  forceReauthenticateOrchServer,
  forceDeleteSessionDataFromOWABucket,
  status,
  flush,
  updateAndRestartAll,
  restartAll,
  stopProcess,
} from './endpoints';
import { authMiddleware } from './middlewares/auth';
import { authenticateInstance, user } from './watcher/firebase_auth';
import { registerOrUpdateBucket } from './watcher/firebase_db';
import { getMachineId } from './data/machine';
import { bucket } from './data/bucket';
import { OrchState, SessionState } from './data/state';
import { addSysLogTransport, log } from './utils/logging';
import { startPm2ProcessWatcher } from './controllers/pm2_controller';
import { MainProcessHandlingQueue } from './controllers/background_q';
import { ORCHESTRATOR_PORT, getOrchestratorHost } from './runtime';

export const PORT = ORCHESTRATOR_PORT;
export const ipaddress = getOrchestratorHost;

export function createOrchestratorApp() {
  const app = new Hono();

  // --- Warnings ---
  if (!process.env.API_KEY) {
    log.warn('API_KEY is not set. Non-GET management routes will reject requests until configured.');
  }

  if (!process.env.SUPER_ADMIN_KEY) {
    log.warn('SUPER_ADMIN_KEY is not set. Super-admin flows must be configured explicitly.');
  }

  // --- Syslog transport ---
  if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) {
    addSysLogTransport({
      host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
      port: process.env.PAPERTRAIL_PORT,
      protocol: 'tls4',
      eol: '\n',
    });
  }

  // --- Middleware ---
  app.use('*', logger());
  app.use('*', cors());
  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", 'code.jquery.com', 'cdnjs.cloudflare.com', 'ajax.cloudflare.com', "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    }),
  );

  // Request timing + ID middleware
  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.header('X-Request-Id', requestId);

    const start = performance.now();
    await next();
    const duration = (performance.now() - start).toFixed(2);
    c.header('X-Response-Time', `${duration}ms`);
  });

  app.use('*', authMiddleware);

  // --- Routes ---
  app.get('/', (c) => c.text('ok'));
  app.post('/create', create);
  app.get('/logs/:id', logs);
  app.get('/list', list);
  app.get('/status', status);
  app.post('/update', update);
  app.post('/updateAndReloadAll', updateAndReloadAll);
  app.post('/updateAndRestartAll', updateAndRestartAll);
  app.post('/reloadAll', reloadAll);
  app.post('/restartAll', restartAll);
  app.post('/stop', stop);
  app.post('/start', start);
  app.post('/delete', deleteSession);
  app.post('/deleteSessionData', forceDeleteSessionDataFromOWABucket);
  app.post('/reload', reload);
  app.post('/restart', restart);
  app.post('/flush', flush);
  app.post('/auth/reload', reloadOrchAuth);
  app.post('/auth/force', forceReauthenticateOrchServer);

  return app;
}

export async function startOrchestratorCli() {
  log.info(`ENVIRONMENT: ${process.env.NODE_ENV}`);
  const app = createOrchestratorApp();
  const inDocker = process.env.IN_DOCKER || false;

  startPm2ProcessWatcher();

  log.info('Machine ID: ', getMachineId());
  const authenticated = await authenticateInstance();
  const bucketRegistered = await registerOrUpdateBucket();
  log.info('startOrchestratorCli bucketRegistered', bucketRegistered);

  const sessionStateFromFirestore = await bucket?.pullSessionStates();

  if (authenticated) {
    log.info('Successfully authenticated!! ', user?.uid);
  } else {
    log.info('Unable to authenticate machine!');
  }

  process.env.ORCH_IP_ADDR = process.env.NODE_ENV === 'dev' || inDocker ? 'localhost' : await publicIp.v4();

  const runningSessions: Record<string, string> = {};

  await new Promise<void>((resolve, reject) => {
    pm2.connect(async function (err) {
      console.log('PM2 CONNECT:', err);

      if (err) {
        reject(err);
        return;
      }

      await new Promise((listResolve, listReject) =>
        pm2.list(async (listErr, list) => {
          console.log('PM2 LIST:', listErr, list);

          if (listErr) {
            listReject(listErr);
            return;
          }

          await Promise.all(
            list.map(async (session) => {
              const host = (session?.pm2_env as any)?.WA_API_HOST_ADDR;
              const sessionId = session?.name;

              if (!host || !sessionId || !sessionStateFromFirestore) {
                return;
              }

              if (
                sessionStateFromFirestore.has(sessionId) &&
                sessionStateFromFirestore.get(sessionId)?.getInternalProxyAddress() !== host
              ) {
                // Legacy: Port bindings via log scraping replaced by CF Proxy Tunnel
                // sessionStateFromFirestore.get(sessionId)?.forcePortReport();
                sessionStateFromFirestore.get(sessionId)?.setInternalProxyAddress(host);
                await sessionStateFromFirestore.get(sessionId)?.addAuditLog(`Host address changed: ${host}`);
              } else if (!sessionStateFromFirestore.has(sessionId)) {
                sessionStateFromFirestore.set(sessionId, new SessionState(sessionId, host, undefined, OrchState.START));
              }

              sessionStateFromFirestore.get(sessionId)?.commit();
              runningSessions[sessionId] = host;
            }),
          );

          listResolve(true);
        }),
      );

      const sessionsFromFirestoreArr: SessionState[] = [];
      sessionStateFromFirestore?.forEach((session) => sessionsFromFirestoreArr.push(session));
      const unstartedSessions = sessionsFromFirestoreArr.filter(
        ({ sessionId }) => !Object.keys(runningSessions).includes(sessionId),
      );

      const orderedUnstartedSessions = [
        ...unstartedSessions.filter((s) => s.processState === 'online'),
        ...unstartedSessions.filter((s) => s.processState != 'online'),
      ];

      orderedUnstartedSessions.map(async ({ sessionId }) => {
        const session = sessionStateFromFirestore?.get(sessionId);

        if (!session || session.orchState === OrchState.DELETE) {
          return;
        }

        const shouldStopImmediately = session.orchState === OrchState.STOP || session.processState === 'stop';

        MainProcessHandlingQueue.add(async () => {
          log.info(`Resurrecting lost session ${sessionId}`);
          await session.addAuditLog(`Resurrected session ${sessionId}`);
          const resurrection = await session.attemptRecreation();
          log.info(`Session ${sessionId} resurrected`, resurrection);

          if (shouldStopImmediately) {
            log.info(`Session ${sessionId} will now stop`, resurrection);
            await stopProcess(sessionId, 'STOP_ON_RESURRECTION');
            log.info(`Session ${sessionId} stopped`, resurrection);
          }
        });
      });

      log.info(`Starting server at port ${ORCHESTRATOR_PORT}`);
      serve(
        {
          fetch: app.fetch,
          port: Number(ORCHESTRATOR_PORT),
        },
        (info) => {
          log.info(`App listening at http://${getOrchestratorHost()}:${info.port}`);
        },
      );

      resolve();
    });
  });

  return app;
}
