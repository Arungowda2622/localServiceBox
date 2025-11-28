const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyDriversOnNewBooking = functions.firestore
  .document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const bookingData = snap.data();
    const bookingId = context.params.bookingId;

    console.log("🔥 New booking detected:", bookingId);

    // 1️⃣ Get all drivers with FCM token
    const usersSnapshot = await admin.firestore().collection("users").get();
    let driverTokens = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.role === "driver" && user.fcmToken) {
        driverTokens.push(user.fcmToken);
      }
    });

    if (driverTokens.length === 0) {
      console.log("❌ No driver FCM tokens found");
      return null;
    }

    console.log("🚀 Sending notification to:", driverTokens);

    // 2️⃣ Build message (FCM v1)
    const message = {
      tokens: driverTokens,
      notification: {
        title: "🚕 New Ride Request",
        body: "A customer has requested a ride!",
      },
      data: {
        screen: "BikeTaxiWaiting", // screen to open
        bookingId: bookingId, // pass booking id
      },
    };

    // 3️⃣ Send notification
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log("📨 Notifications sent:", response);
    } catch (error) {
      console.error("❌ Error sending FCM:", error);
    }

    return null;
  });
