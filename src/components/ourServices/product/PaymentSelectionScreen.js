import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Header from "../../header/Header";
import { notifyDrivers } from "../../utils/notifyDrivers";

const PaymentSelectionScreen = ({ navigation, route }) => {
  const { total, selectedAddress: routeSelectedAddress } = route?.params || {};
  const [addresses, setAddresses] = useState([]);
  const [upis, setUpis] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedUPI, setSelectedUPI] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch user's saved addresses
  const fetchAddresses = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "addresses"),
        where("userId", "==", user.uid),
      );

      const querySnapshot = await getDocs(q);
      const addressList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(addressList);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // 🔹 Fetch user's UPI IDs
  const fetchUpis = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const q = await getDocs(collection(db, "upi_ids"));
      const list = q.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((doc) => doc.userId === user.uid);
      setUpis(list);
    } catch (err) {
      console.log("fetchUpis err", err);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchUpis();
  }, []);

  // 🔹 Open UPI payment app
  const handleContinue = async (row) => {
    const PAYEE_NAME = "Product";
    const upiUrl = `upi://pay?pa=${row.upi}&pn=${PAYEE_NAME}&tn=OrderPayment&am=${total}&cu=INR`;

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);

        Alert.alert(
          "Payment Initiated ✅",
          "After completing payment, please enter your UTR number below.",
        );
        setPaymentDone(true);
      } else {
        Alert.alert(
          "UPI App Not Found",
          "No UPI app found on your device. Please install Google Pay, PhonePe, or PayTM to proceed.",
        );
      }
    } catch (error) {
      console.error("UPI payment error:", error);
      Alert.alert(
        "Payment Failed ❌",
        "Unable to initiate payment. Try again.",
      );
    }
  };

  const payNow = () => {
    if (selectedUPI) {
      handleContinue(selectedUPI);
    } else {
      Alert.alert("Select a UPI ID to proceed");
    }
  };

  // 🔥 UPDATED Confirm ORDER function
  const handleConfirmOrder = async () => {
    if (paymentMethod === "Online Payment" && !utrNumber.trim()) {
      Alert.alert(
        "Missing UTR",
        "Please enter your UTR number before confirming.",
      );
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "User not logged in.");
        setLoading(false);
        return;
      }

      // 🚨 Duplicate UTR Check
      if (paymentMethod === "Online Payment") {
        const utrLower = utrNumber.trim().toLowerCase();
        const q = query(
          collection(db, "orders"),
          where("utrNumberLower", "==", utrLower),
        );
        const utrSnap = await getDocs(q);

        if (!utrSnap.empty) {
          setLoading(false);
          Alert.alert(
            "Duplicate UTR ❌",
            "This UTR number has already been used. Enter a valid UTR.",
          );
          return;
        }
      }

      // 📝 Prepare order object
      const newOrder = {
        userId: user.uid,
        total: Number(total),
        paymentMethod,
        utrNumber: paymentMethod === "Online Payment" ? utrNumber.trim() : null,
        utrNumberLower:
          paymentMethod === "Online Payment"
            ? utrNumber.trim().toLowerCase()
            : null,
        address: routeSelectedAddress
          ? routeSelectedAddress
          : addresses.length > 0
            ? addresses[0]
            : null,
        upi: selectedUPI?.upi || null,
        status:
          paymentMethod === "Online Payment"
            ? "Pending Verification"
            : "COD - Pending Dispatch",
        createdAt: new Date(),
      };

      // 💾 Save Order
      const newOrderRef = await addDoc(collection(db, "orders"), newOrder);

      // 📢 SEND DRIVER NOTIFICATION
      await notifyDrivers(newOrderRef.id, newOrder);

      setLoading(false);

      Alert.alert(
        "Order Placed 🎉",
        `Your order has been placed successfully!\nUTR: ${utrNumber || "N/A"}`,
        [{ text: "OK", onPress: () => navigation.navigate("OuerServices") }],
      );

      // reset
      setUtrNumber("");
      setPaymentDone(false);
      setPaymentMethod("");
    } catch (err) {
      console.error("Order Save Error:", err);
      setLoading(false);
      Alert.alert("Error", "Failed to save order. Try again.");
    }
  };

  const currentAddress = routeSelectedAddress
    ? routeSelectedAddress
    : addresses.length > 0
      ? addresses[0]
      : null;

  return (
    <View style={styles.safeArea}>
      <Header navigation={navigation} title="Payment Options" />
      <ScrollView style={styles.mainContainer}>
        {/* --- Address Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {currentAddress ? (
            <>
              <Text style={styles.deliveryTitle}>
                Delivering to {currentAddress.fullName}
              </Text>
              <Text style={styles.deliveryAddress}>
                {`${currentAddress.address}, ${currentAddress.city}, ${currentAddress.state}, ${currentAddress.pinCode}`}
              </Text>
            </>
          ) : (
            <Text>No address found</Text>
          )}
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => navigation.navigate("AddressSelection", { total })}
          >
            <Text style={styles.changeButtonText}>Change delivery address</Text>
          </TouchableOpacity>
        </View>

        {/* --- Payment Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "Cash on Delivery" && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod("Cash on Delivery")}
          >
            <Text style={styles.paymentText}>💵 Cash on Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "Online Payment" && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod("Online Payment")}
          >
            <Text style={styles.paymentText}>💳 Pay Online</Text>
          </TouchableOpacity>
        </View>

        {/* --- UPI Section --- */}
        {paymentMethod === "Online Payment" && (
          <>
            <Text style={styles.selectUPILabel}>Select UPI ID:</Text>
            {upis.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => setSelectedUPI(item)}
                style={[
                  styles.upiCard,
                  selectedUPI?.id === item.id && styles.selectedPayment,
                ]}
              >
                <Text style={styles.upiText}>{item.upi}</Text>
              </Pressable>
            ))}

            {/* ✅ UTR input after payment */}
            {paymentDone && (
              <View style={styles.utrSection}>
                <Text style={styles.utrLabel}>Enter your UTR Number:</Text>
                <TextInput
                  style={styles.utrInput}
                  placeholder="Enter UTR number"
                  value={utrNumber}
                  onChangeText={setUtrNumber}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* --- Bottom Buttons --- */}
      {paymentMethod === "Online Payment" && !paymentDone && (
        <View style={styles.bottomContainer}>
          <Text style={styles.totalText}>Total: ₹{total}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={payNow}>
            <Text style={styles.confirmButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentDone && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmOrder}
            disabled={loading}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? "Saving Order..." : "Submit UTR & Confirm Order"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {paymentMethod === "Cash on Delivery" && (
        <View style={styles.bottomContainer}>
          <Text style={styles.totalText}>Total: ₹{total}</Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmOrder}
          >
            <Text style={styles.confirmButtonText}>CONFIRM ORDER</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PaymentSelectionScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 10,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  deliveryAddress: {
    fontSize: 15,
    color: "#555",
    marginVertical: 6,
  },
  changeButton: {
    paddingVertical: 8,
  },
  changeButtonText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "500",
  },
  paymentOption: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 10,
  },
  selectedPayment: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF3FF",
  },
  upiCard: {
    borderWidth: 1,
    borderColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  upiText: {
    fontSize: 16,
    color: "#333",
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 15,
    backgroundColor: "#fff",
    bottom: 30,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectUPILabel: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 5,
  },
  utrSection: {
    marginTop: 15,
  },
  utrLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  utrInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
});
