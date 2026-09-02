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
  { label: "Construction Orders", value: "constructionOrders" },
  { label: "Civic Assist", value: "civicBookings" },
  { label: "ManPower Bookings", value: "manpowerBookings" },
  { label: "Service Bookings", value: "serviceBookings" },
];

const Orders = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState("constructionOrders");
  const [orders, setOrders] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  /* ---------------------------------------------------
     SAFE VALUE HELPER
  --------------------------------------------------- */

  const safeText = (value, fallback = "") => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    // Firestore Timestamp
    if (value?.toDate instanceof Function) {
      return value.toDate().toLocaleString();
    }

    // Object / array
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }

    return String(value);
  };

  /* ---------------------------------------------------
     FORMAT DATE
  --------------------------------------------------- */

  const formatDate = (createdAt) => {
    if (!createdAt) {
      return "Processing...";
    }

    try {
      if (createdAt?.toDate instanceof Function) {
        return createdAt.toDate().toLocaleString();
      }

      if (createdAt instanceof Date) {
        return createdAt.toLocaleString();
      }

      return safeText(createdAt, "Processing...");
    } catch (error) {
      console.log("Date formatting error:", error);
      return "Processing...";
    }
  };

  /* ---------------------------------------------------
     FORMAT ADDRESS
  --------------------------------------------------- */

  const formatAddress = (address) => {
    if (!address) {
      return "No Address";
    }

    // Address is already a string
    if (typeof address === "string") {
      return address;
    }

    // Address is an object
    if (typeof address === "object") {
      const parts = [
        address.address,
        address.city,
        address.state,
        address.pinCode,
        address.pincode,
        address.zipCode,
      ]
        .map((value) => {
          if (
            value !== null &&
            value !== undefined &&
            typeof value !== "object"
          ) {
            return String(value);
          }

          return "";
        })
        .filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : "No Address";
    }

    return safeText(address, "No Address");
  };

  /* ---------------------------------------------------
     FETCH DATA
  --------------------------------------------------- */

  const fetchData = async (collectionName, setter) => {
    try {
      console.log("Fetching:", collectionName);

      setLoading(true);

      const uid = await getUserId();

      if (!uid) {
        console.log("No user ID found");
        setter([]);
        return;
      }

      const q = query(
        collection(db, collectionName),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) => item.userId === uid);

      console.log(
        `Fetched ${list.length} ${collectionName} records for user:`,
        uid
      );

      setter(list);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------
     FETCH USERS
  --------------------------------------------------- */

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));

      const map = {};

      snap.forEach((doc) => {
        const data = doc.data();

        map[doc.id] = {
          name: safeText(
            data.fullName || data.name,
            "Customer"
          ),
          phone: safeText(
            data.phone || data.mobileNumber,
            "No Phone"
          ),
        };
      });

      setUsersMap(map);
    } catch (error) {
      console.log("User fetch error:", error);
    }
  };

  /* ---------------------------------------------------
     EFFECT
  --------------------------------------------------- */

  useEffect(() => {
    fetchUsers();
    fetchData(orderType, setOrders);
  }, [orderType]);

  /* ---------------------------------------------------
     STATUS BADGE
  --------------------------------------------------- */

  const StatusBadge = ({ status }) => {
    const statusText = safeText(status, "pending");

    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor:
              statusText.toLowerCase() === "completed"
                ? "#4CAF50"
                : "#FF9800",
          },
        ]}
      >
        <Text style={styles.badgeText}>{statusText}</Text>
      </View>
    );
  };

  /* ---------------------------------------------------
     EMPTY STATE
  --------------------------------------------------- */

  const EmptyState = ({ text }) => (
    <View style={styles.empty}>
      <Icon
        name="clipboard-text-outline"
        size={60}
        color="#ccc"
      />

      <Text style={styles.noOrders}>{text}</Text>
    </View>
  );

  /* ---------------------------------------------------
     CARD WRAPPER
  --------------------------------------------------- */

  const CardWrapper = ({ children }) => (
    <View style={styles.card}>
      <View style={styles.leftStrip} />

      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );

  /* ---------------------------------------------------
     RENDER ORDER
  --------------------------------------------------- */

  const renderOrder = ({ item }) => {
    console.log(
      "Rendering order:",
      item.id,
      "Type:",
      orderType
    );

    /* ================================================
       MANPOWER
    ================================================= */

    if (orderType === "manpowerBookings") {
      return (
        <CardWrapper>
          <Text style={styles.id}>
            ManPower Booking #{item.id?.slice(0, 8)}
          </Text>

          <Text style={styles.sub}>
            👤 {safeText(item.name, "Customer")}
          </Text>

          <Text style={styles.sub}>
            📞 {safeText(item.phoneNumber, "No Phone")}
          </Text>

          <Text style={styles.sub}>
            🧰 Service:{" "}
            {safeText(item.manPowerType, "ManPower")}
          </Text>

          <Text style={styles.sub}>
            📍 {formatAddress(item.address)}
          </Text>

          <Text style={styles.sub}>
            📝 {safeText(item.description, "No Description")}
          </Text>

          <StatusBadge status={item.status} />

          <Text style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>
        </CardWrapper>
      );
    }

    /* ================================================
       SERVICE BOOKINGS
    ================================================= */

    if (orderType === "serviceBookings") {
      return (
        <CardWrapper>
          <Text style={styles.id}>
            Service Booking #{item.id?.slice(0, 8)}
          </Text>

          <Text style={styles.sub}>
            👤 {safeText(item.name, "Customer")}
          </Text>

          <Text style={styles.sub}>
            📞 {safeText(item.phoneNumber, "No Phone")}
          </Text>

          <Text style={styles.sub}>
            🛠️ Service:{" "}
            {safeText(item.serviceType, "Service")}
          </Text>

          <Text style={styles.sub}>
            📍 {formatAddress(item.address)}
          </Text>

          <Text style={styles.sub}>
            📝 {safeText(item.description, "No Description")}
          </Text>

          <StatusBadge status={item.status} />

          <Text style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>
        </CardWrapper>
      );
    }

    /* ================================================
       CIVIC ASSIST
    ================================================= */

    if (orderType === "civicBookings") {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("CivicBookingDetails", {
              booking: item,
            })
          }
        >
          <CardWrapper>
            <Text style={styles.id}>
              Civic Assist #{item.id?.slice(0, 8)}
            </Text>

            <Text style={styles.sub}>
              👤 {safeText(item.name, "Customer")}
            </Text>

            <Text style={styles.sub}>
              📞 {safeText(
                item.phoneNumber || item.mobileNumber,
                "No Phone"
              )}
            </Text>

            <Text style={styles.sub}>
              🏛️ Service:{" "}
              {safeText(
                item.civicType,
                "Civic Assist"
              )}
            </Text>

            {/* City */}
            {item.city && (
              <Text style={styles.sub}>
                🏙️ City: {safeText(item.city)}
              </Text>
            )}

            <Text style={styles.sub}>
              📍 {formatAddress(item.address)}
            </Text>

            <Text style={styles.sub}>
              📝 {safeText(
                item.description,
                "No Description"
              )}
            </Text>

            <StatusBadge status={item.status} />

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </CardWrapper>
        </TouchableOpacity>
      );
    }

    /* ================================================
       CONSTRUCTION / PRODUCT ORDER
    ================================================= */

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("OrderDetails", {
            order: item,
          })
        }
      >
        <CardWrapper>
          <Text style={styles.id}>
            Order #{item.id?.slice(0, 8)}
          </Text>

          <Text style={styles.sub}>
            👤{" "}
            {safeText(
              item.address?.fullName,
              "Customer"
            )}
          </Text>

          <Text style={styles.sub}>
            📞{" "}
            {safeText(
              item.address?.mobileNumber,
              "No Phone"
            )}
          </Text>

          <Text style={styles.amount}>
            ₹ {safeText(item.total, "0")}
          </Text>

          <Text style={styles.sub}>
            Payment:{" "}
            {safeText(
              item.paymentMethod,
              "Not Available"
            )}
          </Text>

          <StatusBadge status={item.status} />

          <Text style={styles.sub}>
            📍 {formatAddress(item.address)}
          </Text>

          <Text style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>
        </CardWrapper>
      </TouchableOpacity>
    );
  };

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */

  return (
    <View style={styles.container}>
      <Header
        title="My Orders"
        navigation={navigation}
      />

      <View
        style={{
          flex: 1,
          padding: 16,
        }}
      >
        <View style={{ marginBottom: 15 }}>
          <Dropdown
            style={styles.dropdown}
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
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 40 }}
          />
        ) : orders.length > 0 ? (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) =>
              item.id
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={{ height: 150 }} />
            }
          />
        ) : (
          <EmptyState
            text={`No ${
              orderTypeData.find(
                (x) => x.value === orderType
              )?.label || "orders"
            } yet`}
          />
        )}
      </View>
    </View>
  );
};

export default Orders;

/* ---------------------------------------------------
   STYLES
--------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 15,
    padding: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  leftStrip: {
    width: 4,
    backgroundColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
  },

  id: {
    color: "#888",
    fontSize: 13,
    marginBottom: 5,
  },

  amount: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 4,
  },

  sub: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },

  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginVertical: 8,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  empty: {
    alignItems: "center",
    marginTop: 60,
  },

  noOrders: {
    fontSize: 16,
    color: "#777",
    marginTop: 10,
  },
});