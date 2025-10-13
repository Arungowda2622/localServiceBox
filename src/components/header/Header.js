import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import React from 'react';
import { Ionicons } from "@expo/vector-icons";


const Header = () => {
    return (
        <View style={headerStyles.container}>
            <Pressable onPress={() => console.log('Go Back')} style={headerStyles.left}>
                <Ionicons name='arrow-back-outline' size={26} style={{marginRight: 15,}}/>
                <Text style={headerStyles.title}>Drop</Text>
            </Pressable>
            {/* <Pressable onPress={() => console.log('Open For Me Menu')} style={headerStyles.right}>
                <Text style={headerStyles.rightText}>For me</Text>
                <Text style={headerStyles.dropdownIcon}>⌵</Text>
            </Pressable> */}
        </View>
    )
}

export default Header

const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    rightText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    dropdownIcon: {
        fontSize: 16,
        marginLeft: 5,
        color: '#333',
    }
});