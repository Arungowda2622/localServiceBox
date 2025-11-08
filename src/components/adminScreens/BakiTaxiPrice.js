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
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import Header from '../header/Header';

const BakiTaxiPrice = ({ navigation }) => {
  const [baseFare, setBaseFare] = useState('');
  const [baseDistance, setBaseDistance] = useState('2'); // default 2 km
  const [extraPerKm, setExtraPerKm] = useState('');
  const [priceId, setPriceId] = useState(null);

  const priceCollection = collection(db, 'taxiPrices');

  // Fetch stored price (only one record)
  const fetchPrice = async () => {
    const snapshot = await getDocs(priceCollection);
    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      setBaseFare(data.baseFare?.toString() || '');
      setBaseDistance(data.baseDistance?.toString() || '2');
      setExtraPerKm(data.extraPerKm?.toString() || '');
      setPriceId(firstDoc.id);
    } else {
      setBaseFare('');
      setExtraPerKm('');
      setBaseDistance('2');
      setPriceId(null);
    }
  };

  // Save or Update Fare
  const savePrice = async () => {
    if (!baseFare || !baseDistance || !extraPerKm) {
      return alert('Please enter all fields');
    }

    const priceData = {
      baseFare: parseFloat(baseFare),
      baseDistance: parseFloat(baseDistance),
      extraPerKm: parseFloat(extraPerKm),
    };

    if (priceId) {
      const docRef = doc(db, 'taxiPrices', priceId);
      await updateDoc(docRef, priceData);
      alert('Taxi fare updated successfully!');
    } else {
      await addDoc(priceCollection, priceData);
      alert('Taxi fare added successfully!');
    }

    fetchPrice();
  };

  useEffect(() => {
    fetchPrice();
  }, []);

  // Example calculation
  const calculateFare = (distance) => {
    if (!baseFare || !extraPerKm || !baseDistance) return 0;
    const base = parseFloat(baseFare);
    const extra = parseFloat(extraPerKm);
    const baseKm = parseFloat(baseDistance);

    if (distance <= baseKm) return base;
    return base + (distance - baseKm) * extra;
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"Taxi Price"} />
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Base Fare (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter base fare (e.g. 30)"
            keyboardType="numeric"
            value={baseFare}
            onChangeText={setBaseFare}
          />

          <Text style={styles.label}>Base Distance (KM)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter base distance (e.g. 2)"
            keyboardType="numeric"
            value={baseDistance}
            onChangeText={setBaseDistance}
          />

          <Text style={styles.label}>Extra Fare per KM (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter extra fare per km (e.g. 10)"
            keyboardType="numeric"
            value={extraPerKm}
            onChangeText={setExtraPerKm}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: priceId ? '#f39c12' : '#27ae60' }]}
            onPress={savePrice}
          >
            <Text style={styles.buttonText}>
              {priceId ? "Update Fare" : "Add Fare"}
            </Text>
          </TouchableOpacity>
        </View>

        {priceId && (
          <View style={styles.displayCard}>
            <Text style={styles.currentLabel}>Current Fare Structure</Text>
            <Text style={styles.currentValue}>
              ₹{baseFare} for first {baseDistance} km{'\n'}
              ₹{extraPerKm} per km thereafter
            </Text>
            <Text style={{ marginTop: 10, color: '#777' }}>
              Example: 5 km = ₹{calculateFare(5).toFixed(2)}
            </Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 5,
    textAlign: 'center',
  },
});
