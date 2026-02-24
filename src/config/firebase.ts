import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCG9jp_EiT82C4PFeRXNuvTP9nf1lL5UBA",
  authDomain: "whats-4dinner.firebaseapp.com",
  projectId: "whats-4dinner",
  storageBucket: "whats-4dinner.firebasestorage.app",
  messagingSenderId: "191540558193",
  appId: "1:191540558193:web:7f772227d36a9ef08e5ed0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
