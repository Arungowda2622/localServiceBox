import { FlatList, Pressable, StyleSheet, Text, View, Dimensions, SafeAreaView } from 'react-native';
import React from 'react'

const Footer = () => {
    const navItems = [
    { name: 'Bike Taxi', icon: '🛵' },
    { name: 'Parcel', icon: '📦' },
    { name: 'Profile', icon: '👤' },
  ];
  return (
    <View style={footerStyles.container}>
      <View style={footerStyles.navBar}>
        {navItems.map((item, index) => (
          <Pressable 
            key={index} 
            style={footerStyles.navItem}
            // The first item is active in the screenshot
            onPress={() => console.log(`Navigating to ${item.name}`)}
          >
            <Text style={item.name === 'Ride' ? footerStyles.activeIcon : footerStyles.icon}>{item.icon}</Text>
            <Text style={item.name === 'Ride' ? footerStyles.activeText : footerStyles.text}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export default Footer

const footerStyles = StyleSheet.create({
    container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingBottom: 30, // Using 0 because SafeAreaView handles bottom inset
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  icon: {
    fontSize: 24,
    color: 'gray',
    marginBottom: 2,
  },
  text: {
    fontSize: 12,
    color: 'gray',
    fontWeight: '500',
  },
  activeIcon: {
    fontSize: 24,
    color: '#000000', // Active color (Black/Dark)
    marginBottom: 2,
  },
  activeText: {
    fontSize: 12,
    color: '#000000', // Active color (Black/Dark)
    fontWeight: '600',
  },

})