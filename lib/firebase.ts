// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Analytics isn't typically used on native mobile apps, so you might omit it.

const firebaseConfig = {
  apiKey: "AIzaSyBeTDq6pUCvEnJfInrO5AciLpnoBT5Ndns",
  authDomain: "turn-talk.firebaseapp.com",
  projectId: "turn-talk",
  storageBucket: "turn-talk.firebasestorage.app",
  messagingSenderId: "1068780272639",
  appId: "1:1068780272639:web:40f8f293dca607302a85ca",
  measurementId: "G-E61DVPVLXC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
