// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-IyfP_fWFjS4CgaBgaE7xawZlGQx_0d4",
  authDomain: "blackmythvssekiro.firebaseapp.com",
  projectId: "blackmythvssekiro",
  storageBucket: "blackmythvssekiro.firebasestorage.app",
  messagingSenderId: "535071038075",
  appId: "1:535071038075:web:a2ae68b62dd4eefc0860de",
  measurementId: "G-1KXGTY058H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);