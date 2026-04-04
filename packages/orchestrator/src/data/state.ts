import { Config } from "@open-wa/config";

import { deleteDoc, doc, DocumentReference, setDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

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
const addToBg = async (p: () => Promise<any>) => await bgq.add(p)

export interface SessionStateInterface {
    internalProxyAddress?: string;
    sessionId?: string;
    stopReason?: string;
    lastEvMessage?: string;
    processState?: string;
    processStateTs?: number;

    config?: OrchestratedSessionConfig;
    auditLog: AuditLogEntry[],
    orchState: OrchState
}

export type OrchestratedSessionConfig = Config & {
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
    processDetails: any;
    sessionId: string;
    stopping = false;

    lastEvMessage = 'UNSTARTED';
    config?: OrchestratedSessionConfig;
    orchState: OrchState = OrchState.IDLE;
    auditLog: AuditLogEntry[] = []
    delete_doc = false;
    stopReason?: string;

    constructor(sessionId: string, internalProxyAddress: string, config?: OrchestratedSessionConfig, orchState?: OrchState, processState?: string) {
        this.sessionId = sessionId;
        this.internalProxyAddress = internalProxyAddress;
        if (config) this.config = config;
        this.setPort(config?.port || 0)
        if (orchState) this.orchState = orchState;
        if (processState) this.processState = processState
    }

    setPort(port: string | number) {
        this.port = portSanitizer(Number(port));
        if (this.config) {
            this.config.port = this.port;
        }
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

    getPort(): number {
        return this.config?.port || 0;
    }

    // Legacy: The orchestrator no longer proxy-binds via CF Tunnel.
    // async forcePortReport(): Promise<false | number | undefined> {
    //     const portReportResult = await requestPortReport(this.sessionId)
    //     if (portReportResult && portReportResult.port) {
    //         this.updatePort(portReportResult.port)
    //         return portReportResult.port
    //     }
    //     return portReportResult as undefined | false
    // }

    /**
     * Update the port assignment of this session
     * @param newPort new port
     * @returns 
     */
    updatePort(newPort: number): number {
        newPort = portSanitizer(newPort)
        /**
         * If the port is the same then ignore
         */
        if (portEqualityChecker(this.port, newPort)) return this.port;
        this.addAuditLog(`UPDATING PORT ${this.sessionId}: ${newPort}`)
        this.setPort(newPort)

        /**
         * Update internal proxy address
         */
        this.setInternalProxyAddress(`http://localhost:${newPort}`)
        /**
         * Port updated — proxy handler reads internalProxyAddress directly
         */
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
        return this.internalProxyAddress
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

    async attemptRecreation(): Promise<CreateSessionResponse> {
        log.info(`RESURRECTING ${this.sessionId}`)
        this.orchState = OrchState.START
        this.addAuditLog("Recreating session.")
        await this.commit()
        const createRes = await createSession((this.config || {}) as OrchestratedSessionConfig, true)
        return createRes;
    }

    async createPm2Proc(): Promise<CreateSessionResponse> {
        this.orchState = OrchState.START
        this.addAuditLog("Creating session.")
        log.info(`CREATING ${this.sessionId}`, this.config)
        await this.commit()
        const createRes = await createSession((this.config || {}) as OrchestratedSessionConfig)
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
            const deletePromises: any[] = [];
            let deleteResult;
            //check if the session exists.
            const procDesc = await this.getProcessDescription().catch(() => false);
            if (procDesc) {
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
            try {
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
        if (this.stopping) return;
        this.stopping = true;
        this.stopReason = reason;
        log.info(`STOPPING ${this.sessionId}. REASON:`, reason)
        this.orchState = OrchState.STOP
        this.addAuditLog(`Stopping session. ${reason}`)
        await this.commit()
        const res = await new Promise((resolve, reject) => pm2.stop(this.sessionId, (err, data) => {
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
            stopReason: this.processState ? this.stopReason : undefined
        }
    }

    async processPm2ProcessEvent(event: {
        event: string,
        at: number,
        process: any
    }): Promise<boolean> {
        this.processState = event.event;
        this.processStateTs = event.at;
        this.setPort(event.process.PORT);
        this.processDetails = event.process;
        await addToBg(() => this.commit());
        return true;
    }


    async commit(): Promise<boolean> {
        try {
            if (this.delete_doc) {
                log.info("🚀 ~ file: state.ts ~ line 210 ~ SessionState ~ commit ~ this.delete_doc", this.delete_doc)
                await deleteDoc(this.getDocumentRef());
                return true;
            }
        } catch (err) {
            log.info("🚀 ~ file: state.ts ~ line 217 ~ SessionState ~ commit ~ err", err)
        }
        try {
            const data = JSON.parse(JSON.stringify(this.toJSON()));
            await setDoc(doc(db, "buckets", myBucketId, "sessions", this.sessionId), data, { merge: true, });
            return true
        } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 124 ~ SessionState ~ commit ~ error", error)
            return false
        }
    }

    async getSessionData(): Promise<string | null> {
        this.addAuditLog("Attempting to grab session data from open-wa session store")
        if (!user?.uid) return null;
        let url;
        try {
            url = await getDownloadURL(ref(storage, `/${user.uid}/${this.sessionId}.data.json`))
        } catch (error: any) {
            if (error.code === 404) log.error("Session Data not found for ", this.sessionId)
            return null
        }
        if (!url) return null
        await this.commit()
        try {
            return fetch(url).then(res => res.text())
        } catch (error) {
            log.info("🚀 ~ file: state.ts ~ line 172 ~ SessionState ~ getSessionData ~ error", error)
            return null
        }
    }
}
