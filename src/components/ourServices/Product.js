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
  where
} from "firebase/firestore";
import Header from '../header/Header';
import { Image as ExpoImage } from "expo-image";
import { FlashList } from "@shopify/flash-list";

const PAGE_SIZE = 8;

const ProductCard = React.memo(({ product, onAddToCart, isInCart, onPress }) => {

  const imageUri =
    product?.imageUrl ??
    product?.images?.[0] ??
    "https://via.placeholder.com/150";

  return (
    <TouchableOpacity
      style={productStyles.card}
      activeOpacity={0.9}
      onPress={() => onPress(product)}
    >
      <View style={productStyles.detailsContainer}>
        <ExpoImage
          source={{ uri: imageUri }}
          style={productStyles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          placeholder={require("../../../assets/placeholder.jpg")}
          transition={200}
        />

        <Text style={productStyles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={productStyles.price}>
          ₹{Number(product?.price || 0).toFixed(2)}
        </Text>

        <TouchableOpacity
          style={[
            productStyles.cartButton,
            isInCart && { backgroundColor: "#ccc" }
          ]}
          onPress={() => !isInCart && onAddToCart(product)}
          disabled={isInCart}
        >
          <Ionicons name="cart" size={16} color="#000" />
          <Text style={productStyles.cartButtonText}>
            {isInCart ? "Added" : "Add to Cart"}
          </Text>
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );
});

const Product = ({ navigation }) => {

  const CART_STORAGE_KEY = "@lsb_cart";

  const [searchText, setSearchText] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const productsRef = collection(db, "products");

  const loadCartFromStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        if (Array.isArray(items)) {
          setCartItems(items);
        }
      }
    } catch (e) {
      console.log("Failed to load cart", e);
    }
  };

  const saveCartToStorage = async (items) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.log("Failed to save cart", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCartFromStorage();
    }, [])
  );

  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const fetchProducts = async (loadMore = false) => {

    if (isFetching) return;

    setIsFetching(true);

    try {

      loadMore ? setLoadingMore(true) : setInitialLoading(true);

      let q;

      if (loadMore && lastDoc) {
        q = query(
          productsRef,
          where("type", "==", "other"),
          orderBy("name"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          productsRef,
          where("type", "==", "other"),
          orderBy("name"),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);

      const newProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setProducts(prev =>
        loadMore ? [...prev, ...newProducts] : newProducts
      );

    } catch (error) {
      console.log("Firestore error:", error);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
  }, []);

  useEffect(() => {
    const urls = products.map(p => p.imageUrl).filter(Boolean);
    ExpoImage.prefetch(urls);
  }, [products]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !isFetching) {
      fetchProducts(true);
    }
  };

  const handleAddToCart = useCallback((product) => {
    setCartItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      (p?.name || "").toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const cartIds = useMemo(() => {
    return new Set(cartItems.map(i => i.id));
  }, [cartItems]);

  const renderItem = useCallback(({ item }) => (
    <ProductCard
      product={item}
      onAddToCart={handleAddToCart}
      isInCart={cartIds.has(item.id)}
      onPress={(product) =>
        navigation.navigate("ProductDetails", {
          product,
          onAddToCart: handleAddToCart,
        })
      }
    />
  ), [cartIds]);

  const goToCart = () => {
    navigation.navigate("Cart", { cartItems });
  };

  return (
    <View style={styles.main}>
      <Header
        title="Products"
        navigation={navigation}
        cartCount={cartItems.length}
        onCartPress={goToCart}
      />

      <View style={styles.body}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#555" />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#888"
            onChangeText={setSearchText}
            value={searchText}
            style={styles.input}
          />
        </View>

        {initialLoading ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : (
          <FlashList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            estimatedItemSize={220}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore
                ? <ActivityIndicator size="small" style={{ margin: 20 }} />
                : null
            }
          />
        )}
      </View>
    </View>
  );
};

export default Product;

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F3F3F3' },
  body: { flex: 1, paddingHorizontal: 15 },

  searchContainer: {
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    backgroundColor: '#FFFFFF',
    borderColor: '#CCCCCC',
    marginVertical: 15,
  },

  input: { flex: 1, fontSize: 16, marginHorizontal: 8 },

  gridContainer: { paddingBottom: 20 },
});

const productStyles = StyleSheet.create({

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
  },

  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#F7F7F7'
  },

  detailsContainer: { padding: 10 },

  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232F3E',
    minHeight: 36
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginVertical: 5
  },

  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD814',
    borderRadius: 20,
    paddingVertical: 6,
    marginTop: 8,
  },

  cartButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5
  }

});