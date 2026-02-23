import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import Header from "../header/Header";

const ProductDetails = ({ route, navigation }) => {
    const { product, onAddToCart } = route.params;


    const images = product.images || (product.imageUrl ? [product.imageUrl] : []);

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <Header title="Product Details" navigation={navigation} />
            <ScrollView>
                {/* Product Image */}
                <Image source={{ uri: images[0] }} style={styles.image} />

                <View style={{ padding: 15 }}>
                    <Text style={styles.name}>{product.name}</Text>

                    <Text style={styles.price}>₹{product.price}</Text>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>
                        {product.description || "No description available"}
                    </Text>

                    {/* Add to Cart */}
                    <TouchableOpacity
                        style={styles.cartBtn}
                        onPress={() => {
                            onAddToCart(product);      // ⭐ ADD TO CART
                            navigation.goBack();       // optional (like Amazon)
                        }}
                    >
                        <Text style={{ fontWeight: "700" }}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default ProductDetails;

const styles = StyleSheet.create({
    header: {
        paddingTop: 45,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 10,
    },
    image: {
        width: "100%",
        height: 300,
        resizeMode: "stretch",
        backgroundColor: "#F5F5F5",
    },
    name: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10,
    },
    price: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#B12704",
    },
    sectionTitle: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: "700",
    },
    description: {
        marginTop: 8,
        fontSize: 14,
        color: "#444",
    },
    cartBtn: {
        marginTop: 25,
        backgroundColor: "#FFD814",
        padding: 15,
        borderRadius: 30,
        alignItems: "center",
    },
});
