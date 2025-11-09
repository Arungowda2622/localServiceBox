import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./src/components/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Screens
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
import Profile from './src/components/Profile';
import CustomDrawer from "./src/components/drawer/CustomDrawer";
import Home from './src/components/adminScreens/Home';
import AddAdmin from './src/components/adminScreens/AddAdmin';
import AddProduct from './src/components/product/AddProduct';
import NewAddress from './src/components/ourServices/product/NewAddress';
import AddUpi from './src/components/adminScreens/AddUpi';
import Orders from './src/components/screens/Orders';
import UpdateOrders from './src/components/adminScreens/UpdateOrders';
import BakiTaxiPrice from './src/components/adminScreens/BakiTaxiPrice';
import BoxDelivery from './src/components/boxDelivery/BoxDelivery';
import DeliveryPayment from './src/components/boxDelivery/DeliveryPayment';
import AddDriverScreen from './src/components/adminScreens/AddDriverScreen';
import DriverScreen from './src/components/driver/DriverScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OuerServices" component={OuerServicesHome} />
      <Stack.Screen name="BikeTaxi" component={BikeTaxi} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="PaymentSelection" component={PaymentSelectionScreen} />
      <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} />
      <Stack.Screen name="BikeTaxiPayment" component={BikeTaxiPayment} />
      <Stack.Screen name="BikeTaxiTracking" component={BikeTaxiTracking} />
      <Stack.Screen name="AdminHome" component={Home} />
      <Stack.Screen name="AddAdmin" component={AddAdmin} />
      <Stack.Screen name="AddProduct" component={AddProduct} />
      <Stack.Screen name="NewAddress" component={NewAddress} />
      <Stack.Screen name="AddUpi" component={AddUpi} />
      <Stack.Screen name="Orders" component={Orders} />
      <Stack.Screen name="UpdateOrders" component={UpdateOrders} />
      <Stack.Screen name="BakiTaxiPrice" component={BakiTaxiPrice} />
      <Stack.Screen name="BoxDelivery" component={BoxDelivery} />
      <Stack.Screen name="DeliveryPayment" component={DeliveryPayment} />
      <Stack.Screen name="AddDriverScreen" component={AddDriverScreen} />
      <Stack.Screen name="DriverScreen" component={DriverScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // ✅ store role

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log("✅ User role:", userData.role);

            setUser(firebaseUser);
            setRole(userData.role || "user");
          } else {
            console.log("❌ Auth user not found in Firestore — logging out");
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        } catch (err) {
          console.error("Error checking Firestore user:", err);
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        role === "driver" ? (
          // ✅ If driver, go directly to DriverScreen
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DriverScreen" component={DriverScreen} />
          </Stack.Navigator>
        ) : (
          // ✅ Otherwise show main Drawer navigation
          <Drawer.Navigator
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{
              headerShown: false,
              drawerType: "front",
              swipeEnabled: true,
            }}
          >
            <Drawer.Screen name="Home" component={MainStack} />
            <Drawer.Screen name="Profile" component={Profile} />
          </Drawer.Navigator>
        )
      ) : (
        // ✅ Login/Signup stack
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
