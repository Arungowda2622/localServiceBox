import { StyleSheet, Text, View, Pressable, Dimensions, Modal, TextInput, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Header from '../header/Header'; // Assuming Header exists
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Helper function to calculate distance using Haversine formula
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in km
};

// Debounce function to limit API calls during typing
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

// --- MOCK DATA FUNCTION TO SIMULATE REAL-WORLD PLACE SEARCH ---
// Replaces the limited Location.geocodeAsync for better UI simulation
const getMockSuggestions = (query, referenceCoords) => {
    // These coordinates are mocked to be near Bengaluru, India (where the previous search was failing)
    const baseLat = 12.9716; 
    const baseLon = 77.5946; 

    if (query.toLowerCase().includes('domino')) {
        return [
            { primaryAddress: "Domino's Pizza | Kenchanakuppe", secondaryAddress: "Bidadi, Karnataka, India", coords: { latitude: baseLat + 0.05, longitude: baseLon + 0.02 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat + 0.05, baseLon + 0.02).toFixed(1) },
            { primaryAddress: "Domino's pizza | Mailoor, Bidar", secondaryAddress: "Mailoor, Bidar, Karnataka, India", coords: { latitude: baseLat + 0.02, longitude: baseLon - 0.03 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat + 0.02, baseLon - 0.03).toFixed(1) },
            { primaryAddress: "Domino's Pizza", secondaryAddress: "Joy Jayanti Sarani, Aranyak (West), Sector 1, Bidhannagar", coords: { latitude: baseLat - 0.01, longitude: baseLon + 0.05 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat - 0.01, baseLon + 0.05).toFixed(1) },
            { primaryAddress: "Domino's Pizza", secondaryAddress: "Saltlake, BF Block, Sector 1, Bidhannagar", coords: { latitude: baseLat - 0.03, longitude: baseLon - 0.01 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat - 0.03, baseLon - 0.01).toFixed(1) },
            { primaryAddress: "Domino's Pizza", secondaryAddress: "DC Block, Sector 1, Bidhannagar", coords: { latitude: baseLat + 0.04, longitude: baseLon + 0.01 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat + 0.04, baseLon + 0.01).toFixed(1) },
        ];
    }
    
    if (query.toLowerCase().includes('kengeri')) {
        return [
            { primaryAddress: "Kengeri, Bengaluru", secondaryAddress: "Karnataka, India", coords: { latitude: baseLat - 0.01, longitude: baseLon - 0.02 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat - 0.01, baseLon - 0.02).toFixed(1) },
            { primaryAddress: "Kengeri Satellite Town", secondaryAddress: "Bengaluru, Karnataka, India", coords: { latitude: baseLat - 0.03, longitude: baseLon - 0.04 }, distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat - 0.03, baseLon - 0.04).toFixed(1) },
        ];
    }
    
    // Fallback to a single result if not one of the mock queries
    return [{ 
        primaryAddress: `Address for "${query}"`, 
        secondaryAddress: 'Mock City, Mock Region, India', 
        coords: { latitude: baseLat + Math.random() * 0.1, longitude: baseLon - Math.random() * 0.1 },
        distance: haversine(referenceCoords.latitude, referenceCoords.longitude, baseLat, baseLon).toFixed(1)
    }];
};
// --- END MOCK DATA FUNCTION ---

