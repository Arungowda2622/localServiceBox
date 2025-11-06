import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import Header from "../header/Header";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const UpdateOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUTR, setSearchUTR] = useState("");

  // 🔹 Fetch all orders in real-time
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(list);
      setFilteredOrders(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Filter orders by UTR number
  const handleSearch = (text) => {
    setSearchUTR(text);
    if (text.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) =>
        order.utrNumber?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

  // 🔹 Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      Alert.alert("✅ Success", `Order status updated to "${newStatus}"`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  // 🔹 Delete order
  const handleDelete = (orderId) => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to delete this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "orders", orderId));
              Alert.alert("Deleted ✅", "Order deleted successfully");
            } catch (error) {
              console.error("Error deleting order:", error);
              Alert.alert("Error", "Failed to delete order");
            }
          },
        },
      ]
    );
  };

  // 🔹 Render each order
  const renderOrder = ({ item }) => (
    <LinearGradient colors={["#ffffff", "#f3f9ff"]} style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="receipt-outline" size={22} color="#007AFF" />
        <Text style={styles.orderId}>Order ID: {item.id}</Text>
      </View>

      <Text style={styles.userId}>User ID: {item.userId}</Text>
      <Text style={styles.total}>Total: ₹{item.total}</Text>
      <Text style={styles.payment}>Payment: {item.paymentMethod}</Text>

      {item.paymentMethod === "Online Payment" && (
        <Text style={styles.utr}>UTR: {item.utrNumber || "N/A"}</Text>
      )}

      {item.address && (
        <Text style={styles.address}>
          Address: {item.address.address}, {item.address.city},{" "}
          {item.address.state} - {item.address.pinCode}
        </Text>
      )}

      <Text style={styles.date}>
        📅{" "}
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString()
          : new Date(item.createdAt).toLocaleString()}
      </Text>

      {/* 🔹 Status Dropdown using RNPickerSelect */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={(value) => handleStatusChange(item.id, value)}
            items={[
              { label: "Pending Verification", value: "Pending Verification" },
              { label: "Confirmed", value: "Confirmed" },
              { label: "Rejected", value: "Rejected" },
              { label: "Dispatched", value: "Dispatched" },
              { label: "Delivered", value: "Delivered" },
            ]}
            value={item.status}
            style={pickerSelectStyles}
            placeholder={{}}
          />
        </View>
      </View>

      {/* 🔹 Delete Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete Order</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"Orders"} />

      {/* 🔹 Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          placeholder="Search by UTR number"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchUTR}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <Text style={styles.noOrders}>No matching orders found.</Text>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
};

export default UpdateOrders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    padding: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: "#333",
  },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
  },
  userId: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111",
  },
  payment: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  utr: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: "#555",
    marginVertical: 4,
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 10,
    color: "#333",
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  noOrders: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
    color: "#777",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#333",
  },
  inputAndroid: {
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#333",
  },
});
