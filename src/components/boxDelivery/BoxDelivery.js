import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#007BFF",
  gradientStart: "#4C9EEB",
  gradientEnd: "#1A73E8",
  white: "#FFF",
  text: "#222",
  subText: "#666",
  card: "#FBFBFD",
  success: "#34A853",
  danger: "#E63946",
};

export default function BoxDelivery({ navigation }) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);

  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Search sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selecting, setSelecting] = useState("pickup"); // 'pickup' | 'destination'
  const sheetAnim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Fare settings (simple)
  const fareSettings = { baseFare: 50, baseDistance: 3, extraPerKm: 15 };

  useEffect(() => {
    (async () => {
      await initLocation();
    })();
  }, []);

  useEffect(() => {
    // animate sheet
    Animated.timing(sheetAnim, {
      toValue: sheetVisible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true,
    }).start();

    // clear search when hidden
    if (!sheetVisible) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [sheetVisible]);

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      calculateRoute();
    } else {
      setRouteCoordinates([]);
      setRouteInfo(null);
    }
  }, [pickupLocation, destinationLocation]);

  // ===== Location init =====
  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };

      setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

      const rev = await Location.reverseGeocodeAsync(coords);
      const info = rev[0] || {};
      const address = [info.name, info.street, info.city].filter(Boolean).join(", ");

      setPickupLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: info.name || "My location",
        address: address || "Current location",
      });

      // center map
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
    } catch (e) {
      console.warn("initLocation error:", e);
    }
  };

  // ===== Polyline decoder (OSRM polyline) =====
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

  // ===== Route calculation (OSRM) =====
  const calculateRoute = async () => {
    try {
      setIsCalculating(true);
      const a = pickupLocation;
      const b = destinationLocation;
      const url = `https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=polyline`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes?.length) {
        const route = json.routes[0];
        const coords = decodePolyline(route.geometry);
        setRouteCoordinates(coords);

        const distance = route.distance / 1000; // km
        const duration = route.duration / 60; // minutes
        const fare =
          fareSettings.baseFare +
          Math.max(0, distance - fareSettings.baseDistance) * fareSettings.extraPerKm;

        setRouteInfo({
          distance: Number(distance.toFixed(1)),
          duration: Math.round(duration),
          fare: Math.round(fare),
        });

        // fit map
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 40, bottom: 220, left: 40 },
          animated: true,
        });
      }
    } catch (err) {
      console.warn("calculateRoute err:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  // ===== Search (Nominatim) =====
  const searchPlaces = async (text) => {
    setSearchQuery(text);
    if (!text || text.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: text,
          format: "json",
          addressdetails: "1",
          limit: "10",
        });
      const res = await fetch(url, { headers: { "User-Agent": "localServiceBox/1.0" } });
      const json = await res.json();
      const mapped = json.map((it) => ({
        id: it.place_id,
        name: it.display_name,
        lat: parseFloat(it.lat),
        lon: parseFloat(it.lon),
        raw: it,
      }));
      setSearchResults(mapped);
    } catch (err) {
      console.warn("searchPlaces err:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ===== Select place from search =====
  const selectLocation = (item) => {
    const loc = {
      latitude: item.lat,
      longitude: item.lon,
      name: item.name.split(",")[0],
      address: item.name,
    };

    // push to recent
    setRecentSearches((prev) => {
      const list = [loc, ...prev.filter((p) => p.address !== loc.address)].slice(0, 6);
      return list;
    });

    if (selecting === "pickup") {
      setPickupLocation(loc);
      // if no destination yet, focus destination
      setSelecting("destination");
      setTimeout(() => setSheetVisible(true), 250);
    } else {
      setDestinationLocation(loc);
      // close sheet after selection
      setSheetVisible(false);
    }

    setRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  };

  const useCurrentLocationAs = async (which) => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const rev = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const info = rev[0] || {};
      const address = [info.name, info.street, info.city].filter(Boolean).join(", ");
      const obj = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        name: info.name || "My location",
        address: address || "Current location",
      };

      if (which === "pickup") setPickupLocation(obj);
      else setDestinationLocation(obj);

      setRegion({ ...obj, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      mapRef.current?.animateToRegion({ ...obj, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);

      // if we used pickup and destination exists -> calculate
      if (pickupLocation && destinationLocation) calculateRoute();
    } catch (e) {
      console.warn("useCurrentLocationAs err:", e);
    }
  };

  // ===== sheet transforms =====
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });

  // ===== UI helpers =====
  const openSearchFor = (which) => {
    setSelecting(which);
    setSheetVisible(true);
  };

  const confirmBooking = () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      return alert("Please select pickup and destination first.");
    }
    navigation.navigate("DeliveryPayment", { pickupLocation, destinationLocation, routeInfo });
  };

  // ===== Render =====
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          region ?? {
            latitude: 12.9716,
            longitude: 77.5946,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }
        }
        showsUserLocation
      >
        {pickupLocation && (
          <Marker coordinate={pickupLocation} title="Pickup" pinColor={COLORS.success} />
        )}
        {destinationLocation && (
          <Marker coordinate={destinationLocation} title="Drop" pinColor={COLORS.danger} />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={COLORS.primary} />
        )}
      </MapView>

      {/* Header gradient (keeps nice contrast) */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.topGradient}
      >
        <Text style={styles.headerTitle}>📦 Box Delivery</Text>
      </LinearGradient>

      {/* Floating search inputs (Uber style) */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.floatingInput}
          onPress={() => openSearchFor("pickup")}
        >
          <Ionicons name="navigate-circle" size={20} color={COLORS.success} />
          <Text style={styles.floatingText}>
            {pickupLocation ? pickupLocation.address : "Where from?"}
          </Text>
          <Ionicons name="search" size={18} color="#999" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.floatingInput, { marginTop: 10 }]}
          onPress={() => openSearchFor("destination")}
        >
          <Ionicons name="location-sharp" size={20} color={COLORS.danger} />
          <Text style={styles.floatingText}>
            {destinationLocation ? destinationLocation.address : "Where to?"}
          </Text>
          <Ionicons name="search" size={18} color="#999" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* Bottom small fare card */}
      <View style={styles.bottomBox}>
        {isCalculating ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : routeInfo ? (
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.smallText}>
                {routeInfo.distance} km • {routeInfo.duration} min
              </Text>
              <Text style={styles.priceText}>₹{routeInfo.fare}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking}>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.smallText}>Select pickup & destination to see fare</Text>
        )}
      </View>

      {/* Animated full-screen search sheet */}
      {/*
        We use an Animated.View that slides from top. It contains:
         - back button
         - text input
         - "Use current location" button
         - recent searches
         - search results
      */}
      <Animated.View
        pointerEvents={sheetVisible ? "auto" : "none"}
        style={[
          styles.sheet,
          {
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={() => setSheetVisible(false)} style={styles.sheetBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.sheetInputWrap}>
            <Text style={styles.sheetLabel}>{selecting === "pickup" ? "Pickup" : "Destination"}</Text>
            <TextInput
              autoFocus
              placeholder={selecting === "pickup" ? "Search pickup location" : "Search destination"}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={searchPlaces}
              style={styles.sheetInput}
            />
          </View>

          <TouchableOpacity
            onPress={() => useCurrentLocationAs(selecting)}
            style={styles.currentBtn}
          >
            <Ionicons name="locate" size={20} color={COLORS.primary} />
            <Text style={styles.currentBtnText}>Use current</Text>
          </TouchableOpacity>
        </View>

        {/* Recent searches (if any) */}
        {recentSearches.length > 0 && (
          <View style={styles.recentWrap}>
            <Text style={styles.recentTitle}>Recent</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={recentSearches}
              keyExtractor={(it, i) => (it.address || it.name) + i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => selectLocation({ lat: item.latitude, lon: item.longitude, name: item.address })}
                >
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text numberOfLines={1} style={styles.recentText}>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Search results */}
        <View style={styles.resultsWrap}>
          {searchLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={searchResults}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectLocation(item)}
                >
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={2} style={styles.resultTitle}>{item.name.split(",")[0]}</Text>
                    <Text numberOfLines={1} style={styles.resultSubtitle}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 1 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ color: "#666" }}>No results found.</Text>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={{ color: "#666" }}>Try searching for an address or place</Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  topGradient: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: Platform.OS === "ios" ? 120 : 100,
    paddingTop: Platform.OS === "ios" ? 40 : StatusBar.currentHeight,
    paddingHorizontal: 16,
    justifyContent: "center",
    zIndex: 30,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  floatingContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 70 : 50,
    left: 16,
    right: 16,
    zIndex: 40,
  },
  floatingInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatingText: { flex: 1, marginLeft: 10, color: "#222", fontWeight: "600" },

  bottomBox: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 40,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  smallText: { color: "#666", fontWeight: "600" },
  priceText: { fontSize: 20, fontWeight: "800", color: COLORS.primary },

  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  confirmBtnText: { color: "#fff", fontWeight: "800" },

  /* Sheet */
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    backgroundColor: "#fff",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  sheetBack: { padding: 6, marginRight: 6 },
  sheetInputWrap: { flex: 1 },
  sheetLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  sheetInput: {
    backgroundColor: "#F6F6F8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 16,
  },
  currentBtn: { marginLeft: 10, alignItems: "center" },
  currentBtnText: { color: COLORS.primary, fontSize: 12, marginTop: 4 },

  recentWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  recentTitle: { fontWeight: "700", color: "#444", marginBottom: 6 },
  recentItem: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  recentText: { marginLeft: 6, color: "#444", maxWidth: width * 0.5 },

  resultsWrap: { flex: 1, paddingVertical: 6 },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#F0F0F0",
  },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  resultSubtitle: { color: "#666", marginTop: 4, fontSize: 12 },

  emptyBox: { alignItems: "center", marginTop: 30 },
});
