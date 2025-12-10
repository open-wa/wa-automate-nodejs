
import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import publicIp from 'public-ip'
import pm2 from 'pm2'
import Cabin from 'cabin';
import Axe from 'axe';
import requestReceived from 'request-received';
import responseTime from 'response-time';
import requestId from 'express-request-id';
import {
  create, restart, logs, deleteMiddleware, proxy, list, reload, reloadAll, update, updateAndReloadAll, stop, start,
  reloadOrchAuth, forceReauthenticateOrchServer, forceDeleteSessionDataFromOWABucket, status, stopProcess, flush,
  updateAndRestartAll, restartAll,
  authMiddleware,
  authenticateInstance, user,
  getMachineId,
  registerOrUpdateBucket,
  OrchState, SessionState,
  bucket,
  addSysLogTransport, log, simpleCabinLog,
  startPm2ProcessWatcher,
  MainProcessHandlingQueue
} from '@open-wa/orchestrator';

log.info(`ENVIRONMENT: ${process.env.NODE_ENV}`)

const axe = new Axe({
  logger: log,
  hooks: {
    pre: [
      function (level, err, message, meta) {
        try {
          if (meta?.is_http && meta?.response?.status_code == "200") return [err, message, {}];
          return [err, message, meta];
        } catch (error) {
          return [err, message, meta];
        }
      }
    ]
  }
})
const app = express();
const cabin = new Cabin({
  logger: axe,
  message: (options) => simpleCabinLog(options),
});
process.env.API_KEY = process.env.API_KEY || 'kMmKKFCGIjyZy55024iOnQKo7Br60Ltg';
export const PORT = process.env.PORT || 3000;
//CHANGE THESE CONSTANTS
export const ipaddress: () => string = () => process.env.ORCH_IP_ADDR || 'localhost';
if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) addSysLogTransport({
  host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
  port: process.env.PAPERTRAIL_PORT,
  protocol: 'tls4',
  eol: '\n',
})
process.env.SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'E4E239585714CD251C3B7BC66C315';
log.info("🚀 ~ file: index.js ~ line 24 ~ process.env.API_KEY", process.env.API_KEY)

const IN_DOCKER = process.env.IN_DOCKER || false;
app.use(requestReceived);
app.use(responseTime());
app.use(requestId());
app.use(cabin.middleware);
// app.use(morgan(':method :host :status :param[id] :req[body] :res[content-length] - :response-time ms'))
app.use(morgan('tiny'))
app.use(express.json())
app.use(cors())
app.use(helmet())

app.use(helmet.contentSecurityPolicy({
  directives: {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "block-all-mixed-content": [],
    "font-src": ["'self'", "https:", "data:"],
    "frame-ancestors": ["'self'"],
    "img-src": ["'self'", "data:"],
    "object-src": ["'none'"],
    "script-src": ["'self'", "code.jquery.com", "cdnjs.cloudflare.com", "ajax.cloudflare.com", "'unsafe-inline'"],
    "script-src-attr": ["'none'"],
    "style-src": ["'self'", "https:", "'unsafe-inline'"],
    "upgrade-insecure-requests": []
  },
}));

//200mb Base64 file size limit. Ideally you shouldn't be sending large files via base64.
app.use(express.json({ limit: '20mb' }));

app.use(authMiddleware)


app.get('/', (req, res, next) => {
  return res.send('ok')
})

/**
 * Create a session, post body requires session ID and can include any create config and cli config.
 * 
 * THE SESSION ID MUST BE UNIQUE
 * 
 * body: {
 *  "sessionId": "marketing"
 *   ... other EASY API props
 * }
 */
app.post('/create', create);

/**
 * The 'proxy' endpoint to access the specific session APIs.
 * 
 * For example, if the session id is 'marketing' then:
 * api docs: http://localhost:5432/api/marketing/api-docs/
 * qr code image: http://localhost:5432/api/marketing/qr
 * logs (will only be available on authentication): http://localhost:5432/api/marketing/
 */
