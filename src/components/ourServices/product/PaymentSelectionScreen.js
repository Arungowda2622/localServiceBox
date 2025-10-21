import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Assuming you use Expo or similar icon library

const { height } = Dimensions.get('window');

const PaymentSelectionScreen = ({navigation}) => {
  const [selectedPayment, setSelectedPayment] = useState('Amazon Pay Balance');

  const deliveryAddress = "#115 2nd floor 2nd main 3rd Cross, Ramaiah layout Meghanpalya, Chelekere extension, hennur cross, BENGALURU, KARNATAKA, 560043, India";

  const onAddressChangeClick = () => {
    navigation.navigate("AddressSelection");
  }

  return (
    <SafeAreaView style={styles.flexContainer}>
      {/* Header (Orange bar with CANCEL) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('Cancel clicked')}>
          <Text style={styles.headerText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Delivery Address Section */}
        <View style={styles.deliverySection}>
          <Text style={styles.deliveryTitle}>Delivering to Arun kumar k</Text>
          <Text style={styles.deliveryAddress}>{deliveryAddress}</Text>
          <TouchableOpacity onPress={onAddressChangeClick} style={styles.changeAddressButton}>
            <Text style={styles.changeAddressText}>Change delivery address</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => console.log('Continue clicked')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Payment Methods Section */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.paymentSectionTitle}>Select a payment method</Text>
          <Text style={styles.paymentSectionSubtitle}>RECOMMENDED</Text>

          {/* Amazon Pay Balance */}
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment('Amazon Pay Balance')}
          >
            {/* Radio Button */}
            <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, selectedPayment === 'Amazon Pay Balance' && styles.radioSelectedOuter]}>
                {selectedPayment === 'Amazon Pay Balance' && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentTag}>Previously used</Text>
              <Text style={styles.paymentName}>Amazon Pay Balance</Text>
              <Text style={styles.balanceText}>Available balance: ₹3,221.31</Text>
            </View>
            <Text style={styles.payIcon}>pay</Text>
          </TouchableOpacity>
          
          {/* Amazon Pay UPI */}
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment('Amazon Pay UPI')}
          >
            {/* Radio Button */}
            <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, selectedPayment === 'Amazon Pay UPI' && styles.radioSelectedOuter]}>
                {selectedPayment === 'Amazon Pay UPI' && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentTag}>Featured</Text>
              <Text style={styles.paymentName}>Amazon Pay UPI</Text>
              <Text style={styles.balanceText}>IDBI Bank **2113</Text>
              <TouchableOpacity onPress={() => console.log('Check balance')}>
                <Text style={styles.checkBalanceText}>Check balance</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.payIcon}>pay</Text>
          </TouchableOpacity>

          <Text style={styles.upiSeparator}>UPI</Text>
          
          {/* Pay by any UPI App */}
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => setSelectedPayment('Other UPI')}
          >
            {/* Radio Button */}
            <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, selectedPayment === 'Other UPI' && styles.radioSelectedOuter]}>
                {selectedPayment === 'Other UPI' && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentName}>Pay by any UPI App</Text>
              <Text style={styles.balanceText}>Google Pay, PhonePe, Paytm and more</Text>
            </View>
            <Text style={styles.payIcon}>UPI</Text>
          </TouchableOpacity>
          
          {/* Add account */}
          <TouchableOpacity style={styles.addAccountButton} onPress={() => console.log('Add account clicked')}>
            <MaterialIcons name="add-circle-outline" size={20} color="#007bff" />
            <Text style={styles.addAccountText}>Add account to Amazon Pay UPI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#ff9900',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: height * 0.1, // Adjusted for safe area
  },
  headerText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  // --- Delivery Section ---
  deliverySection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f0f0f0',
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  changeAddressText: {
    color: '#007bff',
    fontSize: 15,
  },

  // --- Continue Button ---
  continueButton: {
    backgroundColor: '#ff9900',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- Payment Methods Section ---
  paymentMethodsSection: {
    padding: 20,
  },
  paymentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  paymentSectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  paymentTag: {
    fontSize: 10,
    color: 'green',
    fontWeight: 'bold',
  },
  paymentName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
  },
  payIcon: {
    backgroundColor: '#ccc',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
    alignSelf: 'flex-start', // Align pay icon to the top of the line
  },
  checkBalanceText: {
    color: '#007bff',
    fontSize: 12,
    marginTop: 3,
  },
  upiSeparator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  addAccountText: {
    color: '#007bff',
    fontSize: 15,
    marginLeft: 5,
  },
  
  // --- Radio Button Styles ---
  radioContainer: {
    paddingTop: 5, 
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  radioSelectedOuter: {
    borderColor: '#007bff',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
});

export default PaymentSelectionScreen;