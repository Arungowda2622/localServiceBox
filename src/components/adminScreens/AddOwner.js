import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import Header from "../header/Header";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import colors from "../theme/colors";

const DEFAULT_PASSWORD = "pass123";

const AddOwner = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddOwner = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Validation", "Please enter name and email.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 1. CREATE AUTH USER
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        DEFAULT_PASSWORD
      );

      const user = userCredential.user;

      // 🔥 2. SAVE USER IN FIRESTORE
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email: email.trim().toLowerCase(),
        phone: phone || null,
        role: "shopOwner",
        createdBy: "admin",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        `Shop owner created.\n\nLogin password: ${DEFAULT_PASSWORD}`
      );

      navigation.goBack();
    } catch (err) {
      console.error("AddOwner error:", err);

      if (err.code === "auth/email-already-in-use") {
        Alert.alert("Error", "Email already exists.");
      } else {
        Alert.alert("Error", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header navigation={navigation} title={"Add Owner"} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholder="Full name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAddOwner}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Add Shop Owner"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 14, color: "#666", marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});

export default AddOwner;
