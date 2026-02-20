import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import Header from "../header/Header";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AddManPower = ({ navigation }) => {
  const auth = getAuth();

  const [manpowerList, setManpowerList] = useState([]);
  const [name, setName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "manpower_types"),
      snapshot => {
        const list = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        setManpowerList(list);
      }
    );

    return unsubscribe;
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSave = async () => {
    if (!name) {
      Alert.alert("Enter ManPower Type");
      return;
    }

    try {
      const user = auth.currentUser;

      if (editId) {
        // 🔥 UPDATE
        await updateDoc(doc(db, "manpower_types", editId), {
          name,
        });
      } else {
        // 🔥 ADD
        await addDoc(collection(db, "manpower_types"), {
          userId: user.uid,
          name,
          createdAt: new Date().toISOString(),
        });
      }

      setName("");
      setEditId(null);
      setModalVisible(false);
    } catch (e) {
      console.log(e);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = id => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await deleteDoc(doc(db, "manpower_types", id));
        },
      },
    ]);
  };

  /* ================= EDIT ================= */
  const handleEdit = item => {
    setName(item.name);
    setEditId(item.id);
    setModalVisible(true);
  };

  /* ================= UI ================= */
  return (
    <View style={styles.main}>
      <Header navigation={navigation} title="ManPower Manager" />

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setName("");
          setEditId(null);
          setModalVisible(true);
        }}
      >
        <Icon name="plus" size={22} color="#fff" />
        <Text style={{ color: "#fff", marginLeft: 8 }}>
          Add ManPower Type
        </Text>
      </TouchableOpacity>

      {/* LIST */}
      <FlatList
        data={manpowerList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>{item.name}</Text>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Icon name="pencil" size={22} color="#2E86DE" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginLeft: 15 }}
                onPress={() => handleDelete(item.id)}
              >
                <Icon name="delete" size={22} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editId ? "Edit ManPower" : "Add ManPower"}
            </Text>

            <TextInput
              placeholder="Ex: Mason"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: "#fff" }}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddManPower;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: "#f4f6f8" },

  addBtn: {
    backgroundColor: "#efb71bff",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },

  text: {
    fontSize: 16,
    fontWeight: "600",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
  },

  saveBtn: {
    backgroundColor: "#25D366",
    padding: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },

  cancelBtn: {
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
});