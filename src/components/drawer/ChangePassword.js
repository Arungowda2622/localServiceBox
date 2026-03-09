import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from '../firebase/firebaseConfig';
import { updatePassword } from "firebase/auth";
import Header from "../header/Header";
import { waitForAuthUser } from "../../utils/authUtils";


const ChangePassword = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Enter new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const user = await waitForAuthUser();
      if (!user || user._cached) {
        Alert.alert(
          "Security Alert",
          "Please login again before changing password.",
        );
        return;
      }
      await updatePassword(user, newPassword);

      Alert.alert("Success", "Password updated successfully 🔐");
      navigation.goBack();
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Security Alert",
          "Please login again before changing password."
        );
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF7ED" }}>
      <Header title="Change Password" navigation={navigation} />

      <View style={styles.card}>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#EA580C" />
          <TextInput
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#EA580C" />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
        </View>

        <Pressable style={styles.primaryBtn} onPress={handleUpdatePassword}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Update Password</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    marginLeft: 10,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: "#0516D3",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
