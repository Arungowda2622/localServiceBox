import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const notifyDrivers = async (bookingId, bookingData) => {
  try {
    // 🔍 Get all drivers
    const q = query(collection(db, "users"), where("role", "==", "driver"));

    const querySnapshot = await getDocs(q);

    // Group messages by the project/experience id stored on the driver doc.
    // Expo requires that all tokens in a single request belong to the same project.
    const groups = new Map();

    querySnapshot.forEach((doc) => {
      const driver = doc.data();
      const token = driver.expoPushToken || driver.fcmToken || driver.pushToken;
      if (!token) return;
      if (typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
        console.warn("Skipping non-Expo push token for driver:", token);
        return;
      }

      // Prefer an explicit stored project id; fallback to 'unknown'.
      const proj = driver.expoProjectId || driver.projectId || driver.easProjectId || "unknown";

      const msg = {
        to: token,
        sound: "default",
        priority: "high",
        title: "🚖 New Ride Request",
        body: `${bookingData.pickupName} ➝ ${bookingData.destinationName}`,
        data: {
          screen: "DriverRideRequest",
          bookingId,
        },
      };

      if (!groups.has(proj)) groups.set(proj, []);
      groups.get(proj).push(msg);
    });

    if (groups.size === 0) return;

    // Send each project's messages separately to avoid PUSH_TOO_MANY_EXPERIENCE_IDS.
    const chunkSize = 100;
    for (const [proj, msgs] of groups.entries()) {
      // If project is unknown, send messages individually to be safe.
      if (proj === "unknown") {
        console.warn("Some drivers have no stored project id; sending individually to avoid mixing projects.");
        for (const m of msgs) {
          try {
            const r = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { Accept: "application/json", "Content-Type": "application/json" },
              body: JSON.stringify([m]),
            });
            const b = await r.json().catch(() => null);
            if (!r.ok) console.error("Expo push send failed (individual)", r.status, b);
            else console.log("Driver notification sent (individual). Expo response:", b);
            // small delay to reduce chances of rate limiting
            await new Promise((res) => setTimeout(res, 120));
          } catch (err) {
            console.error("Failed to send individual driver notification:", err);
          }
        }
        continue;
      }

      // Chunk and send for this project id
      for (let i = 0; i < msgs.length; i += chunkSize) {
        const chunk = msgs.slice(i, i + chunkSize);
        try {
          const res = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify(chunk),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            console.error("Expo push send failed", res.status, body);
            // If the error indicates mixed projects, fallback to individual sends for this chunk
            if (body && body.errors && body.errors.some(e => e.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS')) {
              console.warn('PUSH_TOO_MANY_EXPERIENCE_IDS detected for project', proj, '- falling back to individual sends for this chunk.');
              for (const m of chunk) {
                try {
                  const r2 = await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: { Accept: "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify([m]),
                  });
                  const b2 = await r2.json().catch(() => null);
                  if (!r2.ok) console.error("Expo push send failed (fallback individual)", r2.status, b2);
                  else console.log("Driver notification sent (fallback individual). Expo response:", b2);
                  await new Promise((res) => setTimeout(res, 120));
                } catch (err) {
                  console.error("Failed fallback individual send:", err);
                }
              }
            }
          } else {
            console.log(`Driver notifications sent for project ${proj}. Expo response:`, body);
          }
        } catch (err) {
          console.error("Error sending driver notifications chunk:", err);
        }
      }
    }
  } catch (error) {
    console.error("Error sending driver notifications:", error);
  }
};
