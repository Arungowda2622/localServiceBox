import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import React, { useState } from "react";
import { Image as ExpoImage } from "expo-image";
import Header from "../header/Header";

const { width } = Dimensions.get("window");

const HomeRentDetails = ({ route, navigation }) => {
  const { item } = route.params;

  const [activeIndex, setActiveIndex] = useState(0);

  const images =
    item.imageUrls?.length > 0
      ? item.imageUrls
      : item.imageUrl
      ? [item.imageUrl]
      : [];

  /* ---------------------------------- */
  /* WHATSAPP */
  /* ---------------------------------- */
  const sendWhatsApp = () => {
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

    const url = `https://wa.me/91${6362775151}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url);
  };

  /* ---------------------------------- */
  /* IMAGE SLIDER */
  /* ---------------------------------- */
  const renderImage = ({ item }) => (
    <ExpoImage
      source={{ uri: item }}
      style={styles.image}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );

  return (
    <View style={styles.container}>
      <Header
        title={"Property Details"}
        navigation={navigation}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGE SLIDER */}
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) =>
              index.toString()
            }
            renderItem={renderImage}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x /
                  width
              );

              setActiveIndex(index);
            }}
          />

          {/* DOTS */}
          <View style={styles.dotContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index &&
                    styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>
            {item.name}
          </Text>

          <Text style={styles.price}>
            ₹ {item.rent} / month
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>
              📍 Location
            </Text>

            <Text style={styles.value}>
              {item.location}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>
              🏠 BHK
            </Text>

            <Text style={styles.value}>
              {item.bhk} BHK
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>
              📞 Phone
            </Text>

            <Text style={styles.value}>
              {item.phone}
            </Text>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionTitle}>
              Description
            </Text>

            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>

          {/* WHATSAPP BUTTON */}
          <Pressable
            style={styles.button}
            onPress={sendWhatsApp}
          >
            <Text style={styles.buttonText}>
              Book Enquiry
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeRentDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  image: {
    width: width,
    height: 320,
  },

  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#FF7E5F",
    width: 20,
  },

  detailsContainer: {
    padding: 18,
    paddingBottom: 50,
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
  },

  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF7E5F",
    marginTop: 10,
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginTop: 15,
    elevation: 2,
  },

  label: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },

  value: {
    fontSize: 17,
    color: "#222",
    fontWeight: "600",
  },

  descriptionBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 14,
    marginTop: 18,
    elevation: 2,
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },

  button: {
    backgroundColor: "#25D366",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});