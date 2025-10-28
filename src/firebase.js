// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Auth
import { getFirestore } from "firebase/firestore";           // Firestore (optional)
import { getStorage } from "firebase/storage";               // Storage (optional)
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjJqdXiTzBeUGWQ-SZDDdH41scBGH-A1M",
  authDomain: "ecoloop2003.firebaseapp.com",
  projectId: "ecoloop2003",
  storageBucket: "ecoloop2003.firebasestorage.app",
  messagingSenderId: "249509129717",
  appId: "1:249509129717:web:f2c916035897103f8c04bc",
  measurementId: "G-0G5N2QN43Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure Google Auth Provider
provider.setCustomParameters({
  prompt: 'select_account'
});

// Only initialize analytics in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

const db = getFirestore(app);       // optional
const storage = getStorage(app);    // optional

// Export the services you need
export { auth, provider, db, storage, analytics };