import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const BikeTaxiWaiting = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "bookings", bookingId), (snap) => {
      const data = snap.data();
      if (!data) return;
      // Update local state
      setDriverInfo(data);
    });

    return () => unsub();
  }, [bookingId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#007BFF" size="large" />

      {driverInfo?.status === "accepted" && driverInfo?.driverId ? (
        <>
          <Text style={styles.text}>Driver accepted the ride — they will reach shortly.</Text>
          <Text style={[styles.subText, { marginTop: 10 }]}>Driver: {driverInfo.driverName}</Text>
          <Text style={styles.subText}>Phone: {driverInfo.driverPhone}</Text>
          <Text style={styles.subText}>Vehicle: {driverInfo.driverVehicle || 'N/A'}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('BikeTaxiTracking', { bookingId, driverInfo })}
            style={{ marginTop: 16, padding: 12, backgroundColor: '#007BFF', borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Track Driver</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.text}>Waiting for a driver to accept...</Text>

          {driverInfo?.assignedDriver && (
            <Text style={styles.subText}>
              Driver {driverInfo.assignedDriver} is reviewing your request...
            </Text>
          )}
        </>
      )}
    </View>
  );
};

export default BikeTaxiWaiting;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { marginTop: 20, fontSize: 18, fontWeight: "600" },
  subText: { marginTop: 10, fontSize: 14, color: "#666" }
});
