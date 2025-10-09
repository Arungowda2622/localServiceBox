import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";

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

  const iconSource = showPass ? "eye-off-outline" : "eye";

  const iconConfirm = showConfirmPass ? "eye-off-outline" : "eye";

  const handleShowPass = () => {
    setShowPass(!showPass);
  };

  const handleShowConfirmPass = () => {
    setShowConfirmPass(!showConfirmPass);
  };

  const handleSignUp = () => {
    navigation.navigate("Login");
  };

  const handleCreateAccount = () => {
    console.log("clickedCreateAccount");
    const bodyData = {
      fullName: fullName,
      email: email,
      phone: phone,
      password: password,
      confirmPassword: confirmPassword,
    };

    // fetch(`${LoanApi}/auth/register`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(bodyData),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     console.log(data, "thisIsData");
    //     navigation.navigate("Main", { loginUser: data });
    //   })
    //   .catch((err) => {
    //     console.log(err, "thisIsError");
    //   });
  };

  return (
    <View style={styles.main}>
      <View style={{ alignItems: "center" }}>
        <Image
          source={require("../../../assets/LsbLogo.jpg")}
          style={styles.iconImage}
        />
        <Text style={styles.topLabel}>Create an acount</Text>
        <Text style={styles.profileLabel}>Set Up Your Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ marginTop: 20, paddingBottom: 200 }}>
        <Text style={styles.signInLabel}>Sign in</Text>
        <Text style={styles.infoLoginLabel}>
          Please fill in your details for sign in
        </Text>
        <View style={[styles.container, { marginTop: 10 }]}>
          <Ionicons name="person-outline" size={24} />
          <TextInput
            placeholder="Enter full name"
            onChangeText={setFullName}
            value={fullName}
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>
        <View style={styles.container}>
          <Ionicons name="mail-outline" size={24} />
          <TextInput
            placeholder="Enter your email"
            onChangeText={setEmail}
            value={email}
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>
        <View style={styles.container}>
          <Ionicons name="call-outline" size={24} />
          <TextInput
            placeholder="Phone number"
            onChangeText={setPhone}
            value={phone}
            style={{ flex: 1, marginLeft: 10 }}
          />
        </View>
        <View style={[styles.container, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="lock-closed-outline" size={24} />
            <TextInput
              placeholder="Enter your password"
              onChangeText={setPassword}
              value={password}
              secureTextEntry={showPass ? false : true}
              style={{ width: "75%", marginLeft:10 }}
            />
          </View>
          <Pressable onPress={handleShowPass}>
            <Ionicons name={iconSource} size={24}/>
          </Pressable>
        </View>
        <View style={[styles.container, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="lock-closed-outline" size={24} />
            <TextInput
              placeholder="Re-Enter your  password"
              onChangeText={setConfirmPassword}
              value={confirmPassword}
              secureTextEntry={showConfirmPass ? false : true}
              style={{ width: "75%", marginLeft:10 }}
            />
          </View>
          <Pressable onPress={handleShowConfirmPass}>
             <Ionicons name={iconConfirm} size={24}/>
          </Pressable>
        </View>
        <View style={styles.mainBox}>
          <View style={styles.checkBox}>
            <Checkbox
              value={isChecked}
              onValueChange={setChecked}
              color={isChecked ? "#4630EB" : undefined}
            />
            <Text style={styles.paragraph}>
              I Agree to <Text style={{ color: "#4630EB" }}>Terms</Text> and{" "}
              <Text style={{ color: "#4630EB" }}>Conditions</Text>
            </Text>
          </View>
        </View>
        <Pressable onPress={handleCreateAccount} style={styles.loginBtn}>
          <Text style={styles.loginLabel}>Create account</Text>
        </Pressable>
        <View style={styles.doHaveBox}>
          <Text style={styles.singUpLabel}>Already have an account?</Text>
          <Pressable onPress={handleSignUp}>
            <Text
              style={[styles.singUpLabel, { color: "#4630EB", marginLeft: 10 }]}
            >
              Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUp;

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
    marginLeft: 15,
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
});
