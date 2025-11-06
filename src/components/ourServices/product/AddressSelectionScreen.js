import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Header from "../../header/Header";

const AddressSelectionScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const fetchAddresses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "addresses"));
      const addressList = [];
      querySnapshot.forEach((doc) => {
        addressList.push({ id: doc.id, ...doc.data() });
      });
      setAddresses(addressList);
    } catch (error) {
      console.error("Error fetching addresses: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchAddresses);
    return unsubscribe;
  }, [navigation]);

  const onAddNewAddress = () => {
    navigation.navigate("NewAddress");
  };

  const onDeliverClick = () => {
    const selected = addresses.find((a) => a.id === selectedAddress);
    if (selected) {
      navigation.navigate("PaymentSelection", { selectedAddress: selected });
    } else {
      alert("Please select an address first!");
    }
  };

  return (
    <View style={addressStyles.safeArea}>
      <Header navigation={navigation} title="Select Delivery Address" />
      <ScrollView style={addressStyles.mainContainer}>
        {addresses.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              addressStyles.addressCard,
              selectedAddress === item.id && addressStyles.selectedCard,
            ]}
            onPress={() => setSelectedAddress(item.id)}
          >
            <Text style={addressStyles.name}>{item.fullName}</Text>
            <Text style={addressStyles.addressText}>
              {`${item.address}, ${item.city}, ${item.state}, ${item.pinCode}`}
            </Text>
            <Text style={addressStyles.phone}>📞 {item.mobileNumber}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={addressStyles.addButton}
          onPress={onAddNewAddress}
        >
          <Text style={addressStyles.addButtonText}>+ Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={addressStyles.bottomContainer}>
        <TouchableOpacity
          style={addressStyles.deliverButton}
          onPress={onDeliverClick}
        >
          <Text style={addressStyles.deliverButtonText}>
            Deliver to this address
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressSelectionScreen;

const addressStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  addressCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF3FF",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  addressText: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  phone: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  deliverButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  deliverButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
