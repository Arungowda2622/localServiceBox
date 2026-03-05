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
  Button,
  Image,
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
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system/legacy";
import { getStorage, ref, getDownloadURL } from "firebase/storage";


const productData = [
  { label: "Food", value: "food" },
  { label: "Other", value: "other" },
];

const ProductManager = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [role, setRole] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [productType, setProductType] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [image, setImage] = useState(null);

  const [productDetails, setProductDetails] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: "",
    type: "",
  });


  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Media permission required.");
      return;
    }

    const mediaTypeConfig = ImagePicker.MediaType
      ? [ImagePicker.MediaType.IMAGE]
      : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypeConfig,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    const localUri = result.assets[0].uri;

    // ⭐ ONLY PREVIEW IMAGE
    setImage(localUri);
  };

  const pickEditImage = async () => {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert("Permission required", "Media permission required.");
    return;
  }

  const mediaTypeConfig = ImagePicker.MediaType
    ? [ImagePicker.MediaType.IMAGE]
    : ImagePicker.MediaTypeOptions.Images;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypeConfig,
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled) return;

  const localUri = result.assets[0].uri;

  // ⭐ update editProduct preview
  setEditProduct(prev => ({
    ...prev,
    imageUrl: localUri,
  }));
};

  /* -------------------------------------------------- */
  /* 🔐 FETCH USER ROLE                                  */
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
  /* 🔥 REAL-TIME PRODUCTS                               */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!role) return;

    const user = auth.currentUser;
    let q;

    if (role === "admin") {
      q = collection(db, "products");
    } else {
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* -------------------------------------------------- */
  /* ➕ ADD PRODUCT                                      */
  /* -------------------------------------------------- */
  const handleAddProduct = async () => {
    try {
      let imageUrl = "";

      if (image) {
        // ⭐ READ IMAGE AS BASE64 AND SAVE DIRECTLY TO FIRESTORE
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageUrl = `data:image/jpeg;base64,${base64}`;
      }

      console.log(imageUrl,"storingImage")

      await addDoc(collection(db, "products"), {
        ...productDetails,
        price: Number(productDetails.price),
        imageUrl,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Product added!");

      setAddModalVisible(false);
      setProductDetails({
        name: "",
        price: "",
        imageUrl: "",
        description: "",
        type: "",
      });
      setImage(null);
    } catch (error) {
      console.log("Add Product Error:", error);
      Alert.alert("Error", error.message || "Failed to add product");
    }
  };

  /* -------------------------------------------------- */
  /* ✏️ UPDATE PRODUCT                                   */
  /* -------------------------------------------------- */
  const handleUpdateProduct = async () => {
  if (!editProduct?.name || !editProduct?.price || !editProduct?.type) {
    Alert.alert("Missing Fields", "Name, price & type required");
    return;
  }

  try {
    let imageUrl = editProduct.imageUrl;

    // ⭐ Upload only if new local image selected
    if (imageUrl && imageUrl.startsWith("file://")) {
      // ⭐ READ IMAGE AS BASE64 AND SAVE DIRECTLY TO FIRESTORE
      const base64 = await FileSystem.readAsStringAsync(imageUrl, {
        encoding: FileSystem.EncodingType.Base64,
      });
      imageUrl = `data:image/jpeg;base64,${base64}`;
    }

    await updateDoc(doc(db, "products", editProduct.id), {
      name: editProduct.name,
      price: Number(editProduct.price),
      imageUrl: imageUrl,
      description: editProduct.description,
      type: editProduct.type,
      updatedAt: new Date(),
    });

    setEditModalVisible(false);
    Alert.alert("Updated", "Product updated successfully!");
  } catch (error) {
    console.log(error);
    Alert.alert("Error", error.message || "Failed updating product");
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
  /* 🧾 RENDER PRODUCT                                   */
  /* -------------------------------------------------- */
  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.pName}>{item.name}</Text>
      <Text style={styles.pPrice}>₹{item.price}</Text>
      <Text style={styles.pType}>Type: {item.type}</Text>
      <Text style={styles.pDesc}>{item.description}</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            setEditProduct({
              ...item,
              imageUrl: item.imageUrl,
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
      {(role === "shopOwner" || role === "admin") && (
        <Pressable
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Product</Text>
        </Pressable>
      )}

      <Text style={styles.totalProducts}>Total Products: {products.length}</Text>

       <TextInput
        placeholder="Search products by name..."
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            No products found
          </Text>
        }
      />

      {/* ADD PRODUCT MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Product</Text>

            <ScrollView>
              <Button title="Pick Image" onPress={pickImage} />

              {image && (
                <Image
                  source={{ uri: image }}
                  style={{ width: "100%", height: 150, marginVertical: 10, resizeMode:"stretch" }}
                />
              )}
              
              <TextInput
                placeholder="Product Name"
                style={styles.input}
                value={productDetails.name}
                onChangeText={(t) =>
                  setProductDetails({ ...productDetails, name: t })
                }
              />

              <Dropdown
                style={styles.dropdown}
                data={productData}
                labelField="label"
                valueField="value"
                placeholder="Select Product Type"
                value={productType}
                onChange={(item) => {
                  setProductType(item.value);
                  setProductDetails({
                    ...productDetails,
                    type: item.value,
                  });
                }}
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

      {/* EDIT PRODUCT MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Product</Text>

            <ScrollView>
              <Pressable onPress={pickEditImage}>
                <Image source={{ uri: editProduct?.imageUrl }} style={styles.image} />
              </Pressable>
              <TextInput
                style={styles.input}
                value={editProduct?.name}
                onChangeText={(t) =>
                  setEditProduct({ ...editProduct, name: t })
                }
              />

              <Dropdown
                style={styles.dropdown}
                data={productData}
                labelField="label"
                valueField="value"
                placeholder="Select Product Type"
                value={editProduct?.type}
                onChange={(item) =>
                  setEditProduct({ ...editProduct, type: item.value })
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
/* 🎨 STYLES                                           */
/* -------------------------------------------------- */
const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#FFFF",
    padding: 12,
    margin: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
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
  totalProducts: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    marginRight: 15,
    marginBottom: 5,
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
  /* Dropdown styles */
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    marginBottom: 12,
    paddingHorizontal: 8,
    height: 50,
  },
  image: {
    width: 200,
    height: 200,
  },
});
