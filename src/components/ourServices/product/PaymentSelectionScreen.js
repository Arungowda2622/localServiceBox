import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Linking, Pressable, Alert } from 'react-native';
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const { height } = Dimensions.get('window');

const PaymentSelectionScreen = ({ navigation, route }) => {
  const {total} = route?.params;
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [upis, setUpis] = useState([]);
  const [selectedUpiId, setSelectedUpiId] = useState([]);

  useEffect(() => {
    fetchUpis()
    fetchAddresses();
  }, []);

  const fetchUpis = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const q = await getDocs(collection(db, "upi_ids"));
      const list = q.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((doc) => doc.userId === user.uid);
        console.log(list,"thisIsUPILIST");
        
      setUpis(list);
      if (list.length > 0) setSelectedUpiId(list[0].id);
    } catch (err) {
      console.log("fetchUpis err", err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const snapshot = await getDocs(collection(db, "addresses"));

      const addressList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(addressList);
      console.log(addressList[0].address, "addressList");
      if (addressList.length > 0) {
        setSelectedAddress(addressList[0].id); // ✅ auto-select first address
      }

    } catch (error) {
      console.log("Error fetching addresses:", error);
    }
  };

  const onAddressChangeClick = () => {
    navigation.navigate("AddressSelection", { navigation });
  }

  const handleContinue = async (row) => {
    const PAYEE_NAME = "Product"
    const upiUrl = `upi://pay?pa=${row.upi}&pn=${PAYEE_NAME}&tn=BikeTaxiFare&am=${total}&cu=INR`;
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
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
  }

  return (
    <View style={styles.flexContainer}>
      {/* Header (Orange bar with CANCEL) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => console.log('Cancel clicked')}>
          <Text style={styles.headerText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Delivery Address Section */}
        <View style={styles.deliverySection}>

          {addresses.length === 0 ? (
            <Text>Loading address...</Text>
          ) : (
            <View>
              <Text style={styles.deliveryTitle}>Delivering to {addresses[0].fullName}</Text>
              <Text style={styles.deliveryAddress}>
                {`${addresses[0].address}, ${addresses[0].city}, ${addresses[0].state}, ${addresses[0].pinCode}`}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={onAddressChangeClick} style={styles.changeAddressButton}>
            <Text style={styles.changeAddressText}>Change delivery address</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        {/* <TouchableOpacity style={styles.continueButton} onPress={() => handleContinue()}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity> */}

        {/* Payment Methods Section */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.paymentSectionTitle}>Select a payment method</Text>
          <Text style={styles.paymentSectionSubtitle}>RECOMMENDED</Text>

          <Text style={styles.upiSeparator}>UPI</Text>

          {/* Pay by any UPI App */}
          <View style={styles.paymentOption}>
            {/* Radio Button */}
            {/* <View style={styles.radioContainer}>
              <View style={[styles.radioOuter, selectedPayment === 'Other UPI' && styles.radioSelectedOuter]}>
                {selectedPayment === 'Other UPI' && <View style={styles.radioInner} />}
              </View>
            </View> */}
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentName}>Pay by any UPI App</Text>
              <Text style={styles.balanceText}>Google Pay, PhonePe, Paytm and more</Text>
            </View>
            <Text style={styles.payIcon}>UPI</Text>
          </View>
          {
            upis.map((item,index)=>{
              return(
                <Pressable onPress={()=> handleContinue(item)} style={{marginVertical:10}} key={index}>
                  <Text>{item.upi}</Text>
                </Pressable>
              )
            })
          }
        </View>
      </ScrollView>
    </View>
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
  upiSeparator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
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