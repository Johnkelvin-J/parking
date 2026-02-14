# How to Run the Parking Spot Finder Project - Step by Step

This guide will walk you through running the project from start to finish.

---

## Prerequisites Check

Before starting, make sure you have:

- ✅ **Node.js** installed (version 18 or higher)
  - Check by running: `node --version`
  - Download from: https://nodejs.org/ (if not installed)
  
- ✅ **npm** (comes with Node.js) or **Bun** (optional)
  - Check npm: `npm --version`
  - Check Bun: `bun --version` (optional)

- ✅ **Firebase configured** (you've already done this! ✅)
  - Your `src/config/firebase.ts` is already set up

---

## Step 1: Open Project in Terminal

1. **Open your terminal/command prompt**
   - **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
   - **Mac/Linux**: Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux), type `terminal`

2. **Navigate to your project folder**
   ```bash
   cd "C:\Users\harim\Downloads\parking-spot-finder"
   ```
   
   Or if you're already in the Downloads folder:
   ```bash
   cd parking-spot-finder
   ```

3. **Verify you're in the right folder**
   - You should see files like `package.json`, `README.md`, `src` folder
   - Type `dir` (Windows) or `ls` (Mac/Linux) to list files

---

## Step 2: Install Dependencies

This downloads all the required packages (React, Firebase, etc.) that the project needs.

### Option A: Using npm (Recommended)

```bash
npm install
```

**What happens:**
- Downloads all packages listed in `package.json`
- Creates a `node_modules` folder
- Takes 2-5 minutes depending on your internet speed

**Expected output:**
```
added 500+ packages, and audited 501 packages in 2m
```

### Option B: Using Bun (Faster, Optional)

If you have Bun installed:
```bash
bun install
```

**Note:** If you see any errors, don't worry - we'll troubleshoot in Step 5.

---

## Step 3: Verify Installation

Check that everything installed correctly:

```bash
npm list --depth=0
```

You should see packages like:
- react
- firebase
- vite
- @tanstack/react-query
- etc.

---

## Step 4: Start the Development Server

Run this command to start the app:

```bash
npm run dev
```

**What happens:**
- Vite starts a development server
- Compiles your React code
- Starts a local web server
- Opens your app in the browser (sometimes)

**Expected output:**
```
  VITE v6.0.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

**Important:** Keep this terminal window open! Closing it will stop the server.

---

## Step 5: Open the App in Browser

1. **Look at the terminal output** - you'll see a URL like:
   ```
   Local:   http://localhost:5173/
   ```

2. **Open your web browser** (Chrome, Firefox, Edge, Safari)

3. **Type or paste the URL** in the address bar:
   ```
   http://localhost:5173
   ```

4. **Press Enter**

5. **You should see:**
   - The Parking Spot Finder login page
   - A form to sign in or register
   - The app logo/icon

---

## Step 6: Test the App

### Create Your First Account

1. **Click "Sign up"** or go to `/register`

2. **Fill in the registration form:**
   - Display Name: Your name (e.g., "John Doe")
   - Email: Your email address
   - Password: At least 6 characters
   - Confirm Password: Same password

3. **Click "Create Account"**

4. **You should be redirected to the Dashboard**

### Test Features

1. **Dashboard:**
   - Allow location access when prompted
   - You should see a map with your location
   - Nearby parking spots will appear (if any exist)

2. **Report a Parking Spot:**
   - Click "Parking Spots" in the sidebar
   - Click "Report Spot" button
   - Fill in the form and submit

3. **Check Other Pages:**
   - Profile
   - Sessions
   - Rewards
   - Notifications
   - Settings

---

## Step 7: Stop the Server

When you're done testing:

1. **Go back to your terminal**
2. **Press `Ctrl + C`** (Windows/Linux) or `Cmd + C` (Mac)
3. **Confirm by pressing `Y` and Enter** (if prompted)

The server will stop and you'll see:
```
^C
```

---

## Common Issues & Solutions

### Issue 1: "npm: command not found" or "npm is not recognized"

**Solution:**
- Node.js is not installed or not in PATH
- Download and install Node.js from https://nodejs.org/
- Restart your terminal after installation
- Verify with: `node --version` and `npm --version`

---

### Issue 2: Port 5173 is already in use

**Error message:**
```
Error: Port 5173 is already in use
```

**Solution:**
- Another app is using port 5173
- Option A: Close the other app using that port
- Option B: Use a different port:
  ```bash
  npm run dev -- --port 3000
  ```
  Then open: `http://localhost:3000`

