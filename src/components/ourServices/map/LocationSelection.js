// LocationSelection.js
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState, useRef } from "react";
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
  Linking,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { GOOGLE_API_KEY } from "../../googleApi/GoogleApi";
import Header from "../../header/Header";

const { height } = Dimensions.get("window");
const PRIMARY_COLOR = "#007BFF";
const SECONDARY_COLOR = "#4285F4";
const SUCCESS_COLOR = "#4CAF50";
const ERROR_COLOR = "#EA4335";
const TEXT_COLOR = "#333";
const SUB_TEXT_COLOR = "#666";
const BACKGROUND_COLOR = "#F5F5F5";

const LocationSelection = ({ navigation }) => {
  const mapRef = useRef(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selecting, setSelecting] = useState("destination");
  const [fareSettings, setFareSettings] = useState({
    baseFare: 30,
    baseDistance: 2,
    extraPerKm: 10,
  });

  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchFareSettings = async () => {
    try {
      const snapshot = await getDocs(collection(db, "taxiPrices"));
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setFareSettings({
          baseFare: docData.baseFare || 30,
          baseDistance: docData.baseDistance || 2,
          extraPerKm: docData.extraPerKm || 10,
        });
      }
    } catch (error) {
      console.error("Error fetching fare settings:", error);
    }
  };

  // -------------------------
  // Get device location & reverse geocode via Google
  // -------------------------
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Permission denied");

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

      // Use Google Geocoding for nicer formatted address
      await reverseGeocodeGoogle(coords, true);
      setSelecting("destination");
    } catch (err) {
      console.error(err);
      Alert.alert("Location Error", "Could not get your current location.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Google Reverse Geocode
  // -------------------------
  const reverseGeocodeGoogle = async (coords, isPickup = false) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !data.results || data.results.length === 0) {
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
      const name =
        (best.address_components &&
          best.address_components[0] &&
          best.address_components[0].long_name) ||
        "Selected Location";

      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name,
        address,
      };

      if (isPickup) {
        setPickupLocation(locationData);
      } else {
        setDestinationLocation(locationData);
      }
    } catch (err) {
      console.error("reverseGeocodeGoogle error", err);
    }
  };

  // -------------------------
  // Polyline decode (Google encoded polyline)
  // -------------------------
  const decodePolyline = (encoded) => {
    const points = [];
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

  // -------------------------
  // Calculate fare, format helpers
  // -------------------------
  const calculateFare = (distance) => {
    const { baseFare, baseDistance, extraPerKm } = fareSettings;
    if (distance <= baseDistance) return Math.round(baseFare);
    const total = baseFare + (distance - baseDistance) * extraPerKm;
    return Math.round(total);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${Math.ceil(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);
    return remainingMinutes === 0
      ? `${hours}h`
      : `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (distance) => {
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    if (distance < 10) return `${distance.toFixed(1)} km`;
    return `${Math.round(distance)} km`;
  };

  // -------------------------
  // Calculate route using Google Directions API
  // -------------------------
  const calculateRoute = async () => {
    if (!pickupLocation || !destinationLocation) return;
    setIsLoading(true);

    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=` +
        `${pickupLocation.latitude},${pickupLocation.longitude}&destination=` +
        `${destinationLocation.latitude},${destinationLocation.longitude}&key=${GOOGLE_API_KEY}&mode=driving&alternatives=false`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data || !data.routes || data.routes.length === 0) {
        Alert.alert(
          "Route Error",
          "Could not find a route between the selected locations."
        );
        return;
      }

      const route = data.routes[0];
      const points = decodePolyline(route.overview_polyline.points);

      setRouteCoordinates(points);

      const distanceMeters = route.legs.reduce(
        (sum, leg) => sum + (leg.distance?.value || 0),
        0
      );
      const durationSeconds = route.legs.reduce(
        (sum, leg) => sum + (leg.duration?.value || 0),
        0
      );

      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10; // 1 decimal
      const durationMin = Math.ceil(durationSeconds / 60);

      const fare = calculateFare(distanceKm);

      setRouteInfo({
        distance: distanceKm,
        formattedDuration: formatDuration(durationMin),
        fare,
      });

      // Fit map
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 80, right: 50, bottom: height * 0.4, left: 50 },
        animated: true,
      });
    } catch (err) {
      console.error("Directions error:", err);
      Alert.alert(
        "Network Error",
        "Failed to calculate route. Check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Map press chooses location and reverse geocodes
  // -------------------------
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    try {
      setIsLoading(true);
      await reverseGeocodeGoogle(
        { latitude, longitude },
        selecting === "pickup"
      );
      if (selecting === "pickup") setSelecting("destination");
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Handle Book Ride
  // -------------------------
  const handleBookRide = () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert("Error", "Please select pickup and destination");
      return;
    }
    navigation.navigate("BikeTaxiPayment", {
      pickupLocation,
      destinationLocation,
      routeInfo,
    });
  };

  // -------------------------
  // Clear pickup and reset
  // -------------------------
  const handleClearPickup = () => {
    setPickupLocation(null);
    setDestinationLocation(null);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setSelecting("pickup");
  };

  // -------------------------
  // GOOGLE PLACES AUTOCOMPLETE (then filter to Karnataka only via place details)
  // -------------------------
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Get autocomplete predictions (country restricted to IN)
      const acUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${GOOGLE_API_KEY}&components=country:in&sessiontoken=${Math.random()
        .toString(36)
        .substring(2, 12)}`;

      const acResp = await fetch(acUrl);
      const acData = await acResp.json();
      if (!acData || !acData.predictions) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      // To enforce "Karnataka only" we need to call place details for top predictions and filter
      const preds = acData.predictions.slice(0, 6); // limit checks to top 6 to save requests
      const detailPromises = preds.map((p) =>
        fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=address_component,geometry,formatted_address,place_id,name&key=${GOOGLE_API_KEY}`
        )
          .then((r) => r.json())
          .then((detailData) => {
            if (!detailData || !detailData.result) return null;
            const components = detailData.result.address_components || [];
            const stateComp = components.find((c) =>
              c.types.includes("administrative_area_level_1")
            );
            const stateName = stateComp ? stateComp.long_name : "";
            if (stateName && stateName.toLowerCase().includes("karnataka")) {
              return {
                place_id: p.place_id,
                description: p.description,
                formatted_address: detailData.result.formatted_address,
                geometry: detailData.result.geometry,
                name: detailData.result.name,
              };
            }
            return null;
          })
          .catch((e) => {
            console.error("place detail error", e);
            return null;
          })
      );

      const detailed = await Promise.all(detailPromises);
      const filtered = detailed.filter(Boolean);

      setSearchResults(filtered);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // -------------------------
  // When user selects a search result
  // -------------------------
  const handleSelectSearchResult = (item) => {
    if (!item || !item.geometry) return;
    const loc = item.geometry.location;
    const location = {
      latitude: loc.lat,
      longitude: loc.lng,
      name: item.formatted_address || item.description,
      address: item.formatted_address || item.description,
    };

    if (selecting === "pickup") {
      setPickupLocation(location);
      setSelecting("destination");
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
    setSearchQuery("");
  };

  const openSearchModal = (type) => {
    setSelecting(type);
    setShowSearchModal(true);
    setSearchResults([]);
    setSearchQuery("");
  };

  const renderLocationInput = (location, type) => {
    const isPickup = type === "pickup";
    const locationName = isPickup
      ? location?.name || "Select Pickup Location"
      : location?.name || "Select Destination";
    const locationAddress =
      location?.address ||
      (isPickup ? "Tap to select location" : "Tap to select location");

    return (
      <TouchableOpacity
        style={styles.locationInput}
        onPress={() => openSearchModal(type)}
        activeOpacity={0.7}
      >
        <View style={styles.locationIcon}>
          <Ionicons
            name={isPickup ? "pin" : "location-sharp"}
            size={20}
            color={isPickup ? SUCCESS_COLOR : ERROR_COLOR}
          />
        </View>
        <View style={styles.locationTextContainer}>
          <Text
            style={[styles.locationText, !location && styles.placeholderText]}
          >
            {locationName}
          </Text>
          <Text style={styles.locationSubText} numberOfLines={1}>
            {locationAddress}
          </Text>
        </View>
        {isPickup && location && (
          <TouchableOpacity
            onPress={handleClearPickup}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={24} color={ERROR_COLOR} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_COLOR} />
      <Header title="Bike Taxi" navigation={navigation} />
      <View style={styles.mapViewContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          onPress={handleMapPress}
          initialRegion={{
            latitude: 12.9716,
            longitude: 77.5946,
            latitudeDelta: 2,
            longitudeDelta: 2,
          }}
        >
          {pickupLocation && (
            <Marker
              coordinate={{
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude,
              }}
              title="Pickup"
              pinColor={SUCCESS_COLOR}
            />
          )}
          {destinationLocation && (
            <Marker
              coordinate={{
                latitude: destinationLocation.latitude,
                longitude: destinationLocation.longitude,
              }}
              title="Destination"
              pinColor={ERROR_COLOR}
            />
          )}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor={PRIMARY_COLOR}
            />
          )}
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.locationCard}>
          {renderLocationInput(pickupLocation, "pickup")}
          <View style={styles.separatorLine} />
          {renderLocationInput(destinationLocation, "destination")}
        </View>

        {routeInfo ? (
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeDetailsWrapper}>
              <View style={styles.distanceDurationRow}>
                <Text style={styles.routeDistance}>
                  {formatDistance(routeInfo.distance)}
                </Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.routeDuration}>
                  {routeInfo.formattedDuration}
                </Text>
              </View>

              <View style={styles.fareInfo}>
                <Text style={styles.routeFareLabel}>Estimated Fare</Text>
                <Text style={styles.routeFare}>₹{routeInfo.fare}</Text>
                <Text style={styles.priceInfo}>
                  (₹{fareSettings.baseFare} for first{" "}
                  {fareSettings.baseDistance} km, then ₹
                  {fareSettings.extraPerKm}/km)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookRide}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoMessage}>
            <Text style={styles.infoText}>
              {pickupLocation
                ? "Now select your destination to see the route and fare."
                : "Tap on the map or search to select your pickup location."}
            </Text>
            {pickupLocation && (
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={handleClearPickup}
              >
                <Ionicons name="refresh" size={16} color={PRIMARY_COLOR} />
                <Text style={styles.currentLocationButtonText}>
                  Reset Selection
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={26} color={TEXT_COLOR} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${
                selecting === "pickup" ? "Pickup" : "Destination"
              } location...`}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              placeholderTextColor="#999"
            />
          </View>

          {searchLoading ? (
            <View style={styles.searchLoaderContainer}>
              <ActivityIndicator size="large" color={SECONDARY_COLOR} />
              <Text style={styles.loadingText}>
                Searching places in Karnataka...
              </Text>
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
                  <Ionicons
                    name="location-outline"
                    size={22}
                    color={PRIMARY_COLOR}
                  />
                  <View style={styles.resultTextWrapper}>
                    <Text style={styles.searchResultName} numberOfLines={1}>
                      {item.name || item.description?.split(",")[0]}
                    </Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>
                      {item.formatted_address || item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 2 && (
                  <View style={styles.noResultContainer}>
                    <Ionicons
                      name="search-circle-outline"
                      size={50}
                      color="#CCC"
                    />
                    <Text style={styles.noResultText}>No results found.</Text>
                    <Text style={styles.noResultSubText}>
                      Try a different search term or check spelling.
                    </Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </Modal>

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
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
    zIndex: 10,
  },

  locationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  locationInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  separatorLine: {
    height: 1,
    backgroundColor: "#EEE",
    marginLeft: 35,
  },
  locationIcon: {
    width: 30,
    alignItems: "center",
    marginRight: 10,
  },
  locationTextContainer: { flex: 1, justifyContent: "center" },
  locationText: { fontSize: 16, color: TEXT_COLOR, fontWeight: "600" },
  placeholderText: { color: SUB_TEXT_COLOR, fontWeight: "500" },
  locationSubText: { fontSize: 13, color: SUB_TEXT_COLOR, marginTop: 2 },
  clearButton: { padding: 5, marginLeft: 10 },
  routeInfoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  routeDetailsContainer: {
    flex: 1,
    paddingRight: 10,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: TEXT_COLOR,
  },

  fareAndButtonWrapper: {
    alignItems: "flex-end",
  },

  fareContainer: {
    alignItems: "flex-end",
    marginBottom: 10,
  },

  fareLabel: {
    fontSize: 12,
    color: SUB_TEXT_COLOR,
  },

  routeFare: {
    fontSize: 26,
    fontWeight: "900",
    color: PRIMARY_COLOR,
    marginTop: 2,
  },

  bookButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },

  bookButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  infoMessage: {
    padding: 15,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: TEXT_COLOR,
    textAlign: "center",
    marginBottom: 10,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
  },
  currentLocationButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  searchModal: { flex: 1, backgroundColor: "#FFF", paddingTop: 50 },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: { marginRight: 15, padding: 5 },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  resultTextWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    color: TEXT_COLOR,
    fontWeight: "500",
  },
  searchResultAddress: {
    fontSize: 12,
    color: SUB_TEXT_COLOR,
    marginTop: 2,
  },
  searchLoaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  noResultContainer: {
    marginTop: 50,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noResultText: {
    color: SUB_TEXT_COLOR,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  noResultSubText: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  routeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
    marginVertical: 10,
  },
  routeDetailsWrapper: { flex: 1, marginRight: 10 },
  distanceDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  routeDistance: { fontSize: 18, fontWeight: "600", color: "#333" },
  routeDuration: { fontSize: 16, fontWeight: "400", color: "#666" },
  separator: { fontSize: 18, color: "#999", marginHorizontal: 8 },
  fareInfo: { marginTop: 5 },
  routeFareLabel: { fontSize: 14, color: "#888", marginBottom: 2 },
  routeFare: { fontSize: 26, fontWeight: "bold", color: "#000" },
  priceInfo: { fontSize: 12, color: "#666", marginTop: 2 },
  bookButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  bookButtonText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
});
