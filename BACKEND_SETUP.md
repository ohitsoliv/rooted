# Backend Setup (Firebase Auth + Firestore)

This app stores logs at:

- `users/{uid}/logs/{YYYY-MM-DD}`

If saves do not appear in History/Summary, complete all steps below.

## 1) Enable providers in Firebase Auth

In Firebase Console:

1. Go to **Authentication** -> **Sign-in method**
2. Enable **Google** provider
3. Save

## 2) Authorize domains for sign-in

In **Authentication** -> **Settings** -> **Authorized domains**, add:

- `localhost`
- `rooted-phi-nine.vercel.app`
- any active Vercel deployment domain you test on

## 3) Create Firestore database

In Firebase Console:

1. Go to **Firestore Database**
2. Click **Create database** (if not already created)
3. Choose a region
4. Start in production mode

## 4) Apply Firestore security rules

Use these rules from [firestore.rules](firestore.rules):

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/logs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

You can paste in Firebase Console -> Firestore Database -> Rules, or deploy via CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

## 5) Ensure Vercel env vars are set (Production)

Required keys:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

After setting/changing env vars, redeploy:

```bash
vercel --prod --yes --force
```

## 6) Verify writes and reads

1. Log in
2. Save one section in Log page
3. Open Firebase Console -> Firestore -> `users/{your uid}/logs/{today}`
4. Confirm document exists and has section data
5. Open app History/Summary and refresh

If the document exists in Firestore but not in app, report that exact state and we can narrow it further quickly.
