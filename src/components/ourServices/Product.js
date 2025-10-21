import { StyleSheet, Text, TextInput, View, FlatList, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '../header/Header';

const PRODUCTS = [
  { id: '1', name: 'Premium Wireless Headphones', price: 149, imageUrl: 'https://thumbs.dreamstime.com/b/beautiful-tropical-rain-forest-nature-trails-ang-ka-luang-nature-trail-doi-inthanon-national-park-chiangmai-thailand-158663306.jpg' },
  { id: '2', name: 'Smart Fitness Watch', price: 79, imageUrl: 'https://thumbs.dreamstime.com/b/beautiful-rain-forest-ang-ka-nature-trail-doi-inthanon-national-park-thailand-36703721.jpg' },
  { id: '3', name: 'Bluetooth Speaker', price: 49, imageUrl: 'https://thumbs.dreamstime.com/b/mountain-rainforest-18715912.jpg' },
  { id: '4', name: 'Bluetooth Speaker', price: 49, imageUrl: 'https://thumbs.dreamstime.com/b/mountain-rainforest-18715912.jpg' },
];

const ProductCard = ({ product, onAddToCart, isInCart }) => {
  return (
    <View style={productStyles.card}>
      <Image source={{ uri: product.imageUrl }} style={productStyles.image} />
      <View style={productStyles.detailsContainer}>
        <Text style={productStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={productStyles.price}>${product.price.toFixed(2)}</Text>
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
    </View>
  );
};

const Product = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      if (prev.some(item => item.id === product.id)) return prev; // prevent duplicate
      return [...prev, product];
    });
  };

  const filteredProducts = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const goToCart = () => {
    navigation.navigate("Cart", { cartItems });
  };

  return (
    <View style={styles.main}>
      <Header title="Products" navigation={navigation} cartCount={cartItems.length} onCartPress={goToCart} />
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
          <MaterialIcons name="mic" size={20} color="#555" />
        </View>

        <Text style={styles.resultCountText}>
          Showing {filteredProducts.length} results
        </Text>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAddToCart={handleAddToCart}
              isInCart={cartItems.some(ci => ci.id === item.id)}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
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
