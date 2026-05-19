import {
    Alert,
    Image,
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ScrollView,
    FlatList,
    Modal,
    ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../header/Header";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { waitForAuthUser } from "../../utils/authUtils";
import { db } from "../firebase/firebaseConfig";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

const AddHome = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [images, setImages] = useState([]);

    const [name, setName] = useState("");
    const [rent, setRent] = useState("");
    const [location, setLocation] = useState("");
    const [bhk, setBhk] = useState("");
    const [phone, setPhone] = useState("");
    const [description, setDescription] = useState("");

    const [editItem, setEditItem] = useState(null);

    const [editModal, setEditModal] = useState(false);
    const [addModal, setAddModal] = useState(false);

    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [search, setSearch] = useState("");

    /* ---------------------------------- */
    /* FETCH DATA */
    /* ---------------------------------- */
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "homeRent"), (snap) => {
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setItems(data);
        });

        return () => unsub();
    }, []);

    /* ---------------------------------- */
    /* DELETE */
    /* ---------------------------------- */
    const handleDelete = (item) => {
        setDeleteId(item.id);

        Alert.alert("Delete Property", "Are you sure?", [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => setDeleteId(null),
            },
            {
                text: "Delete",
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "homeRent", item.id));
                    } catch (e) {
                        console.log(e);
                    } finally {
                        setDeleteId(null);
                    }
                },
            },
        ]);
    };

    /* ---------------------------------- */
    /* IMAGE PICKER */
    /* ---------------------------------- */
    const pickImageFromLibrary = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
            selectionLimit: 10,
        });

        if (!result.canceled) {
            const selectedImages = result.assets.map((item) => item.uri);

            setImages((prevImages) => [...prevImages, ...selectedImages]);
        }
    };

    const uploadMultipleImages = async () => {
        let uploadedUrls = [];

        for (const uri of images) {
            const url = await uploadImageToFirebase(uri);

            uploadedUrls.push(url);
        }

        return uploadedUrls;
    };

    /* ---------------------------------- */
    /* IMAGE UPLOAD */
    /* ---------------------------------- */
    const uploadImageToFirebase = async (uri) => {
        const storage = getStorage(
            undefined,
            "gs://localservicebox.firebasestorage.app"
        );

        const filename = `homeRent/${Date.now()}.jpg`;

        const storageRef = ref(storage, filename);

        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => resolve(xhr.response);

            xhr.onerror = () =>
                reject(new TypeError("Network request failed"));

            xhr.responseType = "blob";

            xhr.open("GET", uri, true);

            xhr.send(null);
        });

        await uploadBytes(storageRef, blob);

        blob.close && blob.close();

        return await getDownloadURL(storageRef);
    };

    /* ---------------------------------- */
    /* ADD PROPERTY */
    /* ---------------------------------- */
    const handleSubmit = async () => {
        if (!name || !rent || !location || !bhk || !phone) {
            Alert.alert("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            let imageUrls = [];

            if (images.length > 0) {
                imageUrls = await uploadMultipleImages();
            }

            const user = await waitForAuthUser();

            if (!user) {
                Alert.alert("Error", "User not logged in");
                return;
            }

            await addDoc(collection(db, "homeRent"), {
                name,
                rent: Number(rent),
                location,
                bhk,
                phone,
                description,
                imageUrls,
                available: true,
                userId: user.uid,
                createdAt: new Date(),
            });

            Alert.alert("Success", "Property added successfully!");

            setName("");
            setRent("");
            setLocation("");
            setBhk("");
            setPhone("");
            setDescription("");
            setImages([]);

            setAddModal(false);
        } catch (error) {
            console.log(error);

            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------- */
    /* UPDATE PROPERTY */
    /* ---------------------------------- */
    const handleUpdate = async () => {
        if (
            !editItem?.name ||
            !editItem?.rent ||
            !editItem?.location
        ) {
            Alert.alert("Please fill all required fields");
            return;
        }

        try {
            setLoading(true);

            let imageUrls = editItem.imageUrls || [];

            if (images.length > 0) {
                const uploadedUrls = await uploadMultipleImages();
                imageUrls = [...imageUrls, ...uploadedUrls];
            }

            await updateDoc(doc(db, "homeRent", editItem.id), {
                name: editItem.name,
                rent: Number(editItem.rent),
                location: editItem.location,
                bhk: editItem.bhk,
                phone: editItem.phone,
                description: editItem.description,
                imageUrls,
                updatedAt: new Date(),
            });

            Alert.alert("Updated successfully");

            setEditModal(false);
            setEditItem(null);
            setImages([]);
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------- */
    /* SEARCH FILTER */
    /* ---------------------------------- */
    const filteredItems = items.filter(
        (item) =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.location?.toLowerCase().includes(search.toLowerCase())
    );

    /* ---------------------------------- */
    /* CARD UI */
    /* ---------------------------------- */
    const renderItem = ({ item }) => {
        console.log(item,"totalImage")
        return(
        <View style={styles.card}>
            {item.imageUrls?.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 10 }}
                >
                    {item.imageUrls.map((img, index) => (
                        <ExpoImage
                            key={index}
                            source={{ uri: img }}
                            style={{
                                width: 250,
                                height: 180,
                                borderRadius: 15,
                                marginRight: 10,
                            }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    ))}
                </ScrollView>
            )}

            <Text style={styles.name}>{item.name}</Text>

            <Text style={styles.price}>₹{item.rent} / month</Text>

            <Text style={styles.text}>📍 {item.location}</Text>

            <Text style={styles.text}>🏠 {item.bhk} BHK</Text>

            <Text style={styles.text}>📞 {item.phone}</Text>

            <Text numberOfLines={2} style={styles.description}>
                {item.description}
            </Text>

            <View style={styles.row}>
                <Pressable
                    style={styles.editBtn}
                    onPress={() => {
                        setEditItem(item);
                        setImages([]);
                        setEditModal(true);
                    }}
                >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Edit
                    </Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.deleteBtn,
                        deleteId === item.id && { opacity: 0.7 },
                    ]}
                    onPress={() => handleDelete(item)}
                    disabled={deleteId === item.id}
                >
                    {deleteId === item.id ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: "#fff", fontWeight: "600" }}>
                            Delete
                        </Text>
                    )}
                </Pressable>
            </View>
        </View>
    )};

    return (
        <View style={styles.container}>
            <Header title="Home Rent" navigation={navigation} />

            {/* ADD BUTTON */}
            <Pressable
                style={styles.addBtn}
                onPress={() => setAddModal(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </Pressable>

            {/* SEARCH */}
            <View style={styles.searchBox}>
                <Ionicons
                    name="search-outline"
                    size={20}
                    color="#777"
                />

                <TextInput
                    placeholder="Search property..."
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <Text style={styles.totalText}>
                Total Properties: {filteredItems.length}
            </Text>

            {/* LIST */}
            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 150,
                }}
                ListFooterComponent={<View style={{ height: 80 }} />}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 40 }}>
                        <Text style={{ color: "#777" }}>
                            No properties found.
                        </Text>
                    </View>
                }
            />

            {/* ---------------------------------- */}
            {/* ADD PROPERTY MODAL */}
            {/* ---------------------------------- */}
            <Modal visible={addModal} animationType="slide">
                <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
                    <Header
                        title="Add Property"
                        navigation={{
                            goBack: () => setAddModal(false),
                        }}
                    />

                    <ScrollView contentContainerStyle={styles.subContainer}>
                        {/* IMAGE */}
                        <Pressable
                            onPress={pickImageFromLibrary}
                            style={styles.imageBox}
                        >
                            {images.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {images.map((img, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: img }}
                                            style={{
                                                width: 120,
                                                height: 120,
                                                borderRadius: 10,
                                                marginRight: 10,
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={styles.imageText}>
                                    Tap to upload property image
                                </Text>
                            )}
                        </Pressable>

                        {/* NAME */}
                        <Text style={styles.label}>Property Name</Text>

                        <TextInput
                            placeholder="Enter property name"
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />

                        {/* RENT */}
                        <Text style={styles.label}>Monthly Rent</Text>

                        <TextInput
                            placeholder="Enter rent"
                            style={styles.input}
                            value={rent}
                            onChangeText={setRent}
                            keyboardType="numeric"
                        />

                        {/* LOCATION */}
                        <Text style={styles.label}>Location</Text>

                        <TextInput
                            placeholder="Enter location"
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                        />

                        {/* BHK */}
                        <Text style={styles.label}>BHK</Text>

                        <TextInput
                            placeholder="2 BHK"
                            style={styles.input}
                            value={bhk}
                            onChangeText={setBhk}
                        />

                        {/* PHONE */}
                        <Text style={styles.label}>Phone</Text>

                        <TextInput
                            placeholder="Enter phone number"
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        {/* DESCRIPTION */}
                        <Text style={styles.label}>Description</Text>

                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            placeholder="Enter property description"
                        />

                        {/* BUTTON */}
                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={["#FF7E5F", "#FEB47B"]}
                                style={styles.button}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Add Property
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </ScrollView>
                </View>
            </Modal>

            {/* ---------------------------------- */}
            {/* EDIT MODAL */}
            {/* ---------------------------------- */}
            <Modal visible={editModal} animationType="slide">
                <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
                    <Header
                        title="Edit Property"
                        navigation={{
                            goBack: () => setEditModal(false),
                        }}
                    />

                    <ScrollView contentContainerStyle={styles.subContainer}>
                        {/* IMAGE */}
                        <Pressable
                            onPress={pickImageFromLibrary}
                            style={styles.imageBox}
                        >
                            {((editItem?.imageUrls || []).length > 0 || images.length > 0) ? (
                                <ScrollView horizontal>
                                    {(
                                        (editItem?.imageUrls || []).concat(images)
                                    ).map((img, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: img }}
                                            style={{
                                                width: 120,
                                                height: 120,
                                                borderRadius: 10,
                                                marginRight: 10,
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={styles.imageText}>
                                    Tap to change image
                                </Text>
                            )}
                        </Pressable>

                        {/* NAME */}
                        <TextInput
                            style={styles.input}
                            value={editItem?.name}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    name: t,
                                })
                            }
                        />

                        {/* RENT */}
                        <TextInput
                            style={styles.input}
                            value={editItem?.rent?.toString()}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    rent: t,
                                })
                            }
                            keyboardType="numeric"
                        />

                        {/* LOCATION */}
                        <TextInput
                            style={styles.input}
                            value={editItem?.location}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    location: t,
                                })
                            }
                        />

                        {/* BHK */}
                        <TextInput
                            style={styles.input}
                            value={editItem?.bhk}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    bhk: t,
                                })
                            }
                        />

                        {/* PHONE */}
                        <TextInput
                            style={styles.input}
                            value={editItem?.phone}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    phone: t,
                                })
                            }
                            keyboardType="phone-pad"
                        />

                        {/* DESCRIPTION */}
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            value={editItem?.description}
                            onChangeText={(t) =>
                                setEditItem({
                                    ...editItem,
                                    description: t,
                                })
                            }
                            multiline
                        />

                        {/* UPDATE */}
                        <Pressable
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={["#4CAF50", "#66BB6A"]}
                                style={styles.button}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Update Property
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

