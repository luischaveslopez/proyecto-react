import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {

  apiKey: "AIzaSyAXZRSb42gtS-b2ts3rWbH1wFPfZXVULIQ",

  authDomain: "reactfirebase-6255a.firebaseapp.com",

  projectId: "reactfirebase-6255a",

  storageBucket: "reactfirebase-6255a.firebasestorage.app",

  messagingSenderId: "963316414035",

  appId: "1:963316414035:web:5248a61a01bf34b9bc78a6"

};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
