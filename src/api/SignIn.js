import { auth } from "../Firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";

const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario encontrado e iniciado sesión", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    return error.message;
  }
};

export default signInUser;
