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
  deleteDoc,
  GeoPoint,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ParkingSpot, User } from '@/types';
import * as geofire from 'geofire-common';

const SPOTS_COLLECTION = 'parkingSpots';
const POINTS_FOR_REPORTING = 50;
const POINTS_FOR_VERIFYING = 10;

// Add a new parking spot
export async function addParkingSpot(
  spotData: Omit<ParkingSpot, 'id' | 'timestamp' | 'reporterName' | 'verifiedCount' | 'rating' | 'verified'>,
  user: User,
  photoFile?: File
): Promise<string> {
  try {
    // Create a geopoint for the location
    const geopoint = new GeoPoint(
      spotData.location.latitude,
      spotData.location.longitude
    );

    // Calculate geohash for location-based queries
    const geohash = geofire.geohashForLocation([
      spotData.location.latitude,
      spotData.location.longitude
    ]);

    // Upload photo to Cloudinary if provided
    let photoURL = '';
    if (photoFile) {
      try {
        const { uploadToCloudinary } = await import('@/utils/uploadToCloudinary');
        photoURL = await uploadToCloudinary(photoFile);
      } catch (error) {
        console.warn('Photo upload failed, continuing without photo:', error);
        // Continue without photo if upload fails
      }
    }

    // Create spot document
    console.log('Attempting to create spot document...');
    let spotRef;
    try {
      spotRef = await addDoc(collection(db, SPOTS_COLLECTION), {
        reporterId: user.id,
        reporterName: user.displayName || 'Anonymous',
        location: {
          latitude: spotData.location.latitude,
          longitude: spotData.location.longitude,
          address: spotData.location.address || '',
          geopoint,
          geohash
        },
        timestamp: serverTimestamp(),
        expiresAt: Timestamp.fromDate(spotData.expiresAt),
        type: spotData.type,
        cost: spotData.cost,
        timeLimit: spotData.timeLimit,
        verified: false,
        verifiedCount: 0,
        photos: photoURL ? [photoURL] : [],
        isHandicapAccessible: spotData.isHandicapAccessible,
        isEVCharging: spotData.isEVCharging,
        rating: 0, // Default rating
        status: 'available'
      });
      console.log('Spot created successfully with ID:', spotRef.id);
    } catch (e: any) {
      console.error('Failed to create parking spot document:', e);
      throw new Error(`Failed to create spot: ${e.message}`);
    }

    // Add points to the user for reporting a spot
    try {
      console.log('Attempting to update user points...');
      await updateUserPoints(user.id, POINTS_FOR_REPORTING);
      console.log('User points updated successfully');
    } catch (e: any) {
      console.error('Failed to update user points (spot was created):', e);
      // We don't throw here to avoid failing the whole operation if just points fail
      // but in strict mode we might want to.
    }

    return spotRef.id;
  } catch (error) {
    console.error('Error adding parking spot:', error);
    throw error;
  }
}

// Get a specific parking spot by ID
export async function getParkingSpot(spotId: string): Promise<ParkingSpot | null> {
  try {
    const spotDoc = await getDoc(doc(db, SPOTS_COLLECTION, spotId));
    if (!spotDoc.exists()) return null;

    const data = spotDoc.data();
    return {
      id: spotDoc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address || ''
      }
    } as ParkingSpot;
  } catch (error) {
    console.error('Error getting parking spot:', error);
    throw error;
  }
}

