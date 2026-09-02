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
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../header/Header";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { waitForAuthUser } from "../../utils/authUtils";

const Services = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [serviceType, setServiceType] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
const [filteredServices, setFilteredServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, "services"),
      snapshot => {
        const list = [];

        snapshot.forEach(doc => {
          list.push({
            label: doc.data().name,
            value: doc.data().name,
          });
        });

        setServiceData(list);
setFilteredServices(list);
setLoading(false);
      },
      error => {
        console.log("Firestore Error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const submitForm = async () => {
    if (isSubmitting) return;

    if (
      !name.trim() ||
      !phoneNumber.trim() ||
      !serviceType ||
      !description.trim() ||
      !address.trim()
    ) {
      Alert.alert("Required", "Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await waitForAuthUser();

      if (!user) {
        Alert.alert("Error", "Unable to get your account. Please try again.");
        return;
      }

      await addDoc(collection(db, "serviceBookings"), {
        userId: user.uid,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        serviceType,
        description: description.trim(),
        address: address.trim(),
        status: "pending",
        submittedVia: "whatsapp",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.log("Service booking error:", error);
      Alert.alert("Error", "Unable to save your request. Please try again.");
      setIsSubmitting(false);
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

    setIsSubmitting(false);
  };

  const handleSearch = text => {
  setSearchText(text);

  if (!text.trim()) {
    setFilteredServices(serviceData);
    return;
  }

  const filtered = serviceData.filter(item =>
    item.label.toLowerCase().includes(text.toLowerCase())
  );

  setFilteredServices(filtered);
};

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f8" }}>
      <Header title="Other Services" navigation={navigation} />

      {serviceType && (
        <TouchableOpacity
          onPress={() => setServiceType(null)}
          style={{
            alignSelf: "flex-end",
            marginBottom: 10,
            marginRight: 20,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "#007AFF", fontWeight: "600" }}>
            Change Service
          </Text>
        </TouchableOpacity>
      )}

      {!serviceType &&
        (loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#25D366" />
            <Text style={styles.loadingText}>Loading Services...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
  <View style={styles.searchContainer}>
    <Icon
      name="magnify"
      size={22}
      color="#666"
      style={{ marginRight: 8 }}
    />

    <TextInput
      style={styles.searchInput}
      placeholder="Search services..."
      placeholderTextColor="#999"
      value={searchText}
      onChangeText={handleSearch}
    />

    {searchText.length > 0 && (
      <TouchableOpacity
        onPress={() => {
          setSearchText("");
          setFilteredServices(serviceData);
        }}
      >
        <Icon
          name="close-circle"
          size={22}
          color="#999"
        />
      </TouchableOpacity>
    )}
  </View>

  <FlatList
    data={filteredServices}
    keyExtractor={(item, index) => `${item.value}-${index}`}
    contentContainerStyle={{
      paddingVertical: 10,
    }}
    keyboardShouldPersistTaps="handled"
    ListEmptyComponent={() => (
      <Text style={styles.noResultText}>
        No services found
      </Text>
    )}
    renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() => setServiceType(item.value)}
        style={styles.itemCard}
      >
        <Text style={styles.dropdownItem}>
          {item.label}
        </Text>
      </TouchableOpacity>
    )}
  />
</View>
        ))}

      {serviceType && (
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
              icon="text"
              placeholder="Service Type"
              multiline
              value={serviceType}
              height={100}
              editable={false}
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

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitForm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="whatsapp" size={22} color="#fff" />
              )}
              <Text style={styles.submitText}>
                {isSubmitting ? " Saving..." : " Send via WhatsApp"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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

  itemCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#d1e7dd",
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 13,
  },

  dropdownItem: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  searchContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  marginHorizontal: 10,
  marginTop: 10,
  paddingHorizontal: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#ddd",
  elevation: 2,
},

searchInput: {
  flex: 1,
  height: 50,
  color: "#000",
},

noResultText: {
  textAlign: "center",
  marginTop: 40,
  fontSize: 16,
  color: "#666",
},
});