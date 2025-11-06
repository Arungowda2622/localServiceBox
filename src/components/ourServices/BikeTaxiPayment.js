import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../header/Header';
import { db } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const BikeTaxiPayment = ({ route, navigation = { goBack: () => {} } }) => {
  const { pickupLocation, destinationLocation, routeInfo } = route?.params || {};
  const finalFare = routeInfo?.fare || 0;

  const handleConfirmBooking = async () => {
    if (!pickupLocation || !destinationLocation || !routeInfo) {
      Alert.alert('Error', 'Incomplete ride details.');
      return;
    }

    try {
      const ridesCollection = collection(db, 'rides');

      const rideData = {
        pickup: pickupLocation?.address || '',
        pickupName: pickupLocation?.name || '',
        destination: destinationLocation?.address || '',
        destinationName: destinationLocation?.name || '',
        distance: routeInfo?.distance || 0,
        duration: routeInfo?.formattedDuration || '',
        fare: finalFare,
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        status: 'Confirmed',
        createdAt: serverTimestamp(),
      };

      await addDoc(ridesCollection, rideData);

      Alert.alert(
        'Ride Confirmed 🚖',
        `Your ride has been booked successfully!\n\nPlease pay ₹${finalFare} in cash to the driver.`
      );

      navigation.navigate('BikeTaxiTracking'); // Navigate to tracking or success screen
    } catch (error) {
      console.error('Error saving ride:', error);
      Alert.alert('Error', 'Failed to save ride. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={'Confirm Ride'} />

      <ScrollView style={styles.main}>
        <Text style={styles.sectionTitle}>Ride Details</Text>

        {/* Pickup and Destination Card */}
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

        {/* Distance and Duration */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Feather name="compass" size={16} color="#007BFF" />
            <Text style={styles.summaryLabel}>Distance & Duration</Text>
            <Text style={styles.summaryValue}>
              {routeInfo?.distance ? `${routeInfo.distance} km` : 'N/A'} • {routeInfo?.formattedDuration || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Fare Info */}
        <View style={styles.fareCard}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareValue}>₹{finalFare}</Text>
          <Text style={styles.fareSubtitle}>Please pay the driver in cash.</Text>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentButton}>
          <MaterialCommunityIcons name="cash-multiple" size={26} color="#4CAF50" />
          <View style={styles.paymentTextContainer}>
            <Text style={styles.paymentMethodText}>Cash</Text>
            <Text style={styles.paymentSubtitle}>Pay the exact fare to the driver</Text>
          </View>
        </View>

        <View style={{ marginBottom: 100 }} />
      </ScrollView>

      {/* Confirm Ride Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>Confirm Ride (Pay ₹{finalFare} Cash)</Text>
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
  main: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  locationCard: {
    backgroundColor: '#FFF',
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
    borderWidth: 2,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
