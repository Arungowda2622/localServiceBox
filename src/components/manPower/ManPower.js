import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../header/Header"
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ManPower = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [manPowerType, setManPowerType] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [manPowerData, setManPowerData] = useState([]);

  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "manpower_types"),
    snapshot => {
      const list = [];

      snapshot.forEach(doc => {
        list.push({
          label: doc.data().name,
          value: doc.data().name,
        });
      });

      setManPowerData(list);
    }
  );

  return unsubscribe;
}, []);

  const submitForm = () => {
    if (!name || !phoneNumber || !manPowerType || !description || !address) {
      Alert.alert("Required", "Please fill all required fields");
      return;
    }

    const whatsappNumber = "916362775151";

    const message = `
👷 *ManPower Request*

👤 *Name:* ${name}
📞 *Phone:* ${phoneNumber}
🧰 *ManPower Type:* ${manPowerType}
📍 *Address:* ${address}
📝 *Description:* ${description}
`;

    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "WhatsApp is not installed")
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f8" }}>
      <Header title="ManPower" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>ManPower Details</Text>

          <Input
            icon="account"
            placeholder="Your Name *"
            value={name}
            onChangeText={setName}
          />

          <Input
            icon="phone"
            placeholder="Contact Number *"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          {/* ✅ Dropdown */}
          <View
            style={[
              styles.dropdownContainer,
              isFocus && { borderColor: "#25D366" },
            ]}
          >
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={manPowerData}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select ManPower Type *" : "..."}
              searchPlaceholder="Search..."
              value={manPowerType}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setManPowerType(item.value);
                setIsFocus(false);
              }}
            />
          </View>

          <Input
            icon="map-marker"
            placeholder="Address *"
            multiline
            value={address}
            onChangeText={setAddress}
            height={80}
          />

          <Input
            icon="text"
            placeholder="Work Description *"
            multiline
            value={description}
            onChangeText={setDescription}
            height={100}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
            <Icon name="whatsapp" size={22} color="#fff" />
            <Text style={styles.submitText}> Send via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ManPower;

/* ---------------- Reusable Input ---------------- */

const Input = ({ icon, height = 50, ...props }) => (
  <View style={[styles.inputContainer, { height }]}>
    <Icon name={icon} size={20} color="#666" />
    <TextInput
      style={styles.input}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#000",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dropdown: {
    height: 50,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#000",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  icon: {
    marginRight: 8,
  },
  submitBtn: {
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
