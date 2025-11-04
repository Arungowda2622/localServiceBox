import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Header from "../header/Header";

const AddProduct = ({ navigation }) => {

  const [productDetails, setProductDetails] = useState({
    name: "",
    price: "",
    imageUrl: "",
    description: ""
  });

  const handleAddProduct = async () => {
    const { name, price, imageUrl, description } = productDetails;

    if (!name || !price || !imageUrl) {
      Alert.alert("Missing Fields", "Product name, price & images are required!");
      return;
    }

    const imageArray = imageUrl
      .split(",")
      .map(img => img.trim())
      .filter(img => img.startsWith("https://"));

    if (imageArray.length === 0) {
      Alert.alert("Invalid Image URLs", "Enter valid HTTPS image URLs!");
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
        name,
        price: Number(price),
        images: imageArray, // ✅ store as array
        description,
        createdAt: new Date().toISOString()
      });

      Alert.alert("Success", "Product added successfully!");
      navigation.goBack();

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add product!");
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

        <Text style={styles.label}>Product Images (Comma Separated HTTPS URLs)</Text>
        <TextInput
          style={styles.input}
          value={productDetails.imageUrl}
          onChangeText={(text) =>
            setProductDetails({ ...productDetails, imageUrl: text })
          }
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
