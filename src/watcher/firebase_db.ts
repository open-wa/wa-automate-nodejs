export { fb } from './firebase_init'
import { getFirestore,  collection, setDoc, getDocs, where, query, DocumentReference, doc, getDoc } from "firebase/firestore";
import { default as publicIp } from "public-ip";
import { setBucketData } from "../data/bucket";
import { getMachineId } from "../data/machine";
import { log } from '../utils/logging';
import { user } from "./firebase_auth";
import { PORT } from '../index'
import { createNewBucketOnly } from './firebase_init';

export const db = getFirestore();

export let myBucketId : string;
export const setBucketId : (id : string) => void = (id : string) => myBucketId = id;
export const bucketsRef = collection(db, "buckets");

export const getLatestApiKey : () => Promise<string | undefined>= async () => {
    let bucket;
    try {
        bucket = (await getDoc(doc(db, 'buckets',myBucketId))).data();
    } catch (error) {
        log.error("Error when trying to get new api key", error)
    }
    process.env.API_KEY = bucket?.api_key || process.env.API_KEY || 'kMmKKFCGIjyZy55024iOnQKo7Br60Ltg';
    return process.env.API_KEY;
}

export const registerOrUpdateBucket: () => Promise<boolean> = async () => {
    const machineId = getMachineId();
    log.info('getting bucket data')
    const machineData = {
        ip: process.env.NODE_ENV === 'dev' ? 'localhost': await publicIp.v4(),
        port: PORT,
        machineId: machineId,
        lastLaunch: Date.now(),
        owner: user?.uid || undefined
    };
    log.info('machine data:', machineData)
    try {
        let bucketRef : DocumentReference;
        if(myBucketId) {
            bucketRef = doc(db, 'buckets',myBucketId);
            const bucket = (await getDoc(bucketRef)).data()
            process.env.API_KEY = bucket?.api_key || process.env.API_KEY || 'kMmKKFCGIjyZy55024iOnQKo7Br60Ltg';
            log.info("Bucket exists!!: ~ bucket", myBucketId, process.env.API_KEY)
            await setDoc(bucketRef, machineData, { merge: true });
            setBucketData({
               id: myBucketId,
               ...machineData
              })
            return true
        }
        /**
         * Check if there is a bucket with a matching machineId
         */
         const querySnapshot = await getDocs(query(bucketsRef, where("machineId", "==", machineId)));
         log.info("🚀 ~ file: firebase_db.ts ~ line 29 ~ constregisterOrUpdateBucket: ~ querySnapshot", querySnapshot.size)
         if(querySnapshot.size>=1) {
             //bucket for this machine already exists
             const myBucketSnapDoc = querySnapshot.docs[0];
             bucketRef = myBucketSnapDoc.ref;
             const setRes = await setDoc(myBucketSnapDoc.ref, machineData, { merge: true });
             log.info("🚀 ~ file: firebase_db.ts ~ line 37 ~ constregisterOrUpdateBucket: ~ setRes", setRes)
             if(bucketRef)
             myBucketId = (bucketRef as DocumentReference).id || myBucketSnapDoc.id
             log.info("🚀 ~ file: firebase_db.ts ~ line 40 ~ constregisterOrUpdateBucket: ~ myBucketId", myBucketId)
         } else {
             /**
              * No bucket for this machine exists, create one using a cloud function call
              */
              const {data} : any = await createNewBucketOnly(machineData)
              log.info("🚀 ~ file: firebase_db.ts ~ line 49 ~ constregisterOrUpdateBucket: ~ x", machineData, data)
              myBucketId = data.id;
         }
         log.info("registerOrUpdateBucket", {
             myBucketId,
             machineId
         })
         setBucketData({
             id: myBucketId,
             ...machineData
            })

        if(!myBucketId){
          log.error("This machine is not assigned to a bucket. Please go to the dashboard and create a new bucket to get a valid secret key. Exiting..")
          process.exit()
        }

        return true;
    } catch (error) {
        log.error("f_db error", error)
        return false;
    }
}