import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ParkingSession } from '@/types';
import { markSpotAsTaken, markSpotAsExpired } from './parkingSpots';

const SESSIONS_COLLECTION = 'parkingSessions';

// Start a new parking session
export async function startParkingSession(
  userId: string,
  spotId: string,
  vehicleId: string
): Promise<string> {
  try {
    // Create session document
    const sessionRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      userId,
      spotId,
      vehicleId,
      startTime: serverTimestamp(),
      endTime: null,
      duration: null,
      cost: null,
      isActive: true,
      reminderSet: false,
      reminderTime: null
    });

    // Mark the spot as taken
    await markSpotAsTaken(spotId);

    return sessionRef.id;
  } catch (error) {
    console.error('Error starting parking session:', error);
    throw error;
  }
}

// End an active parking session
export async function endParkingSession(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();

    if (!sessionData.isActive) {
      throw new Error('Session already ended');
    }

    const startTime = sessionData.startTime.toDate();
    const endTime = new Date();
    const durationInMs = endTime.getTime() - startTime.getTime();
    const durationInMinutes = Math.round(durationInMs / 60000);

    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      duration: durationInMinutes,
      isActive: false
    });

    // Mark the spot as expired
    await markSpotAsExpired(sessionData.spotId);
  } catch (error) {
    console.error('Error ending parking session:', error);
    throw error;
  }
}

// Get a specific parking session by ID
export async function getParkingSession(sessionId: string): Promise<ParkingSession | null> {
  try {
    const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, sessionId));
    if (!sessionDoc.exists()) return null;

    const data = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || null,
      reminderTime: data.reminderTime?.toDate() || null
    } as ParkingSession;
  } catch (error) {
    console.error('Error getting parking session:', error);
    throw error;
  }
}

// Get active parking session for user
export async function getActiveSessionForUser(userId: string): Promise<ParkingSession | null> {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('startTime', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || null,
      reminderTime: data.reminderTime?.toDate() || null
    } as ParkingSession;
  } catch (error) {
    console.error('Error getting active session for user:', error);
    throw error;
  }
}

// Get parking session history for user
export async function getUserSessionHistory(
  userId: string,
  maxResults = 10
): Promise<ParkingSession[]> {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const sessions: ParkingSession[] = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || null,
        reminderTime: data.reminderTime?.toDate() || null
      } as ParkingSession);
    }

    return sessions;
  } catch (error) {
    console.error('Error getting user session history:', error);
    throw error;
  }
}

// Set a reminder for a parking session
export async function setSessionReminder(
  sessionId: string,
  reminderTime: Date
): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await updateDoc(sessionRef, {
      reminderSet: true,
      reminderTime: Timestamp.fromDate(reminderTime)
    });
  } catch (error) {
    console.error('Error setting session reminder:', error);
    throw error;
  }
}

// Cancel a reminder for a parking session
export async function cancelSessionReminder(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await updateDoc(sessionRef, {
      reminderSet: false,
      reminderTime: null
    });
  } catch (error) {
    console.error('Error canceling session reminder:', error);
    throw error;
  }
}

// Delete a parking session
export async function deleteParkingSession(sessionId: string, userId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data();

    // Only allow deletion by the session owner
    if (sessionData.userId !== userId) {
      throw new Error('Not authorized to delete this session');
    }

    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error deleting parking session:', error);
    throw error;
  }
}
