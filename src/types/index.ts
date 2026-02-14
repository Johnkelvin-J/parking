export type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  points: number;
  vehicles: Vehicle[];
};

export type Vehicle = {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
};

export type ParkingSpot = {
  id: string;
  reporterId: string;
  reporterName: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: Date;
  expiresAt: Date; // Estimated time the spot will expire
  type: 'street' | 'garage' | 'lot';
  cost: number | null; // null means free
  timeLimit: number | null; // in minutes, null means no limit
  verified: boolean;
  verifiedCount: number;
  photos: string[]; // URLs to photos
  isHandicapAccessible: boolean;
  isEVCharging: boolean;
  rating: number; // Average rating from 1-5
  status: 'available' | 'taken' | 'expired';
};

export type ParkingSession = {
  id: string;
  userId: string;
  spotId: string;
  vehicleId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // in minutes
  cost: number | null;
  isActive: boolean;
  reminderSet: boolean;
  reminderTime: Date | null;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'spot_found' | 'time_expiring' | 'reward_earned' | 'spot_taken';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data: Record<string, unknown>; // Additional data specific to notification type
};

export type Reward = {
  id: string;
  userId: string;
  type: 'points' | 'badge' | 'level_up';
  pointsEarned: number;
  description: string;
  timestamp: Date;
  claimed: boolean;
};

export type UserPreferences = {
  userId: string;
  notificationRadius: number; // in miles
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  preferredParkingTypes: Array<'street' | 'garage' | 'lot'>;
  maxParkingCost: number | null; // null means no limit
};

export type SpotRating = {
  id: string;
  spotId: string;
  userId: string;
  rating: number; // 1-5
  comment: string | null;
  timestamp: Date;
};
