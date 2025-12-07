export { fb } from './firebase_init'
import axios from 'axios';
import { getAuth, signInWithCustomToken, User } from "@firebase/auth";
import { UserImpl } from '@firebase/auth/internal'
import { getMachineId } from '../data/machine';
import { tryOpenFileAsObject, writeObjectToFile } from '../utils/file-utils';
import { setBucketId } from './firebase_db';
import { log } from '../utils/logging';
const USER_DATA_FILE = "./_user.json";
export let user = getAuth().currentUser;
let attemptingAuthentication = true;

export let s3SDAuth: any;

const authServerHTTP = async (data : any = {})=> (await axios.post("https://us-central1-open-wa-31bb1.cloudfunctions.net/authenticateServerHTTP", data)).data

const authStateHandler = (source : string) =>  async (user : User | null) => {
    log.info(`🚀 ~ file: onAuthStateChanged.ts ~ line 22 ~ authhandler ~ ${source}`, user?.uid)
    if(!user) {
        await onIdTokenRevocation()
    } else {
        attemptingAuthentication = false;
        saveUserAuth(user)
    }
    return;
}

getAuth().onIdTokenChanged(authStateHandler("token"))

getAuth().onAuthStateChanged(authStateHandler("auth"))

async function onIdTokenRevocation() {
    if(!attemptingAuthentication) {
        attemptingAuthentication = true;
        await getAuth().currentUser?.reload();
        if(!getAuth().currentUser?.uid) getSavedUserAuth()
        if(!getAuth().currentUser?.uid) await authenticateInstance();
        attemptingAuthentication = false;
    } else return;
}

export const authenticateInstance : () => Promise<boolean> = async () => {
  log.info("Attempting to authenticate with ID and secret: ", process.env.OWA_ID, process.env.OWA_SECRET)
  const uid = process.env.OWA_ID;
  const secretKey = process.env.OWA_SECRET;
  if(!uid || !secretKey) {
    log.error("No ID or secret key found. Please set OWA_ID and OWA_SECRET in your environment variables or .env file.")
    return false;
    }
    /**
     * call the authenticateServer function, it should return the token and the bucket-id.
     */
     const data = (await authServerHTTP({
        uid,
        secretKey,
        "machineId": getMachineId()
    })) as any
    const {authToken, bucketId, s3Config} = data
     if(bucketId) setBucketId(bucketId);
     s3SDAuth = s3Config
     log.info("🚀 ~ file: firebase_auth.ts ~ line 19 ~ constauthenticateInstance: ~ authToken", data, authToken)
     if(!authToken) {
         log.info('Unable to authenticate. Exiting..', data)
         process.exit()
     }
    try {
        const auth = getAuth();
        const userCredential = await signInWithCustomToken(auth, authToken)
        const _user = userCredential.user;
        user = getAuth().currentUser;
        if((await _user.getIdTokenResult()).claims.orch_server) log.info("Successfully signed in as a orch_server")
        else log.info("Logged in but not as an orch_server? what?")
        log.info("User logged in?", user?.uid, _user?.uid)
        return true;
    } catch (error : any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        log.error("authenticateInstace", errorCode, errorMessage);
        return false
    }
}

export const saveUserAuth : (user : User) => void =  (user : User) => {
    writeObjectToFile(USER_DATA_FILE, user.toJSON());
    return;
}

export const getSavedUserAuth : () => void = async () => {
    /**
     * Check if a file called _user.json exists in the current working directory and if so then open it and parse it.
     */
    const userData = tryOpenFileAsObject(USER_DATA_FILE)
    if(!userData) return;
    log.info("🚀 ~ file: firebase_auth.ts ~ line 91 ~ constgetSavedUserAuth: ~ userData", !!userData)
    const user : User = UserImpl._fromJSON(getAuth() as any, userData)
    log.info("🚀 ~ file: firebase_auth.ts ~ line 96 ~ constgetSavedUserAuth: ~ user", user.uid)
    await getAuth().updateCurrentUser(user);
    return;
}

getSavedUserAuth()