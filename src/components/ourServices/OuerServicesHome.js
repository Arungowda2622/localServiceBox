import React from "react";
import {
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
    {
      id: 5,
      serviceName: "Foods & Beverages",
      title: "FoodsBeverages",
      subtitle: "Order now",
      icon: "🍔",
      colors: ["#FF9A00", "#FF5F6D"],
      fullWidth: true,
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
          item.fullWidth
            ? styles.fullWidthItem
            : isEven
              ? styles.leftItem
              : styles.rightItem,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          onPress={() => handleSelectedService(item)}
        >
          <LinearGradient
            colors={item.colors}
            style={[styles.card, item.fullWidth && styles.fullWidthCard]}
          >
            {/* Soft shine */}
            {item.fullWidth && <View style={styles.shineOverlay} />}

            <View
              style={[
                styles.cardContent,
                item.fullWidth && styles.fullWidthContent,
              ]}
            >
              {item.title === "Services" ? (
                <Image
                  source={require("../../../assets/otherServices.jpeg")}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  resizeMode="stretch"
                />
              ) : (
                <View style={styles.iconWrapper}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
              )}

              <View
                style={[
                  styles.textBlock,
                  item.fullWidth && styles.fullWidthText,
                ]}
              >
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.title}>{item.serviceName}</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#EEF2F3", "#D9E4F5"]} style={styles.safeArea}>
      {/* Decorative Background */}
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
    paddingBottom: 16,
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

  fullWidthItem: {
    width: "100%",
    paddingHorizontal: 8,
  },

  card: {
    height: 175,
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },

  fullWidthCard: {
    height: 135,
    borderRadius: 26,
    paddingHorizontal: 22,
    justifyContent: "center",
  },

  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },

  fullWidthContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
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

  textBlock: {
    marginTop: 10,
  },

  fullWidthText: {
    marginLeft: 18,
  },

  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  shineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
});
