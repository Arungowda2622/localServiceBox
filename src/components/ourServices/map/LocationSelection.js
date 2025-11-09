import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
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
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// --- Constants for better readability ---
const { height } = Dimensions.get('window');
const PRIMARY_COLOR = '#007BFF'; // Blue for primary actions (Book Now)
const SECONDARY_COLOR = '#4285F4'; // Google Blue for route/icons
const SUCCESS_COLOR = '#4CAF50'; // Green for Pickup
const ERROR_COLOR = '#EA4335'; // Red for Destination
const TEXT_COLOR = '#333';
const SUB_TEXT_COLOR = '#666';
const BACKGROUND_COLOR = '#F5F5F5'; // Light grey background
// --- Constants End ---

const LocationSelection = ({ navigation }) => {
  const mapRef = useRef(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selecting, setSelecting] = useState('destination');
  const [fareSettings, setFareSettings] = useState({
    baseFare: 30,
    baseDistance: 2,
    extraPerKm: 10,
  });

  // 🔍 Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    fetchFareSettings();
  }, []);

  useEffect(() => {
    if (pickupLocation && destinationLocation) calculateRoute();
  }, [pickupLocation, destinationLocation]);

  // --- UTILITY FUNCTIONS (Kept the same for functionality) ---

  const fetchFareSettings = async () => {
    // ... (Your original fetchFareSettings function)
    try {
      const snapshot = await getDocs(collection(db, 'taxiPrices'));
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setFareSettings({
          baseFare: docData.baseFare || 30,
          baseDistance: docData.baseDistance || 2,
          extraPerKm: docData.extraPerKm || 10,
        });
      }
    } catch (error) {
      console.error('Error fetching fare settings:', error);
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
    // ... (Your original decodePolyline function)
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
    // ... (Your original calculateFare function)
    const { baseFare, baseDistance, extraPerKm } = fareSettings;
    if (distance <= baseDistance) return Math.round(baseFare);
    const total = baseFare + (distance - baseDistance) * extraPerKm;
    return Math.round(total);
  };

  const formatDuration = (minutes) => {
    // ... (Your original formatDuration function)
    if (minutes < 60) return `${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (distance) => {
    // ... (Your original formatDistance function)
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    if (distance < 10) return `${distance.toFixed(1)} km`;
    return `${Math.round(distance)} km`;
  };

  const calculateRoute = async () => {
    // ... (Your original calculateRoute function)
    if (!pickupLocation || !destinationLocation) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        // Using a more reliable OSRM service
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
          edgePadding: { top: 80, right: 50, bottom: height * 0.4, left: 50 }, // Adjust for bottom sheet
          animated: true,
        });
      } else {
        Alert.alert('Route Error', 'Could not find a route between the selected locations.');
      }
    } catch (error) {
      console.error('OSRM error:', error);
      Alert.alert('Network Error', 'Failed to calculate route. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    // ... (Your original handleMapPress function)
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
    // ... (Your original handleBookRide function)
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert('Error', 'Please select pickup and destination');
      return;
    }
    navigation.navigate('BikeTaxiPayment', {
      pickupLocation,
      destinationLocation,
      routeInfo,
    });
  };

  const handleClearPickup = () => {
    setPickupLocation(null);
    setDestinationLocation(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setSelecting('pickup');
  };

  const handleSearch = async (query) => {
    // ... (Your original handleSearch function)
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
        { headers: { 'User-Agent': 'TaxiBookingApp/1.0' } }
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
    // ... (Your original handleSelectSearchResult function)
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

  const openSearchModal = (type) => {
    setSelecting(type);
    setShowSearchModal(true);
  };
  
  const handleOpenInMaps = () => {
    if (pickupLocation && destinationLocation) {
      const pickup = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const drop = `${destinationLocation.latitude},${destinationLocation.longitude}`;
      // Updated URL to a common format that often works better
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${drop}&travelmode=driving`; 
      Linking.openURL(url);
    } else {
      Alert.alert('Selection Required', 'Select both pickup and destination first to open in Maps.');
    }
  };


  // --- JSX RENDER ---

  const renderLocationInput = (location, type) => {
    const isPickup = type === 'pickup';
    const locationName = isPickup
      ? location?.name || 'Select Pickup Location'
      : location?.name || 'Select Destination';
    const locationAddress = location?.address || (isPickup ? 'Tap to select location' : 'Tap to select location');

    return (
      <TouchableOpacity
        style={styles.locationInput}
        onPress={() => openSearchModal(type)}
        activeOpacity={0.7}
      >
        {/* Dot/Icon Area */}
        <View style={styles.locationIcon}>
          <Ionicons
            name={isPickup ? 'pin' : 'location-sharp'}
            size={20}
            color={isPickup ? SUCCESS_COLOR : ERROR_COLOR}
          />
        </View>

        {/* Text Area */}
        <View style={styles.locationTextContainer}>
          <Text style={[styles.locationText, !location && styles.placeholderText]}>
            {locationName}
          </Text>
          <Text style={styles.locationSubText} numberOfLines={1}>
            {locationAddress}
          </Text>
        </View>

        {/* Clear Button (Only for Pickup and if set) */}
        {isPickup && location && (
          <TouchableOpacity onPress={handleClearPickup} style={styles.clearButton}>
            <Ionicons name="close-circle" size={24} color={ERROR_COLOR} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_COLOR} />

      {/* 🗺️ Map View */}
      <View style={styles.mapViewContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          onPress={handleMapPress}
          initialRegion={{ // Default to a central Karnataka region if no current location
             latitude: 12.9716, 
             longitude: 77.5946, 
             latitudeDelta: 2, 
             longitudeDelta: 2 
          }}
        >
          {pickupLocation && (
            <Marker coordinate={pickupLocation} title="Pickup" pinColor={SUCCESS_COLOR} />
          )}
          {destinationLocation && (
            <Marker coordinate={destinationLocation} title="Destination" pinColor={ERROR_COLOR} />
          )}
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={PRIMARY_COLOR} />
          )}
        </MapView>
      </View>

      {/* 📍 Location Inputs & Booking Details */}
      <View style={styles.bottomSheet}>
        {/* Location Selector Card */}
        <View style={styles.locationCard}>
          {renderLocationInput(pickupLocation, 'pickup')}
          <View style={styles.separatorLine} />
          {renderLocationInput(destinationLocation, 'destination')}
        </View>

        {/* Route Info & Book Button */}
        {routeInfo ? (
          <View style={styles.routeInfoContainer}>
              <View style={styles.routeDetailsWrapper}>
                <View style={styles.distanceDurationRow}>
                  <Text style={styles.routeDistance}>{formatDistance(routeInfo.distance)}</Text>
                  <Text style={styles.separator}>•</Text>
                  <Text style={styles.routeDuration}>{routeInfo.formattedDuration}</Text>
                </View>

                <View style={styles.fareInfo}>
                  <Text style={styles.routeFareLabel}>Estimated Fare</Text>
                  <Text style={styles.routeFare}>₹{routeInfo.fare}</Text>
                  <Text style={styles.priceInfo}>
                    (₹{fareSettings.baseFare} for first {fareSettings.baseDistance} km, then ₹
                    {fareSettings.extraPerKm}/km)
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.bookButton} onPress={handleBookRide} activeOpacity={0.8}>
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          // <View style={styles.routeInfoCard}>
          //   <View style={styles.routeDetailsContainer}>
          //     <View style={styles.detailItem}>
          //       <Ionicons name="map-outline" size={20} color={'#666'} />
          //       <Text style={styles.detailText}>
          //         Distance: {formatDistance(routeInfo.distance)}
          //       </Text>
          //     </View>
          //     <View style={styles.detailItem}>
          //       <Ionicons name="time-outline" size={20} color={'#666'} />
          //       <Text style={styles.detailText}>
          //         Duration: {routeInfo.formattedDuration}
          //       </Text>
          //     </View>
          //   </View>

          //   <View style={styles.fareAndButtonWrapper}>
          //     <View style={styles.fareContainer}>
          //       <Text style={styles.fareLabel}>Estimated Fare</Text>
          //       <Text style={styles.routeFare}>
          //         ₹{routeInfo.fare}
          //       </Text>
          //     </View>

          //     <TouchableOpacity 
          //       style={styles.bookButton} 
          //       onPress={handleBookRide}
          //       activeOpacity={0.8}
          //     >
          //       <Text style={styles.bookButtonText}>Book Now</Text>
          //       <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          //     </TouchableOpacity>
          //   </View>
          // </View>
        ) : (
          <View style={styles.infoMessage}>
            <Text style={styles.infoText}>
                {pickupLocation ? 'Now select your destination to see the route and fare.' : 'Tap on the map or search to select your pickup location.'}
            </Text>
            {pickupLocation && (
                <TouchableOpacity 
                    style={styles.currentLocationButton} 
                    onPress={handleClearPickup}
                >
                     <Ionicons name="refresh" size={16} color={PRIMARY_COLOR} />
                    <Text style={styles.currentLocationButtonText}>Reset Selection</Text>
                </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 🔍 Search Modal */}
      <Modal visible={showSearchModal} animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={26} color={TEXT_COLOR} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${selecting === 'pickup' ? 'Pickup' : 'Destination'} location...`}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              placeholderTextColor="#999"
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
                  <Ionicons name="location-outline" size={22} color={PRIMARY_COLOR} />
                  <View style={styles.resultTextWrapper}>
                    <Text style={styles.searchResultName} numberOfLines={1}>{item.display_name.split(',')[0]}</Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>{item.display_name.substring(item.display_name.split(',')[0].length + 2).trim()}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 2 && (
                  <View style={styles.noResultContainer}>
                    <Ionicons name="search-circle-outline" size={50} color="#CCC" />
                    <Text style={styles.noResultText}>No results found.</Text>
                    <Text style={styles.noResultSubText}>Try a different search term or check spelling.</Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Finding the best route...</Text>
        </View>
      )}
    </View>
  );
};

export default LocationSelection;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  mapViewContainer: { flex: 1, zIndex: 0 },
  map: { flex: 1 },

  // --- Bottom Sheet Styles (Elevated Card Design) ---
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BACKGROUND_COLOR, // Match container for seamless look
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30, // Extra padding for safe area
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
    zIndex: 10,
  },
  
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#EEE',
    marginLeft: 35, // Align with the start of location name
  },
  locationIcon: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextContainer: { flex: 1, justifyContent: 'center' },
  locationText: { fontSize: 16, color: TEXT_COLOR, fontWeight: '600' },
  placeholderText: { color: SUB_TEXT_COLOR, fontWeight: '500' },
  locationSubText: { fontSize: 13, color: SUB_TEXT_COLOR, marginTop: 2 },
  clearButton: { padding: 5, marginLeft: 10 },


  // --- Route Info Card ---
  routeInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    
    // Main layout for neat separation
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  routeDetailsContainer: {
    flex: 1, // Takes up remaining space on the left
    paddingRight: 10,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Spacing between the two detail lines
  },
  
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: TEXT_COLOR, // Using the main text color
    // Bold is applied directly in the JSX for emphasis
  },
  
  fareAndButtonWrapper: {
    // Contains Fare and Book button, aligned to the right
    alignItems: 'flex-end', 
  },
  
  fareContainer: {
    alignItems: 'flex-end',
    marginBottom: 10, // Spacing before the book button
  },
  
  fareLabel: {
    fontSize: 12,
    color: SUB_TEXT_COLOR,
  },
  
  routeFare: { 
    fontSize: 26, // Slightly bigger fare
    fontWeight: '900', // Extra bold for fare
    color: PRIMARY_COLOR, // Highlight the price with the primary color
    marginTop: 2,
  },
  
  bookButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10, // Reduced vertical padding slightly
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120, // Ensure a consistent width
  },
  
  bookButtonText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 15,
  },
  
  // --- Info Message ---
  infoMessage: {
    padding: 15,
    backgroundColor: '#E3F2FD', // Light blue background
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: TEXT_COLOR,
    textAlign: 'center',
    marginBottom: 10,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
  },
  currentLocationButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },


  // --- Search Modal Styles ---
  searchModal: { flex: 1, backgroundColor: '#FFF', paddingTop: 50 },
  searchHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { marginRight: 15, padding: 5 },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultTextWrapper: { 
    marginLeft: 15, 
    flex: 1 
  },
  searchResultName: { 
    fontSize: 16, 
    color: TEXT_COLOR, 
    fontWeight: '500' 
  },
  searchResultAddress: { 
    fontSize: 12, 
    color: SUB_TEXT_COLOR, 
    marginTop: 2 
  },
  searchLoaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: PRIMARY_COLOR, fontWeight: '600' },
  noResultContainer: { marginTop: 50, alignItems: 'center', paddingHorizontal: 20 },
  noResultText: { color: SUB_TEXT_COLOR, fontSize: 16, fontWeight: '600', marginTop: 10 },
  noResultSubText: { color: '#999', fontSize: 14, marginTop: 5, textAlign: 'center' },

  // --- General Overlay ---
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Make sure it's on top
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
    marginVertical: 10
  },
  routeDetailsWrapper: { flex: 1, marginRight: 10 },
  distanceDurationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  routeDistance: { fontSize: 18, fontWeight: '600', color: '#333' },
  routeDuration: { fontSize: 16, fontWeight: '400', color: '#666' },
  separator: { fontSize: 18, color: '#999', marginHorizontal: 8 },
  fareInfo: { marginTop: 5 },
  routeFareLabel: { fontSize: 14, color: '#888', marginBottom: 2 },
  routeFare: { fontSize: 26, fontWeight: 'bold', color: '#000' },
  priceInfo: { fontSize: 12, color: '#666', marginTop: 2 },
  bookButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  bookButtonText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});