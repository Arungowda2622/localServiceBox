import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from 'react-native';
import Login from './src/components/login/Login';
import SignUp from './src/components/signup/SignUp';
import OuerServicesHome from './src/components/ourServices/OuerServicesHome';
import BikeTaxi from './src/components/ourServices/BikeTaxi';
import Product from './src/components/ourServices/Product';
import CartScreen from './src/components/ourServices/CartScreen';
import PaymentSelectionScreen from './src/components/ourServices/product/PaymentSelectionScreen';
import AddressSelectionScreen from './src/components/ourServices/product/AddressSelectionScreen';
import BikeTaxiPayment from './src/components/ourServices/BikeTaxiPayment';
import BikeTaxiTracking from './src/components/ourServices/BikeTaxiTracking';

export default function App() {
  const Stack = createNativeStackNavigator();
 
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="OuerServices" component={OuerServicesHome} />
        <Stack.Screen name="BikeTaxi" component={BikeTaxi} />
        <Stack.Screen name="Product" component={Product} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="PaymentSelection" component={PaymentSelectionScreen} />
        <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} />
        <Stack.Screen name="BikeTaxiPayment" component={BikeTaxiPayment} />
        <Stack.Screen name="BikeTaxiTracking" component={BikeTaxiTracking} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
