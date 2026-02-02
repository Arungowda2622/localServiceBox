import React, { useState } from "react";
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
import AntDesign from "react-native-vector-icons/AntDesign";
import Header from "../header/Header";

const serviceData = [
  { label: "Plumber", value: "Plumber" },
  { label: "Welder", value: "Welder" },
  { label: "Construction Materials", value: "Construction Materials" },
  { label: "Construction Works", value: "Construction Works" },
  { label: "Electrician", value: "Electrician" },
  { label: "Other Services", value: "Other Services" },
];

const Services = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [serviceType, setServiceType] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [isFocus, setIsFocus] = useState(false);

  const submitForm = () => {
    if (!name || !phoneNumber || !serviceType || !description || !address) {
      Alert.alert("Required", "Please fill all required fields");
      return;
    }

    const whatsappNumber = "916362775151";

    const message = `
*🛠 Service Request*

👤 *Name:* ${name}
📞 *Phone:* ${phoneNumber}
🧰 *Service Type:* ${serviceType}
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
      <Header title="Other Services" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Service Details</Text>

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

          {/* ✅ Service Dropdown */}
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
              data={serviceData}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select Service Type *" : "..."}
              searchPlaceholder="Search..."
              value={serviceType}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setServiceType(item.value);
                setIsFocus(false);
              }}
              renderLeftIcon={() => (
                <AntDesign
                  style={styles.icon}
                  color={isFocus ? "#25D366" : "#666"}
                  name="Safety"
                  size={20}
                />
              )}
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
            placeholder="Service Description *"
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

export default Services;

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

  /* Dropdown styles */
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
