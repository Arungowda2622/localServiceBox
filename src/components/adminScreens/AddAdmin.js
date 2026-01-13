import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from "react-native";

import { auth, db } from "../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { createUserWithEmailAndPassword } from "firebase/auth";
import Header from "../header/Header";

const AdminManager = ({ navigation }) => {
  const [admins, setAdmins] = useState([]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [adminDetails, setAdminDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [editingAdmin, setEditingAdmin] = useState(null);

  /* 🔥 Fetch admins real-time */
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdmins(data);
    });

    return () => unsub();
  }, []);

  /* 🟢 Add admin */
  const handleAddAdmin = async () => {
    const { fullName, email, phone, password } = adminDetails;

    if (!fullName || !email || !phone || !password) {
      Alert.alert("Missing Fields", "All fields are required.");
      return;
    }

    try {
      const emailSnap = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );
      if (!emailSnap.empty)
        return Alert.alert("Error", "Email already exists!");

      const phoneSnap = await getDocs(
        query(collection(db, "users"), where("phone", "==", phone))
      );
      if (!phoneSnap.empty)
        return Alert.alert("Error", "Phone already exists!");

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        fullName,
        email,
        phone,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      setAdminDetails({ fullName: "", email: "", phone: "", password: "" });
      setAddModalVisible(false);

      Alert.alert("Success", "Admin added!");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  /* ✏️ Edit admin */
  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, "users", editingAdmin.id), {
        fullName: editingAdmin.fullName,
        phone: editingAdmin.phone,
      });

      setEditModalVisible(false);
      setEditingAdmin(null);
      Alert.alert("Success", "Admin updated!");
    } catch {
      Alert.alert("Error", "Update failed.");
    }
  };

  /* ❌ Delete admin */
  const handleDeleteAdmin = (id) => {
    Alert.alert("Delete Admin", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", id));
            Alert.alert("Deleted", "Admin removed.");
          } catch {
            Alert.alert("Error", "Could not delete admin.");
          }
        },
      },
    ]);
  };

  /* 🧾 Render admin card */
  const renderAdmin = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={styles.info}>📧 {item.email}</Text>
      <Text style={styles.info}>📞 {item.phone}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            setEditingAdmin(item);
            setEditModalVisible(true);
          }}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteAdmin(item.id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Admin Manager" navigation={navigation} />
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addText}>+ Add Admin</Text>
        </TouchableOpacity>

        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          renderItem={renderAdmin}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={styles.listFooter} />}
          showsVerticalScrollIndicator={false}
        />

        {/* ADD MODAL */}
        <Modal visible={addModalVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalBox}>
              <Text style={styles.modalHeader}>Add New Admin</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={adminDetails.fullName}
                onChangeText={(t) =>
                  setAdminDetails({ ...adminDetails, fullName: t })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={adminDetails.email}
                onChangeText={(t) =>
                  setAdminDetails({ ...adminDetails, email: t })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                keyboardType="phone-pad"
                maxLength={10}
                value={adminDetails.phone}
                onChangeText={(t) =>
                  setAdminDetails({ ...adminDetails, phone: t })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={adminDetails.password}
                onChangeText={(t) =>
                  setAdminDetails({ ...adminDetails, password: t })
                }
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAdmin}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* EDIT MODAL */}
        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={styles.modalWrapper}>
            <View style={styles.modalBox}>
              <Text style={styles.modalHeader}>Edit Admin</Text>

              <TextInput
                style={styles.input}
                value={editingAdmin?.fullName}
                onChangeText={(t) =>
                  setEditingAdmin({ ...editingAdmin, fullName: t })
                }
              />

              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                value={editingAdmin?.phone}
                onChangeText={(t) =>
                  setEditingAdmin({ ...editingAdmin, phone: t })
                }
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleEditSave}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default AdminManager;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  addBtn: {
    backgroundColor: "#efb71b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 15,
  },
  addText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },

  listContent: {
    paddingBottom: 20,
  },
  listFooter: {
    height: 60,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    marginTop: 5,
    color: "#555",
  },

  row: {
    flexDirection: "row",
    marginTop: 10,
  },

  editBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#007bff",
    marginRight: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#e53935",
    marginLeft: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },

  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  saveBtn: {
    backgroundColor: "green",
    padding: 12,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#777",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
