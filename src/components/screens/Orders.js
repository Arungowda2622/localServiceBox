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
import Header from "../header/Header";
import { getUserId } from "../../utils/authUtils";
import { Dropdown } from "react-native-element-dropdown";

const orderTypeData = [
  // { label: "Products", value: "orders" },
  // { label: "Box Delivery", value: "boxDelivery" },
  // { label: "Chicken/Fish", value: "chickenFishOrders" },
  { label: "Enquiries", value: "constructionOrders" },
  // { label: "Food Orders", value: "foodOrders" },
];

const Orders = ({ navigation }) => {

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("product");
  const [usersMap, setUsersMap] = useState({});

  const [orderType, setOrderType] = useState("orders"); // default = products
  const [orders, setOrders] = useState([]);


  /* ---------------- FETCH DATA ---------------- */

  const fetchData = async (collectionName, setter) => {
    console.log("Fetching", collectionName);
    console.log(setter)
    try {
      setLoading(true);
      const uid = await getUserId();
      if (!uid) return;

      const q = query(
        collection(db, collectionName),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.userId === uid);

      setter(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));

      const map = {};

      snap.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = {
          name: data.fullName || data.name || "Customer",
          phone: data.phone || data.mobileNumber || "",
        };
      });

      setUsersMap(map);
    } catch (e) {
      console.log("User fetch error", e);
    }
  };


  useEffect(() => {
    fetchUsers();
    fetchData(orderType, setOrders);
  }, [orderType]);

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
    <TouchableOpacity
      onPress={() => navigation.navigate("OrderDetails", { order: item })}
    >
      <CardWrapper>
        <Text style={styles.id}>Order #{item.id.slice(0, 8)}</Text>

        {/* ✅ CUSTOMER INFO FROM address OBJECT */}
        <Text style={styles.sub}>
          👤 {item.address?.fullName || "Customer"}
        </Text>
        <Text style={styles.sub}>
          📞 {item.address?.mobileNumber || "No Phone"}
        </Text>

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
    </TouchableOpacity>
  );

  const renderDelivery = ({ item }) => {
    const customer = usersMap[item.userId];

    return (
      <TouchableOpacity
        // onPress={() => navigation.navigate("OrderDetails", { order: item })}
      >
        <CardWrapper>
          <Text style={styles.id}>Delivery #{item.id.slice(0, 8)}</Text>

          <Text style={styles.sub}>
            👤 {customer?.name || "Customer"}
          </Text>

          <Text style={styles.sub}>
            📞 {customer?.phone || "No Phone"}
          </Text>

          <Text style={styles.amount}>₹ {item.fare}</Text>

          <Text style={styles.sub}>Payment: {item.paymentMethod}</Text>

          <StatusBadge status={item.status} />

          <Text style={styles.sub}>📍 Pickup: {item.pickupName}</Text>
          <Text style={styles.sub}>🏁 Drop: {item.destinationName}</Text>

          <Text style={styles.sub}>
            {item.distance} km • {item.duration}
          </Text>

          <Text style={styles.date}>
            {item.createdAt?.toDate?.().toLocaleString()}
          </Text>
        </CardWrapper>
      </TouchableOpacity>
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Header title="My Orders" navigation={navigation} />
      <View style={{ flex: 1, padding: 16 }}>
        {/* Segmented Tabs */}
        <View style={{ marginBottom: 15 }}>
          <Dropdown
            style={{
              height: 50,
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
            data={orderTypeData}
            labelField="label"
            valueField="value"
            value={orderType}
            placeholder="Select Order Type"
            onChange={(item) => {
              setOrderType(item.value);
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : orders.length ? (
          <FlatList
            data={orders}
            renderItem={({ item }) =>
              orderType === "boxDelivery"
                ? renderDelivery({ item })
                : renderOrder({ item })
            }
            keyExtractor={(item) => item.id}
            ListFooterComponent={<View style={{ height: 150 }} />}
          />
        ) : (
          <EmptyState text={`No ${orderType} orders yet`} />
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

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginVertical: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  empty: { alignItems: "center", marginTop: 60 },
  noOrders: { fontSize: 16, color: "#777", marginTop: 10 },
});
