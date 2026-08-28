import { getApp, getApps, initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
export const firebaseConfigured =
  Object.values(firebaseConfig).every(Boolean) && Boolean(firebaseVapidKey)
export const getFirebaseApp = () => (getApps().length ? getApp() : initializeApp(firebaseConfig))
