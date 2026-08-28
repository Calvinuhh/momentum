import { getMessaging } from 'firebase/messaging/sw'
import { firebaseConfigured, getFirebaseApp } from '@/lib/firebase'

if (firebaseConfigured) getMessaging(getFirebaseApp())
