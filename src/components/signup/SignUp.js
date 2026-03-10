import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import colors from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");


const SignUp = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const iconSource = showPass ? "eye-off-outline" : "eye";

  const iconConfirm = showConfirmPass ? "eye-off-outline" : "eye";

  const handleShowPass = () => {
    setShowPass(!showPass);
  };

  /* 🔹 LOGIN */
  const handleShowConfirmPass = () => {
    setShowConfirmPass(!showConfirmPass);
  };

  const handleSignUp = () => {
    navigation.navigate("Login");
  };

  const isValidEmail = (email) => {
    const trimmedEmail = email.trim().toLowerCase();
    const regex = /^[a-z0-9._%+-]+@gmail\.com$/;
    return regex.test(trimmedEmail);
  };

  const isValidPhone = (phone) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(phone);
  };

  const validateForm = () => {
    // 🔴 Missing fields
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing Fields", "Please fill all the fields");
      return false;
    }

    // 🔴 Gmail-only validation (HERE 👇)
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Only Gmail addresses are allowed");
      return false;
    }

    if (fullName.length < 3) {
      Alert.alert(
        "Validation Error",
        "Full name must be at least 3 characters"
      );
      return false;
    }

    if (!isValidPhone(phone)) {
      Alert.alert("Validation Error", "Phone number must be 10 digits");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }

    if (!isChecked) {
      Alert.alert("Validation Error", "Please accept Terms & Conditions");
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true); // 🔵 START loader

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phone,
        role: "user",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Signup Failed", "Email already exists");
      } else {
        Alert.alert("Signup Failed", error.message);
      }
    } finally {
      setLoading(false); // 🔵 STOP loader
    }
  };


  return (
    <SafeAreaView style={styles.main}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContainer}
        >

          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/icon.png")}
              style={styles.logo}
            />
            <Text style={styles.welcome}>Create an account 👋</Text>
            <Text style={styles.subtitle}>Set Up Your Profile</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Full Name */}
            <View style={styles.inputBox}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="Enter full name"
                onChangeText={setFullName}
                value={fullName}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </View>

            {/* Email */}
            <View style={styles.inputBox}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="Enter your email"
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.placeholder}
                style={styles.input}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputBox}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                placeholder="Phone number"
                onChangeText={setPhone}
                value={phone}
                placeholderTextColor={colors.placeholder}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputBox, { justifyContent: "space-between" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  placeholder="Enter your password"
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry={!showPass}
                  placeholderTextColor={colors.placeholder}
                  style={[styles.input, { flex: 1 }]}
                />
              </View>

              <Pressable onPress={handleShowPass}>
                <Ionicons
                  name={iconSource}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputBox, { justifyContent: "space-between" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  placeholder="Re-enter your password"
                  onChangeText={setConfirmPassword}
                  value={confirmPassword}
                  secureTextEntry={!showConfirmPass}
                  placeholderTextColor={colors.placeholder}
                  style={[styles.input, { flex: 1 }]}
                />
              </View>

              <Pressable onPress={handleShowConfirmPass}>
                <Ionicons
                  name={iconConfirm}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Terms */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}>
              <Checkbox
                value={isChecked}
                onValueChange={setChecked}
                color={isChecked ? colors.primary : undefined}
              />

              <Text style={{ marginLeft: 10, color: colors.textSecondary }}>
                I Agree to <Text style={{ color: colors.primary }}>Terms</Text> and{" "}
                <Text style={{ color: colors.primary }}>Conditions</Text>
              </Text>
            </View>

            {/* Button */}
            <Pressable
              onPress={handleCreateAccount}
              style={styles.loginBtn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginText}>Create Account</Text>
              )}
            </Pressable>

            {/* Login */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Already have an account?</Text>
              <Pressable onPress={handleSignUp}>
                <Text style={styles.signupLink}> Sign In</Text>
              </Pressable>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

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
  scrollContainer: {
    paddingBottom: 40,
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
