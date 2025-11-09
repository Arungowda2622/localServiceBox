import React from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import Header from '../header/Header';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Home = ({ navigation }) => {

  const buttons = [
    { title: 'Admin', icon: 'person-add', color: ['#36D1DC', '#5B86E5'], onPress: () => navigation.navigate("AddAdmin") },
    { title: 'Product', icon: 'cube-outline', color: ['#FF512F', '#DD2476'], onPress: () => navigation.navigate("AddProduct") },
    { title: 'UPI', icon: 'cash-outline', color: ['#00b09b', '#96c93d'], onPress: () => navigation.navigate("AddUpi") },
    { title: 'Orders', icon: 'cart-outline', color: ['#F7971E', '#FFD200'], onPress: () => navigation.navigate("UpdateOrders") },
    { title: 'Taxi Price', icon: 'car-outline', color: ['#8E2DE2', '#4A00E0'], onPress: () => navigation.navigate("BakiTaxiPrice") },
    { title: 'Drivers', icon: 'car-outline', color: ['#12c2e9', '#c471ed'], onPress: () => navigation.navigate("AddDriverScreen") },
  ];

  return (
    <View style={styles.main}>
      <Header navigation={navigation} title={"Admin Dashboard"} />
      
      <LinearGradient colors={['#2193b0', '#6dd5ed']} style={styles.banner}>
        <Text style={styles.bannerTitle}>Welcome, Admin 👋</Text>
        <Text style={styles.bannerSubtitle}>Manage your app’s content and settings easily</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.btnsContainer}>
          {buttons.map((btn, index) => (
            <Pressable key={index} style={styles.cardWrapper} onPress={btn.onPress}>
              <LinearGradient colors={btn.color} style={styles.card}>
                <Ionicons name={btn.icon} size={28} color="#fff" />
                <Text style={styles.cardText}>{btn.title}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  banner: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 6,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    marginTop: 5,
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  btnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    height: 110,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
});
