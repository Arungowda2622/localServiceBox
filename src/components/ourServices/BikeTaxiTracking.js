import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Animated } from 'react-native';
import Header from '../header/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BikeTaxiTracking = ({ navigation }) => {
  const [isWaiting, setIsWaiting] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate rider confirmation after 4 seconds
    const timer = setTimeout(() => {
      setIsWaiting(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={"Booking Status"} />

      <View style={styles.content}>
        {isWaiting ? (
          <>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.waitingText}>Waiting for the rider’s confirmation...</Text>
          </>
        ) : (
          <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
            <Ionicons name="checkmark-circle" size={70} color="#4CAF50" style={{ marginBottom: 15 }} />
            <Text style={styles.successTitle}>Ride confirmed!</Text>
            <Text style={styles.successText}>
              Your ride has been successfully booked. The rider is on the way and will reach your location as soon as possible.
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default BikeTaxiTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  waitingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4CAF50',
    textAlign: 'center',
  },
  successText: {
    marginTop: 10,
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
  },
});
