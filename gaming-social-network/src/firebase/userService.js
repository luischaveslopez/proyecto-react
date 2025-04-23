import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './config'; 

    export async function ensureUserDocumentExists(user) { // esto es para que todos los usuarios tengan perfil, uaunque se registren con google o lo que sea
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
        username: user.displayName || "Nuevo usuario",
        email: user.email,
        bio: "",
        avatarURL: user.photoURL || "",
        location: "",
        createdAt: new Date()
        });
    }
    }
