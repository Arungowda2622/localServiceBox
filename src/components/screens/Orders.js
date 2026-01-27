import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Header from "../header/Header";

const Orders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [rides, setRides] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("product");

  /* ---------------- FETCH DATA ---------------- */

  const fetchData = async (collectionName, setter) => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user) return;

      const q = query(
        collection(db, collectionName),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.userId === user.uid);

      setter(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "product") fetchData("orders", setOrders);
    else if (activeTab === "bike") fetchData("bookings", setRides);
    else fetchData("boxDelivery", setDeliveries);
  }, [activeTab]);

  /* ---------------- HELPERS ---------------- */

  const StatusBadge = ({ status }) => (
    <View
      style={[
        styles.badge,
        { backgroundColor: status === "completed" ? "#4CAF50" : "#FF9800" },
      ]}
    >
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );

  const EmptyState = ({ text }) => (
    <View style={styles.empty}>
      <Icon name="clipboard-text-outline" size={60} color="#ccc" />
      <Text style={styles.noOrders}>{text}</Text>
    </View>
  );

  /* ---------------- CARDS ---------------- */

  const CardWrapper = ({ children }) => (
    <View style={styles.card}>
      <View style={styles.leftStrip} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );

  const renderOrder = ({ item }) => (
    <CardWrapper>
      <Text style={styles.id}>Order #{item.id.slice(0, 8)}</Text>
      <Text style={styles.amount}>₹ {item.total}</Text>
      <Text style={styles.sub}>Payment: {item.paymentMethod}</Text>
      <StatusBadge status={item.status} />
      <Text style={styles.sub}>
        {item.address?.address}, {item.address?.city}
      </Text>
      <Text style={styles.date}>
        {item.createdAt?.toDate?.().toLocaleString()}
      </Text>
    </CardWrapper>
  );

  const renderRide = ({ item }) => (
    <CardWrapper>
      <Text style={styles.id}>Ride #{item.id.slice(0, 8)}</Text>
      <Text style={styles.amount}>₹ {item.fare}</Text>
      <StatusBadge status={item.status} />
      <Text style={styles.sub}>From: {item.pickupName}</Text>
      <Text style={styles.sub}>To: {item.destinationName}</Text>
      <Text style={styles.sub}>
        {item.distance} km • {item.duration}
      </Text>
    </CardWrapper>
  );

  const renderDelivery = ({ item }) => (
    <CardWrapper>
      <Text style={styles.id}>Delivery #{item.id.slice(0, 8)}</Text>
      <Text style={styles.amount}>₹ {item.fare}</Text>
      <StatusBadge status={item.status} />
      <Text style={styles.sub}>Pickup: {item.pickup?.address}</Text>
      <Text style={styles.sub}>Drop: {item.destination?.address}</Text>
      <Text style={styles.sub}>
        {item.distance} km • {item.duration}
      </Text>
    </CardWrapper>
  );

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Header title="My Orders" navigation={navigation} />
      <View style={{ flex: 1, padding: 16 }}>
        {/* Segmented Tabs */}
        <View style={styles.tabs}>
          {[
            { key: "product", label: "Products", icon: "cart" },
            { key: "bike", label: "Bike", icon: "motorbike" },
            { key: "box", label: "Box", icon: "cube-outline" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Icon
                name={t.icon}
                size={20}
                color={activeTab === t.key ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === t.key && styles.tabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 40 }}
          />
        ) : activeTab === "product" ? (
          orders.length ? (
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={(item) => item.id}
              ListFooterComponent={<View style={{ height: 150 }} />}
            />
          ) : (
            <EmptyState text="No product orders yet" />
          )
        ) : activeTab === "bike" ? (
          rides.length ? (
            <FlatList
              data={rides}
              renderItem={renderRide}
              keyExtractor={(item) => item.id}
              ListFooterComponent={<View style={{ height: 150 }} />}
            />
          ) : (
            <EmptyState text="No bike rides yet" />
          )
        ) : deliveries.length ? (
          <FlatList
            data={deliveries}
            renderItem={renderDelivery}
            keyExtractor={(item) => item.id}
            ListFooterComponent={<View style={{ height: 150 }} />}
          />
        ) : (
          <EmptyState text="No box deliveries yet" />
        )}
      </View>
    </View>
  );
};

export default Orders;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
  },
  tabText: { color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  /* Cards */
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 15,
    padding: 14,
    elevation: 4,
  },
  leftStrip: {
    width: 4,
    backgroundColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
  },
  id: { color: "#888", fontSize: 13 },
  amount: { fontSize: 18, fontWeight: "700", marginVertical: 4 },
  sub: { fontSize: 14, color: "#555", marginTop: 2 },
  date: { fontSize: 12, color: "#999", marginTop: 6 },

  /* Badge */
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginVertical: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  /* Empty */
  empty: { alignItems: "center", marginTop: 60 },
  noOrders: { fontSize: 16, color: "#777", marginTop: 10 },
});
