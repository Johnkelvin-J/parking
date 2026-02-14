# Firebase Setup Guide - Step by Step

This guide will walk you through setting up Firebase for your Parking Spot Finder application.

## ⚠️ Important: Storage is Optional!

**You can skip Step 6 (Storage)** if you don't want to pay for Firebase Storage. The app works perfectly without it - users just won't be able to upload photos with parking spots. All other features (authentication, maps, reporting spots, sessions, rewards) work without Storage.

**What works WITHOUT Storage:**
- ✅ User authentication (login/register)
- ✅ Reporting parking spots
- ✅ Viewing spots on map
- ✅ Parking sessions
- ✅ Rewards and points
- ✅ Notifications
- ✅ All core features

**What doesn't work WITHOUT Storage:**
- ❌ Photo uploads for parking spots

The code automatically handles missing Storage gracefully, so you can skip Step 6 and continue to Step 7!

## Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

---

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click the **"Add project"** button (or "Create a project")
   - Enter project name: `parking-spot-finder` (or any name you prefer)
   - Click **"Continue"**

3. **Configure Google Analytics (Optional)**
   - You can enable or disable Google Analytics for this project
   - For this app, you can choose either option
   - Click **"Create project"**

4. **Wait for Project Creation**
   - Firebase will create your project (takes about 30 seconds)
   - Click **"Continue"** when done

---

## Step 2: Register Your Web App

1. **Add a Web App**
   - In the Firebase project dashboard, click the **Web icon** (`</>`)
   - Or click **"Add app"** and select **Web**

2. **Register App**
   - Enter app nickname: `Parking Spot Finder Web` (or any name)
   - **DO NOT** check "Also set up Firebase Hosting" (unless you want to use it)
   - Click **"Register app"**

