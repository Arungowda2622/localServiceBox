import { db } from "../firebase";

export async function sendDriverNotification(
  title: string,
  body: string,
  data: any
) {
  const driversSnap = await db
    .collection("users")
    .where("role", "==", "driver")
    .get();

  const messages: any[] = [];

  driversSnap.forEach((doc) => {
    const driver = doc.data();

    if (!driver.expoPushToken) return;

    messages.push({
      to: driver.expoPushToken,
      sound: "default",
      title,
      body,
      data,
    });
  });

  if (messages.length === 0) {
    console.log("⚠️ No drivers with push tokens");
    return;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error("❌ Expo API error:", response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log("✅ Expo push result:", result);
  } catch (error) {
    console.error("❌ Failed to send notifications:", error);
  }
}
