import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const { height } = Dimensions.get('window');
const PRIMARY_COLOR = '#007BFF';
const SECONDARY_COLOR = '#4285F4';
const SUCCESS_COLOR = '#4CAF50';
const ERROR_COLOR = '#EA4335';
const TEXT_COLOR = '#333';
const SUB_TEXT_COLOR = '#666';
const BACKGROUND_COLOR = '#F5F5F5';

const BoxDelivery = ({ navigation }) => {
  const mapRef = useRef(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selecting, setSelecting] = useState('destination');
  const [fareSettings, setFareSettings] = useState({
    baseFare: 50,
    baseDistance: 3,
    extraPerKm: 15,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // 🔹 Get current location and box delivery fare
  useEffect(() => {
    getCurrentLocation();
    fetchFareSettings();
  }, []);

  useEffect(() => {
    if (pickupLocation && destinationLocation) calculateRoute();
  }, [pickupLocation, destinationLocation]);

  // ✅ Fetch from Firestore 'boxDeliveryPrices'
  const fetchFareSettings = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'boxDeliveryPrices'));
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setFareSettings({
          baseFare: docData.baseFare || 50,
          baseDistance: docData.baseDistance || 3,
          extraPerKm: docData.extraPerKm || 15,
        });
      } else {
        console.warn('No delivery pricing found in Firebase.');
      }
    } catch (error) {
      console.error('Error fetching box delivery fare settings:', error);
    }
  };

