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
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebase/firebaseConfig";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "../theme/colors";

const { width, height } = Dimensions.get("window");

/* 🔹 Firebase Error Mapper */
const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password. Please try again.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    default:
      return "Something went wrong. Please try again.";
  }
};

const getReadableAuthError = (error) => {
  switch (error.code) {
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "No internet connection.";
    default:
      return "Login failed. Please try again.";
  }
};


const Login = ({ navigation }) => {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isShowForgotPass, setIsShowForgotPass] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const iconSource = showPass ? "eye-off-outline" : "eye";

  const isValidGmail = (email) => {
    const regex = /^[a-z0-9._%+-]+@gmail\.com$/;
    return regex.test(email.trim().toLowerCase());
  };

  /* 🔹 LOGIN */
 const handleLogin = async () => {
  if (!mail || !password) {
    Alert.alert("Error", "Please enter email and password");
    return;
  }

  setLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      mail.trim().toLowerCase(),
      password
    );

    const user = userCredential.user;

   
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      Alert.alert("Error", "User profile not found");
      await signOut(auth);
      return;
    }

    // ✅ DO NOTHING ELSE
    // App.js will auto-redirect based on auth state

  } catch (error) {
    Alert.alert("Login Failed", getReadableAuthError(error));
  } finally {
    setLoading(false);
  }
};


  /* 🔹 RESET PASSWORD */
  const handleSendResetEmail = async () => {
    if (!resetEmail) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (!isValidGmail(resetEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid Gmail address.");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      Alert.alert("Success", "Password reset link sent to your Gmail.");
      setIsShowForgotPass(false);
      setResetEmail("");
    } catch (error) {
      Alert.alert("Error", getAuthErrorMessage(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={styles.main}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/icon.png")}
          style={styles.logo}
        />
        <Text style={styles.welcome}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Login to continue</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Email */}
        <View style={styles.inputBox}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            placeholder="Gmail address"
            placeholderTextColor={colors.placeholder}
            value={mail}
            onChangeText={setMail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputBox}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            style={styles.input}
          />
          <Pressable onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={iconSource}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Forgot */}
        <Pressable onPress={() => setIsShowForgotPass(true)}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>

        {/* Button */}
        <Pressable onPress={handleLogin} style={styles.loginBtn}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.loginText}>Login</Text>
          )}
        </Pressable>

        {/* Signup */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don’t have an account?</Text>
          <Pressable onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.signupLink}> Sign Up</Text>
          </Pressable>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={isShowForgotPass} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered Gmail
            </Text>

            <View style={styles.inputBox}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="Gmail address"
                placeholderTextColor={colors.placeholder}
                value={resetEmail}
                onChangeText={setResetEmail}
                style={styles.input}
              />
            </View>

            <Pressable onPress={handleSendResetEmail} style={styles.loginBtn}>
              {resetLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginText}>Send Reset Link</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setIsShowForgotPass(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Login;

/* 🎨 STYLES */
const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: height * 0.35,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    height: 60,
    width: 60,
    borderRadius: 12,
    marginBottom: 10,
  },
  welcome: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: -50,
    padding: 20,
    borderRadius: 20,
    elevation: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 15,
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  forgot: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 12,
    alignSelf: "flex-end",
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 25,
  },
  loginText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  signupLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
  },
  cancel: {
    marginTop: 15,
    textAlign: "center",
    color: colors.placeholder,
  },
});
