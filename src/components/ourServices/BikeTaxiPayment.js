import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
// Assuming you use react-native-vector-icons for Feather and Ionicons
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../header/Header';

const UPI_ID = 'meghuanu261@ybl';
const PAYEE_NAME = 'Taxi Service';

const BikeTaxiPayment = ({ route , navigation = { goBack: () => {} } }) => {
    const { pickupLocation, destinationLocation, routeInfo } = route?.params || {};
    const finalFare = routeInfo?.fare || 1;
    const [selectedMethod, setSelectedMethod] = useState('UPI');

    const handleConfirmBooking = () => {
        if (selectedMethod === 'UPI') {
            handleUpiPayment();
        } else if (selectedMethod === 'CASH') {
            handleCashPayment();
        }
    };

    const handleUpiPayment = async () => {
        if (!finalFare) {
            Alert.alert('Error', 'Fare amount not available.');
            return;
        }
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&tn=BikeTaxiFare&am=${finalFare}&cu=INR`;
        try {
            const supported = await Linking.canOpenURL(upiUrl);
            if (supported) {
                Alert.alert("Booking Confirmed", `Redirecting to UPI app to pay ₹${finalFare}.`);
                await Linking.openURL(upiUrl);
            } else {
                Alert.alert(
                    'UPI App Not Found',
                    'No UPI app found on your device. Please install Google Pay, PhonePe, or PayTM to proceed.'
                );
            }
        } catch (error) {
            console.error('UPI payment error:', error);
            Alert.alert('Payment Error', 'Unable to initiate UPI payment. Try again.');
        }
    };

    const handleCashPayment = () => {
        Alert.alert(
            "Booking Confirmed!",
            `Your ride has been booked. Please pay the driver ₹${finalFare} in cash upon arrival.`
        );
        navigation.navigate('BikeTaxiTracking'); // Example navigation
    };
    
    // --- Reusable Payment Option Component ---

    const PaymentOption = ({ method, title, subtitle, iconName, iconColor, isSelected, onPress }) => (
        <TouchableOpacity
            style={[
                styles.paymentButton,
                isSelected && styles.paymentButtonSelected,
            ]}
            onPress={() => onPress(method)}
            activeOpacity={0.8}
        >
            <MaterialCommunityIcons name={iconName} size={24} color={isSelected ? '#007BFF' : iconColor} />
            <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentMethodText}>{title}</Text>
                <Text style={styles.paymentSubtitle}>{subtitle}</Text>
            </View>
            {isSelected && <Ionicons name="checkmark-circle" size={20} color="#007BFF" />}
            {!isSelected && <View style={styles.spacer} />}
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <Header navigation={navigation} title={"Confirm & Pay"}/>
            <ScrollView style={styles.main}> 
                <Text style={styles.sectionTitle}>Ride Details</Text>
                <View style={styles.locationCard}>
                    <View style={styles.locationItem}>
                        <Feather name="circle" size={12} color="#4CAF50" style={styles.icon} />
                        <Text style={styles.locationLabel}>Pickup:</Text>
                        <Text style={styles.locationValue} numberOfLines={1}>
                            {pickupLocation?.name || 'Not selected'}
                        </Text>
                    </View>
                    <View style={styles.locationDivider} />
                    <View style={styles.locationItem}>
                        <Feather name="square" size={12} color="#EA4335" style={styles.icon} />
                        <Text style={styles.locationLabel}>Destination:</Text>
                        <Text style={styles.locationValue} numberOfLines={1}>
                            {destinationLocation?.name || 'Not selected'}
                        </Text>
                    </View>
                </View>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Feather name="compass" size={16} color="#007BFF" />
                        <Text style={styles.summaryLabel}>Distance & Duration</Text>
                        <Text style={styles.summaryValue}>
                            {routeInfo?.distance ? `${routeInfo.distance} km` : 'N/A'} • {routeInfo?.formattedDuration || 'N/A'}
                        </Text>
                    </View>
                </View>
                <View style={styles.fareCard}>
                    <Text style={styles.fareLabel}>Total Payable Fare</Text>
                    <Text style={styles.fareValue}>
                        ₹{finalFare}
                    </Text>
                    <Text style={styles.fareSubtitle}>Includes all taxes and service fees.</Text>
                </View>
                <Text style={styles.sectionTitle}>Select Payment Method</Text>
                <PaymentOption
                    method="UPI"
                    title="Pay with UPI"
                    subtitle="Fast, secure, and instant payment."
                    iconName="qrcode-scan"
                    iconColor="#007BFF"
                    isSelected={selectedMethod === 'UPI'}
                    onPress={setSelectedMethod}
                />
                <PaymentOption
                    method="CASH"
                    title="Cash"
                    subtitle="Pay the exact fare amount to the driver."
                    iconName="cash-multiple"
                    iconColor="#4CAF50"
                    isSelected={selectedMethod === 'CASH'}
                    onPress={setSelectedMethod}
                />
                <View style={{marginTop:120}}/>
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmBooking}
                    activeOpacity={0.9}
                >
                    <Text style={styles.confirmButtonText}>
                        {selectedMethod === 'CASH' 
                            ? `Confirm Ride (Pay ₹${finalFare} Cash)` 
                            : `Confirm & Pay ₹${finalFare} via UPI`
                        }
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default BikeTaxiPayment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    main: {
        padding: 20,
        paddingBottom: 300,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginTop: 15,
        marginBottom: 10,
    },
    locationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    locationDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 40,
        marginVertical: 2,
    },
    icon: {
        marginRight: 10,
        width: 20,
        textAlign: 'center',
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
        width: 80,
    },
    locationValue: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    fareCard: {
        backgroundColor: '#E6F0FF',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#007BFF50',
    },
    fareLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007BFF',
    },
    fareValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#007BFF',
        marginVertical: 5,
    },
    fareSubtitle: {
        fontSize: 13,
        color: '#6699CC',
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentButtonSelected: {
        borderColor: '#007BFF',
        shadowColor: '#007BFF',
        shadowOpacity: 0.15,
    },
    paymentTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    paymentMethodText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    paymentSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    spacer: {
        width: 20,
    },
    upiInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginTop: 5,
        marginBottom: 10,
    },
    upiText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
        flexShrink: 1,
    },
    upiIdText: {
        fontWeight: '600',
        color: '#333',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    confirmButton: {
        backgroundColor: '#007BFF',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
});