const BikeTaxi = ({ route }) => {
    const { data } = route?.params || {};
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [isSearchVisible, setIsSearchVisible] = useState(false); 

    // Pick Up Location States
    const [pickUpAddress, setPickUpAddress] = useState('');
    const [pickUpCoords, setPickUpCoords] = useState(null);

    // Drop Off Location States
    const [dropAddress, setDropAddress] = useState('');
    const [dropCoords, setDropCoords] = useState(null);
    
    // Temporary State for Map Selection Modal
    const [tempSelectedLocation, setTempSelectedLocation] = useState(null);
    
    // Flow Control State
    const [isSelectingDropOff, setIsSelectingDropOff] = useState(false); 
    const [currentSearchType, setCurrentSearchType] = useState('pickup'); 

    // Distance State
    const [distance, setDistance] = useState(null);
    
    // Live Location States
    const [currentAddress, setCurrentAddress] = useState('Fetching current location...');
    const [currentCoords, setCurrentCoords] = useState(null);

    const mapRef = useRef(null);

    // 🔹 Fetch initial location and set as default pickup
    useEffect(() => {
        let locationSubscription = null;

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setCurrentAddress('Permission denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setCurrentCoords(coords);

            try {
                const [address] = await Location.reverseGeocodeAsync(coords);
                const fullAddress = [
                    address.name, address.street, address.city, address.region, address.postalCode,
                ]
                    .filter(Boolean)
                    .join(', ');
                
                // Set initial Current and Pick Up location
                setCurrentAddress(fullAddress);
                setPickUpAddress(fullAddress);
                setPickUpCoords(coords);
            } catch (e) {
                console.warn("Reverse Geocoding failed:", e);
                // Still set coordinates even if address is textually missing
                setPickUpCoords(coords);
            }
            
            // Live location updates (optional: can be commented out if not needed)
            locationSubscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
                async (loc) => {
                    const newCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setCurrentCoords(newCoords);
                }
            );
        })();

        return () => {
            if (locationSubscription) locationSubscription.remove();
        };
    }, []);

    // 🔹 Calculate distance when pickup and dropoff coords change
    useEffect(() => {
        if (pickUpCoords && dropCoords) {
            const dist = haversine(
                pickUpCoords.latitude, pickUpCoords.longitude,
                dropCoords.latitude, dropCoords.longitude
            );
            setDistance(dist.toFixed(2));
        } else {
            setDistance(null);
        }
    }, [pickUpCoords, dropCoords]);
    
    // 🔹 Update location state based on confirmed location (from Map or Search)
    const updateLocationState = (coords, address, isDropOff) => {
        if (!isDropOff) {
            setPickUpCoords(coords);
            setPickUpAddress(address);
            // If pickup changes, reset drop-off/distance to force re-selection
            setDropCoords(null); 
            setDropAddress('');
        } else {
            setDropCoords(coords);
            setDropAddress(address);
        }
    };
    
    // ----------------------------------------------------
    // MAP SELECTION LOGIC
    // ----------------------------------------------------
    
    // 🔹 Handle map button press logic
    const handleMapButtonPress = (type) => {
        const shouldSelectDropOff = type === 'dropoff' || !!pickUpCoords;
        
        let initialTempLocation = null;
        if (shouldSelectDropOff && dropCoords) {
            initialTempLocation = dropCoords;
        } else if (pickUpCoords) {
             initialTempLocation = pickUpCoords;
        } else if (currentCoords) {
             initialTempLocation = currentCoords;
        }

        setTempSelectedLocation(initialTempLocation);
        setIsSelectingDropOff(shouldSelectDropOff);
        setIsMapVisible(true);
    };

    // ----------------------------------------------------
    // SEARCH INPUT LOGIC
    // ----------------------------------------------------

    const handleSearchPress = (type) => {
        setCurrentSearchType(type);
        setIsSearchVisible(true);
    };

    // 🔹 Location Input Card component
    const LocationInputCard = () => {
        return (
            <View style={locationStyles.card}>
                {/* Pick Up Location Input */}
                <Pressable style={locationStyles.inputRow} onPress={() => handleSearchPress('pickup')}>
                    <View style={locationStyles.markerContainer}>
                        <View style={locationStyles.currentMarker} />
                        <View style={locationStyles.line} />
                    </View>
                    <TextInput 
                        style={locationStyles.locationText} 
                        value={pickUpAddress || 'Select pick up location'} 
                        placeholderTextColor='#999'
                        editable={false} 
                    />
                    <MaterialIcons name="edit" size={18} color="#FF7043" />
                </Pressable>

                {/* Drop Location Input */}
                <Pressable style={locationStyles.inputRow} onPress={() => handleSearchPress('dropoff')}>
                    <View style={locationStyles.markerContainer}>
                        <View style={locationStyles.dropMarker} />
                        <View style={[locationStyles.line, locationStyles.lineHidden]} />
                    </View>
                    <TextInput 
                        style={locationStyles.locationText} 
                        value={dropAddress || 'Select drop location'} 
                        placeholderTextColor='#999'
                        editable={false} 
                    />
                    <MaterialIcons name="edit" size={18} color="#FF7043" />
                </Pressable>
            </View>
        );
    };
    
    // ----------------------------------------------------
    // MODAL COMPONENTS
    // ----------------------------------------------------

    // 🔹 Search Modal Component
    const LocationSearchModal = ({ isVisible, onClose, searchType, referenceCoords }) => {
        const [searchText, setSearchText] = useState('');
        const [suggestions, setSuggestions] = useState([]);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState(null);
        
        const title = searchType === 'pickup' ? 'Search Pick Up Location' : 'Search Drop Location';

        // ----------------------------------------------------
        // SEARCH FUNCTION (DEBOUNCED)
        // ----------------------------------------------------
        const performSearch = useCallback(async (query) => {
            if (!query || query.length < 3) {
                setSuggestions([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            
            // --- Using Mock Data for better UI simulation ---
            // In a real app, you would replace this with a Google Places API or similar service.
            try {
                if (!referenceCoords) {
                    setError("Reference location missing for distance calculation.");
                    return;
                }
                const mockResults = getMockSuggestions(query, referenceCoords);
                setSuggestions(mockResults);
            } catch (err) {
                console.error("Search error:", err);
                setError('Failed to fetch suggestions.');
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
            // ----------------------------------------------------
        }, [referenceCoords]);
        
        // Debounced version of the search function
        const debouncedSearch = useRef(debounce(performSearch, 300)).current;

        // Effect to trigger search on text change
        useEffect(() => {
            if (isVisible) {
                debouncedSearch(searchText);
            }
        }, [searchText, isVisible, debouncedSearch]);
        
        // Clear state on modal open/close
        useEffect(() => {
            if (isVisible) {
                setSearchText(searchType === 'pickup' ? pickUpAddress : dropAddress);
                // Clear suggestions immediately if initial text is short
                if ((searchType === 'pickup' ? pickUpAddress : dropAddress).length < 3) {
                    setSuggestions([]);
                }
            }
        }, [isVisible, searchType]);


        const onSelectSuggestion = (suggestion) => {
            if (suggestion.coords) {
                // Combine primary and secondary address for the final display
                const fullAddress = suggestion.primaryAddress + (suggestion.secondaryAddress ? `, ${suggestion.secondaryAddress}` : '');
                updateLocationState(suggestion.coords, fullAddress, searchType === 'dropoff');
            }
            onClose();
        };

        return (
            <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
                <View style={searchModalStyles.container}>
                    {/* Header/Input */}
                    <View style={searchModalStyles.header}>
                        <Pressable onPress={onClose} style={searchModalStyles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </Pressable>
                        <Text style={searchModalStyles.title}>{title}</Text>
                    </View>
                    
                    <View style={searchModalStyles.inputContainer}>
                        <TextInput
                            style={searchModalStyles.searchInput}
                            placeholder="Enter address or place name"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus={true}
                            // No onSubmitEditing needed, as debounce handles search
                        />
                        {/* Removed Search Button */}
                        {isLoading && (
                            <ActivityIndicator color="#FF7043" style={{ paddingHorizontal: 15 }} />
                        )}
                    </View>

                    {/* Suggestions List */}
                    <View style={searchModalStyles.suggestionsContainer}>
                        {error && <Text style={searchModalStyles.errorText}>{error}</Text>}
                        
                        {/* Option to use current location if searching for pickup */}
                        {searchType === 'pickup' && currentCoords && (
                            <Pressable 
                                style={searchModalStyles.currentLocationItem} 
                                onPress={() => {
                                    updateLocationState(currentCoords, currentAddress, false);
                                    onClose();
                                }}
                            >
                                <AntDesign name="enviromento" size={20} color="#007BFF" style={{ marginRight: 10 }} />
                                <View style={searchModalStyles.suggestionDetails}>
                                    <Text style={[searchModalStyles.suggestionText, { color: '#007BFF' }]} numberOfLines={1}>
                                        Current Location
                                    </Text>
                                    <Text style={[searchModalStyles.secondaryText, { color: '#333' }]} numberOfLines={1}>
                                        {currentAddress}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                        
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Pressable 
                                    style={searchModalStyles.suggestionItem} 
                                    onPress={() => item.coords && onSelectSuggestion(item)}
                                    disabled={!item.coords}
                                >
                                    <View style={searchModalStyles.iconTextWrapper}>
                                        {/* Using the Marker Icon shown in the desired UI */}
                                        <MaterialIcons name="location-pin" size={20} color="#999" style={{ marginRight: 10 }} />
                                        <View style={searchModalStyles.suggestionDetails}>
                                            <Text style={searchModalStyles.suggestionText} numberOfLines={1}>
                                                {item.primaryAddress}
                                            </Text>
                                            <Text style={searchModalStyles.secondaryText} numberOfLines={1}>
                                                {item.secondaryAddress}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={searchModalStyles.rightDetails}>
                                        {/* Distance based on referenceCoords (PickUp for DropOff, Current for PickUp) */}
                                        {item.distance && <Text style={searchModalStyles.distanceText}>{item.distance} km</Text>}
                                        <Ionicons name="heart-outline" size={20} color="#999" style={{ marginLeft: 10 }} />
                                    </View>
                                </Pressable>
                            )}
                        />
                        <Pressable 
                            style={searchModalStyles.selectOnMapButton} 
                            onPress={() => {
                                onClose();
                                // Pass the correct type to open the map for the intended selection
                                handleMapButtonPress(searchType); 
                            }}
                        >
                            <Ionicons name="map-outline" size={20} color="#000" />
                            <Text style={searchModalStyles.selectOnMapText}>Select on Map instead</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    };
    
    // --- Map Modal Component (Unchanged) ---
    // 🔹 Handle map press (select temporary marker)
    const handleMapPress = (event) => {
        const coords = event.nativeEvent.coordinate;
        setTempSelectedLocation(coords);
    };

    // 🔹 Confirm location from Map and reverse geocode
    const onConfirmLocationFromMap = async () => {
        if (tempSelectedLocation) {
            const coordsToSave = tempSelectedLocation;
            setTempSelectedLocation(null); 

            try {
                const [address] = await Location.reverseGeocodeAsync(coordsToSave);
                const fullAddress = [
                    address.name, address.street, address.city, address.region, address.postalCode,
                ]
                    .filter(Boolean)
                    .join(', ');

                updateLocationState(coordsToSave, fullAddress, isSelectingDropOff);
            } catch (error) {
                updateLocationState(coordsToSave, 'Selected address unavailable', isSelectingDropOff);
            }
        }
        setIsMapVisible(false);
    };

    const MapSelectionModal = ({ isVisible, onClose, isSelectingDropOff }) => {
        const title = isSelectingDropOff 
            ? 'Select Drop Location' 
            : 'Select Pick Up Location';
        
        const initialMapLocation = tempSelectedLocation || pickUpCoords || currentCoords;
        const markerColor = isSelectingDropOff ? "#FF5722" : "#4CAF50";

        return (
            <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
                <View style={modalStyles.container}>
                    {/* Header */}
                    <View style={modalStyles.header}>
                        <Pressable onPress={onClose} style={modalStyles.closeButton}>
                            <Text style={modalStyles.closeIcon}>X</Text>
                        </Pressable>
                        <Text style={modalStyles.title}>{title}</Text>
                    </View>

                    {/* Map */}
                    <View style={{ flex: 1 }}>
                        <MapView
                            ref={mapRef}
                            style={{ flex: 1 }}
                            initialRegion={initialMapLocation ? {
                                latitude: initialMapLocation.latitude,
                                longitude: initialMapLocation.longitude,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            } : {latitude: 12.8342, longitude: 77.3934, latitudeDelta: 0.05, longitudeDelta: 0.05,}}
                            onPress={handleMapPress}
                            showsUserLocation={true}
                        >
                            {/* Confirmed Pick Up Marker (if selecting drop-off) */}
                            {isSelectingDropOff && pickUpCoords && (
                                <Marker coordinate={pickUpCoords}>
                                    <MaterialIcons name="flag" size={32} color="#4CAF50" />
                                </Marker>
                            )}

                            {/* Temporary Selection Marker */}
                            {tempSelectedLocation && (
                                <Marker coordinate={tempSelectedLocation}>
                                    <Ionicons name="pin" size={32} color={markerColor} />
                                </Marker>
                            )}
                            
                            {/* Draw Polyline if both are selected */}
                            {(pickUpCoords && dropCoords) && (
                                <Polyline
                                    coordinates={[pickUpCoords, dropCoords]}
                                    strokeColor="#000" // line color
                                    strokeWidth={4}
                                />
                            )}
                        </MapView>
                    </View>

                    {/* Footer */}
                    <View style={modalStyles.footer}>
                        <Pressable style={modalStyles.confirmButton} onPress={onConfirmLocationFromMap} disabled={!tempSelectedLocation}>
                            <Text style={modalStyles.confirmButtonText}>CONFIRM LOCATION</Text>
                        </Pressable>
                        <Text style={modalStyles.hintText}>
                            Tap on the map to select your {isSelectingDropOff ? 'drop-off' : 'pick-up'} point.
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.main}>
            <Header />
            <View style={styles.content}>
                <LocationInputCard />
                
                {/* Distance Display */}
                {distance && (
                    <View style={styles.distanceContainer}>
                        <Text style={styles.distanceText}>
                            Estimated Distance: <Text style={styles.distanceValue}>{distance} km</Text>
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    {/* The map button now opens the map to select the location that's missing or being edited */}
                    <Pressable style={styles.mapButton} onPress={() => handleMapButtonPress(dropCoords ? 'dropoff' : 'pickup')}>
                        <Ionicons name="location-outline" size={26} color="#333" />
                        <Text style={styles.mapText}>
                            {pickUpCoords && !dropCoords
                                ? 'Select Drop Location on Map'
                                : pickUpCoords && dropCoords
                                ? 'Edit Locations on Map'
                                : 'Select Pick Up Location on Map'}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Map Modal */}
            <MapSelectionModal 
                isVisible={isMapVisible} 
                onClose={() => {
                    setIsMapVisible(false);
                    setTempSelectedLocation(null);
                }}
                isSelectingDropOff={isSelectingDropOff}
            />
            
            {/* Search Modal */}
            <LocationSearchModal 
                isVisible={isSearchVisible} 
                onClose={() => setIsSearchVisible(false)}
                searchType={currentSearchType}
                // The reference coords are the *opposite* of what we're searching for
                referenceCoords={currentSearchType === 'dropoff' ? pickUpCoords : currentCoords} 
            />
        </View>
    );
};

export default BikeTaxi;

// ===================== STYLES =====================
const styles = StyleSheet.create({
    main: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        paddingVertical: 20,
    },
    content: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 15,
        justifyContent: 'flex-start',
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    mapText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginLeft: 5,
    },
    distanceContainer: {
        backgroundColor: '#E8F5E9',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 20,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    distanceText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    distanceValue: {
        fontWeight: '800',
        color: '#1B5E20',
    },
});

const locationStyles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        justifyContent: 'space-between',
    },
    markerContainer: {
        width: 15,
        alignItems: 'center',
        marginRight: 10,
    },
    currentMarker: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50', 
        borderWidth: 1,
        borderColor: '#FFFFFF',
        marginBottom: 2,
    },
    dropMarker: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#FF7043', 
    },
    line: {
        flex: 1,
        width: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 2,
    },
    lineHidden: {
        opacity: 0,
    },
    locationText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
        paddingVertical: 5,
    },
});

const modalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        padding: 10,
    },
    closeIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
        color: '#333',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    confirmButton: {
        backgroundColor: '#000000',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hintText: {
        textAlign: 'center',
        fontSize: 12,
        color: 'gray',
        marginTop: 10,
    }
});

const searchModalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 15,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        // Removed paddingRight to hide the search button space
    },
    searchInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    suggestionsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    currentLocationItem: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5', // Lighter border for current location vs suggestions
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        justifyContent: 'space-between', 
    },
    iconTextWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, 
    },
    suggestionDetails: {
        flex: 1,
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    secondaryText: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    rightDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        padding: 10,
    },
    selectOnMapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 10,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    selectOnMapText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    }
});
