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
 GET PUSH TOKEN
********************************************/
async function registerDriverForPushTokenAsync() {
  if (Constants.appOwnership === "expo") {
    console.log("🚫 Expo Go detected — token NOT allowed.");
    return null;
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== "granted") return null;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })
  ).data;

  if (!token || token.startsWith("ExpoGo")) return null;

  console.log("Driver Push Token:", token);
  return token;
}

const DriverScreen = () => {
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState("waiting");
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [waitingBoxBookings, setWaitingBoxBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  /********************************************
   SAVE DRIVER PUSH TOKEN
  ********************************************/
  const saveDriverToken = async () => {
    try {
      const token = await registerDriverForPushTokenAsync();
      if (!token || !user) return;

      await updateDoc(doc(db, "users", user.uid), {
        fcmToken: token,
        updatedAt: new Date(),
      });

      console.log("Driver Token Saved:", token);
    } catch (err) {
      console.log("Token save error:", err);
    }
  };

  useEffect(() => {
    if (user) saveDriverToken();
  }, [user]);

  /********************************************
   LOGOUT FEATURE
  ********************************************/
  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("Driver logged out");
    } catch (err) {
      Alert.alert("Error", "Failed to logout.");
    }
  };

  /********************************************
   NOTIFICATION LISTENERS
********************************************/
  useEffect(() => {
    // Foreground Notification
    const receiveSub = Notifications.addNotificationReceivedListener(() => {
      setActiveTab("waiting");
    });

    // Tap Notification
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.bookingId) {
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
   CANCEL BOOKING (Working everywhere incl. waiting)
********************************************/
  const handleCancelBooking = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, col, item.id);

      await updateDoc(ref, {
        status: "canceled",
        driverId: user.uid, // remain assigned
        canceledBy: "driver",
        updatedAt: new Date(),
      });

      Alert.alert("Cancelled", "Ride moved to Cancel tab.");
    } catch (err) {
      console.log("Cancel error:", err);
    }
  };

  /********************************************
   TAB UI CALCULATIONS
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
   CARD UI
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

      {/* ACTION BUTTONS */}
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
   LOADING
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

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="log-out-outline" size={22} color="red" />
          <Text style={{ color: "red", fontSize: 16, fontWeight: "700", marginLeft: 5 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={getDisplayedData()}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>No bookings found</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

export default DriverScreen;
