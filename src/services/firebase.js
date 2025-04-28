
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMkQL_iMIOpxcaqpnf1pHlJvrYfB3aFFQ",
  authDomain: "devcollabproto.firebaseapp.com",
  projectId: "devcollabproto",
  storageBucket: "devcollabproto.firebasestorage.app", 
  messagingSenderId: "261326667760",
  appId: "1:261326667760:web:86dc2b9a7b97e9f6fe6735",
  measurementId: "G-XR74HK6QTX",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Firebase Authentication
const db = getFirestore(app); // Firestore Database

// Exporting auth and db for use in other components
export { app, analytics, auth, db };
