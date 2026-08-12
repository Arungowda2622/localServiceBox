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
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ManPower = ({ navigation }) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [manPowerType, setManPowerType] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [manPowerData, setManPowerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredManPowerData, setFilteredManPowerData] = useState([]);

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
        setFilteredManPowerData(list);
        setLoading(false);
      },
      error => {
        console.log("Firestore Error:", error);
        setLoading(false);
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

  const renderManPower = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setManPowerType(item.value)}
    >
      <Text style={styles.itemTitle}>{item.label}</Text>
    </TouchableOpacity>
  );

  const handleSearch = text => {
    setSearchText(text);

    if (!text.trim()) {
      setFilteredManPowerData(manPowerData);
      return;
    }

    const filtered = manPowerData.filter(item =>
      item.label.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredManPowerData(filtered);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f6f8" }}>
      <Header title="ManPower" navigation={navigation} />

      {!manPowerType && (
        <>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loaderText}>
                Loading manpower types...
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
                  placeholder="Search manpower type..."
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={handleSearch}
                />

                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText("");
                      setFilteredManPowerData(manPowerData);
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
                data={filteredManPowerData}
                keyExtractor={(item, index) =>
                  `${item.value}-${index}`
                }
                renderItem={renderManPower}
                contentContainerStyle={{
                  paddingVertical: 10,
                }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No manpower types found
                  </Text>
                }
              />
            </View>
          )}
        </>
      )}

      {manPowerType && (
        <>
          <TouchableOpacity
            style={{ padding: 16 }}
            onPress={() => {
              setManPowerType(null);
              setSearchText("");
              setFilteredManPowerData(manPowerData);
            }}
          >
            <Text style={{ color: "#007AFF", fontWeight: "600" }}>
              ← Back to Types
            </Text>
          </TouchableOpacity>

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

              <Input
                icon="briefcase"
                value={manPowerType}
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
                placeholder="Work Description *"
                multiline
                value={description}
                onChangeText={setDescription}
                height={100}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitForm}
              >
                <Icon name="whatsapp" size={22} color="#fff" />
                <Text style={styles.submitText}>
                  {" "}Send via WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
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
  itemTitle: {
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
  itemCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
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
});