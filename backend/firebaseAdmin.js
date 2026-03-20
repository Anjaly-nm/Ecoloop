const admin = require('firebase-admin');

let auth = null;

try {
  // Check if already initialized to avoid "app already exists" error on Vercel reloads
  if (!admin.apps.length) {
    const path = require('path');
    const fs = require('fs');
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');

    if (fs.existsSync(keyPath)) {
      // Option 1: Local file
      const serviceAccount = require(keyPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase initialized using local serviceAccountKey.json');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Option 2: Unified JSON string env var (recommended for Vercel)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log('✅ Firebase initialized using FIREBASE_SERVICE_ACCOUNT_KEY env var');
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Option 3: Individual env vars
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase initialized using individual FIREBASE_* env vars');
    } else {
      console.warn('⚠️ Firebase not configured (no serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_KEY env var). Google login disabled.');
    }
  }
  
  // Set auth only if app was initialized
  if (admin.apps.length > 0) {
    auth = admin.auth();
  }
} catch (err) {
  console.error('❌ Firebase initialization failed:', err.message);
}

module.exports = { auth, admin };