// Shared auth utilities to avoid circular dependencies
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../components/firebase/firebaseConfig";

let forceLogoutCallback = () => {};

/**
 * Set the forceLogout callback (called from App.js)
 */
export const setForceLogoutCallback = (callback) => {
  forceLogoutCallback = callback;
};

/**
 * Force logout - can be called from anywhere without circular dependency
 */
export const forceLogout = () => {
  forceLogoutCallback();
};

/**
 * 🔹 Get user role - checks AsyncStorage cache first, then Firestore
 * This ensures role is available even if auth.currentUser is null
 * @returns {Promise<string|null>} - The user's role or null
 */
export const getUserRole = async () => {
  try {
    // 1️⃣ Try AsyncStorage cache first (fastest)
    const stored = await AsyncStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role) {
        console.log('✅ getUserRole: Using cached role:', parsed.role);
        return parsed.role;
      }
    }

    // 2️⃣ Fallback to Firestore
    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ getUserRole: No user found');
      return null;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const role = snap.data().role;
      console.log('✅ getUserRole: Fetched from Firestore:', role);
      return role;
    }
  } catch (error) {
    console.error('❌ getUserRole: Error:', error);
  }

  return null;
};

/**
 * 🔹 Get user data - checks AsyncStorage cache first, then Firestore
 * @returns {Promise<object|null>} - The user's data object or null
 */
export const getUserData = async () => {
  try {
    // 1️⃣ Try AsyncStorage cache first
    const stored = await AsyncStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.userData) {
        console.log('✅ getUserData: Using cached data');
        return parsed.userData;
      }
    }

    // 2️⃣ Fallback to Firestore
    const user = auth.currentUser;
    if (!user) {
      console.warn('⚠️ getUserData: No user found');
      return null;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      console.log('✅ getUserData: Fetched from Firestore');
      return snap.data();
    }
  } catch (error) {
    console.error('❌ getUserData: Error:', error);
  }

  return null;
};

/**
 * Wait for Firebase Auth to initialize and return the current user.
 * Helps avoid "user not found" errors when the app is reopened and
 * Firebase has not yet repopulated auth.currentUser.
 *
 * @param {number} timeoutMs - Maximum time (ms) to wait.
 * @param {number} intervalMs - Poll interval (ms).
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export const waitForAuthUser = async (timeoutMs = 5000, intervalMs = 100) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const user = auth.currentUser;
    if (user) return user;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // If Firebase Auth never populated currentUser, fall back to the cached AsyncStorage profile.
  // This allows the app to continue working (FireStore writes/reads) even while auth is still initializing.
  try {
    const stored = await AsyncStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.uid) {
        return { uid: parsed.uid, email: parsed.email || null, _cached: true };
      }
    }
  } catch (e) {
    console.warn('waitForAuthUser: failed reading cached user', e);
  }

  return null;
};

/**
 * Return a user ID from Firebase Auth or AsyncStorage cache.
 */
export const getUserId = async () => {
  const user = auth.currentUser;
  if (user?.uid) return user.uid;

  const stored = await AsyncStorage.getItem('user');
  if (stored) {
    const parsed = JSON.parse(stored);
    return parsed?.uid || null;
  }

  return null;
};
