import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// 
// STEP-BY-STEP SETUP:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or select existing)
// 3. Click the Web icon (</>) to add a web app
// 4. Copy the config values from Firebase Console
// 5. Replace the placeholder values below with your actual values
// 
// For detailed instructions, see FIREBASE_SETUP.md
//
// NOTE: Storage is OPTIONAL - you can skip Step 6 if you don't want to pay for Storage
// The app will work without photo uploads. Just leave storageBucket as is.
//
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlkki_jFqPQ3Rw4VJZfs-UdLyGTHfRsKI",
  authDomain: "parking-spot-finder-96099.firebaseapp.com",
  projectId: "parking-spot-finder-96099",
  storageBucket: "parking-spot-finder-96099.firebasestorage.app",
  messagingSenderId: "154674226231",
  appId: "1:154674226231:web:0ca6915c1ad1d615f0cbb2",
  measurementId: "G-DSB0WTSB4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Storage only if available (optional - skip Step 6 if you don't want to pay)
// If Storage is not enabled, photo uploads will be disabled but app will work fine
let storage: FirebaseStorage | null = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage not available. Photo uploads will be disabled.');
}

export { app, auth, db, storage };
