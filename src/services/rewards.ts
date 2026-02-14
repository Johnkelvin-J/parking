import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Reward } from '@/types';
import { sendRewardNotification } from './notifications';

const REWARDS_COLLECTION = 'rewards';
const USERS_COLLECTION = 'users';

// Get rewards for a user
export async function getUserRewards(
  userId: string,
  maxResults = 20
): Promise<Reward[]> {
  try {
    const rewardsRef = collection(db, REWARDS_COLLECTION);
    const q = query(
      rewardsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const rewards: Reward[] = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      rewards.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as Reward);
    }

    return rewards;
  } catch (error) {
    console.error('Error getting user rewards:', error);
    throw error;
  }
}

// Reward a user with points
export async function rewardUserWithPoints(
  userId: string,
  points: number,
  description: string
): Promise<string> {
  try {
    // Create reward document
    const rewardRef = await addDoc(collection(db, REWARDS_COLLECTION), {
      userId,
      type: 'points',
      pointsEarned: points,
      description,
      timestamp: serverTimestamp(),
      claimed: false
    });

    // Send notification to user
    await sendRewardNotification(userId, points, description);

    return rewardRef.id;
  } catch (error) {
    console.error('Error rewarding user with points:', error);
    throw error;
  }
}

// Claim a reward
export async function claimReward(rewardId: string): Promise<void> {
  try {
    const rewardRef = doc(db, REWARDS_COLLECTION, rewardId);
    const rewardDoc = await getDoc(rewardRef);

    if (!rewardDoc.exists()) {
      throw new Error('Reward not found');
    }

    const rewardData = rewardDoc.data();

    if (rewardData.claimed) {
      throw new Error('Reward already claimed');
    }

    // Update reward status
    await updateDoc(rewardRef, {
      claimed: true
    });

    // Update user points
    const userRef = doc(db, USERS_COLLECTION, rewardData.userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    await updateDoc(userRef, {
      points: currentPoints + rewardData.pointsEarned
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    throw error;
  }
}

// Get user's total points
export async function getUserPoints(userId: string): Promise<number> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    return userData.points || 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    throw error;
  }
}

// Get user's ranking
export async function getUserRanking(userId: string): Promise<number> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      orderBy('points', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs;

    // Find the index of the user
    const userIndex = users.findIndex(doc => doc.id === userId);

    // Return 1-based ranking
    return userIndex === -1 ? -1 : userIndex + 1;
  } catch (error) {
    console.error('Error getting user ranking:', error);
    throw error;
  }
}

// Get top users by points
export async function getTopUsers(maxResults = 10): Promise<Array<{ id: string; displayName: string; points: number }>> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      orderBy('points', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const topUsers = [];

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      topUsers.push({
        id: doc.id,
        displayName: data.displayName || 'Anonymous',
        points: data.points || 0
      });
    }

    return topUsers;
  } catch (error) {
    console.error('Error getting top users:', error);
    throw error;
  }
}
