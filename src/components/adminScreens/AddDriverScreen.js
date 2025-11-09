import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { db, auth } from "../firebase/firebaseConfig";
import {
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import Header from "../header/Header";

const PRIMARY_COLOR = "#007BFF";
const ACCENT_GREEN = "#34C759";
const ACCENT_RED = "#FF3B30";
const BACKGROUND_COLOR = "#F0F4F7";
const CARD_BG = "#FFFFFF";
const TEXT_COLOR = "#1D2B36";
const SUB_TEXT_COLOR = "#555";

const AddDriverScreen = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch drivers in real-time
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const driverList = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => d.role === "driver");
      setDrivers(driverList);
      setFilteredDrivers(driverList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Generate driver ID like DRV0001
  const generateDriverId = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const count = snapshot.size + 1;
    return `DRV${String(count).padStart(4, "0")}`;
  };

  // 🔹 Reset Form
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setVehicleNumber("");
    setLicenseNumber("");
    setCity("");
    setEditingDriver(null);
  };

  // 🔹 Add / Update driver
  const handleSaveDriver = async () => {
    if (!name || !email || !phone || !vehicleNumber || !licenseNumber || !city) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setSaving(true);
      const password = "pass123";

      if (editingDriver) {
        // ✅ Update driver
        const ref = doc(db, "users", editingDriver.id);
        await updateDoc(ref, {
          fullName: name,
          email,
          phone,
          vehicleNumber,
          licenseNumber,
          city,
          updatedAt: serverTimestamp(),
        });
        Alert.alert("✅ Updated", "Driver details updated successfully");
      } else {
        // ✅ New driver
        const driverId = await generateDriverId();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          driverId, // 🔹 store custom driver ID
          fullName: name,
          email,
          phone,
          password,
          role: "driver",
          status: "available",
          licenseNumber,
          vehicleNumber,
          city,
          createdAt: serverTimestamp(),
        });

        Alert.alert(
          "✅ Driver Added",
          `Driver created successfully!\n\nDriver ID: ${driverId}\nEmail: ${email}\nPassword: ${password}`
        );
      }

      resetForm();
      setFormVisible(false);
    } catch (error) {
      console.error("❌ Error saving driver:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email already exists.");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Delete driver
  const handleDeleteDriver = (driverId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this driver?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", driverId));
            Alert.alert("Deleted ✅", "Driver removed successfully");
          } catch (error) {
            console.error("Error deleting driver:", error);
            Alert.alert("Error", "Failed to delete driver");
          }
        },
      },
    ]);
  };

  // 🔹 Filter drivers by search text (fullName or driverId)
  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter(
        (d) =>
          d.fullName?.toLowerCase().includes(text.toLowerCase()) ||
          d.driverId?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  };

  const renderDriver = ({ item }) => (
    <View style={styles.driverCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.driverName}>
          <Ionicons name="person-circle-outline" size={20} color={PRIMARY_COLOR} />{" "}
          {item.fullName} ({item.driverId || "N/A"})
        </Text>
        <Text style={[styles.statusPill, { backgroundColor: item.status === "available" ? ACCENT_GREEN : ACCENT_RED }]}>
          {item.status?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={16} color={SUB_TEXT_COLOR} />
          <Text style={styles.driverInfoText}>{item.email}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color={SUB_TEXT_COLOR} />
          <Text style={styles.driverInfoText}>{item.phone}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="car-outline" size={16} color={SUB_TEXT_COLOR} />
          <Text style={styles.driverInfoText}>{item.vehicleNumber}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="id-card-outline" size={16} color={SUB_TEXT_COLOR} />
          <Text style={styles.driverInfoText}>{item.licenseNumber}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => handleEditDriver(item)}
          style={[styles.actionButton, styles.editButton]}
        >
          <Ionicons name="create-outline" size={18} color={PRIMARY_COLOR} />
          <Text style={[styles.actionButtonText, { color: PRIMARY_COLOR }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteDriver(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Ionicons name="trash-outline" size={18} color={ACCENT_RED} />
          <Text style={[styles.actionButtonText, { color: ACCENT_RED }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_COLOR} />
      <Header navigation={navigation} title={"Manage Drivers"} />

      {/* 🔹 Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={SUB_TEXT_COLOR} />
        <TextInput
          placeholder="Search by name or driver ID..."
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      <TouchableOpacity
        style={styles.addDriverButton}
        onPress={() => {
          resetForm();
          setFormVisible(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={24} color="#FFF" />
        <Text style={styles.addDriverText}>Add New Driver</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 40 }} />
      ) : filteredDrivers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-sport-outline" size={60} color="#CCC" />
          <Text style={styles.noDrivers}>No drivers found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDrivers}
          renderItem={renderDriver}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingDriver ? "Edit Driver Details" : "Register New Driver"}
            </Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Driver Name" />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="driver@example.com"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g., KA 01 AB 1234"
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>License Number</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="e.g., DL-123456"
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Enter city name" />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: PRIMARY_COLOR, marginTop: 20 }]}
              onPress={handleSaveDriver}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  <Ionicons
                    name={editingDriver ? "save-outline" : "add-circle-outline"}
                    size={18}
                    color="#FFF"
                  />{" "}
                  {editingDriver ? "Update Driver" : "Save Driver"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default AddDriverScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  flatListContent: { paddingHorizontal: 15, paddingBottom: 100 },
  addDriverButton: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    paddingVertical: 15,
    margin: 15,
  },
  addDriverText: { color: "#FFF", fontWeight: "700", fontSize: 17, marginLeft: 8 },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: TEXT_COLOR },
  driverCard: {
    backgroundColor: CARD_BG,
    borderRadius: 15,
    padding: 18,
    marginVertical: 8,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: PRIMARY_COLOR,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  driverName: { fontSize: 18, fontWeight: "800", color: TEXT_COLOR },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    color: "#FFF",
  },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  detailItem: { width: "50%", flexDirection: "row", alignItems: "center", marginBottom: 6 },
  driverInfoText: { fontSize: 14, color: SUB_TEXT_COLOR, fontWeight: "500" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  editButton: { borderColor: PRIMARY_COLOR + "30", backgroundColor: PRIMARY_COLOR + "05" },
  deleteButton: { borderColor: ACCENT_RED + "30", backgroundColor: ACCENT_RED + "05" },
  actionButtonText: { fontWeight: "600", fontSize: 14, marginLeft: 5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  noDrivers: { textAlign: "center", fontSize: 16, color: SUB_TEXT_COLOR, marginTop: 15 },
  modalContainer: { padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: TEXT_COLOR, marginBottom: 10 },
  inputLabel: { fontSize: 14, color: TEXT_COLOR, fontWeight: "600", marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  button: {
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