const getCurrentLocation = async () => {
  try {
    setIsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Permission denied');

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };

    // 🔹 Reverse geocode to get address
    const res = await Location.reverseGeocodeAsync(coords);
    const info = res[0];

    const address = [
      info.name,
      info.street,
      info.district,
      info.city,
      info.region,
      info.postalCode,
      info.country,
    ]
      .filter(Boolean)
      .join(', ');

    setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

    // ✅ Store the real address, not “Current Location”
    setPickupLocation({
      ...coords,
      name: info.name || 'My Location',
      address: address || 'Unknown Location',
    });

    setSelecting('destination');
  } catch (err) {
    console.error(err);
    Alert.alert('Location Error', 'Could not get your current location.');
  } finally {
    setIsLoading(false);
  }
};


  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
    }
    return points;
  };

  const calculateFare = (distance) => {
    const { baseFare, baseDistance, extraPerKm } = fareSettings;
    if (distance <= baseDistance) return Math.round(baseFare);
    return Math.round(baseFare + (distance - baseDistance) * extraPerKm);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (distance) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    if (distance < 10) return `${distance.toFixed(1)} km`;
    return `${Math.round(distance)} km`;
  };

  const calculateRoute = async () => {
    if (!pickupLocation || !destinationLocation) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupLocation.longitude},${pickupLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=polyline`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = decodePolyline(route.geometry);
        setRouteCoordinates(coordinates);

        const distance = route.distance / 1000;
        const duration = route.duration / 60;
        const fare = calculateFare(distance);

        setRouteInfo({
          distance: Math.round(distance * 10) / 10,
          formattedDuration: formatDuration(duration),
          fare,
        });

        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
          animated: true,
        });
      } else {
        Alert.alert('Route Error', 'No valid route found between points.');
      }
    } catch (error) {
      console.error('Route fetch failed:', error);
      Alert.alert('Error', 'Could not fetch route. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const res = await Location.reverseGeocodeAsync({ latitude, longitude });
      const info = res[0];
      const address = [
        info.name,
        info.street,
        info.district,
        info.city,
        info.region,
      ]
        .filter(Boolean)
        .join(', ');

      const locationData = {
        latitude,
        longitude,
        name: info.name || 'Selected Location',
        address: address || 'Unknown location',
      };

      if (selecting === 'pickup') {
        setPickupLocation(locationData);
        setSelecting('destination');
      } else {
        setDestinationLocation(locationData);
      }

      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.error('Reverse geocode failed:', err);
    }
  };

  const handleBookRide = () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert('Error', 'Please select pickup and destination');
      return;
    }
    navigation.navigate('DeliveryPayment', {
      pickupLocation,
      destinationLocation,
      routeInfo,
    });
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) return;
    try {
      setSearchLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: query,
            format: 'json',
            limit: '10',
            countrycodes: 'in',
            viewbox: '74.0,18.45,78.6,11.5',
            bounded: '1',
          }),
        { headers: { 'User-Agent': 'BoxDeliveryApp/1.0' } }
      );
      const data = await response.json();
      const filteredResults = data.filter((item) =>
        item.display_name.toLowerCase().includes('karnataka')
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const location = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      name: item.display_name.split(',')[0],
      address: item.display_name,
    };

    if (selecting === 'pickup') {
      setPickupLocation(location);
      setSelecting('destination');
    } else {
      setDestinationLocation(location);
    }

    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setShowSearchModal(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleOpenInMaps = () => {
    if (pickupLocation && destinationLocation) {
      const pickup = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const drop = `${destinationLocation.latitude},${destinationLocation.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${drop}&travelmode=driving`;
      Linking.openURL(url);
    } else {
      Alert.alert('Select both pickup and destination first');
    }
  };

  const renderLocationInput = (location, type) => {
    const isPickup = type === 'pickup';
    return (
      <TouchableOpacity
        style={styles.locationInput}
        onPress={() => setShowSearchModal(true) || setSelecting(type)}
      >
        <Ionicons
          name={isPickup ? 'pin' : 'location-sharp'}
          size={20}
          color={isPickup ? SUCCESS_COLOR : ERROR_COLOR}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: TEXT_COLOR }}>
            {location ? location.name : isPickup ? 'Select Pickup' : 'Select Destination'}
          </Text>
          {location && (
            <Text style={{ color: SUB_TEXT_COLOR, fontSize: 12 }} numberOfLines={1}>
              {location.address}
            </Text>
          )}
        </View>
        {isPickup && location && (
          <TouchableOpacity onPress={() => setPickupLocation(null)}>
            <Ionicons name="close-circle" size={20} color={ERROR_COLOR} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_COLOR} />
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation
        onPress={handleMapPress}
      >
        {pickupLocation && (
          <Marker coordinate={pickupLocation} title="Pickup" pinColor={SUCCESS_COLOR} />
        )}
        {destinationLocation && (
          <Marker coordinate={destinationLocation} title="Destination" pinColor={ERROR_COLOR} />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor={PRIMARY_COLOR} />
        )}
      </MapView>

      {pickupLocation && destinationLocation && (
        <TouchableOpacity style={styles.mapsButton} onPress={handleOpenInMaps}>
          <Ionicons name="navigate" size={18} color="#FFF" />
          <Text style={styles.mapsButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSheet}>
        {renderLocationInput(pickupLocation, 'pickup')}
        {renderLocationInput(destinationLocation, 'destination')}

        {routeInfo && (
          <View style={styles.routeContainer}>
            <Text style={styles.routeText}>
              {formatDistance(routeInfo.distance)} • {routeInfo.formattedDuration}
            </Text>
            <Text style={styles.fareText}>₹{routeInfo.fare}</Text>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookRide}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide">
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${selecting === 'pickup' ? 'Pickup' : 'Destination'}`}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
          {searchLoading ? (
            <View style={styles.searchLoaderContainer}>
              <ActivityIndicator size="large" color={SECONDARY_COLOR} />
              <Text style={styles.loadingText}>Searching places in Karnataka...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.searchResultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Finding route...</Text>
        </View>
      )}
    </View>
  );
};

export default BoxDelivery;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  map: { flex: 1 },
  mapsButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 6,
    zIndex: 20,
  },
  mapsButtonText: { color: '#FFF', fontWeight: '600', marginLeft: 6, fontSize: 14 },
  bottomSheet: {
    backgroundColor: '#FFF',
    padding: 15,
    elevation: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  routeContainer: { marginTop: 15, alignItems: 'center' },
  routeText: { fontSize: 16, color: '#555', marginBottom: 5 },
  fareText: { fontSize: 24, fontWeight: '700', color: '#000' },
  bookButton: {
    backgroundColor: PRIMARY_COLOR,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  searchModal: { flex: 1, backgroundColor: '#FFF', paddingTop: 50 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#CCC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginLeft: 10,
  },
  searchLoaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 16, color: PRIMARY_COLOR },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  searchResultText: { marginLeft: 10, fontSize: 15, color: '#333', flex: 1 },
});
