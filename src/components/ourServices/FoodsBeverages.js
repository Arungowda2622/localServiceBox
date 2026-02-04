import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../header/Header";

/* ---------- Product Card ---------- */
const ProductCard = ({ product, onAddToCart, isInCart }) => {
  const image =
    product.images?.[0] || product.imageUrl || "";

  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.price}>₹{product.price}</Text>

        <TouchableOpacity
          style={[
            styles.cartButton,
            isInCart && styles.cartButtonDisabled,
          ]}
          disabled={isInCart}
          onPress={() => onAddToCart(product)}
        >
          <Ionicons name="cart" size={16} color="#000" />
          <Text style={styles.cartText}>
            {isInCart ? "Added" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ---------- Screen ---------- */
const FoodsBeverages = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("type", "==", "food"),
        );

        const snapshot = await getDocs(q);
        setProducts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const addToCart = (product) => {
    setCartItems((prev) =>
      prev.some((i) => i.id === product.id)
        ? prev
        : [...prev, product],
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Foods & Beverages"
        cartCount={cartItems.length}
        navigation={navigation}
        onCartPress={() =>
          navigation.navigate("Cart", { cartItems })
        }
      />

      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onAddToCart={addToCart}
                isInCart={cartItems.some((c) => c.id === item.id)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
};

export default FoodsBeverages;

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  content: {
    flex: 1,
    paddingHorizontal: 15,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 220,
    resizeMode: "stretch",
    backgroundColor: "#EEE",
  },

  details: {
    padding: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#232F3E",
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 6,
  },

  cartButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFD814",
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 8,
  },

  cartButtonDisabled: {
    backgroundColor: "#CCC",
  },

  cartText: {
    marginLeft: 6,
    fontWeight: "600",
  },
});
