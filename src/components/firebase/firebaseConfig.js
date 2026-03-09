import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ Add storage import

const firebaseConfig = {
  apiKey: "AIzaSyCc-BMw1ZHhRLMWlJvP4RGq0ezLx3CSPq8",
  authDomain: "localservicebox.firebaseapp.com",
  projectId: "localservicebox",
  storageBucket: "localservicebox.appspot.com", // ✅ Corrected
  messagingSenderId: "587189827691",
  appId: "1:587189827691:web:71dc1f277e4264e2e7992e",
  measurementId: "G-G6QJRV0SJS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Export storage too

// ✅ Enable offline persistence for Firestore (works in React Native)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("✅ Firestore offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === "unimplemented") {
      console.log("The current browser does not support persistence for Firestore.");
    } else {
      console.log("Firestore persistence error:", err);
    }
  });
