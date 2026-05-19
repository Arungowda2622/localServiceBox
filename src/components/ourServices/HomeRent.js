import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  Pressable,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import Header from "../header/Header";

const windowWidth = Dimensions.get("window").width;

const HomeRent = ({ navigation }) => {
  const [properties, setProperties] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------------------------- */
  /* FETCH ALL HOME RENT DATA */
  /* ---------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "homeRent"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProperties(data);
      setFilteredData(data);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------------------------- */
  /* SEARCH FUNCTION */
  /* ---------------------------------- */
  /* ---------------------------------- */
  /* SEARCH FUNCTION */
  /* ---------------------------------- */
  const handleSearch = (text) => {
    setSearch(text);

    if (text.trim() === "") {
      setFilteredData(properties);
      return;
    }

    const searchText = text.toLowerCase();

    const filtered = properties.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const location = item.location?.toLowerCase() || "";
      const bhk = item.bhk?.toString().toLowerCase() || "";
      const rent = item.rent?.toString() || "";

      return (
        name.includes(searchText) ||
        location.includes(searchText) ||
        bhk.includes(searchText) ||
        rent.includes(searchText)
      );
    });

    setFilteredData(filtered);
  };

  /* ---------------------------------- */
  /* WHATSAPP ENQUIRY */
  /* ---------------------------------- */
  const sendWhatsApp = (item) => {
    const message = `
🏠 Property Enquiry

Property Name: ${item.name}
Rent: ₹ ${item.rent} / month
Location: ${item.location}
BHK: ${item.bhk}
Phone: ${item.phone}

Description:
${item.description}
  `;

    // Remove +91 if already exists
    const phoneNumber = 6362775151;

    const url = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url);
  };

  const handleDetails = (item) => {
    navigation.navigate("HomeRentDetails", { item });
  };

  /* ---------------------------------- */
  /* RENDER ITEM */
  /* ---------------------------------- */
  const renderItem = ({ item }) => {
    console.log(item, "getItem")
    const images = item.imageUrls?.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];

    return (
      <Pressable style={styles.card} onPress={()=> handleDetails(item)}>
        {/* IMAGE */}
        {images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <ExpoImage
                source={{ uri: item }}
                style={styles.image}
                contentFit="cover"
              />
            )}
          />
        ) : null}

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>

          <Text style={styles.price}>
            ₹ {item.rent} / month
          </Text>

          <Text style={styles.text}>
            📍 {item.location}
          </Text>

          <Text style={styles.text}>
            🏠 {item.bhk} BHK
          </Text>

          <Text style={styles.text}>
            📞 {item.phone}
          </Text>

          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>
        <Pressable
          style={styles.whatsappBtn}
          onPress={() => sendWhatsApp(item)}
        >
          <Text style={styles.whatsappText}>
            Book Enquiry
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  /* ---------------------------------- */
  /* LOADING */
  /* ---------------------------------- */
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF7E5F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"Home Rent Properties"} />


      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#777"
        />

        <TextInput
          placeholder="Search by location, BHK, price..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* TOTAL */}
      <Text style={styles.totalText}>
        Total Properties: {filteredData.length}
      </Text>

      {/* LIST */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 15,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Properties Found
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default HomeRent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginTop: 20,
    marginHorizontal: 15,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 12,
    borderRadius: 14,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#000",
  },

  totalText: {
    marginHorizontal: 15,
    marginTop: 10,
    color: "#666",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 4,
  },

  image: {
    width: windowWidth - 80,
    height: 220,
    borderRadius: 18,
    marginRight: 12,
  },
  imageScroll: {
    width: "100%",
  },
  imageScrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  content: {
    padding: 14,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  price: {
    fontSize: 18,
    color: "#FF7E5F",
    fontWeight: "700",
    marginTop: 6,
  },

  text: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  description: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#888",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  whatsappText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});