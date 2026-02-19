import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "./firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth"; // ⭐ ADDED
import Header from "./header/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // ⭐ PASSWORD STATES
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ✅ Fetch existing user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // ⭐ STEP 1 — Instant Prefill from AsyncStorage
                const stored = await AsyncStorage.getItem("user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    console.log(parsed.userData,"thisIsUserData")
                    if (parsed?.userData) {
                        setFullName(parsed.userData.fullName || "");
                        setPhone(parsed.userData.phone || "");
                        setEmail(parsed.userData.email || "");
                    }
                }

                // ⭐ STEP 2 — Prefill email from Firebase Auth
                const user = auth.currentUser;
                if (user?.email) {
                    setEmail(user.email);
                }

                // ⭐ STEP 3 — Fetch latest Firestore data silently
                const uid = user?.uid;
                if (!uid) return;

                const docRef = doc(db, "users", uid);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();

                    setFullName(data.fullName || "");
                    setPhone(data.phone || "");

                    // ⭐ Save latest to AsyncStorage
                    await AsyncStorage.setItem(
                        "user",
                        JSON.stringify({ userData: data })
                    );
                }
            } catch (e) {
                console.log("Profile fetch error:", e);
            } finally {
                setFetching(false);
            }
        };

        fetchUser();
    }, []);


    // ✅ Update Profile Info
    const handleUpdate = async () => {
        if (!fullName.trim() || !phone.trim()) {
            Alert.alert("Validation", "Name and phone required");
            return;
        }

        setLoading(true);

        try {
            const uid = auth.currentUser.uid;

            await updateDoc(doc(db, "users", uid), {
                fullName,
                phone,
                updatedAt: new Date().toISOString(),
            });

            Alert.alert("Success", "Profile updated successfully ✅");
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // ⭐ NEW PASSWORD UPDATE FUNCTION
    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert("Error", "Enter new password");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        try {
            const user = auth.currentUser;
            await updatePassword(user, newPassword);

            Alert.alert("Success", "Password updated successfully 🔐");

            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                    "Security Alert",
                    "Please login again before changing password."
                );
            } else {
                Alert.alert("Error", error.message);
            }
        }
    };

    if (fetching) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0516D3" />
            </View>
        );
    }

    return (
  <View style={{ flex: 1, backgroundColor: "#FFF7ED" }}>
    <Header title="Edit Profile" navigation={navigation} />

    <View style={styles.headerCard}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color="#fff" />
      </View>
      <Text style={styles.name}>{fullName || "User"}</Text>
      <Text style={styles.subText}>{email}</Text>
    </View>

    <ScrollView
      contentContainerStyle={styles.main}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#EA580C" />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full Name"
            style={styles.input}
          />
        </View>

        <View style={[styles.inputBox, styles.disabledInput]}>
          <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
          <TextInput value={email} editable={false} style={styles.input} />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="call-outline" size={20} color="#EA580C" />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={handleUpdate}
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save Profile</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  </View>
);


};

export default Profile;


const styles = StyleSheet.create({
    main: {
        padding: 16,
        paddingBottom: 40,
    },

    headerCard: {
        alignItems: "center",
        paddingVertical: 20,
        backgroundColor: "#FB923C",
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },

    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#EA580C",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    name: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    subText: {
        color: "#FFEDD5",
        fontSize: 13,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginTop: 18,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 14,
        color: "#111827",
    },

    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF7ED",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },

    disabledInput: {
        backgroundColor: "#F3F4F6",
    },

    input: {
        marginLeft: 10,
        flex: 1,
    },

    primaryBtn: {
        backgroundColor: "#EA580C",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },

    secondaryBtn: {
        backgroundColor: "#0516D3",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },

    btnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
});

