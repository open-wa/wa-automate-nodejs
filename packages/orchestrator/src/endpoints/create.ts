import { v4 as uuidv4 } from 'uuid';
import type { Context } from 'hono';
import pm2, { StartOptions } from 'pm2';
import { default as getPort } from 'get-port';
import humanId from 'human-id';
import { getOrchestratorHost, ORCHESTRATOR_PORT } from '../runtime';
import { OrchestratedSessionConfig, OrchState, SessionState } from '../data/state';
import { bucket } from '../data/bucket';
import { s3SDAuth, user } from '../watcher/firebase_auth';
import { log } from '../utils/logging';
import { stopManager } from '../controllers/pm2_controller';
import { resolveEasyApiEntryPath } from '../utils/resolve-easy-api-entry';

let minPort = 3001;
const KEEP_MIN_PORT = process.env.KEEP_MIN_PORT ? Number(process.env.KEEP_MIN_PORT) : undefined;

export interface CreateSessionResponse {
  success: boolean;
  apiKey?: string;
  sessionId?: string;
  qr?: string;
  docs?: string;
  logs?: string;
  message?: string;
  processState?: string;
  err?: unknown;
}

export async function createSessionFromSessionState(sessionState: SessionState): Promise<CreateSessionResponse> {
  if (sessionState.config) return createSession(sessionState.config);
  return {
    success: false,
    sessionId: sessionState.sessionId,
    message: `Trying to re-create session for ${sessionState.sessionId} without any config?`,
  };
}

