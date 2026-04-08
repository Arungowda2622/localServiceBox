import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Header from "../header/Header";
import { Image as ExpoImage } from "expo-image";

const CART_STORAGE_KEY = "@cs_cart"; // 🔥 IMPORTANT

const ConstructionCart = ({ navigation, route }) => {

    const {orderType} = route.params || {};
    const [cartItems, setCartItems] = useState([]);

    /* ---------------- LOAD CART ---------------- */
    useEffect(() => {
        const loadCart = async () => {
            const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setCartItems(
                    parsed.map(i => ({ ...i, quantity: i.quantity || 1 }))
                );
            }
        };

        loadCart();
    }, []);

    /* ---------------- SAVE CART ---------------- */
    useEffect(() => {
        AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    /* ---------------- QUANTITY ---------------- */
    const handleIncrease = (id) => {
        setCartItems(items =>
            items.map(item =>
                item.id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const handleDecrease = (id) => {
        setCartItems(items =>
            items
                .map(item =>
                    item.id === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    };

    const handleRemove = (id) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    /* ---------------- TOTAL ---------------- */
    const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    /* ---------------- CHECKOUT ---------------- */
    const handleCheckout = async () => {

        if (cartItems.length === 0) {
            Alert.alert("Cart empty");
            return;
        }

        navigation.navigate("PaymentSelection", {
            total,
            cartItems,
            orderType
        });

        // optional clear
        setCartItems([]);
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
    };

    return (
        <View style={styles.container}>
            <Header title="Construction Cart" navigation={navigation} />

            {cartItems.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="cart-outline" size={80} color="#aaa" />
                    <Text>Your cart is empty</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.card}>

                                <ExpoImage
                                    source={{ uri: item.imageUrl }}
                                    style={styles.image}
                                    contentFit="cover"
                                />

                                <View style={styles.details}>
                                    <Text style={styles.name}>{item.name}</Text>

                                    <Text style={styles.price}>
                                        ₹{item.price} × {item.quantity}
                                    </Text>

                                    <Text style={styles.totalItem}>
                                        ₹{item.price * item.quantity}
                                    </Text>

                                    {/* 🔥 Quantity Buttons */}
                                    <View style={styles.qtyRow}>
                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => handleDecrease(item.id)}
                                        >
                                            <Ionicons name="remove" size={16} color="#000" />
                                        </TouchableOpacity>

                                        <Text style={styles.qty}>{item.quantity}</Text>

                                        <TouchableOpacity
                                            style={styles.qtyBtn}
                                            onPress={() => handleIncrease(item.id)}
                                        >
                                            <Ionicons name="add" size={16} color="#000" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Delete */}
                                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                                    <Ionicons name="trash-outline" size={22} color="red" />
                                </TouchableOpacity>

                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.total}>₹{total}</Text>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={handleCheckout}
                        >
                            <Text style={styles.checkoutText}>Checkout</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

export default ConstructionCart;

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F9F9F9' 
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 10,
        marginBottom: 30
    },
    checkoutButton: {
        backgroundColor: '#FFD814',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    checkoutText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 12,
        padding: 12,
        elevation: 3,
    },

    image: {
        width: 70,
        height: 70,
        borderRadius: 10,
        marginRight: 12,
    },

    details: {
        flex: 1,
    },

    name: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },

    price: {
        fontSize: 13,
        color: "#666",
        marginTop: 3,
    },

    totalItem: {
        fontSize: 15,
        fontWeight: "bold",
        marginTop: 3,
    },

    qtyRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },

    qtyBtn: {
        backgroundColor: "#FFD814",
        padding: 6,
        borderRadius: 6,
    },

    qty: {
        marginHorizontal: 10,
        fontSize: 16,
        fontWeight: "bold",
    },
});