import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Header from '../header/Header';
import { Image } from 'expo-image';

const HotelList = ({ navigation }) => {
  const [hotels, setHotels] = useState([]);

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

  const handlePress = (item) => {
    if (!item?.id || !item?.name) {
      alert("Hotel data missing");
      return;
    }

    navigation.navigate("HotelItems", {
      hotelId: item.id,
      hotelName: item.name
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Hotels" navigation={navigation} />

      <FlatList
        data={hotels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item)}>
            {item.imageUrl && (
              <Image
                source={item.imageUrl}
                style={styles.image}
                contentFit="cover"
                transition={300}
              />
            )}

            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default HotelList;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5
  }
});