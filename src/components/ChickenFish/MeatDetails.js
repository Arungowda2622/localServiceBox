import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Header from "../header/Header";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_STORAGE_KEY = "@cf_cart";

const MeatDetails = ({ route, navigation }) => {
  const { product } = route.params;

  const [added, setAdded] = useState(false);

  /* ✅ Load cart to check if already added */
  useEffect(() => {
    checkIfAdded();
  }, []);

  const checkIfAdded = async () => {
    const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const items = JSON.parse(saved);
      const exists = items.find(i => i.id === product.id);
      if (exists) setAdded(true);
    }
  };

  /* ✅ Add to cart (SAME STORAGE AS LIST PAGE) */
  const handleAddToCart = async () => {
    try {
      const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let items = saved ? JSON.parse(saved) : [];

      const alreadyExists = items.find(i => i.id === product.id);

      if (!alreadyExists) {
        items.push(product);
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }

      setAdded(true);

    } catch (e) {
      console.log("Cart error:", e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Meat Details" navigation={navigation} />

      <View style={styles.container}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />

        <Text style={styles.name}>{product.name}</Text>

        <Text style={styles.price}>₹{product.price}</Text>

        {product.description && (
          <Text style={styles.desc}>{product.description}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            added && { backgroundColor: "#ccc" }
          ]}
          onPress={handleAddToCart}
          disabled={added}
        >
          <Ionicons name="cart" size={18} />
          <Text style={styles.btnText}>
            {added ? "Added to Cart" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MeatDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  desc: {
    color: "#555",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FFD814",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  btnText: {
    fontWeight: "600",
  },
});