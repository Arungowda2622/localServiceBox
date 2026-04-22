import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Pressable
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Header from '../header/Header';
import { Ionicons } from '@expo/vector-icons';

const HotelItems = ({ route, navigation }) => {
  
  const { hotelId, hotelName } = route.params;

  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "food_items"),
          where("hotelId", "==", hotelId)
        );

        const snapshot = await getDocs(q);

        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setItems(list);

      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item) => {
    setCart(prev =>
      prev.some(i => i.id === item.id)
        ? prev
        : [...prev, { ...item, hotelName }]
    );
  };

  const handleDetails = (item) => {
    navigation.navigate("ItemDetails", { item, hotelName });
  }

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={hotelName}
        navigation={navigation}
        cartCount={cart.length}
        onCartPress={() => navigation.navigate("Cart", { cartItems: cart })}
      />

      <View style={styles.container}>

        {/* 🔍 Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} />
          <TextInput
            placeholder="Search food..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <Pressable onPress={()=> handleDetails(item)} style={styles.card}>

                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.image}
                />

                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => addToCart(item)}
                >
                  <Text style={{ color: '#fff' }}>
                    {cart.some(c => c.id === item.id)
                      ? "Added"
                      : "Add to Cart"}
                  </Text>
                </TouchableOpacity>

              </Pressable>
            )}
          />
        )}

      </View>
    </View>
  );
};

export default HotelItems;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },

  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems:"center"
  },

  searchInput: {
    marginLeft: 10,
    flex: 1
  },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    margin: '1%',
    borderRadius: 10,
    padding: 10
  },

  image: {
    width: '100%',
    height: 120,
    borderRadius: 10
  },

  name: {
    fontWeight: 'bold'
  },

  price: {
    color: 'blue'
  },

  button: {
    backgroundColor: '#007BFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center'
  }
});