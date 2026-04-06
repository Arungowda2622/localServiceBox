import { useEffect } from "react";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export default function useOTAUpdate() {
  useEffect(() => {

    // ✅ ADD HERE (top of useEffect)
    if (__DEV__) return;

    async function checkUpdate() {
      try {
        console.log("Checking OTA update...");

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("Update available");

          Alert.alert(
            "Update Available",
            "A new version of the app is available.",
            [
              {
                text: "Later",
                style: "cancel",
              },
              {
                text: "Update Now",
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (e) {
                    console.log("Update failed:", e);
                  }
                },
              },
            ]
          );
        } else {
          console.log("No update available");
        }
      } catch (error) {
        console.log("OTA update error:", error);
      }
    }

    setTimeout(checkUpdate, 3000);

  }, []);
}