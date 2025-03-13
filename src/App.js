import React, { useEffect } from "react";
import "./App.css";
import { userRef } from "./Firebase";
import {  push } from "firebase/database"; 
import registerUser from "./api/SignUp";
import signInUser from "./api/SignIn";

function App() {
  useEffect(() => {
    function callfunc() {
      push(userRef, {
        email: "ejemplo2@gmail.com",
        password: "123456789",
      })
        .then(() => console.log("Datos guardados correctamente"))
        .catch((error) => console.error("Error al guardar los datos:", error));
    }

    callfunc();
  }, []);

  const onsignup = async () => {
    try {
      const result = await registerUser("luis@gmail.com", "password123"); 
      console.log("Usuario registrado correctamente:", result);
    } catch (error) {
      console.error("Error en onsignup:", error);
    }
  };// aqui se agrega un usuario nuevo a la bd

  const onsignin = async () => {
    try {
      const result = await signInUser("demo_tercero2@gmail.com", "password123");
      console.log("Inicio de sesión exitoso:", result);
    } catch (error) {
      console.error("Error en onsignin:", error);
    }
  };


  return (
    <div className="App">
      <button onClick={()=>onsignup()}>Sign up </button>
      <button onClick={()=>onsignin()}>Sign in </button>
    </div>
  );
}

export default App;
