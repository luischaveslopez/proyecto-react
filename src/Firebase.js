import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref } from "firebase/database";



const firebaseConfig = {
  apiKey: "AIzaSyApcZelClOwXwkLsgzdU2OnnOEc26Ss-Os",
  authDomain: "checkpoint-app-14bda.firebaseapp.com",
  databaseURL: "https://checkpoint-app-14bda-default-rtdb.firebaseio.com",
  projectId: "checkpoint-app-14bda",
  storageBucket: "checkpoint-app-14bda.firebasestorage.app",
  messagingSenderId: "926430998478",
  appId: "1:926430998478:web:0c2d8de0653907134cc59f"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const database = getDatabase(app);

// Referencia a la base de datos
export const userRef = ref(database, "users");
export {auth, database}
export default app;
