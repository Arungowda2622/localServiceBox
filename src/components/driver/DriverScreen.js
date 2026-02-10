import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";

import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import { forceLogout } from "../../utils/authUtils";

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
 ✅ GET DRIVER PUSH TOKEN (EAS SAFE)
********************************************/
async function generateDriverPushToken() {
  try {
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn("❌ Missing EAS projectId");
      return null;
    }

    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (permission.status !== "granted") {
      console.warn("❌ Notification permission not granted");
      return null;
    }

    const tokenObj = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenObj.data;

    console.log("✅ Expo Push Token:", token);
    console.log("✅ Project ID:", projectId);

    if (!token?.startsWith("ExponentPushToken")) {
      console.warn("❌ Invalid Expo Push Token");
      return null;
    }

    return { token, projectId };
  } catch (err) {
    console.log("❌ Token generation error:", err);
    return null;
  }
}

const DriverScreen = () => {
  /********************************************
   🔐 AUTH STATE (FIXED)
  ********************************************/
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((firebaseUser) => {
      console.log("onAuthStateChanged fired, firebaseUser:", firebaseUser?.uid);

      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }

      setAuthReady(true);
    });

    return unsub;
  }, []);

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

    const result = await generateDriverPushToken();
    if (!result) return;

    const { token, projectId } = result;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        expoPushToken: token,
        expoProjectId: projectId,
        updatedAt: new Date(),
      });

      console.log("✅ Driver token saved");
    } catch (err) {
      console.warn("Failed to save driver token:", err);
    }
  };

  useEffect(() => {
    if (authReady && user) saveDriverToken();
  }, [authReady, user]);

  /********************************************
   LOGOUT HANDLER
********************************************/
  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem("loggingOut", "1");
      await AsyncStorage.removeItem("user");
      await auth.signOut();
      await AsyncStorage.removeItem("loggingOut");

      if (typeof forceLogout === "function") {
        forceLogout();
      }

      console.log("Driver logout completed");
    } catch (err) {
      console.warn("Logout error:", err);
      Alert.alert("Error", "Failed to logout.");
    }
  };

  /********************************************
   🔔 NOTIFICATION LISTENERS
********************************************/
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const receiveSub =
      Notifications.addNotificationReceivedListener(() => {
        setActiveTab("waiting");
      });

    const tapSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.bookingId) {
          setActiveTab("waiting");
          setSelectedBookingId(data.bookingId);
        }
      });

    return () => {
      receiveSub.remove();
      tapSub.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSelected = async () => {
      if (!selectedBookingId) return setSelectedBooking(null);
      try {
        const snap = await getDoc(doc(db, "bookings", selectedBookingId));
        if (!mounted) return;
        setSelectedBooking({ id: snap.id, ...(snap.data() || {}) });
      } catch (err) {
        console.warn("Failed to fetch selected booking:", err);
      }
    };
    fetchSelected();
    return () => {
      mounted = false;
    };
  }, [selectedBookingId]);

  /********************************************
   🔥 FETCH BOOKINGS (AUTH SAFE)
********************************************/
  useEffect(() => {
    if (!authReady || !user) return;

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

    const myQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", user.uid)
    );

    const unsubMy = onSnapshot(myQuery, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const b = d.data();
          let customerName = null;
          let customerPhone = null;

          if (b.userId) {
            const userSnap = await getDoc(doc(db, "users", b.userId));
            customerName = userSnap.data()?.fullName || null;
            customerPhone = userSnap.data()?.phone || null;
          }

          return { id: d.id, ...b, customerName, customerPhone };
        })
      );

      setMyBookings(list);
      setLoading(false);
    });

    return () => {
      unsubWait();
      unsubWaitBox();
      unsubMy();
    };
  }, [authReady, user]);

  /********************************************
   ACCEPT BOOKING
********************************************/
  const acceptBooking = async (item) => {
    try {
      const col = item.type === "box" ? "boxDelivery" : "bookings";
      const ref = doc(db, col, item.id);

      const snap = await getDoc(ref);
      const current = snap.data();

      if (current.status !== "waiting") {
        return Alert.alert("Already Accepted", "Another driver accepted this.");
      }

      const driverSnap = await getDoc(doc(db, "users", user.uid));

      await updateDoc(ref, {
        status: "accepted",
        driverId: user.uid,
        driverName: driverSnap.data()?.fullName,
        driverPhone: driverSnap.data()?.phone,
        assignedDriver: driverSnap.data()?.fullName,
        driverVehicle: driverSnap.data()?.vehicle || null,
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
   BOOKING CARD (UNCHANGED UI)
********************************************/
  const BookingCard = ({ item }) => {
    const pickupTitle = item.pickupName || "Pickup Location";
    const pickupAddress = item.pickup || "";

    const destinationTitle = item.destinationName || "Destination";
    const destinationAddress = item.destination || "";

    return (
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

        <Text style={{ marginTop: 5 }}>👤 {item.customerName}</Text>
        <Text>📞 {item.customerPhone}</Text>

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: "700", color: "#4CAF50" }}>📍 Pickup</Text>
          <Text numberOfLines={2}>{pickupTitle}</Text>
          {pickupAddress ? (
            <Text numberOfLines={2} style={{ fontSize: 12, color: "#666" }}>
              {pickupAddress}
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: "700", color: "#EA4335" }}>🏁 Destination</Text>
          <Text numberOfLines={2}>{destinationTitle}</Text>
          {destinationAddress ? (
            <Text numberOfLines={2} style={{ fontSize: 12, color: "#666" }}>
              {destinationAddress}
            </Text>
          ) : null}
        </View>

        {activeTab === "waiting" && (
          <>
            <TouchableOpacity
              onPress={() => acceptBooking(item)}
              style={{
                marginTop: 12,
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
                marginTop: 8,
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
  };

  /********************************************
   AUTH LOADING SCREEN
********************************************/
  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /********************************************
   MAIN UI (UNCHANGED)
********************************************/
  return (
    <View style={{ flex: 1, paddingTop: 45 }}>
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
