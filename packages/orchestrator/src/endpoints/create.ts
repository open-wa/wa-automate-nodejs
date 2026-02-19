import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from "express";
import pm2, { StartOptions } from 'pm2'
import { default as getPort } from 'get-port';
import humanId from 'human-id';
import { ipaddress, PORT } from '..';
import { OrchestratedSessionConfig, OrchState, SessionState } from '../data/state';
import { Config } from '@open-wa/wa-automate';
import { bucket } from '../data/bucket';
import { s3SDAuth, user } from '../watcher/firebase_auth';
import { log } from '../utils/logging';
import { stopManager } from '../controllers/pm2_controller';

let minPort = 3001;
const KEEP_MIN_PORT = process.env.KEEP_MIN_PORT && Number(process.env.KEEP_MIN_PORT)

export interface CreateSessionResponse {
  success: boolean,
  apiKey?: string,
  sessionId?: string,
  qr?: string,
  docs?: string,
  logs?: string,
  message?: string,
}

export const createSessionFromSessionState = async (sessionState: SessionState): Promise<CreateSessionResponse> => {
  if (sessionState.config) return createSession(sessionState.config);
  return {
    success: false,
    sessionId: sessionState.sessionId,
    message: `Trying to re-create session for ${sessionState.sessionId} without any config?`
  }
}

