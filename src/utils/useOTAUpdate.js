import { useEffect } from "react";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export default function useOTAUpdate() {
  useEffect(() => {
    async function checkUpdate() {
      try {
        console.log("Checking OTA update...");

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("Update available");

          await Updates.fetchUpdateAsync();

          Alert.alert(
            "Update Available",
            "A new version of the app is available.",
            [
              {
                text: "Update Now",
                onPress: async () => {
                  await Updates.reloadAsync();
                }
              }
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