---

### Issue 3: Firebase Authentication Errors

**Error message:**
```
Firebase: Error (auth/unauthorized-domain)
```

**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Authentication > Settings > Authorized domains
4. Make sure `localhost` is listed (it should be by default)
5. If not, click "Add domain" and add `localhost`

---

### Issue 4: Dependency Conflict Errors (ERESOLVE)

**Error message:**
```
npm error ERESOLVE unable to resolve dependency tree
react-leaflet@5.0.0 requires react@^19.0.0
```

**Solution:**
This has been fixed in the package.json. If you still see this error:

1. **Delete node_modules and lock file:**
   ```bash
   # Windows
   rmdir /s /q node_modules
   del package-lock.json
   
   # Mac/Linux
   rm -rf node_modules package-lock.json
   ```

2. **Reinstall:**
   ```bash
   npm install
   ```

3. **If still having issues, use legacy peer deps:**
   ```bash
   npm install --legacy-peer-deps
   ```

---

### Issue 5: "Cannot find module" errors

**Error message:**
```
Cannot find module 'firebase/app'
```

**Solution:**
- Dependencies weren't installed properly
- Run again:
  ```bash
  npm install
  ```
- If that doesn't work, delete `node_modules` and `package-lock.json`, then reinstall:
  ```bash
  # Windows
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   
   # Mac/Linux
   rm -rf node_modules package-lock.json
   npm install
  ```

---

### Issue 6: Location Permission Denied

**Issue:** Map doesn't show your location

**Solution:**
1. Click the lock icon in your browser's address bar
2. Allow location access
3. Or manually enable in browser settings:
   - Chrome: Settings > Privacy and security > Site settings > Location
   - Firefox: Settings > Privacy & Security > Permissions > Location

---

### Issue 7: Blank White Screen

**Possible causes:**
1. **Check browser console** (F12) for errors
2. **Firebase config issue** - verify your `src/config/firebase.ts` has correct values
3. **JavaScript errors** - check the console tab in browser dev tools

**Solution:**
- Open browser DevTools (F12)
- Check Console tab for red error messages
- Share the error message for help

---

### Issue 8: "Module not found" errors in terminal

**Error:**
```
Module not found: Can't resolve '@/components/...'
```

**Solution:**
- This is usually a TypeScript/Vite path alias issue
- Make sure `vite.config.ts` exists and has the `@` alias configured
- Restart the dev server:
  ```bash
  # Stop server (Ctrl+C)
  npm run dev
  ```

---

## Quick Reference Commands

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run Linter (Check Code Quality)
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

---

## Project Structure Quick Reference

```
parking-spot-finder/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Page components
│   ├── services/       # Firebase services
│   ├── hooks/          # Custom React hooks
│   ├── config/         # Configuration (Firebase)
│   └── App.tsx         # Main app component
├── public/             # Static files
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

---

## Next Steps After Running

Once the app is running:

1. ✅ **Create an account** - Register a new user
2. ✅ **Allow location** - Enable location access for maps
3. ✅ **Report a spot** - Test reporting a parking spot
4. ✅ **Explore features** - Check out all the pages
5. ✅ **Read the code** - Explore `src/` folder to understand the structure

---

## Need Help?

If you encounter any issues:

1. **Check the error message** in terminal or browser console
2. **Review this guide** - most common issues are covered above
3. **Check Firebase Console** - make sure Authentication and Firestore are enabled
4. **Verify your Firebase config** - ensure `src/config/firebase.ts` has correct values

---

## Summary: Quick Start

```bash
# 1. Navigate to project
cd "C:\Users\harim\Downloads\parking-spot-finder"

# 2. Install dependencies (first time only)
npm install

# 3. Start the server
npm run dev

# 4. Open browser
# Go to: http://localhost:5173

# 5. Stop server (when done)
# Press Ctrl+C in terminal
```

That's it! Your app should now be running! 🎉

