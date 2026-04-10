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
  StatusBar,
} from "react-native";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import Header from "../header/Header";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import { Dropdown } from "react-native-element-dropdown";
import { Linking } from "react-native";


const getStatusColor = (status) => {
  switch (status) {
    case "Delivered":
      return "#38A169"; // Success Green
    case "Confirmed":
    case "Dispatched":
      return colors.PRIMARY_COLOR; // Primary Blue
    case "Cancelled":
      return "#E53E3E"; // Alert Red
    case "Pending":
    default:
      return colors.ACCENT_COLOR; // Accent Yellow
  }
};

const statusData = [
  { label: "Pending", value: "Pending" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Dispatched", value: "Dispatched" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

const orderTypeData = [
  { label: "Product Orders", value: "orders" },
  { label: "Box Delivery", value: "boxDelivery" },
  { label: "Chicken/Fish Orders", value: "chickenFishOrders" },
  { label: "Construction Orders", value: "constructionOrders" },
];

const UpdateOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUTR, setSearchUTR] = useState("");
  const [orderType, setOrderType] = useState("orders"); // "orders" | "rides" | "boxDelivery"
  const [usersMap, setUsersMap] = useState({});

  // 🔹 Fetch data dynamically based on orderType (Unchanged)
  useEffect(() => {
    setLoading(true);
    let collectionRef = collection(db, orderType);
    const q = query(collectionRef, orderBy("createdAt", "desc"));

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
  }, [orderType]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = data;
      });
      setUsersMap(map);
    });

    return unsubscribe;
  }, []);

  // 🔹 Filter orders by UTR or user ID (Unchanged)
  const handleSearch = (text) => {
    setSearchUTR(text);
    if (text.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.utrNumber?.toLowerCase().includes(text.toLowerCase()) ||
          order.userId?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  };

  // 🔹 Update order status (Unchanged)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, orderType, orderId);
      await updateDoc(orderRef, { status: newStatus });
      Alert.alert("✅ Success", `Order status updated to "${newStatus}"`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  // 🔹 Delete order (Unchanged)
  const handleDelete = (orderId) => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to delete this order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, orderType, orderId));
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

  // 🔹 Determine appropriate icon based on order type (Unchanged)
  const getOrderIcon = () => {
    switch (orderType) {
      case "orders":
        return "basket-outline";
      case "boxDelivery":
        return "cube-outline";
      case "chickenFishOrders":
        return "food-drumstick"; // ✅
      case "constructionOrders":
        return "hammer"; // ✅
      default:
        return "document-text-outline";
    }
  };

  const callUser = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const whatsappUser = (phone) => {
    if (!phone) return;
    Linking.openURL(`whatsapp://send?phone=91${phone}`);
  };

  const goToPickup = (pickup) => {
    if (!pickup) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      pickup
    )}`;

    Linking.openURL(url);
  };

  const goToDrop = (pickup, destination) => {
    if (!pickup || !destination) return;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      pickup
    )}&destination=${encodeURIComponent(destination)}`;

    Linking.openURL(url);
  };

  // 🔹 Render order card (Updated for new styles)
  const renderOrder = ({ item }) => {

    const userName =
      item.address?.fullName ||
      usersMap[item.userId]?.name ||
      usersMap[item.userId]?.fullName ||
      "Customer";

    const userPhone =
      item.address?.phone ||
      usersMap[item.userId]?.phone ||
      usersMap[item.userId]?.mobileNumber ||
      null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (orderType !== "boxDelivery") {
            navigation.navigate("AdminOrderDetails", {
              order: item,
              orderType: orderType,
            });
          }
        }}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.avatar}>
                <Ionicons name={getOrderIcon()} size={18} color="#fff" />
              </View>

              <View>
                <Text style={styles.orderId}>
                  #{item.id.substring(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.orderSub}>
                  {orderType === "orders"
                    ? "Product Order"
                    : orderType === "boxDelivery"
                      ? "Box Delivery"
                      : orderType === "chickenFishOrders"
                        ? "Chicken/Fish Order"
                        : orderType === "constructionOrders"
                          ? "Construction Order"
                          : "Order"}
                </Text>
              </View>
            </View>


          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>

          {/* ===== USER CARD ===== */}
          <View style={styles.userCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userPhone}>{userPhone || "No phone"}</Text>
            </View>

            {userPhone && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => callUser(userPhone)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: "#25D366" }]}
                  onPress={() => whatsappUser(userPhone)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ===== PRICE SECTION ===== */}
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Value</Text>
            <Text style={styles.totalValue}>
              ₹{item.total || item.fare || "N/A"}
            </Text>
          </View>


          {/* ===== LOCATION ===== */}
          {orderType === "boxDelivery" && (
            <View style={styles.routeBox}>

              <Text style={[styles.routeText, { fontWeight: "700" }]}>
                📍 Pickup Location
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[styles.routeSubText, { flex: 1 }]} numberOfLines={2}>
                  {item.pickup || "No pickup location"}
                </Text>

                <TouchableOpacity onPress={() => goToPickup(item.pickup)}>
                  <Ionicons name="navigate" size={22} color="#007AFF" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.routeText, { marginTop: 8, fontWeight: "700" }]}>
                🏁 Drop Location
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[styles.routeSubText, { flex: 1 }]} numberOfLines={2}>
                  {item.destination || "No destination"}
                </Text>

                <TouchableOpacity
                  onPress={() => goToDrop(item.pickup, item.destination)}
                >
                  <Ionicons name="navigate-circle" size={22} color="green" />
                </TouchableOpacity>
              </View>

            </View>
          )}

          <Text style={styles.dateText}>
            🕒 {item.createdAt?.toDate?.().toLocaleString() || "No date"}
          </Text>

          {/* ===== ACTION FOOTER ===== */}
          <View style={styles.cardFooter}>
            <View style={styles.dropdownContainerStatus}>
              <Dropdown
                style={styles.dropdown}
                data={statusData}
                labelField="label"
                valueField="value"
                value={item.status}
                placeholder="Change Status"
                onChange={(selected) =>
                  handleStatusChange(item.id, selected.value)
                }
              />
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <LinearGradient
                colors={["#FF5252", "#D91E1E"]}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.BACKGROUND_COLOR} />
      {/* Assuming Header handles back button/title and is already styled */}
      <Header navigation={navigation}
        title={`Manage ${orderType === "orders"
          ? "Orders"
          : orderType === "boxDelivery"
            ? "Deliveries"
            : orderType === "chickenOrders"
              ? "Chicken/Fish Orders"
              : orderType === "constructionOrders"
                ? "Construction Orders"
                : "Orders"
          }`}
      />

      {/* CONTROLS AREA (Using a separate elevated view) */}
      <View style={styles.controlsAreaWrapper}>
        <View style={styles.controlsContainer}>
          {/* Order Type Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Viewing:</Text>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
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
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.TEXT_COLOR_LIGHT} />
            <TextInput
              placeholder="Search by UTR or User ID..."
              placeholderTextColor={colors.TEXT_COLOR_LIGHT}
              style={styles.searchInput}
              value={searchUTR}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>

      {/* 🔹 Content */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.PRIMARY_COLOR} style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.noOrdersContainer}>
          <Ionicons name="folder-open-outline" size={60} color={colors.TEXT_COLOR_LIGHT} />
          <Text style={styles.noOrders}>No {orderType} found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
};

