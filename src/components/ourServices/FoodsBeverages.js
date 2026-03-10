import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../header/Header";

/* ---------- Product Card ---------- */
const ProductCard = ({ product, onAddToCart, isInCart, navigation }) => {
  const image = product.images?.[0] || product.imageUrl || "";

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        navigation.navigate("ProductDetails", {
          product,
          onAddToCart,
        })
      }
    >
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
    </Pressable>
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
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 4,
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                navigation={navigation}
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
    backgroundColor: "#F6F7FB",
  },

  content: {
    flex: 1,
    paddingHorizontal: 15,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 15,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    height: 140,
    resizeMode: "stretch",
    backgroundColor: "#F5F5F5",
  },

  details: {
    padding: 10,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    minHeight: 40,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2F6BFF",
    marginTop: 4,
  },

  cartButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F6BFF",
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },

  cartButtonDisabled: {
    backgroundColor: "#CCC",
  },

  cartText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#FFF",
    fontSize: 13,
  },
});
