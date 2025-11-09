import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import Header from '../header/Header';
import { auth, db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const AddAdmin = ({ navigation }) => {
  const [adminDetails, setAdminDetails] = useState({
    role: "admin",
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleAddAdmin = async () => {
    const { fullName, email, phone, password } = adminDetails;

    // ✅ Validation
    if (!fullName || !email || !phone || !password) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Phone number must be 10 digits.");
      return;
    }

    try {
      // ✅ Check for duplicate email
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        Alert.alert("Error", "User already exists with this email!");
        return;
      }

      // ✅ Check for duplicate phone
      const phoneQuery = query(collection(db, "users"), where("phone", "==", phone));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        Alert.alert("Error", "User already exists with this phone number!");
        return;
      }

      // ✅ Create Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Save admin info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        phone,
        role: "admin",
        password,
        createdAt: serverTimestamp(),
      });

      Alert.alert("✅ Success", "New admin added successfully!");
      setAdminDetails({
        role: "admin",
        fullName: "",
        email: "",
        phone: "",
        password: ""
      });

    } catch (error) {
      console.error("❌ Error adding admin:", error);
      let message = "Something went wrong!";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered!";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address!";
      } else if (error.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      }
      Alert.alert("Error", message);
    }
  };

  return (
    <View style={styles.main}>
      <Header navigation={navigation} title={"Add Admin"} />
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.infoLabel}>Full Name:</Text>
          <TextInput
            placeholder='Enter Full Name'
            style={styles.inputBox}
            value={adminDetails.fullName}
            onChangeText={(text) => setAdminDetails({ ...adminDetails, fullName: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.infoLabel}>Email ID:</Text>
          <TextInput
            placeholder='Enter Email ID'
            style={styles.inputBox}
            value={adminDetails.email}
            onChangeText={(text) => setAdminDetails({ ...adminDetails, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <TextInput
            placeholder='Enter Phone Number'
            style={styles.inputBox}
            value={adminDetails.phone}
            onChangeText={(text) => setAdminDetails({ ...adminDetails, phone: text })}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.infoLabel}>Password:</Text>
          <TextInput
            placeholder='Enter Password'
            style={styles.inputBox}
            value={adminDetails.password}
            onChangeText={(text) => setAdminDetails({ ...adminDetails, password: text })}
            secureTextEntry
          />
        </View>
      </View>

      <Pressable onPress={handleAddAdmin} style={styles.addBtn}>
        <Text style={styles.addLabel}>Add Admin</Text>
      </Pressable>
    </View>
  );
};

export default AddAdmin;

const styles = StyleSheet.create({
  main: { flex: 1 },
  container: { flex: 1, padding: 24 },
  inputContainer: { marginVertical: 10 },
  infoLabel: { fontWeight: "500", fontSize: 13 },
  inputBox: {
    backgroundColor: "white",
    borderRadius: 13,
    marginTop: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addBtn: {
    padding: 15,
    alignItems: "center",
    backgroundColor: "#efb71b",
    marginBottom: 30,
    borderRadius: 10,
    marginHorizontal: 24,
  },
  addLabel: { fontWeight: "600", fontSize: 18, color: "#000" },
});
