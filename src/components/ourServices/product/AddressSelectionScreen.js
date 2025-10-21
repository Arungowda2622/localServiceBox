import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Assuming you use Expo or similar icon library

const { height } = Dimensions.get('window');

/**
 * AddressItem sub-component for rendering a single address block.
 */
const AddressItem = ({ address, isSelected, onSelect }) => (
    <TouchableOpacity style={addressStyles.addressItem} onPress={() => onSelect(address.id)}>
      {/* Radio Button */}
      <View style={addressStyles.radioContainer}>
        <View style={[addressStyles.radioOuter, isSelected && addressStyles.radioSelectedOuter]}>
          {isSelected && <View style={addressStyles.radioInner} />}
        </View>
      </View>
      {/* Address Details */}
      <View style={addressStyles.addressTextContent}>
        <Text style={addressStyles.addressName}>{address.name}</Text>
        <Text style={addressStyles.addressDetails}>{address.details}</Text>
        <Text style={addressStyles.addressPhone}>Phone number: {address.phone}</Text>
      </View>
    </TouchableOpacity>
);


/**
 * AddressSelectionScreen Component
 * Represents the screen where the user selects or changes the delivery address.
 * @param {object} props
 * @param {function} props.onDeliverClick - Function to confirm the address and go back to payment screen.
 * @param {function} props.onBackToPayment - Function to handle the back arrow/back to cart navigation.
 */
const AddressSelectionScreen = ({ onDeliverClick, onBackToPayment }) => {
  const [selectedAddress, setSelectedAddress] = useState(1);

  const addresses = [
    {
      id: 1,
      name: "Arun kumar k",
      details: "#51, jeenugudu nilaya, 2nd cross, 2nd main, Vinayaka nagar, Banashankari 1st stage,, BENGALURU, KARNATAKA, 560050, India",
      phone: "9108802825"
    },
    {
      id: 2,
      name: "Arun kumar k",
      details: "05, Kodihalli, Bidadi, KARNATAKA, 562109, India",
      phone: "9108802825"
    }
    // More addresses would be here
  ];

  return (
    <SafeAreaView style={addressStyles.flexContainer}>
      <View style={[addressStyles.header, addressStyles.addressHeader]}>
        <TouchableOpacity onPress={onBackToPayment}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Cancel clicked')}>
          <Text style={addressStyles.headerText}>CANCEL</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={addressStyles.scrollContainer}>
        
        {/* Deliver Button */}
        <TouchableOpacity style={addressStyles.deliverButton} onPress={onDeliverClick}>
          <Text style={addressStyles.deliverButtonText}>Deliver to this address</Text>
        </TouchableOpacity>

        {/* Edit/Instructions */}
        <TouchableOpacity style={addressStyles.editButton} onPress={() => console.log('Edit address clicked')}>
          <Text style={addressStyles.editText}>Edit address</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Add delivery instructions clicked')}>
          <Text style={addressStyles.instructionsText}>Add delivery instructions</Text>
        </TouchableOpacity>

        {/* Address List Container */}
        <View style={addressStyles.addressesContainer}>
          {addresses.map((address) => (
            <AddressItem
              key={address.id}
              address={address}
              isSelected={selectedAddress === address.id}
              onSelect={setSelectedAddress}
            />
          ))}

          {/* Show More */}
          <TouchableOpacity style={addressStyles.showMoreButton} onPress={() => console.log('Show more addresses clicked')}>
            <Text style={addressStyles.showMoreText}>Show more addresses</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>

        {/* Add Delivery Address Section */}
        <View style={addressStyles.addAddressSection}>
          <Text style={addressStyles.addAddressTitle}>Add delivery address</Text>
          <TouchableOpacity style={addressStyles.addNewAddressButton} onPress={() => console.log('Add new address clicked')}>
            <Text style={addressStyles.addNewAddressText}>Add a new delivery address</Text>
          </TouchableOpacity>
          <Text style={addressStyles.orText}>or</Text>
          <TouchableOpacity onPress={onBackToPayment}>
            <Text style={addressStyles.backToCartText}>Back to cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


const addressStyles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addressHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
    height: 60, // Ensure header is visible
  },
  headerText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  // --- Main Action Buttons ---
  deliverButton: {
    backgroundColor: '#ff9900',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  deliverButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 10,
  },
  editText: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 15,
    color: '#007bff',
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 5,
  },

  // --- Address List ---
  addressesContainer: {
    borderTopWidth: 8,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  addressItem: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-start',
  },
  addressTextContent: {
    marginLeft: 10,
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  addressDetails: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  // --- Show More ---
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  showMoreText: {
    color: '#007bff',
    fontSize: 15,
    marginRight: 5,
  },

  // --- Add Address Section ---
  addAddressSection: {
    borderTopWidth: 8,
    borderTopColor: '#f0f0f0',
    padding: 20,
    alignItems: 'center',
  },
  addAddressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  addNewAddressButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  addNewAddressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  backToCartText: {
    color: '#007bff',
    fontSize: 16,
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

export default AddressSelectionScreen;