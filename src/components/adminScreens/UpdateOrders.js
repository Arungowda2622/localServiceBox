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
import RNPickerSelect from "react-native-picker-select";
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
import Header from "../header/Header"; // Assuming this is a custom header component
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// --- Design System V2 ---
const PRIMARY_COLOR = "#3A86FF"; // Vibrant Blue (More modern)
const PRIMARY_GRADIENT = ["#3A86FF", "#00B4D8"]; // Blue gradient for depth
const ACCENT_COLOR = "#FFC300"; // Gold/Yellow for key values
const BACKGROUND_COLOR = "#F4F7FC"; // Very light, airy background
const CARD_BG = "#FFFFFF";
const TEXT_COLOR_DARK = "#1C1C1E"; // Near-black for contrast
const TEXT_COLOR_LIGHT = "#6C757D"; // Muted grey for details

const getStatusColor = (status) => {
  switch (status) {
    case "Delivered":
      return "#38A169"; // Success Green
    case "Confirmed":
    case "Dispatched":
      return PRIMARY_COLOR; // Primary Blue
    case "Cancelled":
      return "#E53E3E"; // Alert Red
    case "Pending":
    default:
      return ACCENT_COLOR; // Accent Yellow
  }
};
// --- End Design System V2 ---

const UpdateOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUTR, setSearchUTR] = useState("");
  const [orderType, setOrderType] = useState("orders"); // "orders" | "rides" | "boxDelivery"

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
      case "rides":
        return "bicycle-outline"; // Changed to bicycle for better fit
      case "boxDelivery":
        return "cube-outline";
      default:
        return "document-text-outline";
    }
  };

  // 🔹 Render order card (Updated for new styles)
  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      {/* HEADER ROW (ID + STATUS) */}
      <View style={styles.cardHeader}>
        <View style={styles.orderTitleContainer}>
            <Ionicons name={getOrderIcon()} size={22} color={PRIMARY_COLOR} />
            <Text style={styles.orderId}>
                {orderType === "orders" ? "Order" : orderType === "rides" ? "Ride" : "Delivery"} #{item.id.substring(0, 8).toUpperCase()}
            </Text>
        </View>
        <Text
          style={[
            styles.statusPill,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.contentSection}>
        {/* Total/Fare (Elevated) */}
        <View style={styles.totalFareBox}>
            <Text style={styles.totalLabel}>
              <Ionicons name="cash-outline" size={18} color={TEXT_COLOR_DARK} /> Total Value
            </Text>
            <Text style={styles.totalValue}>
              ₹{item.total || item.fare || "N/A"}
            </Text>
        </View>

        {/* User ID */}
        {item.userId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              <Ionicons name="person-outline" size={16} color={TEXT_COLOR_LIGHT} /> User ID
            </Text>
            <Text style={styles.detailValue}>
              {item.userId.substring(0, 10)}...
            </Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            <Ionicons name="calendar-outline" size={16} color={TEXT_COLOR_LIGHT} /> Date/Time
          </Text>
          <Text style={styles.detailValue}>
            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString() : new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        
        {/* UTR Number */}
        {item.utrNumber && (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                    <Ionicons name="wallet-outline" size={16} color={PRIMARY_COLOR} /> UTR Number
                </Text>
                <Text style={styles.utrText}>{item.utrNumber}</Text>
            </View>
        )}

        {/* Dynamic Details based on Type (Location/Address) */}
        <View style={styles.addressSection}>
          {/* Product Order Address */}
          {(orderType === "orders" && item.address) && (
            <>
              <Text style={styles.addressHeader}>
                <Ionicons name="location-outline" size={16} color={PRIMARY_COLOR} /> Shipping Address:
              </Text>
              <Text style={styles.addressText}>
                {item.address.address}, {item.address.city}
              </Text>
            </>
          )}

          {/* Ride/Delivery Locations */}
          {orderType !== "orders" && (
            <>
              <View style={styles.locationDetail}>
                <Ionicons name="arrow-up-circle-outline" size={16} color="#38A169" />
                <View style={{flex: 1}}>
                    <Text style={styles.locationLabel}>Pickup:</Text>
                    <Text style={styles.locationText}>
                        {(item.pickupName || item.pickup?.address || 'N/A').substring(0, 50)}
                    </Text>
                </View>
              </View>
              
              <View style={styles.locationDetail}>
                <Ionicons name="arrow-down-circle-outline" size={16} color="#E53E3E" />
                <View style={{flex: 1}}>
                    <Text style={styles.locationLabel}>Destination:</Text>
                    <Text style={styles.locationText}>
                        {(item.destinationName || item.destination?.address || 'N/A').substring(0, 50)}
                    </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* FOOTER ROW (ACTION BUTTONS) */}
      <View style={styles.cardFooter}>
        {/* Status Dropdown */}
        <View style={styles.pickerWrapper}>
          <RNPickerSelect
            onValueChange={(value) => handleStatusChange(item.id, value)}
            items={[
              { label: "Pending", value: "Pending" },
              { label: "Confirmed", value: "Confirmed" },
              { label: "Dispatched", value: "Dispatched" },
              { label: "Delivered", value: "Delivered" },
              { label: "Cancelled", value: "Cancelled" },
            ]}
            value={item.status}
            placeholder={{ label: "Change Status...", value: null }}
            style={newPickerSelectStyles}
          />
        </View>

        {/* Delete Button (with Gradient) */}
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
        >
            <LinearGradient
                colors={['#FF5252', '#D91E1E']}
                style={styles.deleteButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_COLOR} />
      {/* Assuming Header handles back button/title and is already styled */}
      <Header navigation={navigation} title={`Manage ${orderType === 'orders' ? 'Orders' : orderType === 'rides' ? 'Rides' : 'Deliveries'}`} />

      {/* CONTROLS AREA (Using a separate elevated view) */}
      <View style={styles.controlsAreaWrapper}>
        <View style={styles.controlsContainer}>
          {/* Order Type Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Viewing:</Text>
            <View style={styles.dropdownWrapper}>
              <RNPickerSelect
                onValueChange={(value) => setOrderType(value)}
                items={[
                  { label: "Product Orders", value: "orders" },
                  { label: "Bike Rides", value: "rides" },
                  { label: "Box Delivery", value: "boxDelivery" },
                ]}
                value={orderType}
                style={newPickerSelectStyles}
                useNativeAndroidPickerStyle={false} // Important for Android styling
              />
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={TEXT_COLOR_LIGHT} />
            <TextInput
              placeholder="Search by UTR or User ID..."
              placeholderTextColor={TEXT_COLOR_LIGHT}
              style={styles.searchInput}
              value={searchUTR}
              onChangeText={handleSearch}
            />
          </View>
        </View>
      </View>

      {/* 🔹 Content */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.noOrdersContainer}>
            <Ionicons name="folder-open-outline" size={60} color="#CFD4DA" />
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

// --- NEW STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  
  // Controls Area
  controlsAreaWrapper: {
    paddingHorizontal: 15, 
    paddingBottom: 10, 
    backgroundColor: BACKGROUND_COLOR, // Keep this separate to define a clear boundary
  },
  controlsContainer: { 
    backgroundColor: CARD_BG, 
    borderRadius: 15, // Rounded container
    padding: 15,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 10,
  },
  
  // Dropdown
  dropdownContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingVertical: 5 },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: TEXT_COLOR_DARK,
    marginRight: 10,
  },
  dropdownWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    backgroundColor: BACKGROUND_COLOR, // Subtle contrast
    paddingHorizontal: 8,
  },
  
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLOR, 
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 10, color: TEXT_COLOR_DARK, paddingVertical: 0 },
  
  // Order Card
  flatListContent: { paddingHorizontal: 15, paddingTop: 5, paddingBottom: 100 },
  card: {
    borderRadius: 20, // More rounded corners
    padding: 20,
    marginBottom: 18,
    backgroundColor: CARD_BG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08, // Increased opacity for a nicer shadow
    shadowRadius: 10,
    elevation: 6,
    borderLeftWidth: 0, // Removed borderLeft for cleaner shadow look
  },
  
  // Card Header (ID + Status)
  cardHeader: { 
    flexDirection: "row", 
    justifyContent: 'space-between',
    alignItems: "center", 
    marginBottom: 15, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F7F7F7', // Lighter separator
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: { fontSize: 16, fontWeight: "700", color: TEXT_COLOR_DARK, marginLeft: 8 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20, // Fully rounded
    fontSize: 13,
    fontWeight: "700",
    color: CARD_BG,
    minWidth: 90,
    textAlign: 'center',
    overflow: 'hidden',
  },
  
  // Content Section
  contentSection: { marginBottom: 18 },
  
  // Total/Fare Box
  totalFareBox: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    color: TEXT_COLOR_DARK,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: ACCENT_COLOR, // Gold accent for money
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: TEXT_COLOR_LIGHT,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailValue: {
    fontSize: 14,
    color: TEXT_COLOR_DARK,
    fontWeight: '600',
  },
  
  // UTR Text (Styled as a detail value)
  utrText: {
    fontSize: 14, 
    color: PRIMARY_COLOR, 
    fontWeight: "600",
  },
  
  // Address/Location Details
  addressSection: { 
    paddingTop: 15, 
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F7F7F7'
  },
  addressHeader: { 
    fontSize: 14, 
    color: PRIMARY_COLOR, 
    fontWeight: '700', 
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addressText: { 
    fontSize: 14, 
    color: TEXT_COLOR_LIGHT, 
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
    color: TEXT_COLOR_DARK,
  },
  locationText: {
    fontSize: 13,
    color: TEXT_COLOR_LIGHT,
  },
  
  // Card Footer (Actions)
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
    backgroundColor: BACKGROUND_COLOR,
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
    // No shadow here, the LinearGradient acts as the background
  },
  deleteButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  
  // No Orders View
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
    color: TEXT_COLOR_LIGHT,
    fontWeight: '600',
  },
});

const newPickerSelectStyles = StyleSheet.create({
  inputIOS: { 
    fontSize: 15, 
    paddingVertical: 10, // Added padding for height
    color: TEXT_COLOR_DARK,
    paddingRight: 30,
  },
  inputAndroid: { 
    fontSize: 15, 
    paddingVertical: 8, // Added padding for height
    color: TEXT_COLOR_DARK,
    paddingRight: 30,
  },
});