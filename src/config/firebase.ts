import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPkLgSPpPkVz-YGa1Gnwqp5G5BVOvGJxI",
  authDomain: "dinner-app-family.firebaseapp.com",
  projectId: "dinner-app-family",
  storageBucket: "dinner-app-family.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
