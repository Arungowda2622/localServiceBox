import { Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native'
import React, { useState } from 'react'
import Header from '../header/Header'
import { db } from '../firebase/firebaseConfig'
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore'

const AddAdmin = ({ navigation }) => {

    const [adminDetails, setAdminDetails] = useState({
        role: "admin",
        fullName: "",
        email: "",
        phone: "",
        password: ""
    });

    const handleAddAdmin = async () => {
        const { fullName, email, phone, password } = adminDetails;

        // Check if any field is empty
        if (!fullName || !email || !phone || !password) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        try {
            // Check if user with the same email already exists
            const q = query(
                collection(db, "users"),
                where("email", "==", email)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                Alert.alert("Error", "User already added with this email!");
                return;
            }

            // Check phone number
            const phoneQuery = query(
                collection(db, "users"),
                where("phone", "==", phone)
            );
            const phoneSnapshot = await getDocs(phoneQuery);

            if (!phoneSnapshot.empty) {
                Alert.alert("Error", "User already added with this phone number!");
                return;
            }

            // Add new admin
            const newAdminRef = doc(collection(db, "users"));
            await setDoc(newAdminRef, {
                ...adminDetails,
                createdAt: new Date().toISOString()
            });

            Alert.alert("Success", "New admin added successfully!");
            setAdminDetails({
                role: "admin",
                fullName: "",
                email: "",
                phone: "",
                password: ""
            });

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong!");
        }
    };


    return (
        <View style={styles.main}>
            <Header navigation={navigation} title={"Add Admin"} />
            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <Text style={styles.infoLabel}>FullName :</Text>
                    <TextInput
                        placeholder='Enter FullName'
                        style={styles.inputBox}
                        value={adminDetails.fullName}
                        onChangeText={(text) => setAdminDetails({ ...adminDetails, fullName: text })}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.infoLabel}>Email ID :</Text>
                    <TextInput
                        placeholder='Enter Email ID'
                        style={styles.inputBox}
                        value={adminDetails.email}
                        onChangeText={(text) => setAdminDetails({ ...adminDetails, email: text })}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.infoLabel}>Phone Number :</Text>
                    <TextInput
                        placeholder='Enter Phone Number'
                        style={styles.inputBox}
                        value={adminDetails.phone}
                        onChangeText={(text) => setAdminDetails({ ...adminDetails, phone: text })}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.infoLabel}>Password :</Text>
                    <TextInput
                        placeholder='Enter Password'
                        style={styles.inputBox}
                        value={adminDetails.password}
                        onChangeText={(text) => setAdminDetails({ ...adminDetails, password: text })}
                    />
                </View>
            </View>
            <Pressable onPress={handleAddAdmin} style={styles.addBtn}>
                <Text style={styles.addLabel}>Add Admin</Text>
            </Pressable>
        </View>
    )
}

export default AddAdmin


const styles = StyleSheet.create({
    main: {
        flex: 1
    },
    container: {
        flex: 1,
        padding: 24
    },
    inputContainer: {
        marginVertical: 10,
    },
    infoLabel: {
        fontWeight: "500",
        fontSize: 13
    },
    inputBox: {
        backgroundColor: "white",
        borderRadius: 13,
        marginTop: 5,
        paddingHorizontal: 10
    },
    addBtn: {
        padding: 15,
        alignItems: "center",
        backgroundColor: "#efb71bff",
        marginBottom: 30
    },
    addLabel: {
        fontWeight: "600",
        fontSize: 18
    }
})