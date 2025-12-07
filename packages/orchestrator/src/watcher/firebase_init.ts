import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';

export const fb = initializeApp({
    apiKey: "AIzaSyDIosxmVFxTAyFA975VSvuhNxleYvtWHrc",
    authDomain: "open-wa-31bb1.firebaseapp.com",
    databaseURL: "https://open-wa-31bb1.firebaseio.com",
    projectId: "open-wa-31bb1",
    storageBucket: "open-wa-31bb1.appspot.com",
    messagingSenderId: "349736489986",
    appId: "1:349736489986:web:755dd6ce2e2c526b7a831b",
    measurementId: "G-B72DXQZMLX"
  });

  export const storage = getStorage();

  const functions = getFunctions(fb);

  export const createNewBucketOnly = (data : any) => httpsCallable(functions, 'createNewBucketOnly')(data);
  export const authenticateServer = (data : any) => httpsCallable(functions, 'authenticateServerCallable')(data);
  export const forceDeleteSessionData = (data : any) => httpsCallable(functions, 'forceDeleteSessionData')(data);
  export const deleteSessionDoc = (data : any) => httpsCallable(functions, 'deleteSessionDoc')(data);
