import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../header/Header";

const Services = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);

  const openCamera = () => {
    launchCamera({ mediaType: "photo", quality: 0.7 }, (res) => {
      if (!res.didCancel && !res.errorCode) {
        setPhoto(res.assets[0]);
      }
    });
  };

  const openGallery = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.7 }, (res) => {
      if (!res.didCancel && !res.errorCode) {
        setPhoto(res.assets[0]);
      }
    });
  };

  const submitForm = () => {
    if (!name || !phoneNumber || !description || !address) {
      Alert.alert("Required", "Please fill all required fields");
      return;
    }

    const whatsappNumber = "916362775151"; // Admin WhatsApp

    const message = `
*🛠 Service Request*

👤 *Name:* ${name}
📞 *Phone:* ${phoneNumber}
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
      <Header title="Other Services" navigation={navigation}/>

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

          
          {/* Submit */}
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

/* ----------------- Reusable Components ----------------- */

const Input = ({
  icon,
  height = 50,
  ...props
}) => (
  <View style={[styles.inputContainer, { height }]}>
    <Icon name={icon} size={20} color="#666" />
    <TextInput
      style={styles.input}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const PhotoButton = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.photoBtn} onPress={onPress}>
    <Icon name={icon} size={22} color="#555" />
    <Text style={styles.photoText}>{text}</Text>
  </TouchableOpacity>
);

/* ----------------- Styles ----------------- */

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
  label: {
    fontWeight: "600",
    marginVertical: 10,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    width: "48%",
  },
  photoText: {
    marginLeft: 6,
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
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
