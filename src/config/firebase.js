import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyChsfFdSXR-fihhMc2xZVfW_fVh5KstgOQ",
  authDomain: "openmind-38cae.firebaseapp.com",
  databaseURL: "https://openmind-38cae-default-rtdb.firebaseio.com",
  projectId: "openmind-38cae",
  storageBucket: "openmind-38cae.firebasestorage.app",
  messagingSenderId: "398789526642",
  appId: "1:398789526642:web:1aaa95364fe2db80dfeeeb"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
