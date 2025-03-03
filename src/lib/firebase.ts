import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh1eF1NFXUzCSPppycYjqeWGrSj1fGJj0",
  authDomain: "kepler-omega-dd495.firebaseapp.com",
  projectId: "kepler-omega-dd495",
  storageBucket: "kepler-omega-dd495.firebasestorage.app",
  messagingSenderId: "110852541952",
  appId: "1:110852541952:web:dcc1b0bbeb4dfabd1552e5",
  measurementId: "G-V4T01YLVWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;