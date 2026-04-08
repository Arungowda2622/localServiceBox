import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import Header from '../header/Header';
import { Image as ExpoImage } from "expo-image";
import { FlashList } from "@shopify/flash-list";

const PAGE_SIZE = 8;

const Construction = ({ navigation }) => {

  const CART_STORAGE_KEY = "@cs_cart";

  const [searchText, setSearchText] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const productsRef = collection(db, "constructions");

  /* ---------------- CART ---------------- */
  const loadCart = async () => {
    const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (saved) setCartItems(JSON.parse(saved));
  };

  const saveCart = async (items) => {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  };

  useFocusEffect(useCallback(() => {
    loadCart();
  }, []));

  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  /* ---------------- FETCH ---------------- */
  const fetchProducts = async (loadMore = false) => {

    if (isFetching || !hasMore) return;
    setIsFetching(true);

    try {
      loadMore ? setLoadingMore(true) : setInitialLoading(true);

      let q;

      if (loadMore && lastDoc) {
        q = query(
          productsRef,
          orderBy("name"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(productsRef, orderBy("name"), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);

      const newProducts = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }

      if (snap.docs.length === 0) {
        setHasMore(false);
      }

      setProducts(prev =>
        loadMore ? [...prev, ...newProducts] : newProducts
      );

    } catch (e) {
      console.log(e);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ---------------- CART ADD ---------------- */
  const handleAddToCart = (product) => {
    setCartItems(prev => {
      if (prev.find(i => i.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  /* ---------------- FILTER ---------------- */
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const cartIds = useMemo(() => {
    return new Set(cartItems.map(i => i.id));
  }, [cartItems]);

  /* ---------------- UI CARD ---------------- */
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ConstructionDetails", { product: item, handleAddToCart })}>
      <ExpoImage
        source={{ uri: item.imageUrl }}
        style={styles.image}
        contentFit="contain"
      />

      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>₹{item.price}</Text>

      <TouchableOpacity
        style={[
          styles.cartButton,
          cartIds.has(item.id) && { backgroundColor: "#ccc" }
        ]}
        onPress={() => handleAddToCart(item)}
        disabled={cartIds.has(item.id)}
      >
        <Ionicons name="cart" size={16} />
        <Text>
          {cartIds.has(item.id) ? "Added" : "Add"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Construction"
        navigation={navigation}
        cartCount={cartItems.length}
        onCartPress={() => navigation.navigate("ConstructionCart", { cartItems, orderType: "constructionOrders" })}
      />

      {/* SEARCH */}
      <View style={styles.search}>
        <Ionicons name="search" size={20} />
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
          style={{ flex: 1 }}
        />
      </View>

      {/* LIST */}
      {initialLoading ? (
        <ActivityIndicator style={{ marginTop: 50 }} />
      ) : (
        <FlashList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          estimatedItemSize={220}
          onEndReached={() => {
            if (hasMore && !loadingMore && !isFetching) {
              fetchProducts(true);
            }
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator />
            ) : !hasMore ? (
              <Text style={{ textAlign: "center", margin: 10 }}>
                No more items
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default Construction;

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 5,
    padding: 10,
    borderRadius: 10,
  },

  image: {
    width: "100%",
    height: 120,
  },

  name: {
    fontWeight: "600",
    fontSize: 14,
  },

  price: {
    fontWeight: "bold",
    marginVertical: 5,
  },

  cartButton: {
    backgroundColor: "#FFD814",
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});