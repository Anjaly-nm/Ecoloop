const admin = require('firebase-admin');

let auth = null;

// Option 1: Use service account JSON file (local dev, file present)
// Option 2: Use env vars (Vercel/hosting) — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Option 3: Neither — app runs without Google login
try {
  const path = require('path');
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  const fs = require('fs');
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    auth = admin.auth();
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    auth = admin.auth();
  } else {
    console.warn('⚠️ Firebase not configured (no serviceAccountKey.json or FIREBASE_* env vars). Google login disabled.');
  }
} catch (err) {
  console.warn('⚠️ Firebase init skipped:', err.message);
}

module.exports = { auth, admin };