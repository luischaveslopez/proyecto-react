import { auth } from "../Firebase";
import {createUserWithEmailAndPassword} from 'firebase/auth'

const registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario agregado correctamente:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Error al registrar usuario:", error.message);
      return error.message;
    }
  };
  
  export default registerUser;