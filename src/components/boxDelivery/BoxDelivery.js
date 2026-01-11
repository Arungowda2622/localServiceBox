// BoxDelivery.js (Updated to match LocationSelection style)

import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { GOOGLE_API_KEY } from "../googleApi/GoogleApi";
import Header from "../header/Header";
const { height } = Dimensions.get("window");

// Colors
const PRIMARY_COLOR = "#007BFF";
const SUCCESS_COLOR = "#4CAF50";
const ERROR_COLOR = "#EA4335";
const TEXT_COLOR = "#333";
const SUB_TEXT_COLOR = "#777";
const BACKGROUND_COLOR = "#F5F5F5";

export default function BoxDelivery({ navigation }) {
  const mapRef = useRef(null);

  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [region, setRegion] = useState(null);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selecting, setSelecting] = useState("pickup");

  // Fare settings (static)
  const fareSettings = {
    baseFare: 50,
    baseDistance: 3,
    extraPerKm: 15,
  };

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // -------------------------
  // INIT LOCATION ON LOAD
  // -------------------------
  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      calculateRoute();
    }
  }, [pickupLocation, destinationLocation]);

  // -------------------------
  // GET DEVICE LOCATION
  // -------------------------
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

      await reverseGeocodeGoogle(coords, true);

      setSelecting("destination");
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // GOOGLE REVERSE GEOCODE
  // -------------------------
  const reverseGeocodeGoogle = async (coords, isPickup = false) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.results?.length) {
        const fallback = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: "Selected Location",
          address: "Unknown location",
        };
        if (isPickup) setPickupLocation(fallback);
        else setDestinationLocation(fallback);
        return;
      }

      const best = data.results[0];
      const address = best.formatted_address;

      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: best.address_components[0]?.long_name || "Location",
        address,
      };

      if (isPickup) setPickupLocation(locationData);
      else setDestinationLocation(locationData);
    } catch (err) {
      console.warn(err);
    }
  };

  // -------------------------
  // DECODE GOOGLE POLYLINE
  // -------------------------
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
    }

    return points;
  };

  // -------------------------
  // CALCULATE FARE
  // -------------------------
  const calculateFare = (distance) => {
    const { baseFare, baseDistance, extraPerKm } = fareSettings;
    if (distance <= baseDistance) return baseFare;
    return Math.round(baseFare + (distance - baseDistance) * extraPerKm);
  };

  // -------------------------
  // FORMAT HELPERS
  // -------------------------
  const formatDistance = (km) => (km < 1 ? `${km * 1000} m` : `${km.toFixed(1)} km`);
  const formatDuration = (minutes) =>
    minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  // -------------------------
  // CALCULATE ROUTE (GOOGLE DIRECTIONS)
  // -------------------------
  const calculateRoute = async () => {
    try {
      setIsLoading(true);

      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=` +
        `${pickupLocation.latitude},${pickupLocation.longitude}&destination=` +
        `${destinationLocation.latitude},${destinationLocation.longitude}` +
        `&key=${GOOGLE_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes?.length) {
        Alert.alert("Error", "No route found");
        return;
      }

      const route = data.routes[0];
      const polylinePoints = decodePolyline(route.overview_polyline.points);

      setRouteCoordinates(polylinePoints);

      const leg = route.legs[0];

      const distanceKm = leg.distance.value / 1000;
      const durationMin = Math.ceil(leg.duration.value / 60);
      const fare = calculateFare(distanceKm);

      setRouteInfo({
        distance: distanceKm,
        duration: durationMin,
        formattedDuration: formatDuration(durationMin), 
        fare,
      });

      mapRef.current?.fitToCoordinates(polylinePoints, {
        edgePadding: { top: 80, right: 50, bottom: height * 0.3, left: 50 },
        animated: true,
      });
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // MAP PRESS HANDLER
  // -------------------------
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setIsLoading(true);
    await reverseGeocodeGoogle({ latitude, longitude }, selecting === "pickup");
    if (selecting === "pickup") setSelecting("destination");
    setIsLoading(false);
  };

  // -------------------------
  // GOOGLE PLACES AUTOCOMPLETE
  // -------------------------
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${GOOGLE_API_KEY}&components=country:in`;

      const res = await fetch(url);
      const data = await res.json();

      setSearchResults(data?.predictions || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // ------------------------------------
  // SELECT SEARCH RESULT
  // ------------------------------------
  const handleSelectSearchResult = async (item) => {
  try {
    const detailUrl =
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}` +
      `&fields=formatted_address,name,address_components,geometry` +
      `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(detailUrl);
    const data = await res.json();

    if (!data.result?.geometry) {
      Alert.alert("Error", "Location not available");
      return;
    }

    const loc = data.result.geometry.location;

    const selectedLocation = {
      latitude: loc.lat,
      longitude: loc.lng,
      name: data.result.name || item.description?.split(",")[0] || "Selected Location",
      address: data.result.formatted_address || item.description,
    };

    if (selecting === "pickup") {
      setPickupLocation(selectedLocation);
      setSelecting("destination");
    } else {
      setDestinationLocation(selectedLocation);
    }

    mapRef.current?.animateToRegion({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setShowSearchModal(false);
    setSearchQuery("");
    setSearchResults([]);
  } catch (err) {
    console.error(err);
  }
};


  // -------------------------
  // RESET PICKUP
  // -------------------------
  const handleReset = () => {
    setPickupLocation(null);
    setDestinationLocation(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setSelecting("pickup");
  };

  // -------------------------
  // BOOK DELIVERY
  // -------------------------
  const handleConfirm = () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert("Error", "Please select both locations");
      return;
    }

    navigation.navigate("DeliveryPayment", {
      pickupLocation,
      destinationLocation,
      routeInfo,
    });
  };

  // -----------------------------------------
  // UI ELEMENT: INPUT CARD
  // -----------------------------------------
  const renderLocationInput = (location, type) => {
    const isPickup = type === "pickup";

    return (
      <TouchableOpacity
        style={styles.locationInput}
        onPress={() => {
          setSelecting(type);
          setShowSearchModal(true);
        }}
      >
        <Ionicons
          name={isPickup ? "navigate-circle" : "location-sharp"}
          size={22}
          color={isPickup ? SUCCESS_COLOR : ERROR_COLOR}
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>
            {location ? location.name : isPickup ? "Pickup Location" : "Destination"}
          </Text>
          <Text style={styles.locationSubtitle} numberOfLines={1}>
            {location ? location.address : "Tap to select location"}
          </Text>
        </View>

        {isPickup && location && (
          <TouchableOpacity onPress={handleReset}>
            <Ionicons name="close-circle" size={24} color={ERROR_COLOR} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
     <Header title="Box Delivery" navigation={navigation} /> 
      {/* MAP */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        onPress={handleMapPress}
        initialRegion={{
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
        region={region}
      >
        {pickupLocation && (
          <Marker coordinate={pickupLocation} pinColor={SUCCESS_COLOR} title="Pickup" />
        )}

        {destinationLocation && (
          <Marker coordinate={destinationLocation} pinColor={ERROR_COLOR} title="Destination" />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={PRIMARY_COLOR} />
        )}
      </MapView>

      {/* BOTTOM SHEET */}
      <View style={styles.bottomSheet}>
        <View style={styles.card}>
          {renderLocationInput(pickupLocation, "pickup")}

          <View style={styles.separator} />

          {renderLocationInput(destinationLocation, "destination")}
        </View>

        {/* Route info */}
        {routeInfo ? (
          <View style={styles.routeContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeDistance}>
                {formatDistance(routeInfo.distance)}
              </Text>
              <Text style={styles.routeDuration}>
                {formatDuration(routeInfo.duration)}
              </Text>

              <Text style={styles.fareTitle}>Estimated Fare</Text>
              <Text style={styles.fareValue}>₹{routeInfo.fare}</Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoMsg}>
            <Text style={styles.infoText}>
              {pickupLocation
                ? "Select your destination to calculate the route."
                : "Select your pickup location."}
            </Text>
          </View>
        )}
      </View>

      {/* SEARCH MODAL */}
      <Modal visible={showSearchModal} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              style={{ padding: 6 }}
            >
              <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>

            <TextInput
              style={styles.modalInput}
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>

          {searchLoading ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(i) => i.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <Ionicons name="location-outline" size={22} color={PRIMARY_COLOR} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.searchName}>
                      {item.description.split(",")[0]}
                    </Text>
                    <Text style={styles.searchAddress}>{item.description}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

// --------------------------------------------
// STYLES
// --------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND_COLOR },

  map: { flex: 1 },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 15,
    backgroundColor: BACKGROUND_COLOR,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 4,
  },

  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginLeft: 35,
    marginVertical: 4,
  },

  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
  },

  locationSubtitle: {
    fontSize: 12,
    color: SUB_TEXT_COLOR,
    marginTop: 2,
  },

  routeContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginTop: 10,
    borderRadius: 12,
    flexDirection: "row",
    elevation: 4,
  },

  routeDistance: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_COLOR,
  },

  routeDuration: {
    fontSize: 14,
    color: SUB_TEXT_COLOR,
    marginBottom: 8,
  },

  fareTitle: {
    fontSize: 12,
    color: "#666",
  },

  fareValue: {
    fontSize: 24,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },

  confirmBtn: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  infoMsg: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    alignItems: "center",
  },

  infoText: {
    fontSize: 14,
    color: TEXT_COLOR,
  },

  modal: { flex: 1, backgroundColor: "#fff" },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },

  modalInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginLeft: 10,
  },

  searchItem: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f1f1f1",
  },

  searchName: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT_COLOR,
  },

  searchAddress: {
    fontSize: 12,
    color: SUB_TEXT_COLOR,
  },

  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginTop: 10,
  },
});
