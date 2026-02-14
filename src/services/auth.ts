import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types';

// Register a new user with email and password
export async function registerWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }

    // Create user document in Firestore
    await createUserDocument(userCredential.user, displayName);

    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await createUserDocument(
        userCredential.user,
        userCredential.user.displayName || 'User'
      );
    }

    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// Sign out current user
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

// Create user document in Firestore
async function createUserDocument(user: FirebaseUser, displayName: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);

    // Create new user object
    const userData: Partial<User> = {
      id: user.uid,
      email: user.email || '',
      displayName: displayName,
      photoURL: user.photoURL,
      points: 100, // Starting points
      vehicles: [],
      createdAt: new Date(),
    };

    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp()
    });

    // Also create user preferences
    const preferencesRef = doc(db, 'userPreferences', user.uid);
    await setDoc(preferencesRef, {
      userId: user.uid,
      notificationRadius: 1, // Default 1 mile
      notificationsEnabled: true,
      darkModeEnabled: false,
      preferredParkingTypes: ['street', 'garage', 'lot'],
      maxParkingCost: null
    });

  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

// Get current user from Firestore
export async function getCurrentUser(): Promise<User | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) return null;

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}

// Auth state observer
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
