import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Header from '../header/Header';
import { db } from '../firebase/firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';

const AddHotelOwner = ({ navigation }) => {

  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  const [search, setSearch] = useState('');

  /* ---------------- FETCH HOTELS ---------------- */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "hotels"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHotels(list);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(list);
      setFilteredUsers(list); // default
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- SEARCH FILTER ---------------- */
  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.phone?.includes(search) ||
        user.name?.toLowerCase().includes(search.toLowerCase())
      );

      setFilteredUsers(filtered);
    }
  }, [search, users]);

  /* ---------------- GET OWNER NAME ---------------- */
  const getOwnerName = (ownerId) => {
    const user = users.find(u => u.id === ownerId);
    return user ? user.name : "No Owner";
  };

  /* ---------------- ASSIGN OWNER ---------------- */
  const assignOwner = async (user) => {
    try {
      if (selectedHotel.ownerId) {
        Alert.alert(
          "Replace Owner?",
          "This hotel already has an owner. Replace?",
          [
            { text: "Cancel" },
            {
              text: "Yes",
              onPress: async () => {
                await updateDoc(doc(db, "hotels", selectedHotel.id), {
                  ownerId: user.id
                });

                Alert.alert("Success", "Owner assigned");
                setModalVisible(false);
                setSearch('');
              }
            }
          ]
        );
      } else {
        await updateDoc(doc(db, "hotels", selectedHotel.id), {
          ownerId: user.id
        });

        Alert.alert("Success", "Owner assigned");
        setModalVisible(false);
        setSearch('');
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to assign owner");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={'Add Hotel Owner'} navigation={navigation} />

      <View style={styles.container}>

        {/* 🏨 HOTEL LIST */}
        <FlatList
          data={hotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>

              <Text style={styles.hotelName}>{item.name}</Text>
              <Text>{item.address}</Text>

              {/* 👤 OWNER */}
              <Text style={styles.ownerText}>
                Owner: {getOwnerName(item.ownerId)}
              </Text>

              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => {
                  setSelectedHotel(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.assignText}>Assign Owner</Text>
              </TouchableOpacity>

            </View>
          )}
        />

        {/* 📦 MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>

              <Text style={styles.title}>
                Select Owner for {selectedHotel?.name}
              </Text>

              {/* 🔍 SEARCH */}
              <TextInput
                placeholder="Search by phone or name..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />

              {/* 👥 USER LIST */}
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => assignOwner(item)}
                  >
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phone}</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setSearch('');
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
};

export default AddHotelOwner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F6F7FB'
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

  ownerText: {
    marginTop: 5,
    color: 'green',
    fontWeight: '600'
  },

  assignBtn: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },

  assignText: {
    color: '#fff',
    fontWeight: 'bold'
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
    padding: 20,
    maxHeight: '70%'
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },

  searchInput: {
    backgroundColor: '#F1F1F1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },

  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },

  userName: {
    fontSize: 15,
    fontWeight: '500'
  },

  userPhone: {
    color: 'gray',
    fontSize: 13
  },

  cancelText: {
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600'
  }
});