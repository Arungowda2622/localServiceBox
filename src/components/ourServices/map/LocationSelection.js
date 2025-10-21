import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapComponent from '../map/MapComponent';

const { width, height } = Dimensions.get('window');

// Utility debounce
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

const LocationSelection = ({navigation}) => {
    const [pickupLocation, setPickupLocation] = useState(null);
    const [destinationLocation, setDestinationLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [locationInputType, setLocationInputType] = useState('pickup');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [manualLocationInput, setManualLocationInput] = useState('');

    const [region, setRegion] = useState({
        latitude: 9.452,
        longitude: 77.5534,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    });

    const [nearbyLocations, setNearbyLocations] = useState([]);

    useEffect(() => {
        const fetchNearby = async () => {
            if (!userLocation) return;

            try {
                const { latitude, longitude } = userLocation;

                const latMin = latitude - 0.05;
                const latMax = latitude + 0.05;
                const lonMin = longitude - 0.05;
                const lonMax = longitude + 0.05;

                // ✅ Added q=* to avoid "Nothing to search for"
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=*&bounded=1&addressdetails=1&limit=20&viewbox=${lonMin},${latMax},${lonMax},${latMin}`,
                    { headers: { 'User-Agent': 'TaxiBookingApp/1.0' } }
                );

                const data = await response.json();

                if (!Array.isArray(data)) {
                    console.error('Unexpected Nominatim response:', data);
                    setNearbyLocations([]);
                    return;
                }

                const nearby = data
                    .filter(
                        (item) =>
                            item?.address?.country === 'India' ||
                            item?.display_name?.includes('India')
                    )
                    .map((item) => ({
                        id: item.place_id,
                        name: item.display_name.split(',')[0],
                        address: item.display_name,
                        latitude: parseFloat(item.lat),
                        longitude: parseFloat(item.lon),
                        distance: calculateDistance(
                            latitude,
                            longitude,
                            parseFloat(item.lat),
                            parseFloat(item.lon)
                        ),
                    }))
                    .filter((loc) => loc.distance <= 10)
                    .sort((a, b) => a.distance - b.distance);

                setNearbyLocations(nearby);
            } catch (error) {
                console.error('Nearby fetch error:', error);
                setNearbyLocations([]);
            }
        };

        fetchNearby();
    }, [userLocation]);

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

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (pickupLocation && destinationLocation) {
            calculateRoute();
        }
    }, [pickupLocation, destinationLocation]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if ([lat1, lon1, lat2, lon2].some(isNaN)) return 0;
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    };

    const calculateRelevanceScore = (location, query) => {
        let score = 0;
        const queryLower = query.toLowerCase();
        const nameLower = location.name.toLowerCase();
        const addressLower = location.address.toLowerCase();

        if (nameLower === queryLower) score += 100;
        if (nameLower.startsWith(queryLower)) score += 50;
        if (addressLower.startsWith(queryLower)) score += 30;
        if (nameLower.includes(queryLower)) score += 20;
        if (addressLower.includes(queryLower)) score += 10;
        if (location.type && queryLower.includes(location.type)) score += 15;

        if (userLocation) {
            const dist = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                location.latitude,
                location.longitude
            );
            if (dist < 10) score += 25;
            else if (dist < 50) score += 10;
        }
        return score;
    };

    const removeDuplicateLocations = (locations) => {
        const seen = new Set();
        return locations.filter((loc) => {
            const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}-${loc.name.substring(0, 20)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const extractBestName = (item) => {
        if (item.name) return item.name;
        if (item.display_name) {
            const parts = item.display_name.split(',');
            return parts.slice(0, 2).join(',').trim();
        }
        return 'Location';
    };

    const searchOnlineLocations = async (query) => {
        try {
            const encodedQuery = encodeURIComponent(`${query}, India`);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=8&addressdetails=1&countrycodes=in`,
                {
                    headers: {
                        'User-Agent': 'TaxiBookingApp/1.0',
                        'Accept-Language': 'en-IN,en',
                    },
                }
            );
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data.map((item, index) => ({
                    id: `online-${index}-${Date.now()}`,
                    name: extractBestName(item),
                    address: item.display_name,
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                    type: 'location',
                    relevance: 100 - index,
                }));
            }
        } catch (err) {
            console.log('Online search failed:', err);
        }
        return [];
    };

    const geocodeLocation = async (address) => {
        try {
            setIsLoading(true);
            const searchAddress = address.includes('India') ? address : `${address}, India`;
            const encoded = encodeURIComponent(searchAddress);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1&countrycodes=in`,
                {
                    headers: {
                        'User-Agent': 'TaxiBookingApp/1.0',
                        'Accept-Language': 'en-IN,en',
                    },
                }
            );
            const data = await response.json();
            if (data?.length > 0) {
                const res = data[0];
                const name = res.display_name.split(',').slice(0, 3).join(',').trim();
                return {
                    latitude: parseFloat(res.lat),
                    longitude: parseFloat(res.lon),
                    address: res.display_name,
                    name: name || address,
                };
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            setIsLoading(false);
        }
        return null;
    };

    const reverseGeocodeLocation = async (lat, lon) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'TaxiBookingApp/1.0' } }
            );
            const data = await response.json();
            return data?.display_name
        } catch (err) {

        }
    };

    const getCurrentLocation = async () => {
        try {
            setIsLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Permission denied');

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });

            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            setUserLocation(coords);
            setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

            const address = await reverseGeocodeLocation(coords.latitude, coords.longitude);
            const name = extractLocationName(address);

            setPickupLocation({ ...coords, address, name });
        } catch (err) {

        } finally {
            setIsLoading(false);
        }
    };

    const extractLocationName = (address) => {
        if (!address) return 'Current Location';
        const parts = address.split(',');
        return parts.slice(0, 2).join(',').trim();
    };

    const searchLocations = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // 🔹 Only fetch from online source now
            const onlineResults = await searchOnlineLocations(query);

            // Optional: sort by relevance or distance if needed
            const sorted = (onlineResults || [])
                .sort((a, b) => {
                    const relDiff = (b.relevance || 0) - (a.relevance || 0);
                    if (relDiff !== 0) return relDiff;
                    if (userLocation) {
                        const distA = calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            a.latitude,
                            a.longitude
                        );
                        const distB = calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            b.latitude,
                            b.longitude
                        );
                        return distA - distB;
                    }
                    return 0;
                })
                .slice(0, 10);

            setSearchResults(sorted);
        } catch (err) {
            console.error('Search failed:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const debouncedSearch = debounce((query) => {
        searchLocations(query);
    }, 300);

    const handleLocationSelect = (location) => {
        const selectedLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            name: location.name,
        };

        if (locationInputType === 'pickup') {
            setPickupLocation(selectedLocation);
        } else {
            setDestinationLocation(selectedLocation);
        }

        setShowLocationInput(false);
        setSearchQuery('');
        setSearchResults([]);

        setRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    };

    const handleManualLocationSelect = (location) => {
        const selectedLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            name: location.name,
        };

        if (locationInputType === 'pickup') {
            setPickupLocation(selectedLocation);
        } else {
            setDestinationLocation(selectedLocation);
        }

        setShowLocationInput(false);
        setManualLocationInput('');
        setSearchQuery('');
        setSearchResults([]);

        setRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    };

    const handleManualLocationSearch = async () => {
        if (!manualLocationInput.trim()) {
            Alert.alert('Error', 'Please enter a location name or address');
            return;
        }

        setIsLoading(true);

        try {
            // 🔹 Only use online geocoding now
            const geocodedResult = await geocodeLocation(manualLocationInput);

            if (geocodedResult) {
                const selectedLocation = {
                    latitude: geocodedResult.latitude,
                    longitude: geocodedResult.longitude,
                    address: geocodedResult.address,
                    name: geocodedResult.name || manualLocationInput,
                };

                // ✅ Set pickup or destination
                if (locationInputType === 'pickup') {
                    setPickupLocation(selectedLocation);
                } else {
                    setDestinationLocation(selectedLocation);
                }

                // ✅ Update map and UI
                setShowLocationInput(false);
                setManualLocationInput('');
                setSearchQuery('');
                setSearchResults([]);

                setRegion({
                    latitude: geocodedResult.latitude,
                    longitude: geocodedResult.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });

                Alert.alert('Success', 'Location found and selected!');
            } else {
                Alert.alert(
                    'Location Not Found',
                    "We couldn't find this location. Try:\n• Using a more specific address\n• Checking the spelling\n• Adding 'India' for better results"
                );
            }
        } catch (error) {
            Alert.alert('Search Error', 'There was a problem searching for this location. Please try again.');
            console.error('Manual location search error:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const decodePolyline = (encoded) => {
        const points = [];
        let index = 0;
        let lat = 0;
        let lng = 0;

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
                const formattedDuration = formatDuration(duration);

                setRouteInfo({
                    distance: Math.max(Math.round(distance * 10) / 10, 0.1),
                    duration: Math.max(Math.ceil(duration), 5),
                    fare: Math.round(fare),
                    formattedDuration,
                });
            } else {
                fallbackRouteCalculation();
            }
        } catch (error) {
            console.error('OSRM Routing error:', error);
            fallbackRouteCalculation();
        } finally {
            setIsLoading(false);
        }
    };

    const fallbackRouteCalculation = () => {
        if (!pickupLocation || !destinationLocation) return;

        const distance = calculateDistance(
            pickupLocation.latitude,
            pickupLocation.longitude,
            destinationLocation.latitude,
            destinationLocation.longitude
        );

        const routePoints = generateCurvedRoute(pickupLocation, destinationLocation);
        setRouteCoordinates(routePoints);

        const fare = calculateFare(distance);
        const duration = estimateTravelTime(distance);
        const formattedDuration = formatDuration(duration);

        setRouteInfo({
            distance: Math.max(distance, 0.1),
            duration: Math.max(duration, 5),
            fare: Math.round(fare),
            formattedDuration,
        });
    };

    const calculateFare = (distance, service) => {
        let fare = 0;

        if (service === 'Local') {
            fare = distance <= 10 ? 400 : 400 + (distance - 10) * 15;
        } else if (service === 'Rental') {
            const baseFare = 2499;
            const includedKm = 80;
            fare = baseFare + Math.max(0, distance - includedKm) * 15;
        } else if (service === 'Outstation') {
            fare = distance * 14;
        }

        return fare;
    };

    const generateCurvedRoute = (start, end) => {
        const points = [];
        const numPoints = 50;

        for (let i = 0; i <= numPoints; i++) {
            const ratio = i / numPoints;
            const lat = start.latitude + (end.latitude - start.latitude) * ratio;
            const lon = start.longitude + (end.longitude - start.longitude) * ratio;

            const distance = calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);
            const curveFactor = distance > 50 ? 0.01 : 0.005;
            const perpOffset = Math.sin(ratio * Math.PI) * curveFactor;
            const angle = Math.atan2(end.latitude - start.latitude, end.longitude - start.longitude);
            const perpAngle = angle + Math.PI / 2;

            points.push({
                latitude: lat + Math.sin(perpAngle) * perpOffset,
                longitude: lon + Math.cos(perpAngle) * perpOffset,
            });
        }

        return points;
    };

    const estimateTravelTime = (distance) => {
        let avgSpeed = 45;
        if (distance > 100) avgSpeed = 65;
        else if (distance < 10) avgSpeed = 25;
        return (distance / avgSpeed) * 60;
    };

    const handleBookRide = () => {
        if (!pickupLocation || !destinationLocation || !routeInfo) {
            Alert.alert('Error', 'Please select pickup and destination locations');
            return;
        }

        navigation.navigate('BikeTaxiPayment', {
            pickupLocation,
            destinationLocation,
            routeInfo,
        });
    };

    const openLocationInput = (type) => {
        setLocationInputType(type);
        setShowLocationInput(true);
        setSearchQuery('');
        setSearchResults([]);
        setManualLocationInput('');
    };

    const handleMapRegionChange = (newRegion) => {
        setRegion(newRegion);
    };

    const getLocationIcon = (type) => {
        switch (type) {
            case 'transport':
                return 'bus-outline';
            case 'religious':
                return 'heart-outline';
            case 'medical':
                return 'medical-outline';
            case 'airport':
                return 'airplane-outline';
            case 'capital':
            case 'metro':
                return 'business-outline';
            case 'government':
                return 'business-outline';
            case 'commercial':
                return 'business-outline';
            case 'location': // Changed from 'online' to 'location'
            default:
                return 'location-outline'; // Always use location icon for search results
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <View style={styles.mapContainer}>
                <MapComponent
                    region={region}
                    userLocation={userLocation}
                    pickupLocation={pickupLocation}
                    destinationLocation={destinationLocation}
                    setPickupLocation={setPickupLocation}       // <--- pass setter
                    setDestinationLocation={setDestinationLocation} // <--- pass setter
                    routeCoordinates={routeCoordinates}
                    onRegionChangeComplete={handleMapRegionChange}
                    showRoute={routeCoordinates.length > 0}
                    mapHeight={height * 0.5}
                />
            </View>
            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.locationContainer}>
                    <TouchableOpacity
                        style={styles.locationInput}
                        onPress={() => openLocationInput('pickup')}
                    >
                        <View style={styles.locationDot}>
                            <View style={[styles.dot, styles.pickupDot]} />
                        </View>
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationText}>
                                {pickupLocation
                                    ? pickupLocation.name || 'Current Location'
                                    : 'Select pickup location'}
                            </Text>
                            {pickupLocation && (
                                <Text style={styles.locationSubText} numberOfLines={1}>
                                    {pickupLocation.address}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.locationInput}
                        onPress={() => openLocationInput('destination')}
                    >
                        <View style={styles.locationDot}>
                            <View style={[styles.dot, styles.destinationDot]} />
                        </View>
                        <View style={styles.locationTextContainer}>
                            <Text
                                style={[
                                    styles.locationText,
                                    !destinationLocation && styles.placeholderText,
                                ]}
                            >
                                {destinationLocation
                                    ? destinationLocation.name
                                    : 'Select Destination'}
                            </Text>
                            {destinationLocation && (
                                <Text style={styles.locationSubText} numberOfLines={1}>
                                    {destinationLocation.address}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    {routeInfo && (
                        <View style={styles.routeInfoContainer}>
                            <View style={styles.routeDetailsWrapper}>
                                {/* Distance and Duration Row */}
                                <View style={styles.distanceDurationRow}>
                                    <Text style={styles.routeDistance}>
                                        {formatDistance(routeInfo.distance)}
                                    </Text>
                                    <Text style={styles.separator}>•</Text>
                                    <Text style={styles.routeDuration}>
                                        {routeInfo.formattedDuration}
                                    </Text>
                                </View>

                                {/* Fare Information */}
                                <View style={styles.fareInfo}>
                                    <View>
                                        <Text style={styles.routeFareLabel}>Estimated Fare</Text>
                                        <Text style={styles.routeFare}>₹{routeInfo.fare}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Book Button */}
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => handleBookRide()}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.bookButtonText}>Book Now</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4285F4" />
                    <Text style={styles.loadingText}>Fetching your current location…</Text>
                </View>
            )}
            <Modal
                visible={showLocationInput}
                animationType="slide"
                onRequestClose={() => setShowLocationInput(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowLocationInput(false)}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {locationInputType === 'pickup' ? 'Select Pickup' : 'Select Destination'}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search locations across India..."
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                debouncedSearch(text);
                            }}
                            autoFocus
                        />
                    </View>
                    <View style={styles.manualSearchContainer}>
                        <Text style={styles.manualSearchTitle}>Or enter any Indian location:</Text>
                        <View style={styles.manualInputContainer}>
                            <TextInput
                                style={styles.manualInput}
                                placeholder="Enter any address in India"
                                value={manualLocationInput}
                                onChangeText={setManualLocationInput}
                                onSubmitEditing={handleManualLocationSearch}
                            />
                            <TouchableOpacity
                                style={styles.manualSearchButton}
                                onPress={handleManualLocationSearch}
                                disabled={!manualLocationInput.trim()}
                            >
                                <Ionicons name="navigate" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView style={styles.resultsContainer}>
                        {isSearching && (
                            <View style={styles.searchingContainer}>
                                <ActivityIndicator size="small" color="#4285F4" />
                                <Text style={styles.searchingText}>Searching for locations...</Text>
                            </View>
                        )}
                        {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                            <View style={styles.noResultsContainer}>
                                <Ionicons name="location-outline" size={48} color="#CCC" />
                                <Text style={styles.noResultsTitle}>No locations found</Text>
                                <Text style={styles.noResultsText}>
                                    Try using more specific terms or add city/state name
                                </Text>
                            </View>
                        )}
                        {searchResults.map((result) => (
                            <TouchableOpacity
                                key={result.id}
                                style={styles.resultItem}
                                onPress={() => handleLocationSelect(result)}
                            >
                                <View style={styles.resultIcon}>
                                    <Ionicons
                                        name={getLocationIcon(result.type)}
                                        size={20}
                                        color="#4285F4"
                                    />
                                </View>
                                <View style={styles.resultText}>
                                    <Text style={styles.resultName}>{result.name}</Text>
                                    <Text style={styles.resultAddress} numberOfLines={2}>
                                        {result.address}
                                    </Text>
                                    {userLocation && (
                                        <Text style={styles.resultDistance}>
                                            {formatDistance(
                                                calculateDistance(
                                                    userLocation.latitude,
                                                    userLocation.longitude,
                                                    result.latitude,
                                                    result.longitude
                                                )
                                            )}{' '}
                                            away
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                        {searchQuery === '' && userLocation && !isSearching && (
                            <View>
                                <Text style={styles.sectionTitle}>Nearby Locations</Text>

                                {nearbyLocations.length > 0 ? (
                                    nearbyLocations.map((loc) => (
                                        <TouchableOpacity
                                            key={loc.id || `${loc.latitude}-${loc.longitude}`}
                                            style={styles.resultItem}
                                            onPress={() => handleLocationSelect(loc)}
                                        >
                                            <View style={styles.resultIcon}>
                                                <Ionicons
                                                    name={getLocationIcon(loc.type || 'default')}
                                                    size={20}
                                                    color="#4285F4"
                                                />
                                            </View>
                                            <View style={styles.resultText}>
                                                <Text style={styles.resultName}>{loc.name}</Text>
                                                <Text style={styles.resultAddress}>{loc.address}</Text>
                                                {loc.distance && (
                                                    <Text style={styles.resultDistance}>
                                                        {formatDistance(loc.distance)} away
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.noNearbyText}>Fetching nearby locations...</Text>
                                )}
                            </View>
                        )}

                    </ScrollView>
                    <TouchableOpacity
                        style={styles.currentLocationButton}
                        onPress={getCurrentLocation}
                    >
                        <Ionicons name="locate" size={20} color="#4285F4" />
                        <Text style={styles.currentLocationText}>Use current location</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

export default LocationSelection;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    mapContainer: {
        height: height * 0.5,
        position: 'relative',
        marginTop: -120,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    locationContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    locationInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    locationDot: {
        width: 20,
        alignItems: 'center',
        marginRight: 15,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    pickupDot: {
        backgroundColor: '#4CAF50',
    },
    destinationDot: {
        backgroundColor: '#EA4335',
    },
    locationTextContainer: {
        flex: 1,
    },
    locationText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    placeholderText: {
        color: '#999',
    },
    locationSubText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4285F4',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    manualSearchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    manualSearchTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    manualInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    manualInput: {
        flex: 1,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        marginRight: 8,
    },
    manualSearchButton: {
        backgroundColor: '#4285F4',
        padding: 12,
        borderRadius: 8,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    resultIcon: {
        marginRight: 15,
        width: 24,
        alignItems: 'center',
    },
    resultText: {
        flex: 1,
    },
    resultName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    resultAddress: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F8FF',
        marginHorizontal: 16,
        marginBottom: 20,
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
    currentLocationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4285F4',
        marginLeft: 8,
    },
    searchingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    searchingText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    noResultsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 10,
        marginBottom: 5,
    },
    noResultsText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    resultDistance: {
        fontSize: 12,
        color: '#4285F4',
        marginTop: 2,
        fontWeight: '500',
    },
    // checking
    routeInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF', // Clean white background
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        // Subtle shadow for a "floating" effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        width: '100%',
        marginVertical:10
    },
    routeDetailsWrapper: {
        // Container for all text details on the left
        flex: 1, // Allows it to take up available space
        marginRight: 10,
    },
    distanceDurationRow: {
        // Row for distance and duration
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    routeDistance: {
        // Primary detail (distance)
        fontSize: 18,
        fontWeight: '600',
        color: '#333333', // Dark text for high readability
    },
    routeDuration: {
        // Secondary detail (duration)
        fontSize: 16,
        fontWeight: '400',
        color: '#666666', // Slightly lighter for secondary info
    },
    separator: {
        fontSize: 18,
        color: '#999999',
        marginHorizontal: 8,
    },
    fareInfo: {
        // Container for fare
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    routeFareLabel: {
        // Label (e.g., "Estimated Fare")
        fontSize: 14,
        color: '#888888', // Subtle grey
        marginBottom: 2,
    },
    routeFare: {
        // The actual fare, bold and large
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000000', // Very dark for prominence
    },
    bookButton: {
        // The main call-to-action button
        backgroundColor: '#007BFF', // A vibrant, clear blue (or your brand color)
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        minWidth: 120, // Ensure a good minimum size
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    bookButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF', // White text on colored button
        letterSpacing: 0.5,
    },
});