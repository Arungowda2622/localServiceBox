import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  Image,
  ActivityIndicator
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { waitForAuthUser } from '../../utils/authUtils';
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Header from '../header/Header';

const AddHotel = ({ navigation }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [hotelImage, setHotelImage] = useState(null);
  const [itemImage, setItemImage] = useState(null);
  const [savingHotel, setSavingHotel] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingHotelId, setDeletingHotelId] = useState(null);

  // 🔹 Get user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserRole(snap.data().role);
    };

    fetchUserRole();
  }, []);

  // 🔹 Fetch hotels
  useEffect(() => {
    const q = query(collection(db, "hotels"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHotels(list);
      setFilteredHotels(list);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Search
  useEffect(() => {
    if (!search) {
      setFilteredHotels(hotels);
    } else {
      const filtered = hotels.filter((item) =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.address?.toLowerCase().includes(search.toLowerCase()) ||
        item.phone?.includes(search)
      );
      setFilteredHotels(filtered);
    }
  }, [search, hotels]);

  // 🔹 Pick Image
  const pickImage = async (type) => {
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
      if (type === "hotel") {
        setHotelImage(result.assets[0].uri);
      } else {
        setItemImage(result.assets[0].uri);
      }
    }
  };

  // 🔹 Upload Image
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

  // 🔹 ADD + UPDATE HOTEL
  const handleSaveHotel = async () => {
    setSavingHotel(true);
    const user = await waitForAuthUser();

    if (!user) {
      Alert.alert("User not logged in");
      setSavingHotel(false);
      return;
    }

    let imageUrl = hotelImage;

    if (hotelImage && !hotelImage.startsWith("http")) {
      imageUrl = await uploadImage(hotelImage);
    }

    try {
      if (isEditMode && selectedHotel) {
        await updateDoc(doc(db, "hotels", selectedHotel.id), {
          name,
          address,
          phone,
          imageUrl,
        });

        Alert.alert("Updated Successfully");
      } else {
        await addDoc(collection(db, "hotels"), {
          name,
          address,
          phone,
          ownerId: user.uid,
          imageUrl,
          createdAt: new Date()
        });

        Alert.alert("Hotel added");
      }

      setName('');
      setAddress('');
      setPhone('');
      setHotelImage(null);
      setIsEditMode(false);
      setSelectedHotel(null);
      setModalVisible(false);

    } catch (error) {
      console.log(error);
      Alert.alert("Error saving hotel");
    } finally {
      setSavingHotel(false);
    }
  };

  // 🔹 DELETE HOTEL
  const handleDeleteHotel = async (id) => {
    setDeletingHotelId(id);
    Alert.alert("Confirm", "Delete this hotel?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setDeletingHotelId(null),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            // First, fetch the hotel to get its image URL
            const hotelDoc = await getDoc(doc(db, "hotels", id));
            if (hotelDoc.exists() && hotelDoc.data().imageUrl) {
              // Delete image from Firebase Storage
              const storage = getStorage(undefined, "gs://localservicebox.firebasestorage.app");
              const imageRef = ref(storage, hotelDoc.data().imageUrl);
              await deleteObject(imageRef).catch(() => { });
            }
            
            await deleteDoc(doc(db, "hotels", id));
            Alert.alert("Deleted");
          } catch (err) {
            console.log(err);
            Alert.alert("Error deleting");
          } finally {
            setDeletingHotelId(null);
          }
        }
      }
    ]);
  };

 
  const handleShowItems = (hotel) => {
    navigation.navigate("FoodItems", { hotelId: hotel.id });
  };

  const handleAddItem = async () => {
    const user = await waitForAuthUser();

    if (!itemName || !price) {
      Alert.alert("Please fill all fields");
      return;
    }

    setSavingItem(true);
    let imageUrl = "";

    if (itemImage) {
      imageUrl = await uploadImage(itemImage);
    }

    try {
      await addDoc(collection(db, "food_items"), {
        name: itemName,
        price: Number(price),
        hotelId: selectedHotel.id,
        imageUrl,
        createdAt: new Date()
      });

      Alert.alert("Item added");

      // reset
      setItemName('');
      setPrice('');
      setItemImage(null);
      setItemModalVisible(false);

    } catch (error) {
      console.log(error);
      Alert.alert("Error adding item");
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Hotel List"} navigation={navigation} />

      <View style={styles.container}>
        <TextInput
          placeholder="Search hotels..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />

        <FlatList
          data={filteredHotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>

              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.hotelImage} />
              ) : (
                <View style={styles.noImage}><Text>No Image</Text></View>
              )}

              <Text style={styles.hotelName}>{item.name}</Text>
              <Text>{item.address}</Text>
              <Text>{item.phone}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#28a745' }]}
                  onPress={() => handleShowItems(item)}
                >
                  <Text style={styles.btnText}>Show</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#ffc107' }]}
                  onPress={() => {
                    setSelectedHotel(item);
                    setName(item.name);
                    setAddress(item.address);
                    setPhone(item.phone);
                    setHotelImage(item.imageUrl || null);
                    setIsEditMode(true);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#dc3545' }]}
                  onPress={() => handleDeleteHotel(item.id)}
                  disabled={deletingHotelId === item.id}
                >
                  {deletingHotelId === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Delete</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#007BFF' }]}
                  onPress={() => {
                    setSelectedHotel(item);
                    setItemModalVisible(true);
                  }}
                >
                  <Text style={styles.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* ➕ FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => {
          setIsEditMode(false);
          setModalVisible(true);
        }}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* HOTEL MODAL */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>
                {isEditMode ? "Edit Hotel" : "Add Hotel"}
              </Text>

              <TouchableOpacity onPress={() => pickImage("hotel")} style={styles.imageBox}>
                {hotelImage ? (
                  <Image source={{ uri: hotelImage }} style={styles.imagePreview} />
                ) : (
                  <Text>Upload Hotel Image</Text>
                )}
              </TouchableOpacity>

              <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
              <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={styles.input} />
              <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} />

              <TouchableOpacity style={styles.button} onPress={handleSaveHotel} disabled={savingHotel}>
                {savingHotel ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEditMode ? "Update" : "Save"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ textAlign: 'center', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ITEM MODAL */}
        <Modal visible={itemModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>

              <Text style={styles.title}>Add Food Item</Text>

              {/* IMAGE */}
              <TouchableOpacity
                onPress={() => pickImage("item")}
                style={styles.imageBox}
              >
                {itemImage ? (
                  <Image source={{ uri: itemImage }} style={styles.imagePreview} />
                ) : (
                  <Text>Upload Item Image</Text>
                )}
              </TouchableOpacity>

              {/* NAME */}
              <TextInput
                placeholder="Item Name"
                value={itemName}
                onChangeText={setItemName}
                style={styles.input}
              />

              {/* PRICE */}
              <TextInput
                placeholder="Price"
                value={price}
                onChangeText={setPrice}
                style={styles.input}
                keyboardType="numeric"
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity style={styles.button} onPress={handleAddItem} disabled={savingItem}>
                {savingItem ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Item</Text>
                )}
              </TouchableOpacity>

              {/* CANCEL */}
              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <Text style={{ textAlign: 'center', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
};

export default AddHotel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
    padding: 15
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold'
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
    alignItems: 'center',
    elevation: 5
  },
  fabText: {
    color: '#fff',
    fontSize: 28
  },
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  imageBox: {
    height: 150,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10
  },
  hotelImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10
  },
  noImage: {
    height: 150,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10
  },
});