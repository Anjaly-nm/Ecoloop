// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAEIK6NMNvk5MoNS9ZpkZ0sWigy4mAvHTQ",
  authDomain: "ecoloop-4b830.firebaseapp.com",
  projectId: "ecoloop-4b830",
  storageBucket: "ecoloop-4b830.appspot.com",
  messagingSenderId: "586831559357",
  appId: "1:586831559357:web:f5255fd8a714c8a79115d4",
  measurementId: "G-GHQ98LN88B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth + Google Provider
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