app.use('/api/:id', proxy)

/**
 * Get the logs for a process/session.
 * 
 * GET /logs/marketing
 */
app.get('/logs/:id', logs)

/**
 * List all the sessions as JSON along with their process details
 */
app.get('/list', list)

/**
 * The status of the admin process itself
 */
app.get('/status', status)

/**
 * Update the underlying wa-automate version
 */
app.post('/update', update)


/**
 * Update the underlying wa-automate version and reload all sessions
 */
app.post('/updateAndReloadAll', updateAndReloadAll)

/**
 * Update the underlying wa-automate version and restart all sessions
 */
app.post('/updateAndRestartAll', updateAndRestartAll)

/**
 * Reload all sessions
 */
app.post('/reloadAll', reloadAll)

/**
 * Restart all sessions
 */
app.post('/restartAll', restartAll)


/**
 * Stop a session
 * body: {
 *  "sessionId": "marketing"
 * }
 */
app.post('/stop', stop);

/**
 * Start a session
 * body: {
 *  "sessionId": "marketing"
 * }
 */
app.post('/start', start);

/**
 * Delete a session
 * body: {
 *  "sessionId": "marketing"
 * }
 */
app.post('/delete', deleteMiddleware);

/**
 * Delete session data from the backup backend
 * body: {
 *  "sessionId": "marketing"
 * }
 */
app.post('/deleteSessionData', forceDeleteSessionDataFromOWABucket)

// Only works in cluster mode.
app.post('/reload', reload);

/**
 * Restart a session
 * body: {
 *  "sessionId": "marketing"
 * }
 */
app.post('/restart', restart);

/**
 * Flush logs
 */
app.post('/flush', flush);

//orch-auth
app.post('/auth/reload', reloadOrchAuth);
app.post('/auth/force', forceReauthenticateOrchServer);

