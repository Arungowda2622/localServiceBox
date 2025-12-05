import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getAuth } from 'firebase/auth';

const PRIMARY_COLOR = '#007BFF';
const TEXT_COLOR = '#333';
const SUB_TEXT_COLOR = '#666';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#EA4335';

const DeliveryPayment = ({ route, navigation }) => {
  const { pickupLocation, destinationLocation, routeInfo } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

  /**********************************************
   🔔 PUSH NOTIFICATION SENDER (Updated & Correct)
  **********************************************/
  const notifyDrivers = async (bookingId, deliveryData) => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const driverTokens = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.role === "driver" && data.fcmToken) {
          // Accept ONLY real standalone push tokens
          if (data.fcmToken.startsWith("ExponentPushToken")) {
            driverTokens.push(data.fcmToken);
          }
        }
      });

      console.log("Driver Tokens:", driverTokens);

      // Send notifications to all drivers
      await Promise.all(
        driverTokens.map((token) =>
          fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: token,
              sound: "default",
              title: "📦 New Delivery Request",
              body: "A customer needs a box delivery!",
              data: {
                bookingId,
                type: "boxDelivery",
              },
            }),
          })
        )
      );

      console.log("Push notifications sent!");
    } catch (error) {
      console.log("Push error:", error);
    }
  };

  /**********************************************
   🔥 CONFIRM DELIVERY BOOKING
  **********************************************/
  const handleConfirmBooking = async () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert("Error", "Incomplete delivery details.");
      return;
    }

    try {
      setIsProcessing(true);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setIsProcessing(false);
        Alert.alert("Error", "You must be logged in to place a delivery.");
        return;
      }

      // 📦 DELIVERY BOOKING OBJECT
      const deliveryData = {
        userId: user.uid,
        userEmail: user.email,

        pickup: pickupLocation?.address || "",
        pickupName: pickupLocation?.name || "",
        destination: destinationLocation?.address || "",
        destinationName: destinationLocation?.name || "",

        distance: routeInfo?.distance,
        duration: routeInfo?.formattedDuration ?? routeInfo?.duration ?? "0 min",
        fare: routeInfo?.fare,

        paymentMethod: "Cash",
        paymentStatus: "Pending",

        status: "waiting", // important for driver screen
        driverId: null,
        driverName: null,
        driverPhone: null,

        type: "boxDelivery", // 🔥 so driver UI can identify type

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('====================================');
      console.log(deliveryData,"deliveryData");
      console.log('====================================');

      // 📝 SAVE BOOKING
      const docRef = await addDoc(collection(db, "boxDelivery"), deliveryData);

      // 🔔 SEND NOTIFICATION TO DRIVERS
      await notifyDrivers(docRef.id, deliveryData);

      setIsProcessing(false);

      Alert.alert("Success", "Your delivery has been created!", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error) {
      console.log("Delivery error:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to create delivery. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* TITLE */}
        <Text style={styles.title}>Delivery Summary</Text>

        {/* PICKUP / DESTINATION */}
        <View style={styles.locationCard}>
          <View style={styles.locationItem}>
            <Ionicons name="pin" size={20} color={SUCCESS_COLOR} />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Pickup Location</Text>
              <Text style={styles.address}>{pickupLocation?.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationItem}>
            <Ionicons name="location-sharp" size={20} color={ERROR_COLOR} />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Destination</Text>
              <Text style={styles.address}>{destinationLocation?.address}</Text>
            </View>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{routeInfo?.distance} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{routeInfo?.formattedDuration}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.infoLabel}>Estimated Fare</Text>
            <Text style={[styles.infoValue, styles.fareText]}>₹{routeInfo?.fare}</Text>
          </View>
        </View>

        {/* PAYMENT METHODS */}
        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity style={styles.paymentOption}>
            <Ionicons name="cash-outline" size={22} color={PRIMARY_COLOR} />
            <Text style={styles.paymentText}>Pay on Delivery (Cash)</Text>
            <Ionicons name="checkmark-circle" size={22} color={SUCCESS_COLOR} />
          </TouchableOpacity>
        </View>

        {/* CONFIRM BUTTON */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
              <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DeliveryPayment;

/******************
 STYLES
******************/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: TEXT_COLOR, marginBottom: 15 },
  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  locationItem: { flexDirection: "row", marginBottom: 10 },
  textContainer: { flex: 1, marginLeft: 10 },
  label: { fontSize: 13, color: SUB_TEXT_COLOR },
  address: { fontSize: 14, color: TEXT_COLOR, fontWeight: "600" },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 10,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  infoLabel: { fontSize: 14, color: SUB_TEXT_COLOR },
  infoValue: { fontSize: 15, color: TEXT_COLOR, fontWeight: "600" },
  fareText: { fontSize: 18, color: PRIMARY_COLOR },
  paymentContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    marginBottom: 30,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  paymentText: { flex: 1, marginLeft: 10, fontSize: 15, color: TEXT_COLOR },
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  confirmButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16, marginLeft: 8 },
});