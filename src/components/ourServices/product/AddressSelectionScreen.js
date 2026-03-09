import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import Header from "../../header/Header";
import { getUserId } from "../../../utils/authUtils";

const AddressSelectionScreen = ({ navigation, route }) => {
   const { total } = route.params || {};
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const fetchAddresses = async () => {
    try {
      const uid = await getUserId();
      if (!uid) return;

      const q = query(
        collection(db, "addresses"),
        where("userId", "==", uid)
      );

      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(list);
    } catch (error) {
      console.error("Error fetching addresses:", error);
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
      navigation.navigate("PaymentSelection", { selectedAddress: selected, total });
    } else {
      alert("Please select an address first!");
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header navigation={navigation} title="Select Delivery Address" />
      <ScrollView style={styles.mainContainer}>
        {addresses.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.addressCard,
              selectedAddress === item.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedAddress(item.id)}
          >
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.addressText}>
              {`${item.address}, ${item.city}, ${item.state}, ${item.pinCode}`}
            </Text>
            <Text style={styles.phone}>📞 {item.mobileNumber}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={onAddNewAddress}>
          <Text style={styles.addButtonText}>+ Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.deliverButton}
          onPress={onDeliverClick}
        >
          <Text style={styles.deliverButtonText}>
            Deliver to this address
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressSelectionScreen;


const styles = StyleSheet.create({
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
