import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDCD6ANrPWb90a_ktSFQqTZH_RUy54_nTo",
    authDomain: "myreferee-40784.firebaseapp.com",
    projectId: "myreferee-40784",
    storageBucket: "myreferee-40784.firebasestorage.app",
    messagingSenderId: "682236559614",
    appId: "1:682236559614:web:d2a4b3b20c85edbe7265af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize & Export Firestore (The Database)
export const db = getFirestore(app); 