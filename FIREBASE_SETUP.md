# Firebase Functions Setup Guide

This guide will help you set up Firebase Functions for sending email reminders.

## Prerequisites

1. **Firebase Account**: Sign up at [firebase.google.com](https://firebase.google.com)
2. **Node.js**: Install Node.js (version 18 or higher)
3. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
4. **SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com) for email service

## Step 1: Initialize Firebase in Your Project

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase in your project directory:
```bash
firebase init
```

3. Select the following options:
   - ✅ Functions: Configure a Cloud Functions directory
   - ✅ Firestore: Configure security rules and indexes
   - Select your Firebase project (or create a new one)
   - Choose JavaScript (or TypeScript if you prefer)
   - Install dependencies? Yes

## Step 2: Set Up SendGrid

1. **Create SendGrid Account**:
   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up for a free account (100 emails/day free tier)

2. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it (e.g., "Firebase Functions")
   - Select "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (you won't see it again!)

3. **Verify Sender Email**:
   - Go to Settings → Sender Authentication
   - Verify a single sender email (e.g., reminder@yourdomain.com)
   - This will be your "from" email address

## Step 3: Configure Firebase Functions

1. **Set SendGrid API Key**:
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"
```

2. **Update the from email in functions/index.js**:
   - Open `functions/index.js`
   - Change `'reminder@your-app.com'` to your verified SendGrid sender email

## Step 4: Deploy Functions

1. **Install dependencies** (if not already done):
```bash
cd functions
npm install
cd ..
```

2. **Deploy to Firebase**:
```bash
firebase deploy --only functions
```

3. **Verify deployment**:
   - Go to Firebase Console → Functions
   - You should see `checkReminders` function listed
   - It will run automatically every 5 minutes

## Step 5: Update Your App to Use Firestore

Since you're currently using localStorage, you'll need to:

1. **Install Firebase SDK in your React app**:
```bash
npm install firebase
```

2. **Create Firebase config file** (`src/firebase/config.js`):
```javascript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  // Your Firebase config from Firebase Console
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

3. **Update Reminders component** to use Firestore instead of localStorage:
   - Replace `localStorage` calls with Firestore `addDoc`, `onSnapshot`, etc.
   - Use path: `/artifacts/{appId}/users/{userId}/reminders`

## Testing

1. **Test locally** (optional):
```bash
cd functions
npm run serve
```

2. **Create a test reminder** in your app with a time 1-2 minutes in the future

3. **Check Firebase Functions logs**:
```bash
firebase functions:log
```

4. **Check your email** for the reminder

## Troubleshooting

- **Function not running**: Check Firebase Console → Functions → Logs
- **Email not sending**: Verify SendGrid API key is set correctly
- **Permission errors**: Make sure Firestore security rules allow read/write
- **Rate limits**: SendGrid free tier is 100 emails/day

## Security Rules Example

Add to Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/reminders/{reminderId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Cost Considerations

- **Firebase Functions**: Free tier includes 2 million invocations/month
- **SendGrid**: Free tier includes 100 emails/day
- **Firestore**: Free tier includes 1GB storage and 50K reads/day

For production, monitor usage in Firebase Console.

