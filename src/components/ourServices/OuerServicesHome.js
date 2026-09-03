import React, { useEffect, useState } from "react";
import {
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

  // ================= USER =================

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");

        if (stored) {
          const parsed = JSON.parse(stored);

          console.log(parsed?.userData, "thisIsUserData");

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

  // ================= SERVICES =================

  const services = [
    {
      id: 1,
      serviceName: "Man Power",
      title: "ManPower",
      subtitle: "Book now",
      icon: "🛵",
      image: require("../../../assets/manPower.jpeg"),
    },

    {
      id: 2,
      serviceName: "Services",
      title: "Services",
      subtitle: "Other",
      icon: "🚗",
      image: require("../../../assets/otherServices.jpeg"),
    },

    {
      id: 3,
      serviceName: "Construction Materials",
      title: "Construction",
      subtitle: "Get services",
      icon: "🏗️",
      image: require("../../../assets/constructionImage.jpeg"),
    },

    {
      id: 4,
      serviceName: "Civic Assist",
      title: "CivicAssist",
      subtitle: "Get civic assistance",
      icon: "🏛️",
    },

    {
      id: 5,
      serviceName: "Nearby Properties",
      title: "Properties",
      subtitle: "Find now",
      icon: "🏘️",
    },
  ];

  // ================= NAVIGATION =================

  const handleSelectedService = (item) => {
    if (item.title === "FoodsBeverages") {
      return navigation.navigate("HotelList");
    }

    navigation.navigate(item.title, {
      data: item,
    });
  };

  // ================= FILTER =================

  const filteredServices = services.filter((item) =>
    item.serviceName
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // ================= RENDER CARD =================

  const renderOurServices = ({ item, index }) => {
    /*
     * If total number of services is odd,
     * only the LAST item becomes full width.
     *
     * Example:
     * 5 items → item index 4 = full width
     * 6 items → no full width item
     */
    const isLastItem = index === filteredServices.length - 1;

    const isOddNumber = filteredServices.length % 2 !== 0;

    const isFullWidth = isOddNumber && isLastItem;

    return (
      <View
        style={[
          styles.serviceItem,
          isFullWidth && styles.fullWidthItem,
        ]}
      >
        <Pressable
          onPress={() => handleSelectedService(item)}
          style={({ pressed }) => [
            styles.pressable,
            {
              transform: [
                {
                  scale: pressed ? 0.96 : 1,
                },
              ],
            },
          ]}
        >
          <View style={styles.card}>

            {/* IMAGE / ICON */}

            {item.image ? (
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconWrapper}>
                <Text style={styles.icon}>
                  {item.icon}
                </Text>
              </View>
            )}

            {/* TITLE */}

            <Text
              style={styles.cardTitle}
              numberOfLines={2}
            >
              {item.serviceName}
            </Text>

            {/* SUBTITLE */}

            <Text style={styles.cardSub}>
              {item.subtitle}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  };

  // ================= UI =================

  return (
    <LinearGradient
      colors={["#EEF2F3", "#D9E4F5"]}
      style={styles.safeArea}
    >

      {/* Background Decorations */}

      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />

      <View style={styles.container}>

        {/* ================= HEADER ================= */}

        <View style={styles.header}>

          <Text style={styles.greeting}>
            👋 Hello {fullName || "there"}!
          </Text>

          <Text style={styles.subText}>
            What do you need today?
          </Text>

          {/* SEARCH */}

          <View style={styles.searchBox}>
            <TextInput
              placeholder="🔍 Search services..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
            />
          </View>

        </View>

        {/* ================= SERVICES ================= */}

        <FlatList
          data={filteredServices}
          renderItem={renderOurServices}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}

          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No services found 😔
              </Text>
            </View>
          }

          ListFooterComponent={
            <View style={{ height: 100 }} />
          }
        />

      </View>

      {/* ================= FOOTER ================= */}

      <Footer navigation={navigation} />

    </LinearGradient>
  );
};

export default OuerServicesHome;

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ================= BACKGROUND =================

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

  // ================= CONTAINER =================

  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
  },

  // ================= HEADER =================

  header: {
    marginBottom: 12,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  subText: {
    color: "#777",
    fontSize: 14,
    marginTop: 4,
  },

  // ================= SEARCH =================

  searchBox: {
    marginTop: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    borderRadius: 15,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 6,

    elevation: 3,
  },

  searchInput: {
    height: 45,
    fontSize: 14,
    color: "#222",
  },

  // ================= LIST =================

  listContent: {
    paddingBottom: 20,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  // ================= NORMAL CARD =================

  serviceItem: {
    width: "48%",
    marginBottom: 14,
  },

  // ================= FULL WIDTH LAST CARD =================

  fullWidthItem: {
    width: "100%",
  },

  pressable: {
    width: "100%",
  },

  // ================= CARD =================

  card: {
    width: "100%",
    height: 175,

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 12,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowRadius: 8,

    elevation: 4,
  },

  // ================= IMAGE =================

  image: {
    width: 72,
    height: 72,

    borderRadius: 36,

    marginBottom: 10,
  },

  // ================= ICON =================

  iconWrapper: {
    width: 72,
    height: 72,

    borderRadius: 36,

    backgroundColor: "#F5F7FA",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 10,

    shadowColor: "#000",
    shadowOpacity: 0.08,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowRadius: 5,

    elevation: 3,
  },

  icon: {
    fontSize: 34,
  },

  // ================= CARD TEXT =================

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",

    textAlign: "center",

    minHeight: 38,
  },

  cardSub: {
    fontSize: 12,
    color: "#888",

    marginTop: 3,

    textAlign: "center",
  },

  // ================= EMPTY =================

  emptyContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },

  emptyText: {
    color: "#777",
    fontSize: 14,
  },
});
