import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCTsg9RmZKA8z20LUfMmAGbaGag6-N_ySg",
  authDomain: "revpilot---close-co-pilot.firebaseapp.com",
  projectId: "revpilot---close-co-pilot",
  storageBucket: "revpilot---close-co-pilot.firebasestorage.app",
  messagingSenderId: "576783850750",
  appId: "1:576783850750:web:41e602c0fa5807e93d19af",
  measurementId: "G-F29HKFEB8Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, auth, analytics };