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
  routeCoordinates,
  showRoute,
  mapHeight,
}) => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [selectingPickup, setSelectingPickup] = useState(true);
  const [loading, setLoading] = useState(true);

  // ✅ Get current location and center map
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Allow location access to use the map.');
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const { latitude, longitude } = current.coords;

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Optionally, set this as pickup by default
        setPickupLocation({
          latitude,
          longitude,
          name: 'Current Location',
          address: 'Your current location',
        });

        setLoading(false);
      } catch (error) {
        console.error('Location Error:', error);
        setLoading(false);
      }
    })();
  }, []);

  // Fit map to both markers if available
  useEffect(() => {
    if (pickupLocation && destinationLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
          { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        }
      );
    }
  }, [pickupLocation, destinationLocation]);

  // Handle map tap (reverse-geocode selected point)
  const handleMapPress = async (event) => {
    try {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'TaxiBookingApp/1.0' } }
      );
      const data = await response.json();
      const address = data.display_name || 'Unknown location';

      if (selectingPickup) {
        setPickupLocation({ latitude, longitude, name: 'Pickup Location', address });
        Alert.alert('Pickup selected', address);
        setSelectingPickup(false);
      } else {
        setDestinationLocation({ latitude, longitude, name: 'Destination Location', address });
        Alert.alert('Destination selected', address);
        setSelectingPickup(true);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      Alert.alert('Error', 'Unable to fetch location details');
    }
  };

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
        <Text style={styles.loadingText}>Getting your current location...</Text>
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

        {showRoute && routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={3} strokeColor="#4285F4" />
        )}
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
