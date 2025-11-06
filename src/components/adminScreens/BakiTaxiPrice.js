import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import Header from '../header/Header';

const BakiTaxiPrice = ({ navigation }) => {
  const [pricePerKm, setPricePerKm] = useState('');
  const [priceId, setPriceId] = useState(null); // store document ID if exists
  const priceCollection = collection(db, 'taxiPrices');

  // READ - fetch only one record
  const fetchPrice = async () => {
    const snapshot = await getDocs(priceCollection);
    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      setPricePerKm(firstDoc.data().pricePerKm.toString());
      setPriceId(firstDoc.id);
    } else {
      setPricePerKm('');
      setPriceId(null);
    }
  };

  // CREATE or UPDATE (single record only)
  const savePrice = async () => {
    if (!pricePerKm) return alert('Please enter a price');

    if (priceId) {
      // UPDATE existing record
      const docRef = doc(db, 'taxiPrices', priceId);
      await updateDoc(docRef, { pricePerKm: parseFloat(pricePerKm) });
      alert('Price updated successfully!');
    } else {
      // CREATE new record only if none exists
      await addDoc(priceCollection, { pricePerKm: parseFloat(pricePerKm) });
      alert('Price added successfully!');
    }

    fetchPrice();
  };

  useEffect(() => {
    fetchPrice();
  }, []);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"Taxi Price"} />
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price per KM</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price per km"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={pricePerKm}
            onChangeText={setPricePerKm}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: priceId ? '#f39c12' : '#27ae60' }]}
            onPress={savePrice}
          >
            <Text style={styles.buttonText}>
              {priceId ? "Update Price" : "Add Price"}
            </Text>
          </TouchableOpacity>
        </View>

        {priceId && (
          <View style={styles.displayCard}>
            <Text style={styles.currentLabel}>Current Price</Text>
            <Text style={styles.currentValue}>₹{pricePerKm} / km</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default BakiTaxiPrice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  topSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    marginTop: 4,
  },
  main: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  displayCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  currentLabel: {
    fontSize: 16,
    color: '#555',
  },
  currentValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 5,
  },
});
