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
  ActivityIndicator,
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

import { waitForAuthUser } from "../../utils/authUtils";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const AddCivicAssist = ({ navigation }) => {
  const [civicAssistList, setCivicAssistList] = useState([]);

  const [name, setName] = useState("");

  const [modalVisible, setModalVisible] = useState(false);

  const [editId, setEditId] = useState(null);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  /* =====================================================
     FETCH CIVIC ASSIST DATA
  ===================================================== */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "civic_assist"),
      (snapshot) => {
        const list = [];

        snapshot.forEach((d) => {
          list.push({
            id: d.id,
            ...d.data(),
          });
        });

        setCivicAssistList(list);
      },
      (error) => {
        console.log("Civic Assist fetch error:", error);
      }
    );

    return unsubscribe;
  }, []);

  /* =====================================================
     ADD / UPDATE
  ===================================================== */

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Enter Civic Assist Type");
      return;
    }

    setSaving(true);

    try {
      const user = await waitForAuthUser();

      if (!user) {
        Alert.alert(
          "Error",
          "Still loading your session. Please try again in a moment."
        );
        return;
      }

      /* ================= UPDATE ================= */

      if (editId) {
        await updateDoc(doc(db, "civic_assist", editId), {
          name: name.trim(),
          updatedAt: new Date().toISOString(),
        });
      }

      /* ================= ADD ================= */

      else {
        await addDoc(collection(db, "civic_assist"), {
          userId: user.uid,
          name: name.trim(),
          createdAt: new Date().toISOString(),
        });
      }

      // Reset form

      setName("");
      setEditId(null);
      setModalVisible(false);
    } catch (e) {
      console.log("Civic Assist save error:", e);

      Alert.alert(
        "Error",
        "Unable to save Civic Assist. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = (id) => {
    setDeletingId(id);

    Alert.alert(
      "Delete Civic Assist",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setDeletingId(null),
        },

        {
          text: "Yes",
          style: "destructive",

          onPress: async () => {
            try {
              await deleteDoc(doc(db, "civic_assist", id));
            } catch (error) {
              console.log("Delete error:", error);

              Alert.alert(
                "Error",
                "Unable to delete this item."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const handleEdit = (item) => {
    setName(item.name || "");
    setEditId(item.id);
    setModalVisible(true);
  };

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const handleAdd = () => {
    setName("");
    setEditId(null);
    setModalVisible(true);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <View style={styles.main}>

      {/* HEADER */}

      <Header
        navigation={navigation}
        title="Civic Assist Manager"
      />

      {/* ADD BUTTON */}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Icon
          name="plus"
          size={22}
          color="#fff"
        />

        <Text style={styles.addBtnText}>
          Add Civic Assist
        </Text>
      </TouchableOpacity>

      {/* LIST */}

      <FlatList
        data={civicAssistList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>

            {/* NAME */}

            <Text
              style={styles.text}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* ACTION BUTTONS */}

            <View style={styles.actions}>

              {/* EDIT */}

              <TouchableOpacity
                onPress={() => handleEdit(item)}
                activeOpacity={0.7}
              >
                <Icon
                  name="pencil"
                  size={22}
                  color="#2E86DE"
                />
              </TouchableOpacity>

              {/* DELETE */}

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  {
                    opacity:
                      deletingId === item.id
                        ? 0.6
                        : 1,
                  },
                ]}
                onPress={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator
                    color="red"
                    size="small"
                  />
                ) : (
                  <Icon
                    name="delete"
                    size={22}
                    color="red"
                  />
                )}
              </TouchableOpacity>

            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name="shield-check-outline"
              size={45}
              color="#aaa"
            />

            <Text style={styles.emptyText}>
              No Civic Assist items found
            </Text>
          </View>
        }
      />

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalBg}>

          <View style={styles.modalCard}>

            {/* TITLE */}

            <Text style={styles.modalTitle}>
              {editId
                ? "Edit Civic Assist"
                : "Add Civic Assist"}
            </Text>

            {/* INPUT */}

            <TextInput
              placeholder="Ex: Birth Certificate"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!saving}
              autoCapitalize="words"
            />

            {/* SAVE */}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  opacity: saving ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>
                  {editId ? "Update" : "Save"}
                </Text>
              )}
            </TouchableOpacity>

            {/* CANCEL */}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                if (!saving) {
                  setName("");
                  setEditId(null);
                  setModalVisible(false);
                }
              }}
              disabled={saving}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
};

export default AddCivicAssist;

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  main: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  /* ================= ADD BUTTON ================= */

  addBtn: {
    backgroundColor: "#4FACFE",

    margin: 16,

    padding: 14,

    borderRadius: 12,

    alignItems: "center",

    flexDirection: "row",

    justifyContent: "center",

    elevation: 3,
  },

  addBtnText: {
    color: "#fff",

    marginLeft: 8,

    fontSize: 15,

    fontWeight: "600",
  },

  /* ================= LIST ================= */

  listContent: {
    paddingHorizontal: 16,

    paddingBottom: 30,
  },

  /* ================= CARD ================= */

  card: {
    backgroundColor: "#fff",

    padding: 15,

    borderRadius: 12,

    marginBottom: 12,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    elevation: 3,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowRadius: 5,
  },

  text: {
    fontSize: 16,

    fontWeight: "600",

    color: "#222",

    flex: 1,

    marginRight: 10,
  },

  /* ================= ACTIONS ================= */

  actions: {
    flexDirection: "row",

    alignItems: "center",
  },

  deleteButton: {
    marginLeft: 15,
  },

  /* ================= EMPTY ================= */

  emptyContainer: {
    alignItems: "center",

    justifyContent: "center",

    paddingTop: 70,
  },

  emptyText: {
    marginTop: 10,

    fontSize: 15,

    color: "#999",
  },

  /* ================= MODAL ================= */

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

    color: "#222",
  },

  input: {
    borderWidth: 1,

    borderColor: "#ddd",

    borderRadius: 10,

    padding: 12,

    fontSize: 15,

    color: "#222",
  },

  /* ================= SAVE ================= */

  saveBtn: {
    backgroundColor: "#25D366",

    padding: 14,

    borderRadius: 10,

    marginTop: 15,

    alignItems: "center",

    justifyContent: "center",
  },

  saveText: {
    color: "#fff",

    fontWeight: "600",

    fontSize: 15,
  },

  /* ================= CANCEL ================= */

  cancelBtn: {
    padding: 12,

    alignItems: "center",

    marginTop: 8,
  },

  cancelText: {
    color: "#555",

    fontSize: 14,

    fontWeight: "500",
  },
});
