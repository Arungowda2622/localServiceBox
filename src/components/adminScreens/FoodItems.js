import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import Header from '../header/Header';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";

const FoodItems = ({ route, navigation }) => {
  const { hotelId } = route.params;

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [loadingImages, setLoadingImages] = useState({}); // 🔥 image loading state

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [search, setSearch] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [description, setDescription] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ---------------- FETCH ITEMS ---------------- */
  useEffect(() => {
    const q = query(
      collection(db, "food_items"),
      where("hotelId", "==", hotelId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setItems(list);
      setFilteredItems(list);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- SEARCH ---------------- */
  useEffect(() => {
    if (!search) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [search, items]);

  /* ---------------- ADD / EDIT ---------------- */
  const handleAddItem = async () => {
    if (!name || !price || !description) {
      Alert.alert("Validation", "Fill all fields");
      return;
    }

    setSaving(true);

    let imageUrl = "";
    if (itemImage) {
      imageUrl = await uploadImage(itemImage);
    }

    try {
      if (editMode) {
        await updateDoc(doc(db, "food_items", selectedItemId), {
          name,
          price: Number(price),
          description,
          imageUrl
        });

        Alert.alert("Success", "Item updated");
      } else {
        await addDoc(collection(db, "food_items"), {
          name,
          price: Number(price),
          description,
          hotelId,
          imageUrl,
          createdAt: new Date()
        });

        Alert.alert("Success", "Item added");
      }

      setName('');
      setPrice('');
      setDescription('');
      setItemImage(null);
      setModalVisible(false);
      setEditMode(false);
    } catch (error) {
      Alert.alert("Error", "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (item) => {
    setDeletingId(item.id);
    Alert.alert("Delete", "Are you sure?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setDeletingId(null),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            // 🔥 DELETE IMAGE (if exists)
            if (item.imageUrl) {
              const storage = getStorage(undefined, "gs://localservicebox.firebasestorage.app");

              // ✅ Convert full URL → reference
              const imageRef = ref(storage, item.imageUrl);

              await deleteObject(imageRef);
              console.log("Image deleted successfully");
            }

            // 🔥 DELETE FIRESTORE DOCUMENT
            await deleteDoc(doc(db, "food_items", item.id));

            console.log("Item deleted successfully");
            Alert.alert("Success", "Item deleted");
          } catch (error) {
            console.log("Delete error:", error);
            Alert.alert("Error", "Failed to delete item");
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
  };

  /* ---------------- EDIT ---------------- */
  const handleEditItem = (item) => {
    setEditMode(true);
    setSelectedItemId(item.id);
    setName(item.name);
    setItemImage(item.imageUrl)
    setPrice(String(item.price));
    setDescription(item.description || '');
    setModalVisible(true);
  };

  /* ---------------- IMAGE LOAD HANDLER ---------------- */
  const handleImageLoadStart = (id) => {
    setLoadingImages(prev => ({ ...prev, [id]: true }));
  };

  const handleImageLoadEnd = (id) => {
    setLoadingImages(prev => ({ ...prev, [id]: false }));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      setItemImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
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

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Food List"} navigation={navigation} />

      <View style={styles.container}>

        {/* 🔍 Search */}
        <TextInput
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        {/* 🍔 List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) => (
            <View style={styles.card}>

              {/* 🖼️ IMAGE WITH LOADER */}
              {item.imageUrl ? (
                <View style={{ position: 'relative' }}>
                  <ExpoImage
                    source={item.imageUrl}
                    style={styles.itemImage}
                    contentFit="cover"
                    transition={500}
                    placeholder="blur"
                    cachePolicy="memory-disk"
                  />

                  {loadingImages[item.id] && (
                    <View style={styles.loader}>
                      <ActivityIndicator size="small" color="#000" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noImage}>
                  <Text>No Image</Text>
                </View>
              )}

              <Text style={styles.itemName}>{item.name}</Text>
              <Text>₹ {item.price}</Text>

              <Text style={{ color: '#555', marginTop: 5 }}>
                {item.description}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#ffc107' }]}
                  onPress={() => handleEditItem(item)}
                >
                  <Text>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 'red' }]}
                  onPress={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff' }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          )}
        />

        {/* ➕ Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* 📦 Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>

              <Text style={styles.title}>
                {editMode ? "Edit Item" : "Add Item"}
              </Text>

              <TouchableOpacity onPress={pickImage} style={styles.imageBox}>
                {itemImage ? (
                  <Image source={{ uri: itemImage }} style={styles.imagePreview} />
                ) : (
                  <Text style={styles.uploadText}>Upload Item Image</Text>
                )}
              </TouchableOpacity>

              <TextInput
                placeholder="Item Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />

              <TextInput
                placeholder="Price"
                value={price}
                onChangeText={setPrice}
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
              />

              <TouchableOpacity style={styles.button} onPress={handleAddItem} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ textAlign: 'center', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
};

export default FoodItems;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7FB', padding: 15 },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },

  itemName: { fontSize: 16, fontWeight: 'bold' },

  itemImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover'
  },

  loader: {
    position: 'absolute',
    top: '40%',
    left: '45%'
  },

  noImage: {
    height: 140,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007BFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },

  fabText: { color: '#fff', fontSize: 28 },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20
  },

  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },

  input: {
    backgroundColor: '#F1F1F1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },

  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },

  buttonText: { color: '#fff', fontWeight: 'bold' },

  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },

  row: { flexDirection: 'row', marginTop: 10 },

  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  imageBox: {
  height: 160,
  width: '100%',
  backgroundColor: '#f2f2f2',
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 15,
  borderWidth: 1.5,
  borderColor: '#ddd',
  borderStyle: 'dashed',
  overflow: 'hidden'
},

imagePreview: {
  width: '100%',
  height: '100%',
  borderRadius: 12
},

uploadText: {
  color: '#777',
  fontSize: 14
}
});