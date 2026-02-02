import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const notifyDrivers = async (bookingId, bookingData) => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "driver"));
    const snapshot = await getDocs(q);

    const messages = [];

    snapshot.forEach((doc) => {
      const d = doc.data();
      if (
        d.expoPushToken &&
        d.expoProjectId &&
        d.expoPushToken.startsWith("ExponentPushToken")
      ) {
        messages.push({
          to: d.expoPushToken,
          sound: "default",
          priority: "high",
          title: "🚖 New Ride Request",
          body: `${bookingData.pickupName} ➝ ${bookingData.destinationName}`,
          data: { bookingId },
        });
      }
    });

    if (!messages.length) return;

    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);

      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const result = await res.json();
      console.log("📨 Push result:", result);
    }
  } catch (err) {
    console.error("❌ notifyDrivers error:", err);
  }
};
