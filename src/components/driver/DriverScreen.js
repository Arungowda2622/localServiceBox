// DriverScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

/********************************************
 NOTIFICATION HANDLER
********************************************/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/********************************************
 CORRECT EXPO PUSH TOKEN FUNCTION
********************************************/
async function registerDriverForPushTokenAsync() {
  try {
    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (permission.status !== "granted") return null;

    // MUST include projectId for standalone APK
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    console.log("📌 Generated Token:", token);

    // VALID EXPO TOKEN CHECK
    if (token && token.startsWith("ExponentPushToken")) {
      return token;
    }

    return null;
  } catch (err) {
    console.log("Token error:", err);
    return null;
  }
}

const DriverScreen = () => {
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState("waiting");
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [waitingBoxBookings, setWaitingBoxBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  /********************************************
   SAVE DRIVER PUSH TOKEN (FIXED)
********************************************/
  const saveDriverToken = async () => {
    try {
      if (!user) return;

      const token = await registerDriverForPushTokenAsync();
      if (!token) {
        console.log("❌ No valid token generated");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        fcmToken: token,
        updatedAt: new Date(),
      });

      console.log("✅ Token saved to Firestore:", token);
    } catch (err) {
      console.log("Token save error:", err);
    }
  };

  useEffect(() => {
    if (user) saveDriverToken();
  }, [user]);

  /********************************************
   LOGOUT
********************************************/
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      Alert.alert("Error", "Failed to logout.");
    }
  };

  /********************************************
   NOTIFICATION LISTENERS
********************************************/
  useEffect(() => {
    // Receive notification in foreground
    const receiveSub = Notifications.addNotificationReceivedListener((notif) => {
      console.log("📩 Notification received:", notif);
      setActiveTab("waiting");
    });

    // When notification is tapped
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("📲 Notification tapped");
        const data = response.notification.request.content.data;

        if (data?.bookingId) {
          console.log("Opening waiting tab...");
          setActiveTab("waiting");
        }
      }
    );

    return () => {
      receiveSub.remove();
      tapSub.remove();
    };
  }, []);

  /********************************************
   FETCH BOOKINGS
********************************************/
  useEffect(() => {
    if (!user) return;

    const waitQuery = query(
      collection(db, "bookings"),
      where("status", "==", "waiting")
    );

    const unsubWait = onSnapshot(waitQuery, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();
          const ud = await getDoc(doc(db, "users", booking.userId));
          return {
            id: d.id,
            type: "ride",
            ...booking,
            customerName: ud.data()?.fullName,
            customerPhone: ud.data()?.phone,
          };
        })
      );
      setWaitingBookings(data);
    });

    const waitBoxQuery = query(
      collection(db, "boxDelivery"),
      where("status", "==", "waiting")
    );

    const unsubWaitBox = onSnapshot(waitBoxQuery, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();
          const ud = await getDoc(doc(db, "users", booking.userId));
          return {
            id: d.id,
            type: "box",
            ...booking,
            customerName: ud.data()?.fullName,
            customerPhone: ud.data()?.phone,
          };
        })
      );
      setWaitingBoxBookings(data);
    });

    const myQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", user.uid)
    );

    const unsubMy = onSnapshot(myQuery, (snapshot) => {
      setMyBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubWait();
      unsubWaitBox();
      unsubMy();
    };
  }, [user]);

  /********************************************
   ACCEPT BOOKING
********************************************/
  const handleAccept = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, col, item.id);

      const snap = await getDoc(ref);
      const booking = snap.data();

      if (booking.status !== "waiting")
        return Alert.alert("Already accepted by someone else");

      const driver = await getDoc(doc(db, "users", user.uid));

      await updateDoc(ref, {
        status: "accepted",
        driverId: user.uid,
        driverName: driver.data()?.fullName,
        driverPhone: driver.data()?.phone,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Booking accepted!");
    } catch (err) {
      console.log("Accept error:", err);
    }
  };

  /********************************************
   CANCEL BOOKING
********************************************/
  const handleCancelBooking = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, col, item.id);

      await updateDoc(ref, {
        status: "canceled",
        driverId: user.uid,
        canceledBy: "driver",
        updatedAt: new Date(),
      });

      Alert.alert("Cancelled", "Ride moved to Cancel tab.");
    } catch (err) {
      console.log("Cancel error:", err);
    }
  };

  /********************************************
   TAB DATA
********************************************/
  const waitingCount =
    waitingBookings.length + waitingBoxBookings.length;

  const cancelCount = myBookings.filter((b) => b.status === "canceled").length;

  const historyCount = myBookings.filter((b) =>
    ["accepted", "completed"].includes(b.status)
  ).length;

  const getDisplayedData = () => {
    if (activeTab === "waiting")
      return [...waitingBookings, ...waitingBoxBookings];

    if (activeTab === "cancel")
      return myBookings.filter((b) => b.status === "canceled");

    if (activeTab === "history")
      return myBookings.filter((b) =>
        ["accepted", "completed"].includes(b.status)
      );

    return [];
  };

  /********************************************
   BOOKING CARD
********************************************/
  const renderBooking = ({ item }) => (
    <View
      style={{
        backgroundColor: "#fff",
        margin: 15,
        padding: 15,
        borderRadius: 12,
        elevation: 2,
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 16 }}>
        {item.type === "box" ? "📦 Box Delivery" : "🚕 Ride Booking"}
      </Text>

      <Text>Customer: {item.customerName}</Text>
      <Text>Phone: {item.customerPhone}</Text>

      {activeTab === "waiting" && (
        <>
          <TouchableOpacity
            onPress={() => handleAccept(item)}
            style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: "#007bff",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
              Accept Booking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleCancelBooking(item)}
            style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: "#ff3b30",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
              Cancel Booking
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  /********************************************
   LOADING SCREEN
********************************************/
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );

  /********************************************
   MAIN UI
********************************************/
  return (
    <View style={{ flex: 1, paddingTop: 45 }}>
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800" }}>🚖 Driver Panel</Text>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="red" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={getDisplayedData()}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No bookings found
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

export default DriverScreen;
