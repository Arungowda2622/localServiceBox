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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // if (Constants.appOwnership === "expo") return;

    const token = await generateDriverPushToken();
    if (!token) return;

    try {
      // Save token under multiple fields to match different consumers
      // Some parts of the app write `fcmToken` (App.js) while older code
      // used `expoPushToken`. Storing both keeps compatibility.
      await updateDoc(doc(db, "users", user.uid), {
        expoPushToken: token,
        fcmToken: token,
        // store the EAS project id used to generate the token so server
        // can group tokens by project and avoid mixing different experiences
        expoProjectId: Constants?.expoConfig?.extra?.eas?.projectId || null,
        updatedAt: new Date(),
      });

      console.log("Driver token saved:", token);
    } catch (err) {
      console.warn("Failed to save driver token:", err);
    }
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
      try {
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.warn('Failed to clear stored user on logout:', e);
      }
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
        const data = response.notification.request.content.data;

        if (data?.bookingId) {
          setActiveTab("waiting");
          // open a modal showing only that booking's details for quick action
          setSelectedBookingId(data.bookingId);
        }
      }
    );

    return () => {
      receiveSub.remove();
      tapSub.remove();
    };
  }, []);

  // Selected booking from notification (modal)
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

    const unsubMy = onSnapshot(myQuery, async (snap) => {
      try {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const b = d.data();
            // Fetch customer details so driver sees name/phone on their bookings
            let customerName = null;
            let customerPhone = null;
            try {
              if (b.userId) {
                const userSnap = await getDoc(doc(db, "users", b.userId));
                if (userSnap.exists()) {
                  customerName = userSnap.data()?.fullName || null;
                  customerPhone = userSnap.data()?.phone || null;
                }
              }
            } catch (err) {
              console.warn("Failed to fetch customer for my booking:", err);
            }

            return {
              id: d.id,
              ...b,
              customerName,
              customerPhone,
            };
          })
        );

        setMyBookings(list);
      } catch (err) {
        console.warn("Failed to map my bookings:", err);
      } finally {
        setLoading(false);
      }
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
   BOOKING CARD
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

        {/* CUSTOMER INFO */}
        <Text style={{ marginTop: 5 }}>👤 {item.customerName}</Text>
        <Text>📞 {item.customerPhone}</Text>

        {/* PICKUP */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: "700", color: "#4CAF50" }}>📍 Pickup</Text>
          <Text numberOfLines={2}>{pickupTitle}</Text>
          {pickupAddress ? (
            <Text numberOfLines={2} style={{ fontSize: 12, color: "#666" }}>
              {pickupAddress}
            </Text>
          ) : null}
        </View>

        {/* DESTINATION */}
        <View style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: "700", color: "#EA4335" }}>
            🏁 Destination
          </Text>
          <Text numberOfLines={2}>{destinationTitle}</Text>
          {destinationAddress ? (
            <Text numberOfLines={2} style={{ fontSize: 12, color: "#666" }}>
              {destinationAddress}
            </Text>
          ) : null}
        </View>

        {/* ACTIONS */}
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
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
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
              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                Cancel Booking
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

    // Modal UI for selected booking (from notification tap)
    const SelectedBookingModal = () => {
      if (!selectedBooking) return null;

      return (
        <Modal visible={!!selectedBookingId} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16 }}>
              <ScrollView>
                <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>
                  {selectedBooking.type === "box" ? "📦 Box Delivery" : "🚕 Ride Booking"}
                </Text>
                <Text>Customer: {selectedBooking.customerName}</Text>
                <Text>Phone: {selectedBooking.customerPhone}</Text>
                <Text style={{ marginTop: 8, fontWeight: "700" }}>Pickup</Text>
                <Text>{selectedBooking.pickupName}</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>{selectedBooking.pickup}</Text>
                <Text style={{ marginTop: 8, fontWeight: "700" }}>Destination</Text>
                <Text>{selectedBooking.destinationName}</Text>
                <Text style={{ fontSize: 12, color: "#666" }}>{selectedBooking.destination}</Text>

                <View style={{ flexDirection: "row", marginTop: 14, justifyContent: "space-between" }}>
                  <TouchableOpacity
                    onPress={async () => {
                      await acceptBooking(selectedBooking);
                      setSelectedBookingId(null);
                    }}
                    style={{ backgroundColor: "#007bff", padding: 12, borderRadius: 8, flex: 1, marginRight: 8 }}
                  >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      await cancelBooking(selectedBooking);
                      setSelectedBookingId(null);
                    }}
                    style={{ backgroundColor: "#ff3b30", padding: 12, borderRadius: 8, flex: 1 }}
                  >
                    <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setSelectedBookingId(null)} style={{ marginTop: 12 }}>
                  <Text style={{ textAlign: "center", color: "#666" }}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    };

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
      <SelectedBookingModal />
    </View>
  );
};

export default DriverScreen;