export default AddHome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FB",
        paddingBottom: 10,
    },

    subContainer: {
        padding: 20,
    },

    imageBox: {
        height: 200,
        borderRadius: 20,
        backgroundColor: "#EEE",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        overflow: "hidden",
    },

    image: {
        width: "100%",
        height: 220,
        borderRadius: 15,
        resizeMode: "cover",
    },

    imageText: {
        color: "#888",
        fontSize: 14,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        color: "#333",
    },

    input: {
        backgroundColor: "#FFF",
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },

    button: {
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },

    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    card: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
    },

    name: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#222",
    },

    price: {
        fontSize: 16,
        color: "#FF7E5F",
        fontWeight: "700",
        marginVertical: 5,
    },

    text: {
        fontSize: 14,
        color: "#555",
        marginTop: 3,
    },

    description: {
        marginTop: 8,
        color: "#666",
        lineHeight: 20,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },

    editBtn: {
        backgroundColor: "green",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    deleteBtn: {
        backgroundColor: "red",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },

    addBtn: {
        backgroundColor: "#FF7E5F",
        width: 55,
        height: 55,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "flex-end",
        right: 20,
        marginVertical: 10,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginTop: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        elevation: 2,
    },

    searchInput: {
        flex: 1,
        padding: 10,
        fontSize: 16,
    },

    totalText: {
        textAlign: "right",
        marginRight: 15,
        marginTop: 5,
        fontWeight: "600",
        color: "#555",
    },
});
