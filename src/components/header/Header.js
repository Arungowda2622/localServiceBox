import { StyleSheet, Text, View, Pressable } from 'react-native';
import React from 'react';
import { Ionicons } from "@expo/vector-icons";

const Header = ({ title, navigation, cartCount = 0, onCartPress }) => {
  return (
    <View style={headerStyles.container}>
      <Pressable onPress={() => navigation.goBack()} style={headerStyles.left}>
        <Ionicons name='arrow-back-outline' size={26} style={{ marginRight: 15 }} />
        <Text style={headerStyles.title}>{title || "Drop"}</Text>
      </Pressable>
    {
        onCartPress ? 
    
      <Pressable style={headerStyles.cartContainer} onPress={onCartPress}>
        <Ionicons name="cart-outline" size={26} color="#333" />
        {cartCount > 0 && (
          <View style={headerStyles.cartBadge}>
            <Text style={headerStyles.cartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </Pressable>
      :
      null
    }
    </View>
  );
};

export default Header;

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop:20
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  cartContainer: { position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
