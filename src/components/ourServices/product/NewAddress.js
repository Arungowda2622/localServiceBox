import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import React, { useState } from 'react';
import Header from '../../header/Header';
import { db } from "../../firebase/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

const NewAddress = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [areaAddress, setAreaAddress] = useState('');
    const [buildingAddress, setBuildingAddress] = useState('');
    const [city, setCity] = useState('');
    const state = 'Karnataka';

    const handleSaveAddress = async () => {
        if (!fullName || !mobileNumber || !pinCode || !buildingAddress || !areaAddress) {
            Alert.alert("Missing Fields", "Please fill all required fields!");
            return;
        }

        try {
            await addDoc(collection(db, "addresses"), {
                fullName,
                mobileNumber,
                pinCode,
                address: `${buildingAddress}, ${areaAddress}`, // ✅ fixed
                city: city || "",
                state,
                createdAt: new Date().toISOString(),
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
                        placeholder="Pincode*"
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
                    value={buildingAddress}
                    onChangeText={setBuildingAddress}
                    autoCapitalize="words"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Area, Street, Sector, Village"
                    value={areaAddress}
                    onChangeText={setAreaAddress}
                    autoCapitalize="words"
                />

                <TextInput
                    style={styles.input}
                    value={state}
                    editable={false}
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