// Get nearby parking spots based on user location
export async function getNearbyParkingSpots(
  latitude: number,
  longitude: number,
  radiusInKm = 1,
  maxResults = 20
): Promise<ParkingSpot[]> {
  try {
    // Find spots within the given radius
    const center = [latitude, longitude];
    const radiusInM = radiusInKm * 1000;

    // Each degree of latitude is approximately 111km, so 1km is about 0.009 degrees
    const latDegrees = radiusInKm / 111;
    const lngDegrees = radiusInKm / (111 * Math.cos(latitude * (Math.PI / 180)));

    const minLat = latitude - latDegrees;
    const maxLat = latitude + latDegrees;
    const minLng = longitude - lngDegrees;
    const maxLng = longitude + lngDegrees;

    const spotsRef = collection(db, SPOTS_COLLECTION);
    const q = query(
      spotsRef,
      where('location.latitude', '>=', minLat),
      where('location.latitude', '<=', maxLat),
      where('status', '==', 'available'),
      orderBy('location.latitude'),
      orderBy('timestamp', 'desc'),
      limit(maxResults * 2) // Fetch more than needed to account for longitude filtering
    );

    const querySnapshot = await getDocs(q);

    // Filter results by longitude (since we can't query on two range fields)
    // and calculate exact distance
    const spots: ParkingSpot[] = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const lng = data.location.longitude;

      if (lng >= minLng && lng <= maxLng) {
        // Calculate exact distance
        const distanceInM = geofire.distanceBetween(
          [data.location.latitude, data.location.longitude],
          [center[0], center[1]]
        );

        if (distanceInM <= radiusInM) {
          spots.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(),
            location: {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              address: data.location.address || ''
            }
          } as ParkingSpot);
        }
      }
    }

    // Sort by distance and limit results
    spots.sort((a, b) => {
      const distA = geofire.distanceBetween(
        [a.location.latitude, a.location.longitude],
        [center[0], center[1]]
      );
      const distB = geofire.distanceBetween(
        [b.location.latitude, b.location.longitude],
        [center[0], center[1]]
      );
      return distA - distB;
    });

    return spots.slice(0, maxResults);
  } catch (error) {
    console.error('Error getting nearby parking spots:', error);
    throw error;
  }
}

// Mark a parking spot as taken
export async function markSpotAsTaken(spotId: string): Promise<void> {
  try {
    await updateDoc(doc(db, SPOTS_COLLECTION, spotId), {
      status: 'taken',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking spot as taken:', error);
    throw error;
  }
}

// Mark a parking spot as expired
export async function markSpotAsExpired(spotId: string): Promise<void> {
  try {
    await updateDoc(doc(db, SPOTS_COLLECTION, spotId), {
      status: 'expired',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking spot as expired:', error);
    throw error;
  }
}

// Verify a parking spot
export async function verifyParkingSpot(spotId: string, userId: string): Promise<void> {
  try {
    const spotRef = doc(db, SPOTS_COLLECTION, spotId);
    const spotDoc = await getDoc(spotRef);

    if (!spotDoc.exists()) {
      throw new Error('Spot not found');
    }

    const spotData = spotDoc.data();
    const verifiedCount = (spotData.verifiedCount || 0) + 1;

    // Mark as verified if at least 3 users have verified it
    const verified = verifiedCount >= 3;

    await updateDoc(spotRef, {
      verifiedCount,
      verified,
      updatedAt: serverTimestamp()
    });

    // Add points to the user for verifying a spot
    await updateUserPoints(userId, POINTS_FOR_VERIFYING);
  } catch (error) {
    console.error('Error verifying parking spot:', error);
    throw error;
  }
}

// Delete a parking spot
export async function deleteParkingSpot(spotId: string, userId: string): Promise<void> {
  try {
    const spotRef = doc(db, SPOTS_COLLECTION, spotId);
    const spotDoc = await getDoc(spotRef);

    if (!spotDoc.exists()) {
      throw new Error('Spot not found');
    }

    const spotData = spotDoc.data();

    // Only allow deletion by the reporter or if spot is expired
    if (spotData.reporterId !== userId && spotData.status !== 'expired') {
      throw new Error('Not authorized to delete this spot');
    }

    await deleteDoc(spotRef);
  } catch (error) {
    console.error('Error deleting parking spot:', error);
    throw error;
  }
}

// Update user points
async function updateUserPoints(userId: string, points: number): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    await updateDoc(userRef, {
      points: currentPoints + points
    });

    // Record the points earned in rewards collection
    await addDoc(collection(db, 'rewards'), {
      userId,
      type: 'points',
      pointsEarned: points,
      description: points > 0
        ? `Earned ${points} points for contributing to the community`
        : `Used ${Math.abs(points)} points`,
      timestamp: serverTimestamp(),
      claimed: true
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    throw error;
  }
}
