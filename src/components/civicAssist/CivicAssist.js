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

const CivicAssist = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [civicType, setCivicType] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [civicData, setCivicData] = useState([]);
  const [filteredCivicData, setFilteredCivicData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= FETCH CIVIC TYPES ================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "civic_assist"),
      (snapshot) => {
        const list = [];

        snapshot.forEach((doc) => {
          list.push({
            label: doc.data().name,
            value: doc.data().name,
          });
        });

        setCivicData(list);
        setFilteredCivicData(list);
        setLoading(false);
      },
      (error) => {
        console.log("Firestore Error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /* ================= SEARCH ================= */

  const handleSearch = (text) => {
    setSearchText(text);

    if (!text.trim()) {
      setFilteredCivicData(civicData);
      return;
    }

    const filtered = civicData.filter((item) =>
      item.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredCivicData(filtered);
  };

  /* ================= SUBMIT ================= */

 const submitForm = async () => {
  if (isSubmitting) return;

  if (
    !name.trim() ||
    !phoneNumber.trim() ||
    !civicType ||
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
      Alert.alert(
        "Error",
        "Unable to get your account. Please try again."
      );
      return;
    }

    // ================= SAVE TO FIRESTORE =================

    await addDoc(collection(db, "civicBookings"), {
      userId: user.uid,

      name: name.trim(),

      phoneNumber: phoneNumber.trim(),

      civicType: civicType,

      description: description.trim(),

      address: address.trim(),

      status: "pending",

      submittedVia: "whatsapp",

      createdAt: serverTimestamp(),
    });

    // ================= WHATSAPP =================

    const whatsappNumber = "916362775151";

    const message = `
🏛️ *Civic Assist Request*

👤 Name: ${name}
📞 Phone: ${phoneNumber}
📌 Service: ${civicType}
📍 Address: ${address}

📝 Description:
${description}
`;

    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Error",
        "WhatsApp is not installed"
      )
    );

  } catch (error) {
    console.log(
      "Civic Assist booking error:",
      error
    );

    Alert.alert(
      "Error",
      "Unable to save your request. Please try again."
    );

  } finally {
    setIsSubmitting(false);
  }
};

  /* ================= CARD ================= */

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setCivicType(item.value)}
    >
      <Icon name="shield-check-outline" size={24} color="#007AFF" />
      <Text style={styles.itemTitle}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f8" }}>
      <Header title="Civic Assist" navigation={navigation} />

      {/* SERVICE LIST */}

      {!civicType && (
        <>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loaderText}>
                Loading civic services...
              </Text>
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
                  placeholder="Search civic service..."
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={handleSearch}
                />

                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText("");
                      setFilteredCivicData(civicData);
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
                data={filteredCivicData}
                keyExtractor={(item, index) =>
                  `${item.value}-${index}`
                }
                renderItem={renderItem}
                contentContainerStyle={{ paddingVertical: 10 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No civic services found
                  </Text>
                }
              />
            </View>
          )}
        </>
      )}

      {/* FORM */}

      {civicType && (
        <>
          <TouchableOpacity
            style={{ padding: 16 }}
            onPress={() => {
              setCivicType(null);
              setSearchText("");
              setFilteredCivicData(civicData);
            }}
          >
            <Text style={{ color: "#007AFF", fontWeight: "600" }}>
              ← Back to Services
            </Text>
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
              <Text style={styles.title}>Civic Assist Details</Text>

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
                icon="shield-check-outline"
                value={civicType}
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
                placeholder="Describe your issue *"
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
        </>
      )}
    </View>
  );
};

export default CivicAssist;

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
  container: { padding: 16 },

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

  itemCard: {
    backgroundColor: "#fff",
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },

  itemTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
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

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
    fontSize: 16,
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
});