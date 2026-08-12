import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../header/Header";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { waitForAuthUser } from "../../utils/authUtils";
import { db } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

const AddChickenFish = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [kg, setKg] = useState("");
  const [description, setDescription] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");


  /* ---------------------------------- */
  /* 🔥 FETCH DATA */
  /* ---------------------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "chickenfish"), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setItems(data);
    });

    return () => unsub();
  }, []);

  /* ---------------------------------- */
  /* ❌ DELETE */
  /* ---------------------------------- */
  const handleDelete = (item) => {
    setDeleteId(item.id);
    Alert.alert("Delete", "Are you sure?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setDeleteId(null),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            // Delete image from Firebase Storage if it exists
            if (item.imageUrl) {
              const storage = getStorage(undefined, "gs://localservicebox.firebasestorage.app");
              const imageRef = ref(storage, item.imageUrl);
              await deleteObject(imageRef).catch(() => { });
            }
            
            await deleteDoc(doc(db, "chickenfish", item.id));
          } finally {
            setDeleteId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl && (
        <ExpoImage
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      <Text style={styles.name}>{item.name}</Text>
      <Text>₹{item.price} | {item.kg} KG</Text>
      <Text>{item.description}</Text>

      <View style={styles.row}>
        <Pressable
          style={styles.editBtn}
          onPress={() => {
            setEditItem(item);
            setImage(null);
            setEditModal(true);
          }}
        >
          <Text style={{ color: "#fff" }}>Edit</Text>
        </Pressable>

        <Pressable
          style={[styles.deleteBtn, deleteId === item.id && { opacity: 0.7 }]}
          onPress={() => handleDelete(item)}
          disabled={deleteId === item.id}
        >
          {deleteId === item.id ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff" }}>Delete</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageToFirebase = async (uri) => {
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
  };


  const handleSubmit = async () => {
    if (!name || !price || !kg) {
      Alert.alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let imageUrl = "";

      // 🔥 Upload image
      if (image) {
        imageUrl = await uploadImageToFirebase(image);
      }

      const user = await waitForAuthUser();

      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      // 🔥 Save in SAME collection (chickenfish)
      await addDoc(collection(db, "chickenfish"), {
        name,
        price: Number(price),
        kg: Number(kg),
        description,
        imageUrl,
        userId: user.uid,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Chicken/Fish added successfully!");

      // reset
      setName("");
      setPrice("");
      setKg("");
      setDescription("");
      setImage(null);

      setAddModal(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem?.name || !editItem?.price || !editItem?.kg) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = editItem.imageUrl;

      // 🔥 If new image selected
      if (image && image.startsWith("file://")) {
        imageUrl = await uploadImageToFirebase(image);
      }

      await updateDoc(doc(db, "chickenfish", editItem.id), {
        name: editItem.name,
        price: Number(editItem.price),
        kg: Number(editItem.kg),
        description: editItem.description,
        imageUrl,
        updatedAt: new Date(),
      });

      Alert.alert("Updated successfully");

      setEditModal(false);
      setEditItem(null);
      setImage(null);

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Add Chicken & Fish" navigation={navigation} />

      <Pressable style={styles.addBtn} onPress={() => setAddModal(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#777" />
        <TextInput
          placeholder="Search items..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.totalText}>
        Total Items: {filteredItems.length}
      </Text>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
      />

      <Modal visible={addModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>

          {/* Header inside modal */}
          <Header title="Add Chicken & Fish" navigation={{ goBack: () => setAddModal(false) }} />

          <ScrollView contentContainerStyle={styles.subContainer}>

            {/* Image Picker */}
            <Pressable onPress={pickImageFromLibrary} style={styles.imageBox}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <Text style={styles.imageText}>Tap to upload image</Text>
              )}
            </Pressable>

            {/* Name */}
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              placeholder="Enter item name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            {/* Price + KG */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Weight (KG)</Text>
                <TextInput
                  style={styles.input}
                  value={kg}
                  onChangeText={setKg}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Submit */}
            <Pressable onPress={handleSubmit} disabled={loading}>
              <LinearGradient
                colors={["#FF7E5F", "#FEB47B"]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Add Item</Text>
                )}
              </LinearGradient>
            </Pressable>

          </ScrollView>
        </View>
      </Modal>

      <Modal visible={editModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>

          <Header title="Edit Item" navigation={{ goBack: () => setEditModal(false) }} />

          <ScrollView contentContainerStyle={styles.subContainer}>

            {/* Image */}
            <Pressable onPress={pickImageFromLibrary} style={styles.imageBox}>
              {image || editItem?.imageUrl ? (
                <Image
                  source={{ uri: image || editItem?.imageUrl }}
                  style={styles.image}
                />
              ) : (
                <Text style={styles.imageText}>Tap to change image</Text>
              )}
            </Pressable>

            {/* Name */}
            <TextInput
              style={styles.input}
              value={editItem?.name}
              onChangeText={(t) => setEditItem({ ...editItem, name: t })}
            />

            {/* Price + KG */}
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editItem?.price?.toString()}
                onChangeText={(t) => setEditItem({ ...editItem, price: t })}
              />

              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editItem?.kg?.toString()}
                onChangeText={(t) => setEditItem({ ...editItem, kg: t })}
              />
            </View>

            {/* Description */}
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={editItem?.description}
              onChangeText={(t) =>
                setEditItem({ ...editItem, description: t })
              }
              multiline
            />

            {/* Update Button */}
            <Pressable onPress={handleUpdate} disabled={loading}>
              <LinearGradient
                colors={["#4CAF50", "#66BB6A"]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Item</Text>
                )}
              </LinearGradient>
            </Pressable>

          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

export default AddChickenFish;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  subContainer: {
    padding: 20,
  },
  imageBox: {
    height: 180,
    borderRadius: 20,
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  imageText: {
    color: "#888",
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 150,
    marginBottom: 10,
    resizeMode: "stretch",
    borderRadius: 10
  },
  name: { 
    fontWeight: "bold", 
    fontSize: 16 
  },
  row: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 10 
  },
  editBtn: {
    backgroundColor: "green",
    padding: 8,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 6,
  },
  addBtn: {
    backgroundColor: "#FF7E5F",
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    right: 20,
    marginVertical: 10
  },
  modal: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    maxHeight: "90%",
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
    padding: 10,
    fontSize: 16,
  },
  totalText: {
    textAlign: "right",
    marginRight: 15,
    marginTop: 5,
    fontWeight: "600",
    color: "#555",
  }
});