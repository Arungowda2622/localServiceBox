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
import { addDoc, collection, serverTimestamp, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getAuth } from 'firebase/auth'; // ✅ import auth to get current user

const PRIMARY_COLOR = '#007BFF';
const TEXT_COLOR = '#333';
const SUB_TEXT_COLOR = '#666';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#EA4335';

const DeliveryPayment = ({ route, navigation }) => {
  const { pickupLocation, destinationLocation, routeInfo } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

 // ✔ Your file stays SAME except improved notifyDrivers()

const notifyDrivers = async (bookingId, bookingData) => {
  try {
    const driversSnapshot = await getDocs(collection(db, "users"));
    let driverTokens = [];

    driversSnapshot.forEach((d) => {
      const data = d.data();
      if (data.role === "driver" && data.fcmToken) {
        if (!data.fcmToken.startsWith("ExpoGo")) {
          driverTokens.push(data.fcmToken);
        }
      }
    });

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
            title: "🚕 New Ride Request",
            body: "A new customer needs a ride!",
            data: {
              bookingId,
            },
          }),
        })
      )
    );
  } catch (err) {
    console.log("Notification error:", err);
  }
};


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
        Alert.alert("Error", "You must be logged in to confirm a delivery.");
        setIsProcessing(false);
        return;
      }

      // ✅ Delivery Object SAME STRUCTURE AS NORMAL BOOKINGS
      const deliveryData = {
        userId: user.uid,
        userEmail: user.email,

        // SAME FIELD NAMES AS bookingData
        pickup: pickupLocation?.address || "",
        pickupName: pickupLocation?.name || "",
        destination: destinationLocation?.address || "",
        destinationName: destinationLocation?.name || "",

        distance: routeInfo?.distance || 0,
        duration: routeInfo?.formattedDuration || "",
        fare: routeInfo?.fare || 0,

        paymentMethod: "Cash",
        paymentStatus: "Pending",

        // MUST MATCH booking structure
        status: "waiting",
        driverId: null,
        driverName: null,
        driverPhone: null,
        assignedDriver: null,
        driverRequestSent: true,

        type: "boxDelivery", // 👈 helps identify type in driver panel

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to boxDelivery collection
      const docRef = await addDoc(collection(db, "boxDelivery"), deliveryData);

      // Optional: Notify drivers (same as ride)
      await notifyDrivers(docRef.id, deliveryData);

      setIsProcessing(false);

      Alert.alert("Success", "Your delivery booking has been created!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Home"),
        },
      ]);
    } catch (error) {
      console.error("Delivery error:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to create delivery. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Delivery Summary</Text>

        {/* Pickup & Destination */}
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

        {/* Distance & Fare */}
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

        {/* Payment Options */}
        <View style={styles.paymentContainer}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentOption} activeOpacity={0.8}>
            <Ionicons name="cash-outline" size={22} color={PRIMARY_COLOR} />
            <Text style={styles.paymentText}>Pay on Delivery (Cash)</Text>
            <Ionicons name="checkmark-circle" size={22} color={SUCCESS_COLOR} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, styles.disabledOption]}
            activeOpacity={0.7}
          >
            <Ionicons name="card-outline" size={22} color={'#999'} />
            <Text style={[styles.paymentText, { color: '#999' }]}>
              Online Payment (Coming Soon)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
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
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DeliveryPayment;

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginBottom: 15,
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  textContainer: { flex: 1, marginLeft: 10 },
  label: {
    fontSize: 13,
    color: SUB_TEXT_COLOR,
    fontWeight: '500',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: TEXT_COLOR,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 10,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: SUB_TEXT_COLOR,
  },
  infoValue: {
    fontSize: 15,
    color: TEXT_COLOR,
    fontWeight: '600',
  },
  fareText: {
    fontSize: 18,
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  paymentContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_COLOR,
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F7FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  paymentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: TEXT_COLOR,
    fontWeight: '600',
  },
  disabledOption: {
    opacity: 0.6,
  },
  confirmButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});
