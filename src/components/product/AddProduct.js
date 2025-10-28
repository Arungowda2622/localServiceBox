import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  ScrollView,
  Button,
  Image
} from "react-native";
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Header from "../header/Header";
import * as ImagePicker from "expo-image-picker";

const AddProduct = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [productDetails, setProductDetails] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: ""
  });

  const handleAddProduct = async () => {
    const { name, price, imageUrl } = productDetails;
    console.log(productDetails,"thisIsProductDetails");
    

    if (!name || !price || !imageUrl) {
      Alert.alert("Missing Fields", "Product name, price & image are required!");
      return;
    }

    try {
      const checkQuery = query(
        collection(db, "products"),
        where("name", "==", name)
      );
      const checkSnapshot = await getDocs(checkQuery);

      if (!checkSnapshot.empty) {
        Alert.alert("Already Exists", "Product already exists!");
        return;
      }

      await addDoc(collection(db, "products"), {
        ...productDetails,
        price: Number(price),
        createdAt: new Date().toISOString()
      });

      Alert.alert("Success", "Product added successfully!");
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add product!");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setProductDetails(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Add Product" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          value={productDetails.name}
          onChangeText={(text) =>
            setProductDetails({ ...productDetails, name: text })
          }
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={productDetails.price}
          onChangeText={(text) =>
            setProductDetails({ ...productDetails, price: text })
          }
        />

        <Text style={styles.label}>Product Image</Text>
        <Button title="Choose Image" onPress={pickImage} />
        <Image
          source={{ uri: image }}
          style={{ width: 140, height: 140, marginTop: 10, borderRadius: 10 }}
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={productDetails.description}
          onChangeText={(text) =>
            setProductDetails({ ...productDetails, description: text })
          }
        />

        <Pressable style={styles.btn} onPress={handleAddProduct}>
          <Text style={styles.btnText}>Add Product</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default AddProduct;

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, marginTop: 15, fontWeight: "500" },
  input: {
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    marginTop: 5
  },
  btn: {
    backgroundColor: "#efb71bff",
    padding: 15,
    alignItems: "center",
    marginTop: 25,
    borderRadius: 12
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700"
  }
});
