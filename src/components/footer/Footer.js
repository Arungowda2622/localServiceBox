import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Footer = ({ navigation }) => {

  const navItems = [
    { name: 'Bike Taxi', icon: '🛵' },
    { name: 'Parcel', icon: '📦' },
    { name: 'Profile', icon: '👤' },
  ];

  const handlePress = (item) => {
    if (item.name === 'Profile') {
      // 👇 Open Drawer when Profile is pressed
      navigation.openDrawer();
    } else {
      // Handle other navigation cases
      navigation.navigate(item.name);
    }
  };

  return (
    <View style={footerStyles.container}>
      <View style={footerStyles.navBar}>
        {navItems.map((item, index) => (
          <Pressable
            key={index}
            style={footerStyles.navItem}
            onPress={() => handlePress(item)}
          >
            <Text style={footerStyles.icon}>{item.icon}</Text>
            <Text style={footerStyles.text}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default Footer;

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingBottom: 30,
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
});
