import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const MapComponent = ({
  pickupLocation,
  destinationLocation,
  setPickupLocation,
  setDestinationLocation,
  selecting,
  routeCoordinates,
  showRoute,
  mapHeight,
}) => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  // ✅ Get current location and center the map
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please allow location access.');
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = current.coords;

        const currentRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setRegion(currentRegion);
        setPickupLocation({
          latitude,
          longitude,
          name: 'Current Location',
          address: 'Your current location',
        });

        fetchNearbyPlaces(latitude, longitude);
        setLoading(false);
      } catch (error) {
        console.error('Location Error:', error);
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Fetch nearby points of interest (optional, still uses OpenStreetMap)
  const fetchNearbyPlaces = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=restaurant,shop,atm,park,hospital,hotel&bounded=1&limit=20&viewbox=${lon - 0.01},${lat + 0.01},${lon + 0.01},${lat - 0.01}`,
        { headers: { 'User-Agent': 'TaxiBookingApp/1.0' } }
      );
      const data = await response.json();
      setNearbyPlaces(data || []);
    } catch (err) {
      console.error('Nearby places fetch error:', err);
    }
  };

  // ✅ Fit both markers if available
  useEffect(() => {
    if (pickupLocation && destinationLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
        ],
        { edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, animated: true }
      );
    }
  }, [pickupLocation, destinationLocation]);

  // ✅ FAST Reverse Geocoding using expo-location
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result && result.length > 0) {
        const info = result[0];
        const address = [
          info.name,
          info.street,
          info.district,
          info.city,
          info.region,
        ]
          .filter(Boolean)
          .join(', ');
        return address || 'Unknown location';
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return 'Unknown location';
    }
  };

  // ✅ Handle map tap — instant marker + fast reverse geocoding
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Show marker immediately
    if (selecting === 'pickup') {
      setPickupLocation({ latitude, longitude, name: 'Pickup Location', address: 'Fetching address...' });
    } else if (selecting === 'destination') {
      setDestinationLocation({ latitude, longitude, name: 'Destination Location', address: 'Fetching address...' });
    }

    // Get address fast using expo-location
    const address = await reverseGeocode(latitude, longitude);

    if (selecting === 'pickup') {
      setPickupLocation((prev) => ({ ...prev, address }));
      Alert.alert('Pickup Selected', address);
    } else if (selecting === 'destination') {
      setDestinationLocation((prev) => ({ ...prev, address }));
      Alert.alert('Destination Selected', address);
    }
  };

  // ✅ Open route in Google Maps
  const openInMaps = () => {
    if (pickupLocation && destinationLocation) {
      const pickup = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const destination = `${destinationLocation.latitude},${destinationLocation.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${destination}&travelmode=driving`;
      Linking.openURL(url);
    } else {
      Alert.alert('Select both pickup and destination first');
    }
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Locating you...</Text>
      </View>
    );
  }

  return (
    <View style={{ height: mapHeight }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        region={region}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {/* Pickup Marker */}
        {pickupLocation && (
          <Marker
            coordinate={{
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            }}
            title="Pickup"
            description={pickupLocation.address}
            pinColor="green"
          />
        )}

        {/* Destination Marker */}
        {destinationLocation && (
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Destination"
            description={destinationLocation.address}
            pinColor="red"
          />
        )}

        {/* Route Polyline */}
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="#4285F4" />
        )}

        {/* Optional: Nearby places */}
        {nearbyPlaces.map((place, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(place.lat),
              longitude: parseFloat(place.lon),
            }}
            title={place.display_name.split(',')[0]}
            description={place.display_name}
            pinColor="#007AFF"
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
        <Ionicons name="navigate" size={16} color="#FFF" />
        <Text style={styles.mapsButtonText}>Open in Maps</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mapsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    zIndex: 20,
  },
  mapsButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default MapComponent;
