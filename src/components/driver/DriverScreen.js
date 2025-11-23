import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
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

/* -------------------------------------------------- */
/* 🟢 REQUIRED: Notification Handler                   */
/* -------------------------------------------------- */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/* -------------------------------------------------- */
/* 🔥 Get Expo Push Token                             */
/* -------------------------------------------------- */
async function registerDriverForPushTokenAsync() {
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== "granted") return null;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })
  ).data;

  return token;
}

const DriverScreen = () => {
  const [activeTab, setActiveTab] = useState("waiting");
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [waitingBoxBookings, setWaitingBoxBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  /* -------------------------------------------------- */
  /* 🔥 Save driver push token                          */
  /* -------------------------------------------------- */
  const saveDriverToken = async () => {
    if (!user) return;

    try {
      const token = await registerDriverForPushTokenAsync();
      if (!token) return;

      await updateDoc(doc(db, "users", user.uid), {
        fcmToken: token,
        updatedAt: new Date(),
      });

      console.log("Driver Token Saved:", token);
    } catch (e) {
      console.log("Error saving driver token:", e);
    }
  };

  /* -------------------------------------------------- */
  /* 🔄 RUN ON MOUNT                                    */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    saveDriverToken();

    const sub = Notifications.addPushTokenListener((newToken) => {
      updateDoc(doc(db, "users", user.uid), {
        fcmToken: newToken.data,
        updatedAt: new Date(),
      });
      console.log("Driver Token Updated:", newToken.data);
    });

    return () => sub.remove();
  }, [user]);

  /* -------------------------------------------------- */
  /* 🔥 Fetch Bookings WITH User Info                   */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    /* ---------------- Ride Bookings ---------------- */
    const qWaiting = query(
      collection(db, "bookings"),
      where("status", "==", "waiting")
    );

    const unsubWaiting = onSnapshot(qWaiting, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();

          // Fetch user info
          const userRef = doc(db, "users", booking.userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            id: d.id,
            type: "ride",
            ...booking,
            customerName: userData.fullName || "Unknown User",
            customerPhone: userData.phone || "N/A",
          };
        })
      );
      setWaitingBookings(data);
    });

    /* ---------------- Box Deliveries ---------------- */
    const qBoxWaiting = query(
      collection(db, "boxDelivery"),
      where("status", "==", "waiting")
    );

    const unsubBoxWaiting = onSnapshot(qBoxWaiting, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();

          // Fetch user info
          const userRef = doc(db, "users", booking.userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            id: d.id,
            type: "box",
            ...booking,
            customerName: userData.fullName || "Unknown User",
            customerPhone: userData.phone || "N/A",
          };
        })
      );
      setWaitingBoxBookings(data);
    });

    /* ---------------- Accepted Rides ---------------- */
    const qMy = query(
      collection(db, "bookings"),
      where("driverId", "==", user.uid)
    );

    const unsubMy = onSnapshot(qMy, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        type: "ride",
        ...d.data(),
      }));
      setMyBookings(data);
      setLoading(false);
    });

    return () => {
      unsubWaiting();
      unsubBoxWaiting();
      unsubMy();
    };
  }, [user]);

  /* -------------------------------------------------- */
  /* 🟢 Merge waiting lists                             */
  /* -------------------------------------------------- */
  const mergedWaiting = [...waitingBookings, ...waitingBoxBookings];

  /* -------------------------------------------------- */
  /* 🟨 Accept Booking                                  */
  /* -------------------------------------------------- */
  const handleAccept = async (item) => {
    try {
      const colName = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, colName, item.id);

      const snap = await getDoc(ref);
      if (!snap.exists()) return Alert.alert("Error", "Booking no longer exists.");

      const booking = snap.data();
      if (booking.status !== "waiting" || booking.driverId)
        return Alert.alert("Too Late", "Another driver accepted this.");

      const driverSnap = await getDoc(doc(db, "users", user.uid));
      const driver = driverSnap.data();

      await updateDoc(ref, {
        status: "accepted",
        driverId: user.uid,
        driverName: driver.fullName,
        driverPhone: driver.phone,
        assignedDriver: driver.fullName,
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Booking accepted!");
    } catch (err) {
      console.log("Accept Error:", err);
      Alert.alert("Error", "Could not accept this booking.");
    }
  };

  /* -------------------------------------------------- */
  /* LOGOUT                                             */
  /* -------------------------------------------------- */
  const handleLogout = () =>
    auth
      .signOut()
      .then(() => Alert.alert("Logged out", "You have been logged out."))
      .catch((err) => Alert.alert("Error", err.message));

  /* -------------------------------------------------- */
  /* Render Booking Card                                */
  /* -------------------------------------------------- */
  const renderBooking = ({ item }) => (
    <View
      style={{
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 8,
        backgroundColor: "#fff",
        borderRadius: 12,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700" }}>
        {item.type === "box" ? "📦 Box Delivery" : "🚕 Ride Booking"}
      </Text>

      {/* Customer Info */}
      <Text style={{ marginTop: 6, fontSize: 15, fontWeight: "600" }}>
        👤 {item.customerName}
      </Text>

      <Text style={{ marginTop: 3, fontSize: 14 }}>
        📞 {item.customerPhone}
      </Text>

      {/* Pickup / Drop */}
      <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "700" }}>
        📍 {item.pickupName || item.pickup}
      </Text>

      <Text style={{ marginTop: 3, fontSize: 14 }}>
        🛑 {item.destinationName || item.destination}
      </Text>

      {/* Fare */}
      <Text style={{ marginTop: 8, fontSize: 15, fontWeight: "600" }}>
        💰 Fare: ₹{item.fare}
      </Text>

      {/* Accept Button */}
      <Pressable
        onPress={() => handleAccept(item)}
        style={{
          backgroundColor: "#007bff",
          padding: 10,
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>
          Accept
        </Text>
      </Pressable>
    </View>
  );

  /* -------------------------------------------------- */
  /* LOADING SCREEN                                     */
  /* -------------------------------------------------- */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  /* -------------------------------------------------- */
  /* MAIN UI                                            */
  /* -------------------------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4", paddingTop: 45 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700" }}>🚖 Driver Panel</Text>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: "red", fontWeight: "700", fontSize: 16 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginTop: 20,
          backgroundColor: "#ddd",
          borderRadius: 10,
          padding: 4,
        }}
      >
        <Pressable
          onPress={() => setActiveTab("waiting")}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            backgroundColor:
              activeTab === "waiting" ? "#007bff" : "transparent",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "700",
              color: activeTab === "waiting" ? "#fff" : "#000",
            }}
          >
            Waiting Bookings
          </Text>
        </Pressable>
      </View>

      {/* Booking List */}
      <FlatList
        data={mergedWaiting}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
            No bookings found
          </Text>
        }
      />
    </View>
  );
};

export default DriverScreen;
