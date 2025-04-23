import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyC0UzkZuwuKMhPb9o2zWhUSRqVLA_PO2Yk",
  authDomain: "pruebas-proyecto-9bd1c.firebaseapp.com",
  projectId: "pruebas-proyecto-9bd1c",
  storageBucket: "pruebas-proyecto-9bd1c.appspot.com",  
  messagingSenderId: "443103949112",
  appId: "1:443103949112:web:030afb8194cc4eaed091cd"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
