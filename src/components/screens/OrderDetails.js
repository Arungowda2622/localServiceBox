import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import Header from "../header/Header";

const OrderDetails = ({ route, navigation }) => {
  const { order } = route.params;

  return (
    <View style={styles.container}>
        <Header title={"Order Details"} navigation={navigation}/>
      
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {/* 👤 CUSTOMER */}
      <Text style={styles.section}>Customer</Text>
      <Text>{order.address?.fullName}</Text>
      <Text>{order.address?.mobileNumber}</Text>

      {/* 📍 ADDRESS */}
      <Text style={styles.section}>Address</Text>
      <Text>
        {order.address?.address}, {order.address?.city},{" "}
        {order.address?.state} - {order.address?.pinCode}
      </Text>

      {/* 🛒 ITEMS */}
      <Text style={styles.section}>Items</Text>

      {order.items?.[0]?.hotelName && (
        <Text style={styles.hotelName}>Hotel: {order.items[0].hotelName}</Text>
      )}

      {order.items?.map((item, index) => {
        const qty = item.quantity || item.qty || 1;

        return (
          <View key={index} style={styles.itemCard}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>

              <Text>Qty: {qty}</Text>
              <Text>Price: ₹{item.price}</Text>
              <Text>Subtotal: ₹{qty * item.price}</Text>
            </View>
          </View>
        );
      })}

      {/* 💰 TOTAL */}
      <Text style={styles.section}>Payment</Text>
      <Text>Total: ₹ {order.total}</Text>
      <Text>Method: {order.paymentMethod}</Text>

      {/* 🚚 STATUS */}
      <Text style={styles.section}>Status</Text>
      <Text>{order.status}</Text>
      </ScrollView>
    </View>
  );
};

export default OrderDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  section: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
  },
  itemCard: {
    flexDirection: "row",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  name: {
    fontWeight: "600",
  },
  hotelName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 10,
  },
});