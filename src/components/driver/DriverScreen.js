import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { auth, db } from "../firebase/firebaseConfig";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";

const DriverScreen = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // 🔹 Listen for available bookings
    const qPending = query(collection(db, "bookings"), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingBookings(data);
    });

    // 🔹 Listen for this driver's bookings
    const qMy = query(collection(db, "bookings"), where("driverId", "==", user.uid));
    const unsubMy = onSnapshot(qMy, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMyBookings(data);
      setLoading(false);
    });

    return () => {
      unsubPending();
      unsubMy();
    };
  }, [user]);

  // 🔹 Accept Booking
  const handleAccept = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        driverId: user.uid,
        status: "accepted",
      });
      Alert.alert("Booking Accepted ✅");
    } catch (error) {
      console.error("Error accepting booking:", error);
      Alert.alert("Error", "Could not accept booking");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const renderBooking = ({ item }) => (
    <View
      style={{
        padding: 15,
        margin: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 16 }}>
        {item.pickup} → {item.drop}
      </Text>
      <Text>Fare: ₹{item.fare}</Text>
      <Text>Status: {item.status}</Text>

      {item.status === "pending" && (
        <Pressable
          onPress={() => handleAccept(item.id)}
          style={{
            backgroundColor: "#007bff",
            padding: 10,
            marginTop: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Accept Ride</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4", paddingTop: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 }}>
        🚖 Driver Dashboard
      </Text>

      <Text style={{ marginLeft: 10, fontWeight: "600", fontSize: 18 }}>Available Bookings</Text>
      <FlatList
        data={pendingBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginVertical: 10 }}>No available rides</Text>}
      />

      <Text style={{ marginLeft: 10, fontWeight: "600", fontSize: 18, marginTop: 20 }}>My Bookings</Text>
      <FlatList
        data={myBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginVertical: 10 }}>No rides yet</Text>}
      />
    </View>
  );
};

export default DriverScreen;
