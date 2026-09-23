import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDg5uC5fA7XTOwJttHSTOXYd_RcafYUVbU",
  authDomain: "savix-ai.firebaseapp.com",
  projectId: "savix-ai",
  storageBucket: "savix-ai.firebasestorage.app",
  messagingSenderId: "141321299093",
  appId: "1:141321299093:web:d4a846741deb1c8b41a79c",
  measurementId: "G-9W20TWGWX6"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const currentToken = await getToken(messaging, { vapidKey: 'BMAr7E97BxWdnu9NTdlymktiDQEbYuiV-pogeM_9jUf3ciie9RSg_ZKoQZ3X8SEopVSkRBPV2f3lNgsXT3Oc4vI' });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
