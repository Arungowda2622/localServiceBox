import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Profile = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome to your Profile 👤</Text>
        </View>
    );
}

export default Profile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
    }
})