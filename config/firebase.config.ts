import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiKvzO9onypNFnuT3fnXh0kyVhtqSIzSc",
  authDomain: "carrier-guidence-da33f.firebaseapp.com",
  projectId: "carrier-guidence-da33f",
  storageBucket: "carrier-guidence-da33f.firebasestorage.app",
  messagingSenderId: "463763974969",
  appId: "1:463763974969:web:9a2e1606438a22cdf796e8",
  measurementId: "G-0QYZ6BXB1H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

