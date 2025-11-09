import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { signOut } from "firebase/auth";

export default function CustomDrawer(props) {
  const { navigation } = props;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("User data:", docSnap.data());
          setUserData(docSnap.data());
        }
      } else {
        console.log("No user logged in");
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    navigation.closeDrawer();
    await AsyncStorage.removeItem('user');
    await signOut(auth);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* 🔹 Header Section */}
      <View style={styles.header}>
        <Image source={require('../../../assets/profile_pic.png')} style={styles.profilePic} />
        <Text style={styles.name}>{userData?.fullName || 'User Name'}</Text>
        <Text style={styles.phone}>{userData?.phone || '+91 XXXXX XXXXX'}</Text>
      </View>

      {/* 🔹 Menu Section */}
      <View style={styles.menu}>
        {/* <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.menuItem}>
          <Ionicons name="person-circle-outline" size={22} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'Orders' })} style={styles.menuItem}>
          <Ionicons name="cart-outline" size={22} color="#333" style={styles.menuIcon} />
          <Text style={styles.menuText}>Orders</Text>
        </TouchableOpacity>
        {
          userData?.role === "admin" ?
            <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'AdminHome' })} style={styles.menuItem}>
              <Ionicons name="settings-outline" size={22} color="#333" style={styles.menuIcon} />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            :
            null
        }
      </View>

      {/* 🔹 Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phone: {
    fontSize: 14,
  },
  menu: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    marginTop: 'auto',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
