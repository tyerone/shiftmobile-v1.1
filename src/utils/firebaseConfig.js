import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsSekBjbYlhan5jnay05rvCYg7vhiNWtA",
  authDomain: "shift-37798.firebaseapp.com",
  projectId: "shift-37798",
  storageBucket: "shift-37798.firebasestorage.app",
  messagingSenderId: "578258757047",
  appId: "1:578258757047:web:71e22bf73594b76ac47432"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)