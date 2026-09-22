import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInitialized = false;
let messagingApp;

try {
  const serviceAccountPath = path.resolve(__dirname, '../config/firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    messagingApp = getMessaging(app);
    isInitialized = true;
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("⚠️ Firebase service account file not found. Push notifications will be disabled.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

export const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!isInitialized || !tokens || tokens.length === 0) return;

  const payload = {
    notification: {
      title,
      body
    },
    data
  };

  try {
    const response = await messagingApp.sendEachForMulticast({
      tokens,
      ...payload
    });
    console.log(`✅ [FCM] Sent to ${response.successCount} devices. Failed: ${response.failureCount}`);
  } catch (error) {
    console.error("❌ [FCM] Failed to send push notifications:", error);
  }
};
