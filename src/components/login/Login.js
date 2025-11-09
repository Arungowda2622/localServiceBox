import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useRef, useState } from "react";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const Login = ({ navigation }) => {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isShowForgotPass, setIsShowForgotPass] = useState(false);
  const [isShowNewPasswordModal, setIsShowNewPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const iconSource = showPass ? "eye-off-outline" : "eye";

  // ✅ Toggle password visibility
  const handleShowPass = () => setShowPass(!showPass);

  // ✅ Login handler
  const handleLogin = async () => {
    if (!mail || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Sign in using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, mail, password);
      const user = userCredential.user;
      console.log("✅ Firebase Auth User:", user.uid);

      // Step 2: Fetch Firestore user data using UID
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert("Error", "User profile not found in Firestore.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      console.log("✅ Firestore Data:", userData);

      // Step 3: Save user data in AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Step 4: Navigate based on role
      if (userData.role === "driver") {
        Alert.alert("Welcome Driver", "Login successful!");
        navigation.reset({
          index: 0,
          routes: [{ name: "DriverScreen", params: { driverData: userData } }],
        });
      } else {
        Alert.alert("Welcome", "Login successful!");
      }
    } catch (error) {
      console.error("❌ Login Error:", error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => navigation.navigate("SignUp");
  const handleForgotPass = () => setIsShowForgotPass(true);

  const handleSubmitPhone = () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    setIsShowForgotPass(false);
    setIsShowNewPasswordModal(true);
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    Alert.alert("Success", "Password reset functionality not implemented yet.");
  };

  return (
    <View style={styles.main}>
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../../../assets/LsbLogo.jpg")}
          style={styles.iconImage}
        />
        <Text style={styles.topLabel}>Hi, Welcome back!</Text>
        <Text style={styles.profileLabel}>Let's get started.</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.signInLabel}>Login</Text>
        <Text style={styles.infoLoginLabel}>
          Please fill in your details to Login
        </Text>

        {/* Email Input */}
        <View style={[styles.container, { marginTop: 10 }]}>
          <Ionicons name="mail-outline" size={24} />
          <TextInput
            placeholder="Enter your email"
            onChangeText={setMail}
            value={mail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>

        {/* Password Input */}
        <View style={[styles.container, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="lock-closed-outline" size={24} />
            <TextInput
              placeholder="Enter your password"
              onChangeText={setPassword}
              value={password}
              secureTextEntry={!showPass}
              style={{ width: "75%", marginLeft: 10 }}
            />
          </View>
          <Pressable onPress={handleShowPass}>
            <Ionicons name={iconSource} size={24} style={{ marginRight: 15 }} />
          </Pressable>
        </View>

        {/* Remember Me + Forgot Password */}
        <View style={styles.mainBox}>
          <View style={styles.checkBox}>
            <Checkbox
              value={isChecked}
              onValueChange={setChecked}
              color={isChecked ? "#4630EB" : undefined}
            />
            <Text style={styles.paragraph}>Remember me</Text>
          </View>
          <Pressable onPress={handleForgotPass}>
            <Text style={styles.forgotPassLabel}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable onPress={handleLogin} style={styles.loginBtn}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginLabel}>Login</Text>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View style={styles.doHaveBox}>
          <Text style={styles.singUpLabel}>Don't have an account?</Text>
          <Pressable onPress={handleSignUp}>
            <Text
              style={[styles.singUpLabel, { color: "#4630EB", marginLeft: 10 }]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={isShowForgotPass} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsShowForgotPass(false)}
        >
          <Pressable style={styles.bottomModal} onPress={() => {}}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Ionicons
                onPress={() => setIsShowForgotPass(false)}
                name="close-circle-outline"
                size={30}
              />
            </View>

            <Text style={styles.modalText}>
              Enter your phone number to reset your password
            </Text>
            <View style={styles.modalInput}>
              <Ionicons name="person-outline" size={24} />
              <TextInput
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                value={phoneNumber}
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>

            <Pressable onPress={handleSubmitPhone} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={isShowNewPasswordModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsShowNewPasswordModal(false)}
        >
          <Pressable style={styles.bottomModal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Create New Password</Text>
            <View style={styles.modalInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" />
              <TextInput
                placeholder="New Password"
                secureTextEntry
                onChangeText={setNewPassword}
                value={newPassword}
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>
            <View style={styles.modalInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" />
              <TextInput
                placeholder="Re-enter Password"
                secureTextEntry
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>
            <Pressable onPress={handleResetPassword} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  main: { flex: 1, padding: 24 },
  iconImage: {
    marginTop: 50,
    height: height * 0.08,
    width: width * 0.2,
    resizeMode: "stretch",
  },
  topLabel: { fontWeight: "500", fontSize: 25, color: "#000000", marginVertical: 5 },
  profileLabel: { fontWeight: "500", fontSize: 16 },
  signInLabel: { fontWeight: "400", fontSize: 35, marginVertical: 10 },
  infoLoginLabel: { fontWeight: "600", fontSize: 13, color: "#0516D3", marginTop: 7 },
  container: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkBox: { flexDirection: "row", alignItems: "center" },
  mainBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  paragraph: { fontWeight: "400", fontSize: 13, marginLeft: 5 },
  forgotPassLabel: { fontWeight: "500", fontSize: 13, color: "#0516D3" },
  loginBtn: {
    padding: 15,
    alignItems: "center",
    backgroundColor: "#0516D3",
    marginVertical: 10,
    marginTop: 20,
    borderRadius: 13,
  },
  loginLabel: { fontWeight: "600", fontSize: 17, color: "#FFFFFF" },
  doHaveBox: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginVertical: 10,
  },
  singUpLabel: { fontWeight: "500", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  modalText: { fontSize: 14, color: "#555", marginBottom: 15 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#0516D3",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  modalButtonText: { color: "#fff", fontWeight: "600" },
});
