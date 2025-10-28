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
} from "react-native";
import React, { useRef, useState } from "react";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

const Login = ({ navigation }) => {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecked, setChecked] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isShowForgotPass, setIsShowForgotPass] = useState(false);
  const [isShowOtp, setIsShowOtp] = useState(false);
  const [isShowNewPasswordModal, setIsShowNewPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [phoneNumber, setPhoneNumber] = useState("");

  const iconSource = showPass
    ? "eye-off-outline"
    : "eye";

  const handleShowPass = () => {
    setShowPass(!showPass);
  };

  const handleLogin = async () => {
  if (!mail || !password) {
    Alert.alert("Error", "Please enter both email and password");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, mail, password);
    const user = userCredential.user;
    console.log("Logged in user:", user.email);
    Alert.alert("Welcome", "Login successful!");
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error(error);
    Alert.alert("Login Failed", error.message);
  }
};


  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  const handleForgotPass = () => {
    setIsShowForgotPass(true);
  };

  const handleSubmitPhone = () => {
    console.log("clicked");

    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    setIsShowForgotPass(false);
    setIsShowNewPasswordModal(true);
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };


  const handleSubmitOtp = () => {
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
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
          Please fill in your details for Login
        </Text>
        <View style={[styles.container, { marginTop: 10 }]}>
          <Ionicons name="mail-outline" size={24} />
          <TextInput
            placeholder="Enter your  email"
            onChangeText={setMail}
            value={mail}
            style={{ flex: 1, marginLeft: 10, }}
          />
        </View>
        <View style={[styles.container, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="lock-closed-outline" size={24} />
            <TextInput
              placeholder="Enter your  password"
              onChangeText={setPassword}
              value={password}
              secureTextEntry={showPass ? false : true}
              style={{ width: "75%", marginLeft: 10 }}
            />
          </View>
          <Pressable onPress={handleShowPass}>
            <Ionicons name={iconSource} size={24} style={{ marginRight: 15 }} />
          </Pressable>
        </View>
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
        <Pressable onPress={handleLogin} style={styles.loginBtn}>
          <Text style={styles.loginLabel}>Login</Text>
        </Pressable>
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
      <Modal
        visible={isShowForgotPass}
        transparent
        animationType="slide" // This makes it slide from bottom
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsShowForgotPass(false)}
        >
          <Pressable style={styles.bottomModal} onPress={() => { }}>
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

      <Modal visible={isShowNewPasswordModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsShowNewPasswordModal(false)}
        >
          <Pressable style={styles.bottomModal} onPress={() => { }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.modalTitle}>Create New Password</Text>
              <Ionicons
                onPress={() => setIsShowNewPasswordModal(false)}
                name="close-circle-outline"
                size={30}
              />
            </View>

            <Text style={styles.modalText}>Enter your new password</Text>

            <View style={styles.modalInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" />
              <TextInput
                placeholder="New Password"
                secureTextEntry
                style={{ flex: 1, marginLeft: 10 }}
                onChangeText={setNewPassword}
                value={newPassword}
              />
            </View>

            <View style={styles.modalInput}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" />
              <TextInput
                placeholder="Re-enter Password"
                secureTextEntry
                style={{ flex: 1, marginLeft: 10 }}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
              />
            </View>

            <Pressable
              onPress={() => {
                // Add validation and API call logic here
                if (newPassword && newPassword === confirmPassword) {
                  setIsShowNewPasswordModal(false);
                  handleResetPassword();
                  alert("Password successfully reset!");
                  // Optionally navigate to login or home
                } else {
                  alert("Passwords do not match");
                }
              }}
              style={styles.modalButton}
            >
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
  main: {
    flex: 1,
    padding: 24,
  },
  iconImage: {
    marginTop: 50,
    height: height * 0.08,
    width: width * 0.2,
    resizeMode: "stretch",
  },
  topLabel: {
    fontWeight: "500",
    fontSize: 25,
    color: "#000000",
    marginVertical: 5,
  },
  profileLabel: {
    fontWeight: "500",
    fontSize: 16,
  },
  signInLabel: {
    fontWeight: "400",
    fontSize: 35,
    marginVertical: 10,
  },
  infoLoginLabel: {
    fontWeight: "600",
    fontSize: 13,
    color: "#0516D3",
    marginTop: 7,
  },
  container: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  lockIcon: {
    height: height * 0.035,
    width: width * 0.1,
    resizeMode: "stretch",
  },
  checkBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  paragraph: {
    fontWeight: "400",
    fontSize: 13,
    marginLeft: 5,
  },
  forgotPassLabel: {
    fontWeight: "500",
    fontSize: 13,
    color: "#0516D3",
  },
  loginBtn: {
    padding: 15,
    alignItems: "center",
    backgroundColor: "#0516D3",
    marginVertical: 10,
    marginTop: 20,
    borderRadius: 13,
  },
  loginLabel: {
    fontWeight: "600",
    fontSize: 17,
    color: "#FFFFFF",
  },
  doHaveBox: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginVertical: 10,
  },
  singUpLabel: {
    fontWeight: "500",
    fontSize: 14,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
  },
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
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  box: {
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    padding: 2,
    marginRight: 3,
    marginVertical: 10,
  },
  otpInput: {
    width: width * 0.1,
    height: width * 0.12,
    textAlign: "center",
    fontSize: 18,
  },
});
