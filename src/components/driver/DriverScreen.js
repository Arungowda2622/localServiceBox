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
/* 🔥 Get Expo Push Token (but block Expo Go)          */
/* -------------------------------------------------- */
async function registerDriverForPushTokenAsync() {
  if (Constants.appOwnership === "expo") {
    console.log("🚫 Expo Go detected — NOT registering token.");
    return null;
  }

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

  if (token.startsWith("ExpoGo")) {
    console.log("🚫 Expo Go token rejected:", token);
    return null;
  }

  return token;
}

const DriverScreen = () => {
  const [activeTab, setActiveTab] = useState("waiting");
  const [waitingBookings, setWaitingBookings] = useState([]);
  const [waitingBoxBookings, setWaitingBoxBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

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

  useEffect(() => {
    if (!user) return;

    saveDriverToken();

    const sub = Notifications.addPushTokenListener((newToken) => {
      if (newToken.data.startsWith("ExpoGo")) return;

      updateDoc(doc(db, "users", user.uid), {
        fcmToken: newToken.data,
        updatedAt: new Date(),
      });

      console.log("Driver Token Updated:", newToken.data);
    });

    return () => sub.remove();
  }, [user]);

  /* -------------------------------------------------- */
  /* 🔥 Fetch Bookings                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    const qWaiting = query(
      collection(db, "bookings"),
      where("status", "==", "waiting")
    );

    const unsubWaiting = onSnapshot(qWaiting, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();
          const userSnap = await getDoc(doc(db, "users", booking.userId));

          return {
            id: d.id,
            type: "ride",
            ...booking,
            customerName: userSnap.data()?.fullName || "Unknown User",
            customerPhone: userSnap.data()?.phone || "N/A",
          };
        })
      );
      setWaitingBookings(data);
    });

    const qBoxWaiting = query(
      collection(db, "boxDelivery"),
      where("status", "==", "waiting")
    );

    const unsubBoxWaiting = onSnapshot(qBoxWaiting, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (d) => {
          const booking = d.data();
          const userSnap = await getDoc(doc(db, "users", booking.userId));

          return {
            id: d.id,
            type: "box",
            ...booking,
            customerName: userSnap.data()?.fullName || "Unknown User",
            customerPhone: userSnap.data()?.phone || "N/A",
          };
        })
      );
      setWaitingBoxBookings(data);
    });

    const unsubscribeMy = onSnapshot(
      query(collection(db, "bookings"), where("driverId", "==", user.uid)),
      (snapshot) => {
        setMyBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );

    return () => {
      unsubWaiting();
      unsubBoxWaiting();
      unsubscribeMy();
    };
  }, [user]);

  const mergedWaiting = [...waitingBookings, ...waitingBoxBookings];

  const handleAccept = async (item) => {
    const colName = item.type === "box" ? "boxDelivery" : "bookings";
    const ref = doc(db, colName, item.id);

    const snap = await getDoc(ref);
    if (!snap.exists())
      return Alert.alert("Error", "Booking no longer exists.");

    const booking = snap.data();
    if (booking.status !== "waiting" || booking.driverId)
      return Alert.alert("Too Late", "Another driver accepted this.");

    const driver = (await getDoc(doc(db, "users", user.uid))).data();

    await updateDoc(ref, {
      status: "accepted",
      driverId: user.uid,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      updatedAt: new Date(),
    });

    Alert.alert("Success", "Booking accepted!");
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );

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
