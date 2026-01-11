import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function CustomDrawer(props) {
  const { navigation } = props;
  const [userData, setUserData] = useState(null);

  // 🔹 Fetch user data ONCE (no auth listener here)
  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;

      const docRef = doc(db, "users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };

    fetchUser();
  }, []);

  // 🔹 Correct Logout
  const handleLogout = async () => {
    try {
      navigation.closeDrawer();
      await signOut(auth);
      // ❌ Do NOT navigate manually
      // App.js will automatically show Login screen
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
            onPress={() =>
              navigation.navigate("Home", { screen: "AdminHome" })
            }
          />
        )}
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
