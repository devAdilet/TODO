import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAbnaDjie7ccaJVLzPJ7SgcigDsURyS3-E",
    authDomain: "adilettodo77.firebaseapp.com",
    projectId: "adilettodo77",
    storageBucket: "adilettodo77.firebasestorage.app",
    messagingSenderId: "876911218452",
    appId: "1:876911218452:web:bdf352e9633f71e56abc01",
    measurementId: "G-2B6RCCK9WQ"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
