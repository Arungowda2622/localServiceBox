import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import { forceLogout } from "../../utils/authUtils";

export default function CustomDrawer(props) {
  const { navigation } = props;
  const [userData, setUserData] = useState(null);

  // 🔹 Fetch user data ONCE (no auth listener here)
  useEffect(() => {
    const fetchUser = async () => {
      // 1) Prefer live data from Firebase Auth if available
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          return;
        }
      }

      // 2) Fallback: try to read persisted profile from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.userData) setUserData(parsed.userData);
        }
      } catch (err) {
        console.warn('Failed to read stored user for drawer:', err);
      }
    };

    fetchUser();
  }, []);

  // 🔹 Correct Logout
  const handleLogout = async () => {
    try {
      // 1️⃣ Mark that a logout is in-progress so the auth listener
      // won't attempt to restore the persisted user while we sign out.
      try {
        await AsyncStorage.setItem("loggingOut", "1");
      } catch (e) {
        console.warn("Failed to set loggingOut flag:", e);
      }

      // 2️⃣ Remove persisted profile to avoid later restores
      try {
        await AsyncStorage.removeItem("user");
        console.log("Cleared stored 'user' before signOut");
      } catch (e) {
        console.warn("Failed to remove stored 'user' before signOut:", e);
      }

      // 3️⃣ Firebase logout (this is the KEY step)
      await signOut(auth);

      // 3️⃣ Optional: close drawer (safe)
      navigation.closeDrawer();

      console.log('signOut completed from drawer logout');

      // Clear the loggingOut flag now that signOut finished
      try {
        await AsyncStorage.removeItem("loggingOut");
      } catch (e) {
        console.warn("Failed to clear loggingOut flag:", e);
      }

      // If the firebase auth state didn't change (we were in 'restored' mode),
      // force the app-level user state to clear so the Login stack appears.
      try {
        if (typeof forceLogout === 'function') {
          forceLogout();
        }
      } catch (e) {
        console.warn('forceLogout call failed:', e);
      }

      // 4️⃣ Do not attempt to navigate to 'Login' here. The top-level
      // navigator does not necessarily expose a 'Login' route and calling
      // navigate/reset from the drawer can produce navigation warnings.
      // The app's `onAuthStateChanged` listener in `App.js` will handle
      // switching the visible navigator when signOut completes.

      // ❌ Do NOT navigate manually
      // App.js will automatically render Login screen
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
    >
      {/* ================= USER INFO ================= */}
      <View style={styles.userSection}>
        <Image
          source={require("../../../assets/profile_pic.png")}
          style={styles.avatar}
        />

        <View style={{ marginLeft: 12 }}>
          <Text style={styles.userName}>
            {userData?.fullName || "User Name"}
          </Text>
          <Text style={styles.userPhone}>
            {userData?.phone || "+91 XXXXX XXXXX"}
          </Text>
        </View>
        <View style={{ marginLeft: "auto" }}>
          <Ionicons
            name="create-outline"
            size={18}
            color="#fff"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>
      </View>

      {/* ================= MENU ================= */}
      <View style={styles.menuSection}>
        <DrawerItem
          icon="cart-outline"
          label="My Orders"
          onPress={() => navigation.navigate("Home", { screen: "Orders" })}
        />

        {userData?.role === "admin" && (
          <DrawerItem
            icon="settings-outline"
            label="Admin Settings"
            onPress={() => navigation.navigate("Home", { screen: "AdminHome" })}
          />
        )}

        <DrawerItem
          icon="key-outline"
          label="Change Password"
          onPress={() => navigation.navigate("ChangePassword")}
        />

      </View>

      {/* ================= LOGOUT ================= */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

/* ================= MENU ITEM COMPONENT ================= */
const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.iconWrapper}>
      <Ionicons name={icon} size={20} color="#EA580C" />
    </View>
    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FB923C",
    borderRadius: 13,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  userPhone: {
    fontSize: 13,
    color: "#FFEDD5",
    marginTop: 2,
  },

  menuSection: {
    paddingVertical: 12,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },

  menuText: {
    fontSize: 15,
    marginLeft: 16,
    color: "#111827",
    fontWeight: "500",
  },

  footer: {
    marginTop: "auto",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#FED7AA",
    padding: 20,
  },

  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoutText: {
    fontSize: 15,
    color: "#DC2626",
    marginLeft: 14,
    fontWeight: "600",
  },
});
