import { ConfigObject } from "@open-wa/wa-automate/dist/api/model/config";
import axios from "axios";
import { deleteDoc, doc, DocumentReference, setDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";
import pm2, { Proc, ProcessDescription } from 'pm2'
import { bgq } from "../controllers/background_q";
import { createSession, CreateSessionResponse } from "../endpoints";
import { log } from "../utils/logging";
import { getPortForPm2Process, getProcessDescriptions, requestPortReport, portSanitizer, portEqualityChecker } from '../utils/process_utils';
import { user } from "../watcher/firebase_auth";
import { db, myBucketId } from "../watcher/firebase_db";
import { deleteSessionDoc, storage } from "../watcher/firebase_init";
import fse from 'fs-extra';
import { bucket } from "../data/bucket";

/**
 * Background queue
 */
const addToBg = async (p : () => Promise<any>) => await bgq.add(p)

export interface SessionStateInterface {
    internalProxyAddress?: string;
    sessionId?: string;
    stopReason?: string;
    lastEvMessage?: string;
    processState?: string;
    processStateTs?: number;
    _proxyMiddleware?: RequestHandler;
    config?: OrchestratedSessionConfig;
    auditLog : AuditLogEntry[],
    orchState: OrchState
}

export type OrchestratedSessionConfig = ConfigObject & {
    [k: string]: any;
}

export enum OrchState {
    START = "START",
    RESTART = "RESTART",
    RELOAD = "RELOAD",
    STOP = "STOP",
    DELETE = "DELETE",
    IDLE = "IDLE"
}

export interface AuditLogEntry {
    time: number,
    log: string,
    extras: any
}

export class SessionState implements SessionStateInterface {
    internalProxyAddress: string;
    processState = 'UNSET';
    port = 0;
    processStateTs = 0;
    processDetails : any ;
    sessionId: string;
    stopping = false;
    _proxyMiddleware !: RequestHandler
    lastEvMessage = 'UNSTARTED';
    config?: OrchestratedSessionConfig;
    orchState: OrchState = OrchState.IDLE;
    auditLog: AuditLogEntry[] = []
    delete_doc = false;
    stopReason ?: string;

    constructor(sessionId: string, internalProxyAddress: string, config?: OrchestratedSessionConfig, orchState?: OrchState, processState ?: string) {
        this.sessionId = sessionId;
        this.internalProxyAddress = internalProxyAddress;
        if (config) this.config = config;
        this.setPort(config?.port || 0)
        if(orchState) this.orchState = orchState;
        if(processState) this.processState = processState
    }

    setPort(port : string | number){
        this.port = portSanitizer(Number(port));
        (this.config || {}).port = this.port
        return this.port;
    }

    setConfig(config: OrchestratedSessionConfig): OrchestratedSessionConfig {
        log.info(`SETTING CONFIG ${this.sessionId}`, config)
        this.addAuditLog("Setting config", config)
        this.config = config;
        return this.config
    }

    getConfig(): OrchestratedSessionConfig | undefined {
        return this.config
    }

    getPort() : number {
        return this.config?.port || 0;
    }

    async forcePortReport() : Promise<false | number | undefined> {
        const portReportResult = await requestPortReport(this.sessionId)
        if(portReportResult && portReportResult.port) {
            this.updatePort(portReportResult.port)
            return portReportResult.port
        }
        return portReportResult as undefined | false
    }

    /**
     * Update the port assignment of this session
     * @param newPort new port
     * @returns 
     */
    updatePort(newPort : number) : number {
        newPort = portSanitizer(newPort)
        /**
         * If the port is the same then ignore
         */
        if(portEqualityChecker(this.port, newPort)) return this.port;
        this.addAuditLog(`UPDATING PORT ${this.sessionId}: ${newPort}`)
        this.setPort(newPort)
        
        /**
         * Update internal proxy address
         */
        this.setInternalProxyAddress(`http://localhost:${newPort}`)
        /**
         * Update proxy middleware
         */
        this.createProxyMiddleware(true)
        return this.port
    }

    async addAuditLog(_log: string, extras?: {
        [k: string]: any
    }): Promise<AuditLogEntry> {
        const _l = {
            time: Date.now(),
            log: _log,
            extras
        }
        log.info(`AUDIT: ${this.sessionId} - ${_log}`, extras || {})
        // this.auditLog.push(_l);
        // await this.commit()
        return _l;
    }

    /**
     * A getter for the internal proxy address. This address is the actual address and PORT of the session.
     * 
     * For example:
     * 
     * http://localhost:3002
     * 
     * @returns 
     */
    getInternalProxyAddress(): string {
        return this.internalProxyAddress;
    }

    setInternalProxyAddress(internalProxyAddress: string): string {
        this.addAuditLog("Setting internal proxy address", {
            host: internalProxyAddress
        })
        log.info(`SETTING INTERNAL PROXY ADDR ${this.sessionId}`, internalProxyAddress)
        this.internalProxyAddress = internalProxyAddress;
        this.commit()
        this.createProxyMiddleware();
        return this.internalProxyAddress
    }

    createProxyMiddleware(force = false): void {
        if(force) {
            log.info("REBUILDING PROXY MIDDLEWARE", this.internalProxyAddress)
        }
        this._proxyMiddleware = createProxyMiddleware({
            target: `${this.internalProxyAddress}`,
            ws: true,
            onProxyReq: (proxyReq, req, res) => {
                /**
                 * Set check headers
                 */
                if(!req.get('owa-check-property')) {
                    proxyReq.setHeader('owa-check-property','session')
                    proxyReq.setHeader('owa-check-value', this.sessionId)
                }
                if(process.env.VERBOSE) log.info(`Proxying req ${req.path}`, {
                    sessionId: this.sessionId,
                    path: req.path,
                    body: req['body'] || {}
                })
                if(this.processState == "online" || this.processState == "reload" || this.processState == "restart" ) {
                    if (req['body'] && !req.path.includes("socket.io")) {
                        const bodyData = JSON.stringify(req.body);
                        // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
                        proxyReq.setHeader('Content-Type', 'application/json');
                        proxyReq.setHeader('req-proxied', 'true');
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                        // stream the content
                        proxyReq.write(bodyData);
                    }
                } else {
                    const bodyData = JSON.stringify({
                        error: "Process is not online",
                        state: this.processState
                    })
                    // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    // stream the content
                    proxyReq.write(bodyData);
                }
            },
            onProxyRes: async (proxyRes, req, _res) => {
                // add new header to response
                // proxyRes.headers['x-added'] = 'foobar';
                // proxyRes.statusCode
                if(proxyRes.statusCode==412) {
                    log.error('Looks like a request was sent to the wrong session. Request was successfully caught by the session and ignored.')
                    /**
                     * The request failed because it was sent to the wrong session.
                     * Trigger a port report on both sessions.
                     */
                    if(req.get('owa-check-property') === 'session' && req.get('owa-check-value')) {
                        await bucket?.sessions.get(req.get('owa-check-value') || '')?.forcePortReport();
                    }
                }
                // remove header from response
                // delete proxyRes.headers['x-removed'];
              },
            pathRewrite: (path) => path.replace(`/api/${this.sessionId}/`, '/'),
            logLevel: 'debug',
            /**
             * This is only called if the actual request failed. If the request responds with non-200 then onError IS NOT triggered. Use onProxyRes instead
             */
            onError: async (err, req, res, target) => {
                /**
                 * Sometimes `error` emits different parameters:
                 * ....emit('error', err, req, socket)
                 * 
                 * This is why you should first test whether or not this is a ws proxy req before processing it as a HTTP error.
                 * 
                 * You do this by checking if the third parameter is an instance of Socket (standard flow third param is a res obj)
                 */
                if(res?.constructor?.name === 'Socket') return;
                console.log("🚀 ~ file: state.ts:228 ~ SessionState ~ onError: ~ target", err, target)
                const procPort = await this.getProcessPort()
                if(procPort && Number(this.port) !== Number(procPort)) {
                    log.info("PORT MISMATCH", this.port, procPort)
                    const bodyData = JSON.stringify({
                        error: `Internal Port may have changed. Please try again. State: ${this.processState} ${this.port} ${procPort}`,
                        state: this.processState,
                        port: this.port,
                        procPort: procPort
                    })
                    // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
                    res.writeHead(501, {
                        'Content-Type': 'application/json',
                      });
                    res.end(bodyData);
                    return;
                }
                if(err['code'] === "ECONNREFUSED") {
                    log.info("Session is down?", this.processState,this.port)
                    //the server is no longer runnning?
                    const bodyData = JSON.stringify({
                        error: `Session is not online. Try /start or /restart. State: ${this.processState} ${this.port}`,
                        state: this.processState,
                        port: this.port,
                    })
                    // incase if content-type is application/x-www-form-urlencoded -> we need to change to application/json
                    res.writeHead(504, {
                        'Content-Type': 'application/json',
                      });
                    res.end(bodyData);
                    return;
                }
                res.writeHead(504, {
                    'Content-Type': 'application/json',
                  });
                res.end(JSON.stringify({
                    error: `Something went wrong trying to proxy this request. State: ${this.processState} ${this.port}`,
                    state: this.processState,
                    port: this.port,
                    err
                }));
                return;
              }
        });
        return;
    }

    async getProxyMiddleware(): Promise<RequestHandler> {
        if (!this._proxyMiddleware) {
            await this.forcePortReport();
            this.createProxyMiddleware();
        }
        return this._proxyMiddleware
    }

    async getProcessDescription(): Promise<ProcessDescription> {
        const possibleProcessDescriptions = await getProcessDescriptions(this.sessionId)
        if (possibleProcessDescriptions[0]) return possibleProcessDescriptions[0]
        else throw new Error("Process description does not exist")
    }

    async getProcessPort(): Promise<number | false> {
        try {
        const port = await getPortForPm2Process(this.sessionId)
        if (port) return port
        } catch (error) {
            log.error("Process description or port assignment does not exist")
            return false;
        }
        return false;
    }

    setLastEvMessage(message: string): string {
        this.lastEvMessage = message;
        return this.lastEvMessage
    }

    async reload(): Promise<Proc> {
        log.info(`RELOADING ${this.sessionId}`)
        this.orchState = OrchState.RELOAD
        this.addAuditLog("Reloading session.")
        await this.commit()
        return await new Promise((resolve, reject) => pm2.reload(this.sessionId, (err, data) => {
            if (err) reject(err)
            else {
                const res = {
                    sessionId: data[0]?.name,
                    status: data[0]?.status,
                }
                resolve(res || {})
            }
        }))
    }

    async attemptRecreation(): Promise<CreateSessionResponse>{
        log.info(`RESURRECTING ${this.sessionId}`)
        this.orchState = OrchState.START
        this.addAuditLog("Recreating session.")
        await this.commit()
        const createRes = await createSession(this.config || {}, true)
        return createRes;
    }

    async createPm2Proc(): Promise<CreateSessionResponse> {
        this.orchState = OrchState.START
        this.addAuditLog("Creating session.")
        log.info(`CREATING ${this.sessionId}`, this.config)
        await this.commit()
        const createRes =  await createSession(this.config || {})
        log.info(`CREATE RES ${this.sessionId}`, createRes)
        // return await new Promise((resolve, reject) => pm2.start(this.sessionId, (err, data) => {
        //     log.info("🚀 ~ file: state.ts ~ line 135 ~ SessionState ~ returnawaitnewPromise ~ err, data", err, data)
        //     if (err) reject(err)
        //     else resolve(data)
        // }))
        return createRes;
    }

    /**
     * Equivalent of running `pm2 start session`
     * 
     * Useful for sesisons that were stopped.
     * 
     * @returns 
     */
    async start(): Promise<Proc | string> {
        log.info(`STARTING ${this.sessionId}`)
        this.addAuditLog("STARTING session.")
        return await new Promise((resolve, reject) => pm2.start(this.sessionId, (err, data) => {
            log.info("🚀 ~ SessionState ~ start ~ err, data", err, data)
            if (err) reject(err)
            else resolve(data)
        }))
    }

    async delete(): Promise<Proc | string> {
        log.info(`DELETING ${this.sessionId}`)
        this.orchState = OrchState.DELETE
        this.delete_doc = true;
        this.addAuditLog("Deleting session.")
        try {
            const deletePromises : any[] = [];
            let deleteResult;
            //check if the session exists.
            const procDesc = await this.getProcessDescription().catch(()=>false);
            if(procDesc) {
                deleteResult = new Promise((resolve, reject) => pm2.delete(this.sessionId, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })) as Promise<Proc>
                deletePromises.push(deleteResult)
            } else {
                deleteResult = 'Process deleted'
            }

            this.delete_doc = true;
            deletePromises.push(deleteDoc(this.getDocumentRef()));
            deletePromises.push(deleteSessionDoc({
                sessionId: this.sessionId,
                buckedId: myBucketId
            }));
            //delete the folder from the local filesystem in the /session folder
            const dataDir = `/sessions/_IGNORE_${this.sessionId}`
            try {
                fse.removeSync(dataDir);
                log.info(`${dataDir} removed`)
            } catch (error) {
                log.error(`Something went wrong deleting the data dir: ${dataDir}`)
            }
            try{
                await Promise.all(deletePromises);
            } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 163 ~ SessionState ~ delete ~ error", error)
            }
            // await deleteDoc(this.getDocumentRef());
        // await this.commit();
        return deleteResult;
        } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 148 ~ SessionState ~ delete ~ error", error)
            throw error
        }
    }

    getDocumentRef(): DocumentReference {
        return doc(db, 'bucket', myBucketId, `sessions`, this.sessionId)
    }

    async stop(reason: string): Promise<Proc | undefined | void> {
        if(this.stopping) return;
        this.stopping = true;
        this.stopReason = reason;
        log.info(`STOPPING ${this.sessionId}. REASON:`, reason)
        this.orchState = OrchState.STOP
        this.addAuditLog(`Stopping session. ${reason}`)
        await this.commit()
        const res =  await new Promise((resolve, reject) => pm2.stop(this.sessionId, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        }))
        this.stopping = false
        return res as Proc;
    }

    async restart(): Promise<Proc> {
        log.info(`RESTARTING ${this.sessionId}`)
        this.addAuditLog("Restarting session.")
        this.orchState = OrchState.RESTART
        await this.commit()
        return await new Promise((resolve, reject) => pm2.restart(this.sessionId, (err, data) => {
            if (err) reject(err)
            else resolve(data)
        }))
    }

    toJSON(): SessionStateInterface {
        return {
            internalProxyAddress: this.internalProxyAddress,
            sessionId: this.sessionId,
            lastEvMessage: this.lastEvMessage,
            config: this.config,
            auditLog: this.auditLog,
            processState: this.processState,
            processStateTs: this.processStateTs,
            orchState: this.orchState,
            stopReason: this.processState ?  this.stopReason : undefined
        }
    }

    async processPm2ProcessEvent(event: {
        event: string,
        at: number,
        process: any
    }) : Promise<boolean> {
        this.processState = event.event;
        this.processStateTs =  event.at;
        this.setPort(event.process.PORT);
        this.processDetails = event.process;
        await addToBg(()=>this.commit());
        return true;
    }
    

    async commit(): Promise<boolean> {
        try{
            if(this.delete_doc){
                log.info("🚀 ~ file: state.ts ~ line 210 ~ SessionState ~ commit ~ this.delete_doc", this.delete_doc)
                await deleteDoc(this.getDocumentRef());
                return true;
            }
        } catch (err){
            log.info("🚀 ~ file: state.ts ~ line 217 ~ SessionState ~ commit ~ err", err)
        }
        try {
            const data = JSON.parse(JSON.stringify(this.toJSON()));
            await setDoc(doc(db, "buckets", myBucketId, "sessions", this.sessionId), data, { merge: true,  });
            return true
        } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 124 ~ SessionState ~ commit ~ error", error)
            return false
        }
    }

    async getSessionData() : Promise<string | null>{
        this.addAuditLog("Attempting to grab session data from open-wa session store")
        if(!user?.uid) return null;
        let url;
        try {
          url = await getDownloadURL(ref(storage, `/${user.uid}/${this.sessionId}.data.json`))   
        } catch (error : any) {
            if(error.code === 404) log.error("Session Data not found for ", this.sessionId)
            return null
        }
        if(!url) return null
        await this.commit()
        try {
            return axios.get(url).then(res => res.data.toString())
        } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 172 ~ SessionState ~ getSessionData ~ error", error)
            return null
        }
    }
}