3. **Copy Firebase Configuration**
   - You'll see a code snippet with your Firebase config
   - It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdefghijklmnop"
   };
   ```
   - **Keep this page open** - you'll need these values in Step 6

---

## Step 3: Enable Authentication

1. **Navigate to Authentication**
   - In the left sidebar, click **"Authentication"**
   - Click **"Get started"** if you see it

2. **Enable Sign-in Methods**
   - Click on the **"Sign-in method"** tab
   
3. **Enable Email/Password**
   - Click on **"Email/Password"**
   - Toggle **"Enable"** to ON
   - Click **"Save"**

4. **Enable Google Sign-in**
   - Click on **"Google"**
   - Toggle **"Enable"** to ON
   - Select a support email (use your email)
   - Click **"Save"**

---

## Step 4: Create Firestore Database

1. **Navigate to Firestore**
   - In the left sidebar, click **"Firestore Database"**
   - Click **"Create database"**

2. **Choose Security Rules Mode**
   - Select **"Start in test mode"** (we'll update rules later)
   - Click **"Next"**

3. **Choose Location**
   - Select a location closest to your users
   - For example: `us-central` (Iowa) or `europe-west` (Belgium)
   - Click **"Enable"**

4. **Wait for Database Creation**
   - This takes about 1-2 minutes
   - You'll see "Cloud Firestore" when ready

---

## Step 5: Set Up Firestore Security Rules

1. **Go to Firestore Rules**
   - In Firestore Database, click the **"Rules"** tab

2. **Replace the Rules**
   - Delete the existing test mode rules
   - Copy and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is accessing their own data
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
    }
    
    // Parking spots
    match /parkingSpots/{spotId} {
      allow read: if true; // Anyone can view spots
      allow create: if isAuthenticated(); // Only auth users can report
      allow update: if isAuthenticated(); // Only auth users can update (verification, etc.)
      allow delete: if isAuthenticated() && (resource.data.reporterId == request.auth.uid || resource.data.status == 'expired');
    }
    
    // Parking sessions
    match /parkingSessions/{sessionId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Rewards
    match /rewards/{rewardId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated(); // Allow system to create rewards (via client SDK for now)
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. **Publish Rules**
   - Click **"Publish"** button
   - Rules are now active

---

## Step 6: Enable Storage (OPTIONAL - Skip if you don't want to pay)

**⚠️ IMPORTANT:** Firebase Storage requires a paid plan (Blaze plan). 
**You can SKIP this step** - the app will work perfectly without photo uploads!

### Option A: Skip Storage (Recommended if you don't want to pay)

**You can skip this entire step!** The app will work fine without Storage. Users just won't be able to upload photos with parking spots.

- ✅ All other features work (reporting spots, sessions, rewards, etc.)
- ✅ Maps, authentication, and database all work
- ❌ Only photo uploads will be disabled

**Just continue to Step 7** - the code already handles missing Storage gracefully.

---

### Option B: Enable Storage (Only if you want photo uploads)

**Note:** This requires upgrading to Firebase Blaze (pay-as-you-go) plan. 
The free Spark plan does NOT include Storage.

1. **Upgrade to Blaze Plan** (if not already)
   - Go to Firebase Console > Project Settings > Usage and billing
   - Click "Upgrade" to Blaze plan
   - **Note:** Blaze plan has a free tier, but requires a credit card

2. **Navigate to Storage**
   - In the left sidebar, click **"Storage"**
   - Click **"Get started"**

3. **Set Up Storage**
   - Choose **"Start in test mode"** (we'll update rules)
   - Click **"Next"**

4. **Choose Location**
   - Use the same location as Firestore (or choose closest)
   - Click **"Done"**

5. **Set Storage Security Rules**
   - Click on the **"Rules"** tab
   - Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload spot photos
    match /spots/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
   - Click **"Publish"**

---

## Step 7: Update Your App Configuration

1. **Open Your Project**
   - Navigate to your project folder
   - Open `src/config/firebase.ts`

2. **Replace Configuration Values**
   - Go back to Firebase Console (Step 2)
   - Copy each value from the Firebase config
   - Replace the placeholder values in `firebase.ts`:

```typescript
// Before (placeholders):
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "parking-spot-finder-app.firebaseapp.com",
  projectId: "parking-spot-finder-app",
  storageBucket: "parking-spot-finder-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// After (your actual values):
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // Your actual API key
  authDomain: "your-project.firebaseapp.com",      // Your actual auth domain
  projectId: "your-project-id",                     // Your actual project ID
  storageBucket: "your-project.appspot.com",        // Your actual storage bucket (can leave as is if you skipped Storage)
  messagingSenderId: "123456789012",                // Your actual sender ID
  appId: "1:123456789012:web:abcdefghijklmnop",    // Your actual app ID
  measurementId: "G-XXXXXXXXXX"                    // Your actual measurement ID (optional)
};
```

**Note:** If you skipped Step 6 (Storage), you can leave `storageBucket` as the placeholder value or use the one from Firebase config. The app will automatically detect that Storage is not enabled and disable photo uploads.

3. **Save the File**
   - Save `firebase.ts` with your actual values

---

## Step 8: Verify Setup

1. **Check Firebase Console**
   - Authentication: Should show enabled methods (Email/Password, Google)
   - Firestore: Should show empty database (ready for data)
   - Storage: Should show empty bucket (ready for files)

2. **Test Your App**
   - Run `npm run dev` or `bun run dev`
   - Try to register a new account
   - Check Firebase Console > Authentication > Users - you should see the new user
   - Check Firestore - you should see collections being created

---

## Step 9: Optional - Get Measurement ID (for Analytics)

If you enabled Google Analytics:

1. **Find Measurement ID**
   - Go to Firebase Console > Project Settings
   - Scroll down to "Your apps" section
   - Find your web app
   - The Measurement ID is shown there (format: `G-XXXXXXXXXX`)

2. **Add to Config**
   - Add it to your `firebase.ts` file (it's optional, app works without it)

---

## Troubleshooting

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: 
- Go to Firebase Console > Authentication > Settings > Authorized domains
- Add your domain (for localhost, it should already be there)
- For production, add your actual domain

### Issue: "Permission denied" errors
**Solution**:
- Check that Firestore security rules are published correctly
- Make sure user is authenticated
- Verify rules match the structure in Step 5

### Issue: Can't find Firebase config values
**Solution**:
- Go to Firebase Console > Project Settings (gear icon)
- Scroll to "Your apps" section
- Click on your web app
- Click "Config" to see the values again

### Issue: Storage upload fails
**Solution**:
- Check Storage security rules are published
- Verify Storage is enabled
- Check browser console for specific error messages

---

## Security Best Practices

1. **Never commit Firebase config with real values to public repos**
   - Use environment variables for production
   - The config values are safe to use in client-side code (they're public anyway)

2. **Review Security Rules Regularly**
   - Test your rules using the Rules Playground in Firebase Console
   - Make sure rules match your app's requirements

3. **Monitor Usage**
   - Check Firebase Console > Usage and billing regularly
   - Set up billing alerts if needed

---

## Next Steps

After completing this setup:

1. ✅ Your Firebase is configured
2. ✅ Run `npm run dev` to start the app
3. ✅ Create your first account
4. ✅ Start reporting parking spots!

---

## Quick Reference

**Firebase Console**: https://console.firebase.google.com/

**Your Config File**: `src/config/firebase.ts`

**Important Collections**:
- `users` - User profiles
- `parkingSpots` - Parking spot data
- `parkingSessions` - Active parking sessions
- `notifications` - User notifications
- `rewards` - User rewards/points
- `userPreferences` - User settings

---

Need help? Check the main README.md or Firebase documentation: https://firebase.google.com/docs

