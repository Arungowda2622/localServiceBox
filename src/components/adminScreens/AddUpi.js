import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import Header from '../header/Header';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AddUpi = ({ navigation }) => {
  const [upi, setUpi] = useState("");
  const auth = getAuth();

  const handleSaveUPI = async () => {
    if (!upi || !upi.includes('@')) {
      Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. xyz@ybl)");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not logged in!");
        return;
      }

      await addDoc(collection(db, "upi_ids"), {
        userId: user.uid,
        upi,
        createdAt: new Date().toISOString()
      });

      Alert.alert("Success ✅", "UPI added successfully!");
      navigation.goBack();

    } catch (error) {
      console.log("Error saving UPI:", error);
      Alert.alert("Error", "Failed to save UPI. Try again!");
    }
  }

  return (
    <View style={styles.main}>
      <Header navigation={navigation} title="Add UPI" />
      
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.infoLabel}>Enter Your UPI ID</Text>
          <TextInput
            placeholder="xyz@ybl"
            style={styles.inputBox}
            value={upi}
            onChangeText={setUpi}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveUPI}>
          <Text style={styles.saveButtonText}>Save UPI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddUpi;

const styles = StyleSheet.create({
  main: { flex: 1 },
  container: { flex: 1, padding: 24 },
  inputContainer: { marginVertical: 10 },
  infoLabel: { fontWeight: "500", fontSize: 13, marginBottom: 5 },
  inputBox: {
    backgroundColor: "white",
    borderRadius: 13,
    paddingHorizontal: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  saveButton: {
    backgroundColor: "#efb71bff",
    padding: 15,
    alignItems: "center",
    marginTop: 25,
    borderRadius: 12
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000"
  }
});
