import React, { useEffect, useState, useMemo } from "react";
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
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../header/Header";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Dropdown } from "react-native-element-dropdown";
import { waitForAuthUser, getUserId } from "../../utils/authUtils";
import * as ImagePicker from 'expo-image-picker';
import { getUserRole } from "../../utils/authUtils";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { deleteObject } from "firebase/storage";
import { Image as ExpoImage } from "expo-image";

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
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: "",
    type: "",
  });

  useEffect(() => {
    products.forEach((p) => {
      if (p.imageUrl) {
        ExpoImage.prefetch(p.imageUrl);
      }
    });
  }, [products]);

  const uploadImageToFirebase = async (uri) => {
    try {
      const storage = getStorage(undefined, "gs://localservicebox.firebasestorage.app");
      const filename = `products/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new TypeError("Network request failed"));
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      await uploadBytes(storageRef, blob);

      blob.close && blob.close();

      return await getDownloadURL(storageRef);

    } catch (error) {
      console.log("Upload error:", error);
      throw error;
    }
  };

  const pickImageFromLibrary = async (callback) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4,
    });

    if (!result.canceled) {
      callback(result.assets[0].uri);
    }
  };

  const pickImage = () => {
    pickImageFromLibrary(setImage);
  };

  const pickEditImage = () => {
    pickImageFromLibrary((uri) =>
      setEditProduct((prev) => ({ ...prev, imageUrl: uri }))
    );
  };

  /* -------------------------------------------------- */
  /* 🔐 FETCH USER ROLE                                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
    };

    fetchRole();
  }, []);

  /* -------------------------------------------------- */
  /* 🔥 REAL-TIME PRODUCTS                               */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!role) return;

    let unsub = () => { };

    const setup = async () => {
      const uid = await getUserId();
      if (!uid) {
        console.warn("AddProduct: no uid available to fetch products");
        return;
      }

      const q =
        role === "admin"
          ? collection(db, "products")
          : query(collection(db, "products"), where("ownerId", "==", uid));

      unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setProducts(list);
      });
    };

    setup();

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [role]);

  // ⭐ FILTER PRODUCTS BASED ON SEARCH
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  /* -------------------------------------------------- */
  /* ➕ ADD PRODUCT                                      */
  /* -------------------------------------------------- */
  const handleAddProduct = async () => {
    try {
      setLoading(true);

      let imageUrl = "";

      if (image) {
        imageUrl = await uploadImageToFirebase(image);
      }

      const user = await waitForAuthUser();

      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      await addDoc(collection(db, "products"), {
        ...productDetails,
        price: Number(productDetails.price),
        imageUrl,
        userId: user.uid,
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
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
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

      if (imageUrl && imageUrl.startsWith("file://")) {
        imageUrl = await uploadImageToFirebase(imageUrl);
      }

      await updateDoc(doc(db, "products", editProduct.id), {
        name: editProduct.name,
        price: Number(editProduct.price),
        imageUrl,
        description: editProduct.description,
        type: editProduct.type,
        updatedAt: new Date(),
      });

      setEditModalVisible(false);
      Alert.alert("Updated", "Product updated successfully!");

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  /* -------------------------------------------------- */
  /* ❌ DELETE PRODUCT                                   */
  /* -------------------------------------------------- */
  const handleDeleteProduct = (product) => {
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {

            // delete image from storage
            if (product.imageUrl) {
              const storage = getStorage(undefined, "gs://localservicebox.firebasestorage.app");
              const imageRef = ref(storage, product.imageUrl);
              await deleteObject(imageRef).catch(() => { });
            }

            await deleteDoc(doc(db, "products", product.id));

            Alert.alert("Deleted", "Product removed");

          } catch (error) {
            console.log(error);
          }
        },
      },
    ]);
  };

  /* -------------------------------------------------- */
  /* 🧾 RENDER PRODUCT                                   */
  /* -------------------------------------------------- */
  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl && (
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={styles.productImage}
          contentFit="contain"
          cachePolicy="memory-disk"
          placeholder={require("../../../assets/placeholder.jpg")}
          transition={300}
        />
      )}
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
          onPress={() => handleDeleteProduct(item)}
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
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* ADD PRODUCT MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Product</Text>

            <ScrollView>
              <View style={{ marginVertical: 20 }}>
                <Button title="Pick Image" onPress={pickImage} />
              </View>

              {image && (
                <Image
                  source={{ uri: image }}
                  style={{ width: "100%", height: 150, marginVertical: 10, resizeMode: "stretch" }}
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
                <Text style={styles.btnText}>
                  {loading ? "Uploading..." : "Save"}
                </Text>
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
                {editProduct?.imageUrl && (
                  <Image source={{ uri: editProduct.imageUrl }} style={styles.image} />
                )}
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
    marginVertical: 20
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
});
