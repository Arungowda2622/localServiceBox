"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDriverNotification = sendDriverNotification;
const firebase_1 = require("../firebase");
async function sendDriverNotification(title, body, data) {
    const driversSnap = await firebase_1.db
        .collection("users")
        .where("role", "==", "driver")
        .get();
    const messages = [];
    driversSnap.forEach((doc) => {
        const driver = doc.data();
        if (!driver.expoPushToken)
            return;
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
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
    });
    const result = await response.json();
    console.log("✅ Expo push result:", result);
}
