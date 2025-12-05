// DriverScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
 🔔 NOTIFICATION HANDLER
********************************************/
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/********************************************
 ✅ GET DRIVER PUSH TOKEN (APK ONLY)
********************************************/
async function generateDriverPushToken() {
  try {
    let permission = await Notifications.getPermissionsAsync();

    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (permission.status !== "granted") return null;

    // ❗ MUST include projectId for EAS build
    const tokenObj = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });

    const token = tokenObj.data;

    console.log("Generated Push Token:", token);

    // Reject invalid Expo Go tokens
    if (!token.startsWith("ExponentPushToken")) return null;

    return token;
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
   🔥 SAVE TOKEN FOR DRIVER
********************************************/
  const saveDriverToken = async () => {
    if (!user) return;

    // Do NOT save if running inside Expo Go
    if (Constants.appOwnership === "expo") return;

    const token = await generateDriverPushToken();
    if (!token) return;

    await updateDoc(doc(db, "users", user.uid), {
      fcmToken: token,
      updatedAt: new Date(),
    });

    console.log("Driver token saved:", token);
  };

  useEffect(() => {
    if (user) saveDriverToken();
  }, [user]);

  /********************************************
   LOGOUT HANDLER
********************************************/
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      Alert.alert("Error", "Failed to logout.");
    }
  };

  /********************************************
   🔔 NOTIFICATION LISTENERS (OPEN WAITING TAB)
********************************************/
  useEffect(() => {
    // Foreground receive
    const receiveSub = Notifications.addNotificationReceivedListener(() => {
      setActiveTab("waiting");
    });

    // Tapped notification
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("📨 Notification tapped:", response);
        setActiveTab("waiting");
      }
    );

    return () => {
      receiveSub.remove();
      tapSub.remove();
    };
  }, []);

  /********************************************
   🔥 FETCH BOOKINGS (Realtime Listener)
********************************************/
  useEffect(() => {
    if (!user) return;

    // Ride bookings
    const waitQuery = query(
      collection(db, "bookings"),
      where("status", "==", "waiting")
    );

    const unsubWait = onSnapshot(waitQuery, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const b = d.data();
          const userSnap = await getDoc(doc(db, "users", b.userId));
          return {
            id: d.id,
            type: "ride",
            ...b,
            customerName: userSnap.data()?.fullName,
            customerPhone: userSnap.data()?.phone,
          };
        })
      );
      setWaitingBookings(list);
    });

    // Box Delivery Bookings
    const waitBoxQuery = query(
      collection(db, "boxDelivery"),
      where("status", "==", "waiting")
    );

    const unsubWaitBox = onSnapshot(waitBoxQuery, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const b = d.data();
          const userSnap = await getDoc(doc(db, "users", b.userId));
          return {
            id: d.id,
            type: "box",
            ...b,
            customerName: userSnap.data()?.fullName,
            customerPhone: userSnap.data()?.phone,
          };
        })
      );
      setWaitingBoxBookings(list);
    });

    // Driver own bookings
    const myQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", user.uid)
    );

    const unsubMy = onSnapshot(myQuery, (snap) => {
      setMyBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
  const acceptBooking = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, col, item.id);

      const snap = await getDoc(ref);
      const current = snap.data();

      // Someone accepted already
      if (current.status !== "waiting") {
        return Alert.alert("Already Accepted", "Another driver accepted this.");
      }

      const driverSnap = await getDoc(doc(db, "users", user.uid));

      await updateDoc(ref, {
        status: "accepted",
        driverId: user.uid,
        driverName: driverSnap.data()?.fullName,
        driverPhone: driverSnap.data()?.phone,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Booking Accepted!");
    } catch (err) {
      console.log("Accept error:", err);
    }
  };

  /********************************************
   CANCEL BOOKING
********************************************/
  const cancelBooking = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      await updateDoc(doc(db, col, item.id), {
        status: "canceled",
        driverId: user.uid,
        canceledBy: "driver",
        updatedAt: new Date(),
      });

      Alert.alert("Cancelled", "Booking moved to Cancelled tab.");
    } catch (err) {
      console.log("Cancel error:", err);
    }
  };

  /********************************************
   DEFINE TABS
********************************************/
  const waitingList = [...waitingBookings, ...waitingBoxBookings];
  const cancelList = myBookings.filter((b) => b.status === "canceled");
  const historyList = myBookings.filter((b) =>
    ["accepted", "completed"].includes(b.status)
  );

  const getList = () => {
    if (activeTab === "waiting") return waitingList;
    if (activeTab === "cancel") return cancelList;
    if (activeTab === "history") return historyList;
    return [];
  };

  /********************************************
   BOOKING CARD
********************************************/
  const BookingCard = ({ item }) => (
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
            onPress={() => acceptBooking(item)}
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
            onPress={() => cancelBooking(item)}
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

      {/* TABS */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 10,
          backgroundColor: "#eee",
        }}
      >
        <TouchableOpacity onPress={() => setActiveTab("waiting")}>
          <Text style={{ fontWeight: activeTab === "waiting" ? "800" : "500" }}>
            Waiting ({waitingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("cancel")}>
          <Text style={{ fontWeight: activeTab === "cancel" ? "800" : "500" }}>
            Cancelled ({cancelList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("history")}>
          <Text style={{ fontWeight: activeTab === "history" ? "800" : "500" }}>
            History ({historyList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* BOOKINGS LIST */}
      <FlatList
        data={getList()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard item={item} />}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No bookings available
          </Text>
        }
      />
    </View>
  );
};

export default DriverScreen;
