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
  TouchableOpacity,
} from "react-native";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import Header from "../header/Header";
import { Ionicons } from "@expo/vector-icons";

const ProductManager = ({ navigation }) => {
  const [products, setProducts] = useState([]);

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
  /* 🔥 Real-time Fetch Products                         */
  /* -------------------------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
    });
    return () => unsub();
  }, []);

  /* -------------------------------------------------- */
  /* 🟢 Add Product                                      */
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
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        images: imgArr,
        description,
        createdAt: new Date().toISOString(),
      });

      setAddModalVisible(false);
      setProductDetails({ name: "", price: "", imageUrl: "", description: "" });
      Alert.alert("Success", "Product added!");
    } catch (error) {
      Alert.alert("Error", "Could not add product");
    }
  };

  /* -------------------------------------------------- */
  /* ✏️ Update Product                                    */
  /* -------------------------------------------------- */
  const handleUpdateProduct = async () => {
    if (!editProduct.name || !editProduct.price) {
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
      });

      setEditModalVisible(false);
      Alert.alert("Updated", "Product updated!");
    } catch (error) {
      Alert.alert("Error", "Failed updating product");
    }
  };

  /* -------------------------------------------------- */
  /* ❌ Delete Product                                   */
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
  /* 🧾 Render Product Item                              */
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

  return (
    <View style={{ flex: 1 }}>
      <Header title="Manage Products" navigation={navigation} />

      {/* ADD PRODUCT BUTTON */}
      <Pressable style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Add Product</Text>
      </Pressable>

      {/* PRODUCT LIST */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
      />

      {/* -------------------------------------------------- */}
      {/* ADD PRODUCT MODAL                                   */}
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
                  setProductDetails({ ...productDetails, description: t })
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
      {/* EDIT PRODUCT MODAL                                  */}
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
                  setEditProduct({ ...editProduct, description: t })
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
/* STYLES                                              */
/* -------------------------------------------------- */
const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: "#efb71b",
    padding: 15,
    margin: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
  },
  pName: {
    fontSize: 18,
    fontWeight: "700",
  },
  pPrice: {
    fontSize: 16,
    marginTop: 5,
  },
  pDesc: {
    marginTop: 5,
    color: "#444",
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#777",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
});
