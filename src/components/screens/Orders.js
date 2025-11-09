import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Header from "../header/Header";

const Orders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [rides, setRides] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("product"); // "product", "bike", "box"

  // ✅ Fetch Product Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("User not logged in");
        setLoading(false);
        return;
      }

      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.userId === user.uid); // ✅ filter by user

      setOrders(list);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Bike Rides
  const fetchRides = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("User not logged in");
        setLoading(false);
        return;
      }

      const q = query(collection(db, "rides"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.userId === user.uid); // ✅ filter by user

      setRides(list);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Box Deliveries
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn("User not logged in");
        setLoading(false);
        return;
      }

      const q = query(collection(db, "boxDelivery"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.userId === user.uid); // ✅ filter by user

      setDeliveries(list);
    } catch (error) {
      console.error("Error fetching box deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Load data based on active tab
  useEffect(() => {
    if (activeTab === "product") fetchOrders();
    else if (activeTab === "bike") fetchRides();
    else fetchDeliveries();
  }, [activeTab]);

  // ✅ Render Product Orders
  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.orderId}>Order ID: {item.id}</Text>
      <Text style={styles.total}>Total: ₹{item.total}</Text>
      <Text style={styles.payment}>Payment: {item.paymentMethod}</Text>
      <Text style={styles.status}>
        Status: <Text style={styles.statusValue}>{item.status}</Text>
      </Text>

      {item.address && (
        <Text style={styles.address}>
          Address: {item.address.address}, {item.address.city},{" "}
          {item.address.state} - {item.address.pinCode}
        </Text>
      )}

      <Text style={styles.date}>
        Date:{" "}
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString()
          : new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  // ✅ Render Bike Rides
  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.orderId}>Ride ID: {item.id}</Text>
      <Text style={styles.total}>Fare: ₹{item.fare}</Text>
      <Text style={styles.status}>
        Status: <Text style={styles.statusValue}>{item.status}</Text>
      </Text>
      <Text style={styles.address}>From: {item.pickupName}</Text>
      <Text style={styles.address}>To: {item.destinationName}</Text>
      <Text style={styles.address}>Distance: {item.distance} km</Text>
      <Text style={styles.address}>Duration: {item.duration}</Text>
      <Text style={styles.date}>
        Date:{" "}
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString()
          : new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  // ✅ Render Box Deliveries
  const renderDelivery = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.orderId}>Delivery ID: {item.id}</Text>
      <Text style={styles.total}>Fare: ₹{item.fare}</Text>
      <Text style={styles.status}>
        Status: <Text style={styles.statusValue}>{item.status}</Text>
      </Text>
      <Text style={styles.address}>Pickup: {item.pickup?.address}</Text>
      <Text style={styles.address}>Destination: {item.destination?.address}</Text>
      <Text style={styles.address}>Distance: {item.distance} km</Text>
      <Text style={styles.address}>Duration: {item.duration}</Text>
      <Text style={styles.date}>
        Date:{" "}
        {item.createdAt?.toDate
          ? item.createdAt.toDate().toLocaleString()
          : new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"My Orders"} />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["product", "bike", "box"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {tab === "product"
                ? "Products"
                : tab === "bike"
                ? "Bike Rides"
                : "Box Delivery"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lists */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : activeTab === "product" ? (
        orders.length === 0 ? (
          <Text style={styles.noOrders}>No product orders found.</Text>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
          />
        )
      ) : activeTab === "bike" ? (
        rides.length === 0 ? (
          <Text style={styles.noOrders}>No bike rides found.</Text>
        ) : (
          <FlatList
            data={rides}
            renderItem={renderRide}
            keyExtractor={(item) => item.id}
          />
        )
      ) : deliveries.length === 0 ? (
        <Text style={styles.noOrders}>No box deliveries found.</Text>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

export default Orders;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 15,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
    marginBottom: 15,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: { backgroundColor: "#007AFF" },
  tabButtonText: { color: "#555", fontWeight: "600", fontSize: 16 },
  tabButtonTextActive: { color: "#FFF" },
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  orderId: { fontSize: 14, color: "#555", marginBottom: 4 },
  total: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  payment: { fontSize: 14, color: "#333", marginBottom: 4 },
  status: { fontSize: 15, marginBottom: 4 },
  statusValue: { fontWeight: "bold", color: "#007AFF" },
  address: { fontSize: 13, color: "#666", marginTop: 3 },
  date: { fontSize: 13, color: "#888", marginTop: 5 },
  noOrders: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
    color: "#555",
  },
});
