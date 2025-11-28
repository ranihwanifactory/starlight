import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4xMhm9kmCXrHIm65vzBX2DeCk3v0XrC4",
  authDomain: "familychatapp-5ecc4.firebaseapp.com",
  projectId: "familychatapp-5ecc4",
  storageBucket: "familychatapp-5ecc4.firebasestorage.app",
  messagingSenderId: "119722483360",
  appId: "1:119722483360:web:a8982d8e13afc7aa8cf3c5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
