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
  limit,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Notification, UserPreferences, ParkingSpot } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const USER_PREFERENCES_COLLECTION = 'userPreferences';

// Send a notification to a user
export async function sendNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<string> {
  try {
    // Check if the user has notifications enabled
    const userPreferencesRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const userPreferencesDoc = await getDoc(userPreferencesRef);

    if (!userPreferencesDoc.exists()) {
      throw new Error('User preferences not found');
    }

    const userPreferences = userPreferencesDoc.data() as UserPreferences;

    // If notifications are disabled, don't create a notification
    if (!userPreferences.notificationsEnabled) {
      return '';
    }

    // Create notification document
    const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type,
      title,
      message,
      timestamp: serverTimestamp(),
      read: false,
      data
    });

    // In a real app, here we would also send a push notification to the user's device
    // using a service like Firebase Cloud Messaging (FCM)

    return notificationRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string,
  maxResults = 20
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as Notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    for (const doc of querySnapshot.docs) {
      const notificationRef = doc.ref;
      batch.update(notificationRef, { read: true });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notificationDoc = await getDoc(notificationRef);

    if (!notificationDoc.exists()) {
      throw new Error('Notification not found');
    }

    const notificationData = notificationDoc.data();

    // Only allow deletion by the notification owner
    if (notificationData.userId !== userId) {
      throw new Error('Not authorized to delete this notification');
    }

    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Send spot found notification to nearby users
export async function notifyNearbyUsers(spot: ParkingSpot): Promise<void> {
  try {
    // In a real app, this would be handled by a backend function
    // using geoqueries to find users within a certain radius
    // For now, we'll just show how we might implement it

    // Step 1: Find all users with preferences within the spot's radius
    const preferencesRef = collection(db, USER_PREFERENCES_COLLECTION);
    const preferencesSnapshot = await getDocs(preferencesRef);

    // Step 2: Filter for users who have notifications enabled
    const eligibleUserIds: string[] = [];

    for (const doc of preferencesSnapshot.docs) {
      const preferences = doc.data() as UserPreferences;

      if (preferences.notificationsEnabled &&
          preferences.preferredParkingTypes.includes(spot.type) &&
          (preferences.maxParkingCost === null || spot.cost === null || spot.cost <= preferences.maxParkingCost)) {
        eligibleUserIds.push(preferences.userId);
      }
    }

    // Step 3: Send notification to each eligible user
    // In a real app, this would filter by user location
    for (const userId of eligibleUserIds) {
      // Skip the reporter
      if (userId === spot.reporterId) continue;

      await sendNotification(
        userId,
        'spot_found',
        'Parking Spot Available!',
        `A new ${spot.type} parking spot was just reported nearby`,
        {
          spotId: spot.id,
          latitude: spot.location.latitude,
          longitude: spot.location.longitude,
          type: spot.type,
          cost: spot.cost
        }
      );
    }
  } catch (error) {
    console.error('Error notifying nearby users:', error);
    throw error;
  }
}

// Send parking time expiring notification
export async function sendParkingExpiryNotification(
  userId: string,
  sessionId: string,
  minutesRemaining: number
): Promise<void> {
  try {
    await sendNotification(
      userId,
      'time_expiring',
      'Parking Time Expiring',
      `Your parking time will expire in ${minutesRemaining} minutes`,
      {
        sessionId,
        minutesRemaining
      }
    );
  } catch (error) {
    console.error('Error sending parking expiry notification:', error);
    throw error;
  }
}

// Send reward earned notification
export async function sendRewardNotification(
  userId: string,
  pointsEarned: number,
  description: string
): Promise<void> {
  try {
    await sendNotification(
      userId,
      'reward_earned',
      'You Earned Points!',
      `You earned ${pointsEarned} points: ${description}`,
      {
        pointsEarned,
        description
      }
    );
  } catch (error) {
    console.error('Error sending reward notification:', error);
    throw error;
  }
}
