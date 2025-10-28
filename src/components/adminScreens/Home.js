import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from '../header/Header';
import { Ionicons } from '@expo/vector-icons';

const Home = ({ navigation }) => {

    const handleAddAdmin = () => {
        navigation.navigate("AddAdmin");
    }

    const handleAddProduct = () => {
        navigation.navigate("AddProduct");
    }

    return (
        <View style={styles.main}>
            <Header navigation={navigation} title={"Admin"} />
            <View style={styles.container}>
                <View style={styles.btnsContainer}>
                <Pressable onPress={handleAddAdmin} style={styles.btns}>
                    <Ionicons name='add' size={20}/>
                    <Text> Admin</Text>
                </Pressable>
                <Pressable onPress={handleAddProduct} style={styles.btns}>
                    <Ionicons name='add' size={20}/>
                    <Text> Product</Text>
                </Pressable>
                </View>
            </View>
        </View>
    )
}

export default Home

const styles = StyleSheet.create({
    main: {
        flex: 1
    },
    container: {
        flex: 1,
        padding: 24,
    },
    btns: {
        padding: 10,
        borderRadius: 13,
        margin: 10,
        backgroundColor: "white",
        flexDirection:"row",
        alignItems:"center"
    },
    btnsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    }
})