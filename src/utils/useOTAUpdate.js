import { useEffect, useState } from "react";
import * as Updates from "expo-updates";

export default function useOTAUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (__DEV__) return;

    async function handleOTAUpdate() {
      try {
        console.log("Checking OTA update...");

        // ✅ ADD HERE (very important)
        if (Updates.isEmergencyLaunch) {
          console.log("Emergency launch - skipping update");
          return;
        }

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("Update available");

          setIsUpdating(true);

          await Updates.fetchUpdateAsync();

          console.log("Update downloaded");

          setTimeout(async () => {
            try {
              await Updates.reloadAsync();
            } catch (reloadError) {
              console.log("Reload failed:", reloadError);
              setIsUpdating(false);
            }
          }, 1500);
        } else {
          console.log("No update available");
        }
      } catch (error) {
        console.log("OTA update error:", error);
      }
    }

    handleOTAUpdate();
  }, []);

  return { isUpdating };
}