export async function createSession(
  configData: OrchestratedSessionConfig,
  recreating = false,
): Promise<CreateSessionResponse> {
  const { sessionData, webhook, licenseKey, cron, ...rest } = configData;
  const cron_restart = cron;
  let apiKey = configData?.apiKey || configData?.key;

  // Port assignment comes from the orchestrator, never from config
  if (configData.port) delete (configData as any).port;
  if (rest.port) delete (rest as any).port;

  if (!apiKey) apiKey = uuidv4();

  let sessionId = rest?.sessionId;
  if (!sessionId) {
    return {
      success: false,
      sessionId,
      message: `sessionId is missing. It needs to be set explicitly: ${sessionId}. Recreating: ${recreating}`,
    };
  }

  if (sessionId === '__AUTO__') {
    sessionId = humanId({ separator: '-', capitalize: false });
  }

  stopManager.preventAutoStop(sessionId);

  try {
    if (!recreating && bucket?.sessions.has(sessionId)) {
      await bucket?.sessions?.get(sessionId)?.addAuditLog('Trying to create a session that already exists');
      return {
        success: false,
        sessionId,
        message: `${sessionId} already exists`,
        processState: bucket?.sessions.get(sessionId)?.processState,
      };
    }

    log.info(`Starting ${sessionId}`);
    const PORT_TOP = KEEP_MIN_PORT || minPort;
    const PORT_BOTTOM = Number(process.env.MAX_PORT || 65535);
    log.info(`Checking for free ports between ${PORT_TOP} and ${PORT_BOTTOM}`);

    const port = await getPort({ port: getPort.makeRange(PORT_TOP, PORT_BOTTOM) });
    log.info(`Using PORT ${port} for ${sessionId}`);
    minPort = minPort + 1;

    const env: Record<string, string> = {
      WA_API_HOST_ADDR: `http://${getOrchestratorHost()}:${port}/`,
    };

    log.info('env', env);

    const logging: any[] = [];
    if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) {
      logging.push({
        type: 'syslog',
        options: {
          host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
          port: process.env.PAPERTRAIL_PORT,
          protocol: 'tls4',
          eol: '\n',
        },
      });
    }

    const useChrome = process.env.USE_CHROME !== 'false';

    const baseConfig: Partial<OrchestratedSessionConfig> = {
      qrTimeout: 0,
      useChrome,
      blockAssets: true,
      blockCrashLogs: true,
      skipBrokenMethodsCheck: true,
      disableSpins: true,
      debug: true,
      skipSavePostmanCollection: true,
      killProcessOnBrowserClose: true,
      killProcessOnTimeout: true,
      killClientOnLogout: true,
      qrMax: 10,
      licenseKey,
      webhook,
      apiKey,
      //@ts-ignore
      logging,
    };

    const config: OrchestratedSessionConfig = Object.assign(baseConfig, configData || {}, {
      popup: true,
      qrLogSkip: true,
      port,
      sessionId,
    }) as OrchestratedSessionConfig;

    // Remove sensitive keys from config
    delete config.oid;
    delete config.osecret;
    config.popup = port;
    if (process.env.NODE_ENV === 'dev') config.sessionDataPath = './devSessions';

    const s3obj: Record<string, any> = {
      provider: 'GCP',
      bucket: process.env.GCP_BUCKET,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      ...(s3SDAuth || {}),
      directory: `${user?.uid}/`,
    };

    const requiredS3Keys = ['provider', 'bucket', 'accessKeyId', 'secretAccessKey'];
    const isS3ObjValid =
      Object.keys(s3obj).every((k) => s3obj[k] !== undefined) && requiredS3Keys.every((k) => s3obj[k]);

    const owaS3WriteAuth =
      user?.uid && isS3ObjValid ? Buffer.from(JSON.stringify(s3obj)).toString('base64') : undefined;

    env['WA_BUCKET_ID'] = bucket?.getId() || '';
    env['WA_SESSION_DATA_BUCKET_AUTH'] =
      config.WA_SESSION_DATA_BUCKET_AUTH || process.env.WA_SESSION_DATA_BUCKET_AUTH || owaS3WriteAuth;

    bucket?.sessions?.set(
      sessionId,
      new SessionState(sessionId, `http://localhost:${port}/`, config, OrchState.START, 'creating'),
    );

    // Attempt to grab sessionData from the bucket if it wasn't sent via the request
    let sdFromGCS: string | undefined;
    if (!sessionData && sessionData !== 'NUKE') {
      sdFromGCS = await bucket?.sessions?.get(sessionId)?.getSessionData();
    }
    if (sdFromGCS) env['WA_SESSION_DATA'] = sdFromGCS;
    if (sessionData) env['WA_SESSION_DATA'] = `${sessionData}`;

    const configJsonBase64 = Buffer.from(JSON.stringify(config)).toString('base64');
    if (configJsonBase64) env['WA_CLI_CONFIG'] = configJsonBase64;
    env['PORT'] = `${port}`;

    const args = `--in-docker --port ${port} --api-host 'http://${getOrchestratorHost()}:${ORCHESTRATOR_PORT}/api/${sessionId}' --config ${configJsonBase64}`;

    try {
      await new Promise((resolve, reject) =>
        pm2.start(
          {
            name: sessionId,
            script: resolveEasyApiEntryPath(),
            max_memory_restart: '800M',
            instances: 1,
            exec_mode:
              (process.env.CLUSTER_MODE && Boolean(process.env.CLUSTER_MODE)) || config.cluster ? 'cluster' : 'fork',
            port,
            wait_ready: true,
            merge_logs: true,
            max_restarts: 5,
            exp_backoff_restart_delay: 5000,
            restart_delay: 5000,
            listen_timeout: 10000,
            cron_restart,
            args,
            namespace: 'sessions',
            env,
          } as StartOptions,
          (err, apps) => {
            if (err) {
              pm2.disconnect();
              log.error('pm2.start failed for session', err);
              reject(err);
            }
            return resolve(apps[0]);
          },
        ),
      );
    } catch (err) {
      log.error('createSession pm2.start error', err);
      return {
        success: false,
        sessionId,
        message: `${sessionId} failed to start`,
        err,
      };
    }

    await bucket?.sessions?.get(sessionId)?.addAuditLog(`${sessionId} started.`);
    await bucket?.sessions?.get(sessionId)?.commit();

    return {
      success: true,
      apiKey,
      sessionId,
      qr: `/api/${sessionId}/qr`,
      docs: `/api/${sessionId}/api-docs/`,
      logs: `/logs/${sessionId}`,
      message: `${sessionId} started.`,
    };
  } catch (error: any) {
    await bucket?.sessions?.get(sessionId)?.addAuditLog(`Something went wrong while creating the session: ${error}`);
    log.error('createSession error', error);
    return {
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    };
  }
}

export async function create(c: Context) {
  const body = await c.req.json();
  log.info('Creating new session', body);
  return c.json(await createSession(body));
}
