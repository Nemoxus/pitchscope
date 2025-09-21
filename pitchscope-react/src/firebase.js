// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz53JZD3t5Ql8AGaC50viNUGmey0a6968",
  authDomain: "pitchscope-7f989.firebaseapp.com",
  projectId: "pitchscope-7f989",
  storageBucket: "pitchscope-7f989.firebasestorage.app",
  messagingSenderId: "730282485768",
  appId: "1:730282485768:web:90309014318ec8728989bd",
  measurementId: "G-43RLG9SRJL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const analytics = getAnalytics(app);
export const storage = getStorage(app); 