async function startSupervisor() {
  /**
   * Authenticate machine
   */
  log.info("Machine ID: ", getMachineId())
  const authenticated = await authenticateInstance()
  /**
   * Update machine bucket info
   */
  const bucketRegistered = await registerOrUpdateBucket()
  log.info("🚀 ~ file: index.ts ~ line 100 ~ start ~ bucketRegistered", bucketRegistered)
  /**
   * Grab initial bucket session states.
   * 
   * Bucket should be ready now
   */
  const sessionStateFromFirestore = await bucket?.pullSessionStates()
  if (authenticated) {
    log.info("Successfully authenticated!! ", user?.uid)
  } else log.info("Unable to authenticate machine!")
  process.env.ORCH_IP_ADDR = (process.env.NODE_ENV === 'dev' || IN_DOCKER) ? 'localhost' : await publicIp.v4();
  const runningSessions: {
    [k: string]: string
  } = {}
  //@ts-ignore
  pm2.connect(async function (err, pm2Info) {
    console.log(`PM2 CONNECT:`, err, pm2Info)
    if (err) {
      console.error(err)
      log.error(err);
      process.exit(2);
    }
    //recononect existing processes
    await new Promise((resolve, reject) => pm2.list(async (err, list) => {
      console.log('PM2 LIST:', err, list)
      if (err) reject(err)
      await Promise.all(list.map(async session => {
        console.log('PM2_NAME', session.name)
        if ((session?.pm2_env as any)?.WA_API_HOST_ADDR) {
          const host = (session?.pm2_env as any)?.WA_API_HOST_ADDR;
          const sessionId = session?.name;
          /**
           * Check if the session ID already exists in the firestore bucket.
           * If it does then check if the URLs are the same.
           * if not then set the session url in the firestore
           */
          if (sessionId && sessionStateFromFirestore) {
            log.info(`reconnecting: ${sessionId} @ ${host} ${sessionStateFromFirestore.get(sessionId)?.getInternalProxyAddress()}`)
            if (sessionStateFromFirestore.has(sessionId) && sessionStateFromFirestore.get(sessionId)?.getInternalProxyAddress() === host) {
              log.info('session already exists in firestore and is up to date')
            } else if (sessionStateFromFirestore.has(sessionId) && sessionStateFromFirestore.get(sessionId)?.getInternalProxyAddress() !== host) {
              log.info('session already exists in firestore but url has changed. Forcing port report...')
              sessionStateFromFirestore.get(sessionId)?.forcePortReport()
              await sessionStateFromFirestore.get(sessionId)?.addAuditLog(`Host address changed: ${host}`)
            } else if (!sessionStateFromFirestore.has(sessionId)) {
              log.info('session does not exist in firestore')
              sessionStateFromFirestore.set(sessionId, new SessionState(sessionId, host, undefined, OrchState.START))
            }
            sessionStateFromFirestore.get(sessionId)?.commit();
            runningSessions[sessionId] = host;
            console.log("Running sessions: ", runningSessions)
            resolve(true)
          }
        }
      }))
      resolve(true)
    }));
    console.log('CHECKED EXISTING PROCS...')
    log.info('CONTINUING....')
    /**
     * Restarting sessions that should be running
     */
    log.info('Restarting sessions that should be running')
    log.info('Existing sessions which should be ignored during resurrection', runningSessions)
    const sessionsFromFirestoreArr: SessionState[] = [];
    sessionStateFromFirestore?.forEach(session => sessionsFromFirestoreArr.push(session))
    const unstartedSessions = sessionsFromFirestoreArr.filter(({ sessionId }) => !Object.keys(runningSessions).includes(sessionId));
    log.info('Unstarted sessions which will be resurrected', unstartedSessions.map(x => x.sessionId))

    /**
     * This creates an ordered array of session objects.
     * The ordered unstarted sessions orders by whether or not the session was previously started or not.
     * 
     * A previously online session should be recreted with priority over a session that was stopped for any reason.
     */
    const orderedUnstartedSessions = [
      ...unstartedSessions.filter(s => s.processState === "online"),
      ...unstartedSessions.filter(s => s.processState != "online")
    ];
    console.log("orderedUnstartedSessions", orderedUnstartedSessions)
    orderedUnstartedSessions.map(async ({ sessionId }) => {
      const session = sessionStateFromFirestore?.get(sessionId);
      log.info("FROM BACKEND:", session)
      if (!session) return;
      if (session.orchState === OrchState.DELETE) {
        log.info('Session recreation skipped', session.sessionId, session.orchState);
        return;
      }
      const shouldStopImmediately = session.orchState === OrchState.STOP || session.processState === 'stop'
      // console.log("🚀 ~ file: index.ts ~ line 185 ~ unstartedSessions.map ~ session.orchState", session.orchState)
      // await createSessionFromSessionState(sessionStateFromFirestore[sessionId])
      MainProcessHandlingQueue.add(async () => {
        log.info(`Resurrecting lost session ${sessionId}`)
        await session.addAuditLog(`Resurrected session ${sessionId}`)
        const resurrection = await session.attemptRecreation()
        log.info(`Session ${sessionId} ressurected`, resurrection)
        if (shouldStopImmediately) {
          log.info(`Session ${sessionId} will now stop`, resurrection)
          await stopProcess(sessionId, "STOP_ON_RESURRECTION")
          log.info(`Session ${sessionId} stopped`, resurrection)
        }
      })
      // /**
      //  * Timeout for 5 seconds before starting the next one, skip if this sessionId is the last one
      //  */
      // if(process.env.RECREATE_WAIT && sessionId !== unstartedSessions.slice(-1)[0]?.sessionId) {
      //   log.info('WAITING ${timeoutBetweenSessionReloads} seconds ....')
      //   await timeout(Number(process.env?.RECREATE_WAIT_MS) || timeoutBetweenSessionReloads)
      // }
    });
  });
  log.info(`Starting server at port ${PORT}`)
  app.listen(PORT, () => {
    log.info(`App listening at http://${ipaddress()}:${PORT}`)
  })
}

startPm2ProcessWatcher();
startSupervisor();