export default UpdateOrders;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.BACKGROUND_COLOR },
  controlsAreaWrapper: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: colors.BACKGROUND_COLOR
  },
  controlsContainer: {
    backgroundColor: colors.CARD_BG,
    borderRadius: 15,
    padding: 15,
    shadowColor: colors.PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 10,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.TEXT_COLOR_DARK,
    marginRight: 10,
  },
  dropdownWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    backgroundColor: colors.BACKGROUND_COLOR,
    paddingHorizontal: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.BACKGROUND_COLOR,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: colors.TEXT_COLOR_DARK,
    paddingVertical: 0
  },
  flatListContent: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 100
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    backgroundColor: colors.CARD_BG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    borderLeftWidth: 0
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.TEXT_COLOR_DARK,
    marginLeft: 8
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "700",
    color: colors.CARD_BG,
    minWidth: 90,
    textAlign: 'center',
    overflow: 'hidden',
  },
  contentSection: {
    marginBottom: 18
  },
  totalFareBox: {
    backgroundColor: colors.BACKGROUND_COLOR,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: colors.TEXT_COLOR_DARK,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ACCENT_COLOR,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.TEXT_COLOR_LIGHT,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailValue: {
    fontSize: 14,
    color: colors.TEXT_COLOR_DARK,
    fontWeight: '600',
  },
  utrText: {
    fontSize: 14,
    color: colors.PRIMARY_COLOR,
    fontWeight: "600",
  },
  addressSection: {
    paddingTop: 15,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F7F7F7'
  },
  addressHeader: {
    fontSize: 14,
    color: colors.PRIMARY_COLOR,
    fontWeight: '700',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: {
    fontSize: 14,
    color: colors.TEXT_COLOR_LIGHT,
    marginLeft: 22,
    marginBottom: 10,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.TEXT_COLOR_DARK,
  },
  locationText: {
    fontSize: 13,
    color: colors.TEXT_COLOR_LIGHT,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: colors.BACKGROUND_COLOR,
    marginRight: 10,
    paddingHorizontal: 8,
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noOrders: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
    color: colors.TEXT_COLOR_LIGHT,
    fontWeight: '600',
  },
  dropdownContainerStatus: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: colors.BACKGROUND_COLOR,
    marginRight: 10,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  dropdown: {
    height: 45,
  },
  placeholderStyle: {
    fontSize: 14,
    color: colors.TEXT_COLOR_LIGHT,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: colors.TEXT_COLOR_DARK,
    fontWeight: "600",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  orderSub: {
    fontSize: 12,
    color: colors.TEXT_COLOR_LIGHT,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginVertical: 10
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.TEXT_COLOR_DARK,
  },
  userPhone: {
    fontSize: 13,
    color: colors.TEXT_COLOR_LIGHT,
  },
  iconBtn: {
    backgroundColor: colors.PRIMARY_COLOR,
    padding: 10,
    borderRadius: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeBox: {
    backgroundColor: "#F4F7FF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 13,
    color: colors.TEXT_COLOR_DARK,
  },
  routeSubText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  dateText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});