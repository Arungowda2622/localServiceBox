import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../header/Header";

import { auth, db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
} from "firebase/firestore";

const ProductManager = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState(null);

  // MODALS
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [productDetails, setProductDetails] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: "",
  });

  const [editProduct, setEditProduct] = useState(null);

  /* -------------------------------------------------- */
  /* 🔐 FETCH LOGGED-IN USER ROLE                         */
  /* -------------------------------------------------- */
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setRole(snap.data().role);
      }
    };

    fetchRole();
  }, []);

  /* -------------------------------------------------- */
  /* 🔥 REAL-TIME FETCH PRODUCTS (ROLE BASED)            */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!role) return;

    const user = auth.currentUser;
    let q;

    if (role === "admin") {
      // 🔥 Admin → all products
      q = collection(db, "products");
    } else {
      // 🔥 ShopOwner → only own products
      q = query(
        collection(db, "products"),
        where("ownerId", "==", user.uid)
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProducts(list);
    });

    return () => unsub();
  }, [role]);

  /* -------------------------------------------------- */
  /* 🟢 ADD PRODUCT                                      */
  /* -------------------------------------------------- */
  const handleAddProduct = async () => {
    const { name, price, imageUrl, description } = productDetails;

    if (!name || !price || !imageUrl) {
      Alert.alert("Missing Fields", "Product name, price & image URL required!");
      return;
    }

    const imgArr = imageUrl
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.startsWith("https://"));

    if (imgArr.length === 0) {
      Alert.alert("Invalid Images", "Use comma-separated HTTPS URLs");
      return;
    }

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        images: imgArr,
        description,
        ownerId: user.uid,        // ✅ IMPORTANT
        createdByRole: role,      // optional
        createdAt: new Date(),
      });

      setAddModalVisible(false);
      setProductDetails({
        name: "",
        price: "",
        imageUrl: "",
        description: "",
      });

      Alert.alert("Success", "Product added!");
    } catch (error) {
      Alert.alert("Error", "Could not add product");
    }
  };

  /* -------------------------------------------------- */
  /* ✏️ UPDATE PRODUCT                                   */
  /* -------------------------------------------------- */
  const handleUpdateProduct = async () => {
    if (!editProduct?.name || !editProduct?.price) {
      Alert.alert("Missing Fields", "Name & price required");
      return;
    }

    const imgArr = editProduct.imageUrl
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.startsWith("https://"));

    try {
      await updateDoc(doc(db, "products", editProduct.id), {
        name: editProduct.name,
        price: Number(editProduct.price),
        images: imgArr,
        description: editProduct.description,
        updatedAt: new Date(),
      });

      setEditModalVisible(false);
      Alert.alert("Updated", "Product updated!");
    } catch (error) {
      Alert.alert("Error", "Failed updating product");
    }
  };

  /* -------------------------------------------------- */
  /* ❌ DELETE PRODUCT                                   */
  /* -------------------------------------------------- */
  const handleDeleteProduct = (id) => {
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "products", id));
          Alert.alert("Deleted", "Product removed");
        },
      },
    ]);
  };

  /* -------------------------------------------------- */
  /* 🧾 RENDER PRODUCT ITEM                              */
  /* -------------------------------------------------- */
  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.pName}>{item.name}</Text>
      <Text style={styles.pPrice}>₹{item.price}</Text>
      <Text style={styles.pDesc}>{item.description}</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            setEditProduct({
              ...item,
              imageUrl: item.images?.join(", "),
            });
            setEditModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Edit</Text>
        </Pressable>

        <Pressable
          style={styles.deleteBtn}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  /* -------------------------------------------------- */
  /* 🧱 UI                                               */
  /* -------------------------------------------------- */
  return (
    <View style={{ flex: 1 }}>
      <Header title="Manage Products" navigation={navigation} />

      {/* ADD PRODUCT BUTTON (shopOwner + admin) */}
      {(role === "shopOwner" || role === "admin") && (
        <Pressable
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </Pressable>
      )}

      {/* PRODUCT LIST */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            No products found
          </Text>
        }
      />

      {/* -------------------------------------------------- */}
      {/* ADD PRODUCT MODAL                                  */}
      {/* -------------------------------------------------- */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Product</Text>

            <ScrollView>
              <TextInput
                placeholder="Product Name"
                style={styles.input}
                value={productDetails.name}
                onChangeText={(t) =>
                  setProductDetails({ ...productDetails, name: t })
                }
              />

              <TextInput
                placeholder="Price"
                style={styles.input}
                keyboardType="numeric"
                value={productDetails.price}
                onChangeText={(t) =>
                  setProductDetails({ ...productDetails, price: t })
                }
              />

              <TextInput
                placeholder="Image URLs (comma separated)"
                style={styles.input}
                value={productDetails.imageUrl}
                onChangeText={(t) =>
                  setProductDetails({ ...productDetails, imageUrl: t })
                }
              />

              <TextInput
                placeholder="Description"
                style={[styles.input, { height: 80 }]}
                multiline
                value={productDetails.description}
                onChangeText={(t) =>
                  setProductDetails({
                    ...productDetails,
                    description: t,
                  })
                }
              />

              <Pressable style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={styles.btnText}>Save</Text>
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* -------------------------------------------------- */}
      {/* EDIT PRODUCT MODAL                                 */}
      {/* -------------------------------------------------- */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <ScrollView>
              <TextInput
                style={styles.input}
                value={editProduct?.name}
                onChangeText={(t) =>
                  setEditProduct({ ...editProduct, name: t })
                }
              />

              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editProduct?.price?.toString()}
                onChangeText={(t) =>
                  setEditProduct({ ...editProduct, price: t })
                }
              />

              <TextInput
                style={styles.input}
                value={editProduct?.imageUrl}
                onChangeText={(t) =>
                  setEditProduct({ ...editProduct, imageUrl: t })
                }
              />

              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={editProduct?.description}
                onChangeText={(t) =>
                  setEditProduct({
                    ...editProduct,
                    description: t,
                  })
                }
              />

              <Pressable style={styles.saveBtn} onPress={handleUpdateProduct}>
                <Text style={styles.btnText}>Update</Text>
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProductManager;

/* -------------------------------------------------- */
/* 🎨 STYLES                                           */
/* -------------------------------------------------- */
const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: "#2F6BFF",
    margin: 15,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  pName: { fontSize: 16, fontWeight: "700" },
  pPrice: { marginTop: 4, fontWeight: "600" },
  pDesc: { marginTop: 6, color: "#666" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    padding: 8,
    borderRadius: 6,
  },
  btnText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#2F6BFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#999",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
});
