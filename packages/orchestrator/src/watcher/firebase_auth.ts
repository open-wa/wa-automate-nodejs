import { fb } from './firebase_init';
import { getAuth, signInWithCustomToken, User } from 'firebase/auth';
import { UserImpl } from '@firebase/auth/internal';
import { getMachineId } from '../data/machine';
import { tryOpenFileAsObject, writeObjectToFile } from '../utils/file-utils';
import { setBucketId } from './firebase_db';
import { log } from '../utils/logging';

const USER_DATA_FILE = './_user.json';

let auth = undefined as ReturnType<typeof getAuth> | undefined;
let authInitialized = false;

export { fb } from './firebase_init';
export let user = undefined as User | null | undefined;
let attemptingAuthentication = true;

export let s3SDAuth: any;

const authServerHTTP = async (data: any = {}) => {
  const res = await fetch('https://us-central1-open-wa-31bb1.cloudfunctions.net/authenticateServerHTTP', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

function getOrchestratorAuth() {
  auth = auth || getAuth(fb);
  return auth;
}

const authStateHandler = (source: string) => async (currentUser: User | null) => {
  log.info(`🚀 ~ file: onAuthStateChanged.ts ~ line 22 ~ authhandler ~ ${source}`, currentUser?.uid);
  if (!currentUser) {
    await onIdTokenRevocation();
  } else {
    attemptingAuthentication = false;
    saveUserAuth(currentUser);
  }
  return;
};

function ensureAuthInitialized() {
  const auth = getOrchestratorAuth();
  if (authInitialized) {
    return auth;
  }

  auth.onIdTokenChanged(authStateHandler('token'));
  auth.onAuthStateChanged(authStateHandler('auth'));
  user = auth.currentUser;
  authInitialized = true;

  return auth;
}

async function onIdTokenRevocation() {
  const auth = ensureAuthInitialized();
  if (!attemptingAuthentication) {
    attemptingAuthentication = true;
    await auth.currentUser?.reload();
    if (!auth.currentUser?.uid) getSavedUserAuth();
    if (!auth.currentUser?.uid) await authenticateInstance();
    attemptingAuthentication = false;
  } else return;
}

export const authenticateInstance: () => Promise<boolean> = async () => {
  log.info('Attempting to authenticate with ID and secret: ', process.env.OWA_ID, process.env.OWA_SECRET);
  const uid = process.env.OWA_ID;
  const secretKey = process.env.OWA_SECRET;
  if (!uid || !secretKey) {
    log.error('No ID or secret key found. Please set OWA_ID and OWA_SECRET in your environment variables or .env file.');
    return false;
  }

  const data = (await authServerHTTP({
    uid,
    secretKey,
    machineId: getMachineId(),
  })) as any;
  const { authToken, bucketId, s3Config } = data;
  if (bucketId) setBucketId(bucketId);
  s3SDAuth = s3Config;
  log.info('🚀 ~ file: firebase_auth.ts ~ line 19 ~ constauthenticateInstance: ~ authToken', data, authToken);
  if (!authToken) {
    log.info('Unable to authenticate. Exiting..', data);
    process.exit();
  }
  try {
    const auth = ensureAuthInitialized();
    const userCredential = await signInWithCustomToken(auth, authToken);
    const currentUser = userCredential.user;
    user = auth.currentUser;
    if ((await currentUser.getIdTokenResult()).claims.orch_server) log.info('Successfully signed in as a orch_server');
    else log.info('Logged in but not as an orch_server? what?');
    log.info('User logged in?', user?.uid, currentUser?.uid);
    return true;
  } catch (error: any) {
    const errorCode = error.code;
    const errorMessage = error.message;
    log.error('authenticateInstace', errorCode, errorMessage);
    return false;
  }
};

export const saveUserAuth: (user: User) => void = (user: User) => {
  writeObjectToFile(USER_DATA_FILE, user.toJSON());
  return;
};

export const getSavedUserAuth: () => void = async () => {
  const userData = tryOpenFileAsObject(USER_DATA_FILE);
  if (!userData) return;
  log.info('🚀 ~ file: firebase_auth.ts ~ line 91 ~ constgetSavedUserAuth: ~ userData', !!userData);
  const auth = ensureAuthInitialized();
  const restoredUser: User = UserImpl._fromJSON(auth as any, userData);
  log.info('🚀 ~ file: firebase_auth.ts ~ line 96 ~ constgetSavedUserAuth: ~ user', restoredUser.uid);
  await auth.updateCurrentUser(restoredUser);
  return;
};

void getSavedUserAuth();
