import { StyleSheet, Text, TextInput, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const ProductCard = ({ product, onAddToCart, isInCart, onPress }) => {
  const images =
    product?.imageUrl ||
    product?.images?.[0] ||
    "https://via.placeholder.com/150";
    console.log(product,"productDetails")
  return (
    <TouchableOpacity
      style={productStyles.card}
      activeOpacity={0.9}
      onPress={() => onPress(product)}
    >
      <View style={productStyles.detailsContainer}>
        <Image
          source={{ uri: images }}
          style={productStyles.image}

        />
        <Text style={productStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={productStyles.price}>₹{Number(product?.price || 0).toFixed(2)}</Text>
        <TouchableOpacity
          style={[productStyles.cartButton, isInCart && { backgroundColor: '#ccc' }]}
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
};


const Product = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 8;

  const [lastDoc, setLastDoc] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // 🔥 prevents multi calls

  const fetchProducts = async (loadMore = false) => {
    if (isFetching) return; // 🔥 stop multiple calls
    setIsFetching(true);

    try {
      loadMore ? setLoadingMore(true) : setInitialLoading(true);

      let q;

      if (loadMore && lastDoc) {
        q = query(
          collection(db, "products"),
          orderBy("name"), // or createdAt (recommended)
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, "products"),
          orderBy("name"),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);

      const newProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔥 Save last document for next page
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      // 🔥 Stop pagination if no more data
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setProducts(prev =>
        loadMore ? [...prev, ...newProducts] : newProducts
      );
    } catch (error) {
      console.log("Advanced pagination error:", error);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !isFetching) {
      fetchProducts(true);
    }
  };

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const filteredProducts = products.filter(p =>
    (p?.name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const goToCart = () => {
    navigation.navigate("Cart", { cartItems });
  };

  return (
    <View style={styles.main}>
      <Header title="Products" navigation={navigation} cartCount={cartItems.length} onCartPress={goToCart} />

      <View style={styles.body}>
        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#555" />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#888"
            onChangeText={setSearchText}
            value={searchText}
            style={styles.input}
          />
          {/* <MaterialIcons name="mic" size={20} color="#555" /> */}
        </View>

        {initialLoading  ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* <Text style={styles.resultCountText}>
              Showing {filteredProducts.length} results
            </Text> */}

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onAddToCart={handleAddToCart}
                  isInCart={cartItems.some(ci => ci.id === item.id)}
                  onPress={(product) =>
                    navigation.navigate("ProductDetails", {
                      product,
                      onAddToCart: handleAddToCart,
                    })
                  }
                />
              )}
              numColumns={2}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.2} // 🔥 smoother trigger
              removeClippedSubviews={true}
              maxToRenderPerBatch={6}
              windowSize={7}
              initialNumToRender={8}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" style={{ margin: 20 }} />
                ) : null
              }
            />
          </>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0, marginHorizontal: 8 },
  resultCountText: { fontSize: 14, color: '#333', marginBottom: 10, fontWeight: '500' },
  gridContainer: { paddingBottom: 20 },
});

const productStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  image: { width: '100%', height: 150, resizeMode: 'contain', backgroundColor: '#F7F7F7' },
  detailsContainer: { padding: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#232F3E', minHeight: 36 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#111', marginVertical: 5 },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD814',
    borderRadius: 20,
    paddingVertical: 6,
    marginTop: 8,
  },
  cartButtonText: { color: '#000', fontSize: 14, fontWeight: '600', marginLeft: 5 },
});
