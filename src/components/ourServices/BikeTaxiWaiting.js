import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const BikeTaxiWaiting = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "bookings", bookingId), (snap) => {
      const data = snap.data();
      if (!data) return;

      // Driver accepted
      if (data.status === "accepted" && data.driverId) {
        navigation.replace("BikeTaxiTracking", {
          bookingId,
          driverInfo: data
        });
      }

      setDriverInfo(data);
    });

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#007BFF" size="large" />
      <Text style={styles.text}>Waiting for a driver to accept...</Text>

      {driverInfo?.assignedDriver && (
        <Text style={styles.subText}>
          Driver {driverInfo.assignedDriver} is reviewing your request...
        </Text>
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