export const createSession: (configData: OrchestratedSessionConfig, recreating?: boolean) => Promise<CreateSessionResponse> = async (configData: OrchestratedSessionConfig, recreating?: boolean) => {
  const { sessionData, webhook, licenseKey, cron, ...rest } = configData;
  const cron_restart = cron;
  let apiKey = configData?.apiKey || configData?.key
  /**
   * DELETE THE PORT ASSIGNMENT FROM THE CONFIG. This causes confusion because the orchestration service determines port a and the config may have port b.
   */
  if (configData.port) delete configData.port;
  if (rest.port) delete rest.port;
  if (!apiKey) apiKey = uuidv4();
  let sessionId = rest?.sessionId;
  if (!sessionId) {
    return {
      success: false,
      sessionId,
      message: `sessionId is missing. It needs to be set explicitly: ${sessionId}. Recreating: ${recreating}`
    };
  }
  if (sessionId === "__AUTO__") {
    /**
     * Create a random session ID string. This is the old behaviour. Now if a session ID is not explicitly set it will throw an error.
     */
    sessionId = humanId({
      separator: '-',
      capitalize: false
    });
  }
  stopManager.preventAutoStop(sessionId)
  try {
    if (!recreating && bucket?.sessions.has(sessionId)) {
      await bucket?.sessions?.get(sessionId)?.addAuditLog(`Trying to create a session that already exists`)
      return {
        success: false,
        sessionId,
        message: `${sessionId} already exists`,
        processState: bucket?.sessions.get(sessionId)?.processState
      };
    }
    log.info(`starting ${sessionId}`)
    const PORT_TOP = KEEP_MIN_PORT || minPort;
    const PORT_BOTTOM = Number(process.env.MAX_PORT || 65535);
    log.info(`checking for free ports between ${PORT_TOP}, ${PORT_BOTTOM}`)
    const port = await getPort({ port: getPort.makeRange(PORT_TOP, PORT_BOTTOM) })
    log.info(`Using PORT ${port} for ${sessionId}`)
    minPort = minPort + 1;
    log.info(`Setting PORT ${sessionId}: `, port);
    const env: {
      [k: string]: string
    } = {
      "WA_API_HOST_ADDR": `http://${ipaddress()}:${port}/`,
    };
    log.info("env", env)
    const logging: any[] = [
    ]
    if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) {
      logging.push({
        "type": "syslog",
        "options": {
          host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
          //@ts-ignore
          "port": process.env.PAPERTRAIL_PORT,
          protocol: 'tls4',
          eol: '\n',
        }
      })
    }
    const useChrome = process.env.USE_CHROME === "false" ? false : true;
    const config: any = {
      /**
       * Can be overridden
       */
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
      ...(configData || {}),
      popup: true,
      /**
       * Cannot be overridden
       */
      qrLogSkip: true,
      port,
      sessionId
      // skipSessionSave: true,
      // chromiumArgs: [
      //   '--single-process',
      //   '--no-zygote',
      //   '--renderer-process-limit=1',
      //   '--no-first-run'
      // ]
    }
    //remove sensitive keys from config:
    delete config.oid
    delete config.osecret
    // delete config.port
    config.popup = port;
    if (process.env.NODE_ENV === 'dev') config.sessionDataPath = './devSessions'
    const s3obj = {
      "provider": "GCP",
      "bucket": process.env.GCP_BUCKET,
      "accessKeyId": process.env.ACCESS_KEY_ID,
      "secretAccessKey": process.env.SECRET_ACCESS_KEY,
      ...(s3SDAuth || {}),
      "directory": `${user?.uid}/`
    }
    const isS3ObjValid = Object.keys(s3obj).every(k => s3obj[k] !== undefined) && [
      "provider",
      "bucket",
      "accessKeyId",
      "secretAccessKey"
    ].every(k => s3obj[k])
    const owaS3WriteAuth = user?.uid && isS3ObjValid ? Buffer.from(JSON.stringify(s3obj)).toString('base64') : undefined
    env["WA_BUCKET_ID"] = bucket?.getId() || "";
    env["WA_SESSION_DATA_BUCKET_AUTH"] = config.WA_SESSION_DATA_BUCKET_AUTH || process.env.WA_SESSION_DATA_BUCKET_AUTH || owaS3WriteAuth;
    bucket?.sessions?.set(sessionId, new SessionState(sessionId, `http://localhost:${port}/`, config, OrchState.START, 'creating'));
    /**
     * Attempt to grab the sessionData from the bucket, if it wasn't send via the request
     */
    let sdFromGCS;
    if (!sessionData && sessionData !== "NUKE") sdFromGCS = await bucket?.sessions?.get(sessionId)?.getSessionData()
    if (sdFromGCS) env["WA_SESSION_DATA"] = sdFromGCS;
    if (sessionData) env["WA_SESSION_DATA"] = `${sessionData}`;
    const configJsonBase64 = Buffer.from(JSON.stringify(config)).toString("base64");
    if (configJsonBase64) env["WA_CLI_CONFIG"] = configJsonBase64;
    env["PORT"] = `${port}`;
    const args = `--in-docker --port ${port} --api-host 'http://${ipaddress()}:${PORT}/api/${sessionId}' --config ${configJsonBase64}`;
    try {
      await new Promise((resolve, reject) => pm2.start({
        name: sessionId,
        script: process.env.EASY_API_PATH || process.env.NODE_ENV === 'dev' ? "./node_modules/@open-wa/wa-automate/bin/server.js" : "/usr/src/app/node_modules/@open-wa/wa-automate/bin/server.js",
        max_memory_restart: '800M',
        instances: 1,
        exec_mode: (process.env.CLUSTER_MODE && Boolean(process.env.CLUSTER_MODE)) || config.cluster ? "cluster" : "fork",
        port,
        wait_ready: true,
        merge_logs: true,
        max_restarts: 5,
        exp_backoff_restart_delay: 5000,
        restart_delay: 5000,
        listen_timeout: 10000,
        cron_restart,
        args,
        namespace: "sessions",
        env
      } as StartOptions, function (err, apps) {
        if (err) {
          pm2.disconnect();   // Disconnects from PM2
          log.error("🚀 ~ file: create.ts ~ line 66 ~ constcreate: ~ err", err)
          reject(err)
        }
        // log.info("🚀 ~ file: create.ts ~ line 124 ~ awaitnewPromise ~ apps", apps[0])
        return resolve(apps[0])
      }));
    } catch (err) {
      log.error("🚀 ~ file: create.ts ~ line 121 ~ constcreateSession: ~ err", err)
      return {
        success: false,
        sessionId,
        message: `${sessionId} failed to start`,
        err
      }
    }

    const _log = `${sessionId} started.`;
    await bucket?.sessions?.get(sessionId)?.addAuditLog(_log)
    await bucket?.sessions?.get(sessionId)?.commit()
    return {
      success: true,
      apiKey,
      sessionId,
      qr: `/api/${sessionId}/qr`,
      docs: `/api/${sessionId}/api-docs/`,
      logs: `/logs/${sessionId}`,
      message: `${sessionId} started.`
    };
  } catch (error: any) {
    await bucket?.sessions?.get(sessionId)?.addAuditLog(`Something went wrong while creating the session: ${error}`)
    log.info("🚀 ~ file: index.ts ~ line 199 ~ app.post ~ error", error)
    return {
      success: false,
      sessionId,
      message: error?.message || error || '??'
    };
  }
}

export const create: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
  log.info('Creating new session', req.body)
  return res.send(await createSession(req.body))
}
