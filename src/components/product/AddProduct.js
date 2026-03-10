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
      <View style={{ position: "relative" }}>
        {item.imageUrl && (
          <ExpoImage
            source={{ uri: item.imageUrl }}
            style={styles.productImage}
            contentFit="fill"
            cachePolicy="memory-disk"
            placeholder={require("../../../assets/placeholder.jpg")}
            transition={300}
          />
        )}

        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.pName}>{item.name}</Text>
      <Text style={styles.pPrice}>₹{item.price}</Text>
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
        <Pressable style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      )}

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#777" />
        <TextInput
          placeholder="Search products..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Text style={styles.totalProducts}>Total Products: {products.length}</Text>



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
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#2F6BFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    zIndex: 100,
  },
  addBtnText: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  totalProducts: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    marginRight: 15,
    marginVertical: 5,
    marginTop:10
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 4,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pName: {
    fontSize: 18,
    fontWeight: "700",
  },

  pPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#2F6BFF",
  },

  pDesc: {
    marginTop: 6,
    color: "#666",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    borderRadius: 18,
    padding: 20,
    maxHeight: "90%",
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F7F8FA",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  saveBtn: {
    backgroundColor: "#2F6BFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#E53935",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  typeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#2F6BFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  typeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
