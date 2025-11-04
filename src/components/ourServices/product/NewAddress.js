import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import Header from '../../header/Header';
import RNPickerSelect from "react-native-picker-select";
import { db } from "../../firebase/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";
import { Alert } from "react-native";

const NewAddress = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const statesOfIndia = [
        { label: "Andhra Pradesh", value: "Andhra Pradesh" },
        { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
        { label: "Assam", value: "Assam" },
        { label: "Bihar", value: "Bihar" },
        { label: "Chhattisgarh", value: "Chhattisgarh" },
        { label: "Goa", value: "Goa" },
        { label: "Gujarat", value: "Gujarat" },
        { label: "Haryana", value: "Haryana" },
        { label: "Himachal Pradesh", value: "Himachal Pradesh" },
        { label: "Jharkhand", value: "Jharkhand" },
        { label: "Karnataka", value: "Karnataka" },
        { label: "Kerala", value: "Kerala" },
        { label: "Madhya Pradesh", value: "Madhya Pradesh" },
        { label: "Maharashtra", value: "Maharashtra" },
        { label: "Manipur", value: "Manipur" },
        { label: "Meghalaya", value: "Meghalaya" },
        { label: "Mizoram", value: "Mizoram" },
        { label: "Nagaland", value: "Nagaland" },
        { label: "Odisha", value: "Odisha" },
        { label: "Punjab", value: "Punjab" },
        { label: "Rajasthan", value: "Rajasthan" },
        { label: "Sikkim", value: "Sikkim" },
        { label: "Tamil Nadu", value: "Tamil Nadu" },
        { label: "Telangana", value: "Telangana" },
        { label: "Tripura", value: "Tripura" },
        { label: "Uttar Pradesh", value: "Uttar Pradesh" },
        { label: "Uttarakhand", value: "Uttarakhand" },
        { label: "West Bengal", value: "West Bengal" },
        { label: "Delhi", value: "Delhi" },
        { label: "Jammu & Kashmir", value: "Jammu & Kashmir" },
        { label: "Ladakh", value: "Ladakh" },
    ];


    const handleSaveAddress = async () => {

        if (!fullName || !mobileNumber || !pinCode || !address || !state) {
            Alert.alert("Missing Fields", "Please fill all required fields!");
            return;
        }

        try {
            await addDoc(collection(db, "addresses"), {
                fullName,
                mobileNumber,
                pinCode,
                address,
                city: city || "",
                state,
                createdAt: new Date().toISOString()
            });

            Alert.alert("Success", "Address saved successfully!");
            navigation.goBack();

        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to save address!");
        }
    };


    return (
        <View style={styles.safeArea}>
            <Header navigation={navigation} title={"Add New Address"} />
            <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Contact Details</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name (Required)*"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mobile Number (Required)*"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                />
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Address Details</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Pincode (Required)*"
                        value={pinCode}
                        onChangeText={setPinCode}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="City"
                        value={city}
                        onChangeText={setCity}
                        autoCapitalize="words"
                    />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Flat, House No., Building, Company"
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="words"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Area, Street, Sector, Village"
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="words"
                />
                <RNPickerSelect
                    onValueChange={(value) => setState(value)}
                    placeholder={{ label: "Select State (Required)*", value: null }}
                    style={pickerSelectStyles}
                    items={statesOfIndia}
                />
            </ScrollView>
            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
                    <Text style={styles.saveButtonText}>SAVE ADDRESS</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default NewAddress;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
        marginTop: 15,
        marginBottom: 10,
    },
    input: {
        height: 50,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: '#333333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 15,
    },
    bottomContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        backgroundColor: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

const pickerSelectStyles = {
    inputIOS: {
        height: 50,
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 12,
        color: '#333333',
    },
    inputAndroid: {
        height: 50,
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 12,
        color: '#333333',
    },
};
