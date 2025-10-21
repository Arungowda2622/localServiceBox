// BikeTaxi.js
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput } from 'react-native';
import Header from '../header/Header';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import LocationSelection from './map/LocationSelection'; // ✅ use the external file

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const BikeTaxi = ({ navigation }) => {
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [currentSearchType, setCurrentSearchType] = useState('pickup');

  const [pickUpAddress, setPickUpAddress] = useState('');
  const [pickUpCoords, setPickUpCoords] = useState(null);
  const [dropAddress, setDropAddress] = useState('');
  const [dropCoords, setDropCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (pickUpCoords && dropCoords) {
      const dist = haversine(
        pickUpCoords.latitude,
        pickUpCoords.longitude,
        dropCoords.latitude,
        dropCoords.longitude
      );
      setDistance(dist.toFixed(2));
    } else setDistance(null);
  }, [pickUpCoords, dropCoords]);

  const handleLocationSelect = (coords, address) => {
    if (currentSearchType === 'pickup') {
      setPickUpCoords(coords);
      setPickUpAddress(address);
    } else {
      setDropCoords(coords);
      setDropAddress(address);
    }
    setShowLocationInput(false);
  };

  return (
    <View style={styles.main}>
      <LocationSelection navigation={navigation}/>
    </View>
  );
};

export default BikeTaxi;

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#FFF' },
  content: { padding: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  locationText: { flex: 1, color: '#333' },
  distanceText: { marginTop: 10, color: '#444', fontSize: 16 },
});

