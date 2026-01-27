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
  getDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
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

  // 🔹 Fetch drivers (realtime)
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const driverList = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "driver");

      setDrivers(driverList);
      setFilteredDrivers(driverList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Generate incremental DRV ID safely
  const generateDriverId = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    let maxId = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.driverId) {
        const num = parseInt(data.driverId.replace("DRV", ""));
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });

    return `DRV${String(maxId + 1).padStart(4, "0")}`;
  };

  // 🔹 Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setVehicleNumber("");
    setLicenseNumber("");
    setCity("");

    setEditingDriver(null);
  };

  // 🔹 EDIT driver → Fill form
  const handleEditDriver = (driver) => {
    setEditingDriver(driver);

    setName(driver.fullName || "");
    setEmail(driver.email || "");
    setPhone(driver.phone || "");
    setVehicleNumber(driver.vehicleNumber || "");
    setLicenseNumber(driver.licenseNumber || "");
    setCity(driver.city || "");

    setFormVisible(true);
  };

  // 🔹 Validate & Save
  const handleSaveDriver = async () => {
    if (
      !name ||
      !email ||
      !phone ||
      !vehicleNumber ||
      !licenseNumber ||
      !city
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Error", "Phone number must be 10 digits.");
      return;
    }

    try {
      setSaving(true);

      if (editingDriver) {
        // Update driver
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

        Alert.alert("Updated", "Driver updated successfully");
      } else {
        // Create new Firestore-only driver
        const driverId = await generateDriverId();

        await setDoc(doc(db, "users", driverId), {
          id: driverId,
          driverId,
          fullName: name,
          email,
          phone,
          role: "driver",
          status: "available",
          licenseNumber,
          vehicleNumber,
          city,
          createdAt: serverTimestamp(),
        });

        Alert.alert(
          "Driver Added",
          `Driver created successfully!\nDriver ID: ${driverId}`
        );
      }

      resetForm();
      setFormVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Delete Driver
  const handleDeleteDriver = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this driver?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", id));
              Alert.alert("Deleted", "Driver removed successfully.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete driver.");
            }
          },
        },
      ]
    );
  };

  // ===== Driver History Modal & Logic =====
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyDriver, setHistoryDriver] = useState(null);
  const [fromDateText, setFromDateText] = useState("");
  const [toDateText, setToDateText] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyResult, setHistoryResult] = useState({ count: 0, total: 0 });
  const [historyEntries, setHistoryEntries] = useState([]);

  const openHistoryModal = (driver) => {
    setHistoryDriver(driver);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7);
    const fmt = (d) => d.toISOString().slice(0, 10);
    setFromDateText(fmt(from));
    setToDateText(fmt(to));
    setHistoryResult({ count: 0, total: 0 });
    setHistoryEntries([]);
    setHistoryModalVisible(true);
  };

  const fetchDriverHistory = async () => {
    if (!historyDriver) return;

    const parseDate = (s, endOfDay = false) => {
      const parts = s.split("-");
      if (parts.length !== 3) return null;
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (endOfDay) d.setHours(23,59,59,999); else d.setHours(0,0,0,0);
      return d;
    };

    const from = parseDate(fromDateText);
    const to = parseDate(toDateText, true);
    if (!from || !to || from > to) {
      Alert.alert('Invalid Dates', 'Please enter a valid date range (YYYY-MM-DD).');
      return;
    }

    setHistoryLoading(true);
    try {
      const entries = [];

      // rides
      const bookingsSnap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
      bookingsSnap.forEach((d) => {
        const b = d.data();
        if (b.driverId === historyDriver.id) {
          const cd = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : null);
          if (cd && cd >= from && cd <= to) entries.push({ id: d.id, type: 'ride', date: cd, fare: b.fare || 0, customerId: b.userId });
        }
      });

      // box deliveries
      const boxSnap = await getDocs(query(collection(db, 'boxDelivery'), orderBy('createdAt', 'desc')));
      boxSnap.forEach((d) => {
        const b = d.data();
        if (b.driverId === historyDriver.id) {
          const cd = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : null);
          if (cd && cd >= from && cd <= to) entries.push({ id: d.id, type: 'box', date: cd, fare: b.fare || b.price || 0, customerId: b.userId });
        }
      });

      const enriched = await Promise.all(entries.map(async (e) => {
        let customerName = '';
        try {
          if (e.customerId) {
            const usnap = await getDoc(doc(db, 'users', e.customerId));
            if (usnap.exists()) customerName = usnap.data()?.fullName || '';
          }
        } catch (err) {
          // ignore
        }
        return { ...e, customerName };
      }));

      const total = enriched.reduce((s, it) => s + (parseFloat(it.fare) || 0), 0);
      setHistoryEntries(enriched.sort((a,b)=>b.date - a.date));
      setHistoryResult({ count: enriched.length, total });
    } catch (err) {
      console.error('Failed to fetch driver history', err);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 🔹 Filter list
  const handleSearch = (text) => {
    setSearchText(text);

    if (text.trim() === "") return setFilteredDrivers(drivers);

    const filtered = drivers.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(text.toLowerCase()) ||
        d.driverId?.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredDrivers(filtered);
  };

  // 🔹 Render Driver Card
  const renderDriver = ({ item }) => (
    <View style={styles.driverCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.driverName}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={PRIMARY_COLOR}
          />{" "}
          {item.fullName} ({item.driverId})
        </Text>

        <Text
          style={[
            styles.statusPill,
            {
              backgroundColor:
                item.status === "available" ? ACCENT_GREEN : ACCENT_RED,
            },
          ]}
        >
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
          <Text style={[styles.actionButtonText, { color: PRIMARY_COLOR }]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openHistoryModal(item)}
          style={[styles.actionButton, styles.historyButton]}
        >
          <Ionicons name="time-outline" size={18} color="#6B21A8" />
          <Text style={[styles.actionButtonText, { color: '#6B21A8' }]}>History</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={SUB_TEXT_COLOR} />
        <TextInput
          placeholder="Search by name or driver ID..."
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Add New Driver Button */}
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

      {/* Driver List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={PRIMARY_COLOR}
          style={{ marginTop: 40 }}
        />
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
      <Modal visible={formVisible} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingDriver ? "Edit Driver Details" : "Register New Driver"}
            </Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Driver Name"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                editingDriver && { backgroundColor: "#EEE" },
              ]}
              value={email}
              editable={!editingDriver}
              onChangeText={!editingDriver ? setEmail : undefined}
              placeholder="driver@example.com"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              placeholder="e.g., KA01AB1234"
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
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city name"
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: PRIMARY_COLOR, marginTop: 20 },
              ]}
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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: ACCENT_RED, marginTop: 10 },
              ]}
              onPress={() => setFormVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Driver History Modal ===== */}
      <Modal visible={historyModalVisible} animationType="slide">
        <View style={{ flex: 1, marginTop: 40}}>
        <Header
          navigation={{
            goBack: () => setHistoryModalVisible(false),
          }}
          title="Driver History"
        />
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={styles.modalTitle}>
            {historyDriver ? `History — ${historyDriver.fullName}` : 'Driver History'}
          </Text>

          <Text style={styles.inputLabel}>From (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={fromDateText} onChangeText={setFromDateText} />

          <Text style={styles.inputLabel}>To (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={toDateText} onChangeText={setToDateText} />

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <TouchableOpacity onPress={fetchDriverHistory} style={[styles.button, { backgroundColor: PRIMARY_COLOR, marginRight: 8 }] }>
              {historyLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Load</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={[styles.button, { backgroundColor: ACCENT_RED }] }>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: '700' }}>Total Trips: {historyResult.count}</Text>
            <Text style={{ fontWeight: '700', marginTop: 6 }}>Total Earnings: ₹ {historyResult.total.toFixed(2)}</Text>
          </View>

          <View style={{ marginTop: 12, flex: 1 }}>
            {historyEntries.length === 0 ? (
              <Text style={{ marginTop: 20, color: '#666' }}>No trips for selected range.</Text>
            ) : (
              <FlatList
                data={historyEntries}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                    <Text style={{ fontWeight: '700' }}>{item.type === 'ride' ? 'Ride' : 'Box'}</Text>
                    <Text style={{ color: '#444' }}>{item.customerName || 'Customer' } • {item.date.toISOString().slice(0,19).replace('T',' ')}</Text>
                    <Text style={{ marginTop: 6, fontWeight: '700' }}>₹ {item.fare}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddDriverScreen;

/* --- STYLES --- */
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
  addDriverText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 8,
  },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  driverName: { fontSize: 18, fontWeight: "800", color: TEXT_COLOR },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
    overflow: "hidden",
  },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  driverInfoText: { fontSize: 14, color: SUB_TEXT_COLOR, fontWeight: "500" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  editButton: {
    borderColor: PRIMARY_COLOR + "30",
    backgroundColor: PRIMARY_COLOR + "05",
  },
  deleteButton: {
    borderColor: ACCENT_RED + "30",
    backgroundColor: ACCENT_RED + "05",
  },
  historyButton: {
    borderColor: '#6B21A8' + '30',
    backgroundColor: '#6B21A8' + '05',
  },
  actionButtonText: { fontWeight: "600", fontSize: 14, marginLeft: 5 },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  noDrivers: {
    textAlign: "center",
    fontSize: 16,
    color: SUB_TEXT_COLOR,
    marginTop: 15,
  },

  modalContainer: { padding: 20, paddingBottom: 50 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT_COLOR,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: TEXT_COLOR,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
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
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
