const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/*************************************************
 🚖 RIDE BOOKING PUSH
*************************************************/
exports.sendBookingNotification = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    try {
      const bookingId = event.params.bookingId;

      console.log("🚖 New booking created:", bookingId);

      const driversSnap = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "driver")
        .get();

      const messages = [];

      driversSnap.forEach((doc) => {
        const driver = doc.data();

        if (driver.expoPushToken) {
          messages.push({
            to: driver.expoPushToken,
            sound: "default",
            title: "🚖 New Ride Available",
            body: "Tap to accept the ride!",
            data: { bookingId },
          });
        }
      });

      console.log("📤 Sending ride push:", messages.length);

      if (!messages.length) return;

      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        }
      );

      const result = await response.json();
      console.log("✅ Expo Response:", result);
    } catch (err) {
      console.error("❌ Ride push error:", err);
    }
  }
);

/*************************************************
 📦 BOX DELIVERY PUSH
*************************************************/
exports.sendBoxDeliveryNotification = onDocumentCreated(
  "boxDelivery/{boxId}",
  async (event) => {
    try {
      const boxId = event.params.boxId;

      console.log("📦 New box delivery created:", boxId);

      const driversSnap = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "driver")
        .get();

      const messages = [];

      driversSnap.forEach((doc) => {
        const driver = doc.data();

        if (driver.expoPushToken) {
          messages.push({
            to: driver.expoPushToken,
            sound: "default",
            title: "📦 New Delivery Available",
            body: "Tap to accept delivery!",
            data: { boxId },
          });
        }
      });

      console.log("📤 Sending delivery push:", messages.length);

      if (!messages.length) return;

      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        }
      );

      const result = await response.json();
      console.log("✅ Expo Response:", result);
    } catch (err) {
      console.error("❌ Delivery push error:", err);
    }
  }
);
