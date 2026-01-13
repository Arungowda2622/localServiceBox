import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  Platform,
  StatusBar,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, db } from "./src/components/firebase/firebaseConfig";

/* Screens */
import Login from "./src/components/login/Login";
import SignUp from "./src/components/signup/SignUp";
import OuerServicesHome from "./src/components/ourServices/OuerServicesHome";
import BikeTaxi from "./src/components/ourServices/BikeTaxi";
import Product from "./src/components/ourServices/Product";
import CartScreen from "./src/components/ourServices/CartScreen";
import PaymentSelectionScreen from "./src/components/ourServices/product/PaymentSelectionScreen";
import AddressSelectionScreen from "./src/components/ourServices/product/AddressSelectionScreen";
import BikeTaxiPayment from "./src/components/ourServices/BikeTaxiPayment";
import BikeTaxiTracking from "./src/components/ourServices/BikeTaxiTracking";
import BikeTaxiWaiting from "./src/components/ourServices/BikeTaxiWaiting";
import Services from "./src/components/ourServices/Services";
import Profile from "./src/components/Profile";
import CustomDrawer from "./src/components/drawer/CustomDrawer";
import DriverScreen from "./src/components/driver/DriverScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

/* ================= USER STACK ================= */
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
      <Stack.Screen name="BikeTaxiWaiting" component={BikeTaxiWaiting} />
      <Stack.Screen name="Services" component={Services} />
    </Stack.Navigator>
  );
}

/* ================= ROOT APP ================= */
export default function App() {
  const navigationRef = useRef(null);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  /* 1️⃣ INSTANT RESTORE FROM ASYNCSTORAGE */
  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem("authUser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed.user);
        setRole(parsed.role);
      }
      setInitializing(false);
    })();
  }, []);

  /* 2️⃣ FIREBASE AUTH SYNC (BACKGROUND) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        await AsyncStorage.removeItem("authUser");
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const role = userSnap.exists() ? userSnap.data().role : "user";

      setUser(firebaseUser);
      setRole(role);

      await AsyncStorage.setItem(
        "authUser",
        JSON.stringify({
          user: firebaseUser,
          role,
        })
      );
    });

    return unsubscribe;
  }, []);

  /* 🔄 Splash */
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop:
          Platform.OS === "android" ? StatusBar || 0 : 0,
      }}
    >
      <NavigationContainer ref={navigationRef}>
        {user ? (
          role === "driver" ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="DriverScreen" component={DriverScreen} />
              <Stack.Screen
                name="BikeTaxiWaiting"
                component={BikeTaxiWaiting}
              />
            </Stack.Navigator>
          ) : (
            <Drawer.Navigator
              drawerContent={(props) => <CustomDrawer {...props} />}
              screenOptions={{ headerShown: false }}
            >
              <Drawer.Screen name="Home" component={MainStack} />
              <Drawer.Screen name="Profile" component={Profile} />
            </Drawer.Navigator>
          )
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
}
