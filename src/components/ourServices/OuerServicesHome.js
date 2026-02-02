import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Footer from "../footer/Footer";

const OuerServicesHome = ({ navigation }) => {
  const services = [
    {
      id: 1,
      serviceName: "Bike Taxi",
      title: "BikeTaxi",
      subtitle: "Book now",
      icon: "🛵",
      colors: ["#36D1DC", "#5B86E5"],
    },
    {
      id: 2,
      serviceName: "Box Delivery",
      title: "BoxDelivery",
      subtitle: "Send anything",
      icon: "📦",
      colors: ["#FF512F", "#DD2476"],
    },
    {
      id: 3,
      serviceName: "Services",
      title: "Services",
      subtitle: "Other",
      icon: "🚗",
      colors: ["#8E2DE2", "#4A00E0"],
    },
    {
      id: 4,
      serviceName: "Product",
      title: "Product",
      subtitle: "Get products",
      icon: "🛒",
      colors: ["#11998E", "#38EF7D"],
    },
  ];

  const handleSelectedService = (item) => {
    navigation.navigate(item.title, { data: item });
  };

  const renderOurServices = ({ item, index }) => {
    const isEven = index % 2 === 0;

    return (
      <View
        style={[
          styles.serviceItem,
          isEven ? styles.leftItem : styles.rightItem,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          onPress={() => handleSelectedService(item)}
        >
          {/* /Users/com/Downloads/lsb/localServiceBox/assets/otherServices.jpeg */}
          <LinearGradient colors={item.colors} style={styles.card}>
            <View style={styles.iconWrapper}>
              {item.serviceName === "Services" ? (
                <Image
                  source={require("../../../assets/otherServices.jpeg")}
                  style={{ width: 45, height: 45 }}
                  resizeMode="stretch"
                />
              ) : (
                <Text style={styles.icon}>{item.icon}</Text>
              )}
            </View>
            <View>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.title}>{item.serviceName}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#EEF2F3", "#D9E4F5"]} style={styles.safeArea}>
      {/* Decorative Background Shapes */}
      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />

      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Our Services</Text>

        <FlatList
          data={services}
          renderItem={renderOurServices}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      </View>

      <Footer navigation={navigation} />
    </LinearGradient>
  );
};

export default OuerServicesHome;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  /* Background blobs */
  bgCircleOne: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(54, 209, 220, 0.25)",
  },
  bgCircleTwo: {
    position: "absolute",
    bottom: 120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(91, 134, 229, 0.25)",
  },

  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
  },

  sectionLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1C1C1E",
    marginBottom: 20,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 12,
  },

  serviceItem: {
    width: "50%",
    marginBottom: 18,
  },
  leftItem: {
    paddingRight: 8,
  },
  rightItem: {
    paddingLeft: 8,
  },

  card: {
    height: 175, // ⬅️ increased from 155
    borderRadius: 20,
    padding: 18,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
  },

  iconWrapper: {
    width: 64, // ⬅️ increased
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF", // ⬅️ solid white
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },

  icon: {
    fontSize: 32,
  },

  subtitle: {
    fontSize: 12,
    color: "#F1F1F1",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
});
