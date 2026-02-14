# Parking Spot Finder

A modern web application for finding and sharing parking spots in your area. Built with React, TypeScript, Vite, Firebase, and Leaflet maps.

## Features

- 🔐 **Authentication**: Email/password and Google sign-in
- 🗺️ **Interactive Maps**: Real-time map view with Leaflet integration
- 📍 **Parking Spot Management**: Report, verify, and find nearby parking spots
- 🚗 **Parking Sessions**: Track active parking sessions with reminders
- 🏆 **Rewards System**: Earn points for contributing to the community
- 📱 **Notifications**: Get notified about nearby spots and expiring sessions
- ⚙️ **User Preferences**: Customize notification radius and parking preferences
- 🌙 **Dark Mode**: Support for light/dark/system themes

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui
- **Maps**: Leaflet, React Leaflet
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Notifications**: Sonner (Toast notifications)

## Prerequisites

- Node.js 18+ (or Bun)
- Firebase project with Firestore and Storage enabled
- Google Maps API key (optional, for address geocoding)

## Setup Instructions

### 1. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun:
```bash
bun install
```

### 2. Configure Firebase

**📖 For detailed step-by-step instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

Quick overview:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase configuration
6. Update `src/config/firebase.ts` with your config values

The detailed guide includes:
- Screenshot references
- Security rules setup
- Troubleshooting tips
- Best practices

### 4. Set Up Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /parkingSpots/{spotId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.reporterId == request.auth.uid || 
         resource.data.status == 'expired');
    }
    match /parkingSessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /rewards/{rewardId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 5. Run the Development Server

Using npm:
```bash
npm run dev
```

Or using Bun:
```bash
bun run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── Layout.tsx      # Main layout with navigation
├── config/             # Configuration files
│   └── firebase.ts     # Firebase configuration
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   └── useGeolocation.ts # Geolocation hook
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ParkingSpotsPage.tsx
│   ├── ParkingSessionsPage.tsx
│   ├── ProfilePage.tsx
│   ├── RewardsPage.tsx
│   ├── NotificationsPage.tsx
│   └── SettingsPage.tsx
├── services/           # API/service functions
│   ├── auth.ts         # Authentication services
│   ├── parkingSpots.ts # Parking spot services
│   ├── parkingSessions.ts # Session services
│   ├── rewards.ts      # Rewards services
│   └── notifications.ts # Notification services
├── types/              # TypeScript type definitions
│   └── index.ts
├── lib/                # Utility functions
│   └── utils.ts
├── App.tsx             # Main app component with routing
└── main.tsx            # Entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter
- `npm run format` - Format code

## Features in Detail

### Parking Spots
- Report new parking spots with location, cost, time limits
- View nearby spots on an interactive map
- Verify spots reported by others
- Filter by type (street, garage, lot), cost, and features

### Parking Sessions
- Start a parking session when you park
- Set reminders for expiring parking time
- Track session history
- Automatic spot status updates

### Rewards System
- Earn 50 points for reporting a spot
- Earn 10 points for verifying a spot
- View leaderboard rankings
- Track reward history

### Notifications
- Get notified about nearby parking spots
- Receive reminders for expiring sessions
- Track reward notifications
- Mark notifications as read

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
