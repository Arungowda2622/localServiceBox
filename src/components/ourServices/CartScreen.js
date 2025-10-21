import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Header from '../header/Header';

const CartScreen = ({ route, navigation }) => {
  const { cartItems: initialItems } = route.params || {};

  // Initialize each item with a quantity of 1
  const [cartItems, setCartItems] = useState(
    (initialItems || []).map(item => ({ ...item, quantity: item.quantity || 1 }))
  );

  const handleIncrease = (id) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrease = (id) => {
    setCartItems(items =>
      items
        .map(item =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter(item => item.quantity > 0) // Remove if quantity is 0
    );
  };

  const handleRemove = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    navigation.navigate("PaymentSelection");
  }

  return (
    <View style={styles.container}>
      <Header title="My Cart" navigation={navigation} />

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#aaa" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    ₹{item.price.toLocaleString('en-IN')} × {item.quantity} = ₹
                    {(item.price * item.quantity).toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => handleDecrease(item.id)}
                    >
                      <Ionicons name="remove" size={18} color="#000" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => handleIncrease(item.id)}
                    >
                      <Ionicons name="add" size={18} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <Text style={styles.totalText}>
              Total: ₹{total.toLocaleString('en-IN')}
            </Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#555', marginTop: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 15, color: '#111', marginVertical: 4 },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyButton: {
    backgroundColor: '#FFD814',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 8,
  },
  quantityText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    marginBottom:30
  },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  checkoutButton: {
    backgroundColor: '#FFD814',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  checkoutText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
});
