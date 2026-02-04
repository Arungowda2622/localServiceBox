import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Animated, Pressable } from 'react-native';
import Header from '../header/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const BikeTaxiTracking = ({ navigation, route }) => {
  const { bookingId } = route.params; // ⭐ Get bookingId from previous screen
  const [booking, setBooking] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    // ⭐ REAL-TIME BOOKING LISTENER
    const unsubscribe = onSnapshot(doc(db, "bookings", bookingId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBooking(data);

        // If driver accepted -> show driver details
        if (data.status === "accepted") {
          setIsWaiting(false);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        }
      }
    });

    return () => unsubscribe();
  }, [bookingId]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isWaiting ? (
          <>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.waitingText}>
              Waiting for driver’s confirmation...
            </Text>
          </>
        ) : (
          <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
            <Ionicons name="checkmark-circle" size={70} color="#4CAF50" style={{ marginBottom: 15 }} />
            <Text style={styles.successTitle}>Ride Confirmed!</Text>

            {/* SHOW DRIVER DETAILS */}
            <Text style={styles.driverLabel}>Driver Name</Text>
            <Text style={styles.driverText}>{booking?.driverName}</Text>

            <Text style={styles.driverLabel}>Driver Phone</Text>
            <Text style={styles.driverText}>{booking?.driverPhone}</Text>

            <Text style={styles.successText}>
              Your driver is on the way and will reach your location soon.
            </Text>

            <Pressable>
              <Text>Done</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default BikeTaxiTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  waitingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
  },
  driverLabel: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  driverText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "700",
    marginBottom: 10,
  },
  successText: {
    marginTop: 20,
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
  },
});
