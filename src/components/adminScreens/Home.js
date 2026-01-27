import React from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import Header from "../header/Header";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../theme/colors"

const Home = ({ navigation }) => {
  const buttons = [
    {
      title: "Admin",
      icon: "person-add",
      color: colors.gradientPrimary,
      onPress: () => navigation.navigate("AddAdmin"),
    },
    {
      title: "Product",
      icon: "cube-outline",
      color: colors.gradientDanger,
      onPress: () => navigation.navigate("AddProduct"),
    },
    {
      title: "UPI",
      icon: "cash-outline",
      color: colors.gradientSuccess,
      onPress: () => navigation.navigate("AddUpi"),
    },
    {
      title: "Orders",
      icon: "cart-outline",
      color: colors.gradientWarning,
      onPress: () => navigation.navigate("UpdateOrders"),
    },
    {
      title: "Taxi Price",
      icon: "car-outline",
      color: colors.gradientPurple,
      onPress: () => navigation.navigate("BakiTaxiPrice"),
    },
    {
      title: "Drivers",
      icon: "car-outline",
      color: colors.gradientPink,
      onPress: () => navigation.navigate("AddDriverScreen"),
    },
    {
      title: "Add Owner",
      icon: "storefront-outline",
      color: colors.gradientPrimary,
      onPress: () => navigation.navigate("AddOwner"),
    },
  ];

  return (
    <View style={styles.main}>
      <Header navigation={navigation} title="Admin Dashboard" />
      {/* Banner */}
      <LinearGradient colors={colors.gradientBanner} style={styles.banner}>
        <Text style={styles.bannerTitle}>Welcome, Admin 👋</Text>
        <Text style={styles.bannerSubtitle}>
          Manage your app’s content and settings easily
        </Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.btnsContainer}>
          {buttons.map((btn) => (
            <Pressable
              key={btn.title}
              style={styles.cardWrapper}
              onPress={btn.onPress}
            >
              <LinearGradient colors={btn.color} style={styles.card}>
                <Ionicons name={btn.icon} size={28} color={colors.white} />
                <Text style={styles.cardText}>{btn.title}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    paddingVertical: 36,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.primaryLight,
    marginTop: 6,
  },
  container: {
    paddingVertical: 26,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 18,
  },
  btnsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 18,
  },
  card: {
    height: 120,
    borderRadius: 18,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6,
  },
  cardText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
});
