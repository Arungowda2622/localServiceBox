import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Footer from "../footer/Footer";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OuerServicesHome = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [fullName, setFullName] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
          const fetchUser = async () => {
              try {
                  const stored = await AsyncStorage.getItem("user");
                  if (stored) {
                      const parsed = JSON.parse(stored);
                      console.log(parsed.userData, "thisIsUserData")
                      if (parsed?.userData) {
                          setFullName(parsed.userData.fullName || "");
                      }
                  }
                 
              } catch (e) {
                  console.log("Profile fetch error:", e);
              } finally {
                  setFetching(false);
              }
          };
  
          fetchUser();
      }, []);


  const services = [
    // {
    //   id: 1,
    //   serviceName: "Bike Taxi",
    //   title: "BikeTaxi",
    //   subtitle: "Book now",
    //   icon: "🛵",
    //   colors: ["#36D1DC", "#5B86E5"],
    // },
    {
      id: 1,
      serviceName: "Man Power",
      title: "ManPower",
      subtitle: "Book now",
      icon: "🛵",
      colors: ["#36D1DC", "#5B86E5"],
    },
    // {
    //   id: 2,
    //   serviceName: "Box Delivery",
    //   title: "BoxDelivery",
    //   subtitle: "Send anything",
    //   icon: "📦",
    //   colors: ["#FF512F", "#DD2476"],
    // },
    {
      id: 2,
      serviceName: "Home Rent",
      title: "HomeRent",
      subtitle: "Find your perfect home",
      icon: "🏠",
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
    // {
    //   id: 4,
    //   serviceName: "Product",
    //   title: "Product",
    //   subtitle: "Get products",
    //   icon: "🛒",
    //   colors: ["#11998E", "#38EF7D"],
    // },
    // {
    //   id: 5,
    //   serviceName: "Chicken & Fish",
    //   title: "ChickenFish",
    //   subtitle: "Order now",
    //   icon: "🍗",
    //   colors: ["#FF9A00", "#FF5F6D"],
    // },
    {
      id: 6,
      serviceName: "Construction Materials",
      title: "Construction",
      subtitle: "Get services",
      icon: "🏗️",
      colors: ["#36D1DC", "#5B86E5"],
    },
    {
      id: 7,
      serviceName: "Nearby Properties",
      title: "Properties",
      subtitle: "Find now",
      icon: "🏘️",
      colors: ["#FF9A00", "#FF5F6D"],
      fullWidth: true,
    },
    // {
    //   id: 7,
    //   serviceName: "Foods & Beverages",
    //   title: "FoodsBeverages",
    //   subtitle: "Order now",
    //   icon: "🍔",
    //   colors: ["#FF9A00", "#FF5F6D"],
    //   fullWidth: true,
    // },
  ];

  const handleSelectedService = (item) => {
    if(item.title === "FoodsBeverages"){
      return navigation.navigate("HotelList");
    }
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
          <View style={styles.card}>
            {item.title === "Services" ? (
              <Image
                source={require("../../../assets/otherServices.jpeg")}
                style={styles.image}
                resizeMode="stretch"
              />
            ) : item.title === "ManPower" ? (
              <Image
                source={require("../../../assets/manPower.jpeg")}
                style={styles.image}
                resizeMode="stretch"
              />
            ) : item.title === "ChickenFish" ? (
              <Image
                source={require("../../../assets/chickenFish.jpeg")}
                style={styles.image}
                resizeMode="stretch"
              />
            ) : item.title === "Construction" ? (
              <Image
                source={require("../../../assets/constructionImage.jpeg")}
                style={styles.image}
                resizeMode="stretch"
              />
            ) : (
              <View style={styles.iconWrapper}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
            )}

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.serviceName}
            </Text>

            <Text style={styles.cardSub}>{item.subtitle}</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  const filteredServices = services.filter((item) =>
    item.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );


  return (
    <LinearGradient colors={["#EEF2F3", "#D9E4F5"]} style={styles.safeArea}>
      {/* Decorative Background */}
      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />

      <View style={styles.container}>
        {/* <Text style={styles.sectionLabel}>Our Services</Text> */}

        <View style={styles.header}>
          <Text style={styles.greeting}>👋 Hello {fullName || "there"}!</Text>
          <Text style={styles.subText}>What do you need today?</Text>

          <View style={styles.searchBox}>
            <TextInput
              placeholder="🔍 Search services..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <FlatList
          data={filteredServices}
          renderItem={renderOurServices}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={{ height: 100 }} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No services found 😔
            </Text>
          }
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
    paddingBottom: 120,
  },

  serviceItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
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
    flexShrink: 1,
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
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    flexWrap: "wrap",
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
  header: {
    marginBottom: 20,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  subText: {
    color: "#777",
    marginTop: 4,
  },

  searchBox: {
    marginTop: 15,
    backgroundColor: "#f1f3f6",
    paddingHorizontal: 12,
    paddingVertical:5,
    borderRadius: 15,
  },

  card: {
    width: "100%",   // 🔥 important
    height: 180,     // 🔥 fixed height (same for all)
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  cardSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
