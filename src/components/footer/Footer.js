import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getUserRole } from "../../utils/authUtils";

const Footer = ({ navigation }) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
    };

    fetchRole();
  }, []);

  const handleAddProduct = () => {
    if (role === "shopOwner" || role === "admin") {
      navigation.navigate("AddProduct", { fromFooter: true });
    } else {
      Alert.alert(
        "Access Denied",
        "Only shop owners can add products."
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* LEFT */}
      <Pressable
        style={styles.navItem}
        onPress={() => navigation.navigate("Orders")}
      >
        <Ionicons name="cube-outline" size={22} color="#666" />
        <Text style={styles.text}>Orders</Text>
      </Pressable>

      {/* CENTER FAB */}
      <Pressable style={styles.fab} onPress={handleAddProduct}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      {/* RIGHT */}
      <Pressable
        style={styles.navItem}
        onPress={() => {
          if (navigation && typeof navigation.openDrawer === "function") {
            navigation.openDrawer();
          } else {
            // Not in drawer navigator (guest browse mode)
            navigation.navigate("Login");
          }
        }}
      >
        <Ionicons name="person-outline" size={22} color="#666" />
        <Text style={styles.text}>Profile</Text>
      </Pressable>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 40,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
  },
  navItem: {
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    color: "#666",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2F6BFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    elevation: 25,
  },
});
