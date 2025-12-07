import { SessionState, SessionStateInterface } from "./state";
import { default as publicIp } from "public-ip";
import { collection, CollectionReference, doc, DocumentData, DocumentReference, getDoc, getDocs, onSnapshot, query, Unsubscribe, where } from "firebase/firestore";
import { bucketsRef } from "../watcher/firebase_db";
import { log } from "../utils/logging";
import { portEqualityChecker } from "../utils/process_utils";

/**
 * The strategy with which to deal with conflicts between local process state and the state in the firestore database.
 * 
 * For example, if firestore thinks the IP is X and locally it is determined to be Y then it will be updated to Y
 */
const CONFLICT_STRATEGY = "OVERWRITE"
log.info("🚀 ~ file: bucket.ts ~ line 12 ~ CONFLICT_STRATEGY", CONFLICT_STRATEGY)


export interface BucketInterface {
    /**
     * This is seperate from the machine ID!!! This is the ID given to this bucket by firestore
     */
    id: string;
    machineId: string;
    lastLaunch: number;
    ip ?: string;
    owner ?: string;
    sessions ?: Map<string, SessionState>;
}


/**
 * A wrapper class for the running state of the orchestration process.
 * 
 * In order to create a new instance of OwOrchBucket, a few things need to be predetermined:
 * - The ID given to this bucket by firestore
 * - The owner of this bucket (There must be an owner for the bucket to be able to keep secure)
 * 
 */
export class OwOrchBucket implements BucketInterface {
    id: string;
    machineId: string;
    lastLaunch: number;
    ip: string | undefined;
    owner: string;
    name = '';
    sessions: Map<string, SessionState> = new Map();
    unSubSessionStateListener: Unsubscribe | undefined;
    unSubBucketListener: Unsubscribe | undefined;

    toJSON(): any {
        return {
            id: this.id,
            lastLaunch: this.lastLaunch,
            machineId: this.machineId,
            ip: this.ip,
            owner: this.owner,
            name: this.name,
            sessions: this.sessions.keys()
        }
    }

    constructor(data: BucketInterface) {
        this.id = data.id;
        this.machineId = data.machineId;
        this.lastLaunch = data.lastLaunch;
        this.owner = data.owner || "";
    }

    hasOwner() : boolean {
        return !!this.owner || this.owner !== "";
    }

    /**
     * Get the uid of the owner if this bucket
     * @returns 
     */
    getOwnerId() : string {
        return this.owner;
    }

    /**
     * Get the ID of the bucket
     * @returns 
     */
    getId() : string {
        return this.id;
    }

    /**
     * Get the IP of the bucket
     */
    async getIp() : Promise<string> {
        if(!this.ip) this.ip = await publicIp.v4();
        return this.ip;
    }

    async findBucketIdByMachineIdFromFirestore() : Promise<string | undefined> {
        const querySnapshot = await getDocs(query(bucketsRef, where("machineId", "==", this.machineId)));
        log.info("Found some possible matching buckets on firestore", querySnapshot.size)
        if(querySnapshot.size === 0) return undefined;
        const myBucketSnapDoc = querySnapshot.docs[0];
        return myBucketSnapDoc.id
    }

    getBucketReference() : DocumentReference<DocumentData> {
        return doc(bucketsRef, this.id)
    }

    getSessionCollectionReference() : CollectionReference<DocumentData>{
        return collection(this.getBucketReference(), "sessions")
    }

    async pullBucketDataFromFirestore(): Promise<void> {
        const docSnapshot = await getDoc(doc(this.getBucketReference(), this.id))
        const _b = docSnapshot.data() as BucketInterface;
        const {
        id,
        machineId,
        ip,
        owner,
        } = _b;
        /**
         * Check if ID is the same.
         */
        if(id!==this.id && this.id) {
            log.error("There seems to be a conflict with id. Firestore: ", id, " Local: ", this.id)
        }
        /**
         * Check if the machine ID is the same
         */
        if(machineId!==this.machineId && this.id) {
            log.error("There seems to be a conflict with machineId. Firestore: ", machineId, " Local: ", this.machineId)
        }
        /**
         * Check if the ip is the same
         */
        if(ip!==this.ip && this.id) {
            log.error("There seems to be a conflict with ip. Firestore: ", ip, " Local: ", this.ip)
        }
        /**
         * Check if the owner is the same
         */
        if(owner!==this.owner && this.id) {
            log.error("There seems to be a conflict with owner. Firestore: ", owner, " Local: ", this.owner)
        }
    }

    async pullSessionStates() : Promise<Map<string, SessionState>> {
        const querySnapshot = await getDocs(this.getSessionCollectionReference())
        querySnapshot.forEach((doc) => {
            const _s = doc.data() as SessionStateInterface;
            this.sessions.set(doc.id, new SessionState(doc.id, _s.internalProxyAddress || '', _s.config, _s.orchState, _s.processState))
        });
        return this.sessions
    }

    listenToBucketChanges() : boolean {
        this.unSubBucketListener = onSnapshot(this.getBucketReference(), (doc) => {
            log.info("Current data: ", doc.data());
        });
        return true;
    }

    stopBucketChangesListener() : boolean  {
        if(this.unSubBucketListener) this.unSubBucketListener();
        return true;
    }

    listenToSessionStatesChanges() : boolean {
        this.unSubSessionStateListener = onSnapshot(this.getSessionCollectionReference(), (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const _s = doc.data() as SessionStateInterface;
                this.sessions.set(doc.id, new SessionState(doc.id, _s.internalProxyAddress || '', _s.config, _s.orchState, _s.processState))
            });
            log.info("Current sessions in bucket ", Object.keys(sessionStorage).join(", "));
        });
        return true;
    }

    stopSessionStatesChangesListener() : boolean  {
        if(this.unSubSessionStateListener) this.unSubSessionStateListener();
        return true;
    }

    async processPm2ProcessEvent(pm2EventPacket: {
        event: string,
        at: number,
        process: any
    }) : Promise<boolean> {
        //get the session ID for this pm2 process event
        const sessionId = pm2EventPacket.process.name;
        //get the port for this process
        const port = pm2EventPacket.process.PORT;
        const ts = pm2EventPacket.at;
        const event = pm2EventPacket.event;
        const session = this.sessions.get(sessionId);
        log.info("PM2 EVENT:", {
            sessionId,
            port,
            ts,
            event
        })
        if(session) {
            //if the session exists, process the event
            if(session.getPort() && !portEqualityChecker(session.getPort(),port)) {
                //the port is different?, update PORT in the session details
                log.error("The port is different for the session: ", sessionId, " Old port: ", session.getPort(), " New port: ", port);
                await session.updatePort(port);
            } 
            await session.processPm2ProcessEvent(pm2EventPacket);
            return true;
        } else return false;
    }
}

export let bucket: OwOrchBucket | undefined;
export const setBucketData : (data: BucketInterface) => boolean = (data: BucketInterface) => {
    if(bucket) {
        log.error("Bucket already set")
        return false;
    }
    bucket = new OwOrchBucket(data);
    return true
}