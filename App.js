import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./src/components/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
import Profile from "./src/components/Profile";
import CustomDrawer from "./src/components/drawer/CustomDrawer";
import Home from "./src/components/adminScreens/Home";
import AddAdmin from "./src/components/adminScreens/AddAdmin";
import AddProduct from "./src/components/product/AddProduct";
import AddOwner from "./src/components/adminScreens/AddOwner";
import NewAddress from "./src/components/ourServices/product/NewAddress";
import AddUpi from "./src/components/adminScreens/AddUpi";
import Orders from "./src/components/screens/Orders";
import UpdateOrders from "./src/components/adminScreens/UpdateOrders";
import BakiTaxiPrice from "./src/components/adminScreens/BakiTaxiPrice";
import BoxDelivery from "./src/components/boxDelivery/BoxDelivery";
import DeliveryPayment from "./src/components/boxDelivery/DeliveryPayment";
import AddDriverScreen from "./src/components/adminScreens/AddDriverScreen";
import DriverScreen from "./src/components/driver/DriverScreen";
import BikeTaxiWaiting from "./src/components/ourServices/BikeTaxiWaiting";
import Services from "./src/components/ourServices/Services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Users from "./src/components/adminScreens/Users";
import FoodsBeverages from "./src/components/ourServices/FoodsBeverages";
import { setForceLogoutCallback } from "./src/utils/authUtils";
import ManPower from "./src/components/manPower/ManPower";
import ChangePassword from "./src/components/drawer/ChangePassword";
import ProductDetails from "./src/components/ourServices/ProductDetails";
import AddServiceScreen from "./src/components/adminScreens/AddServiceScreen";
import AddManPower from "./src/components/adminScreens/AddManPower";
import useOTAUpdate from "./src/utils/useOTAUpdate";
import CustomerCare from "./src/components/CustomerCare/CustomerCare";

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
      <Stack.Screen
        name="PaymentSelection"
        component={PaymentSelectionScreen}
      />
      <Stack.Screen
        name="AddressSelection"
        component={AddressSelectionScreen}
      />
      <Stack.Screen name="BikeTaxiPayment" component={BikeTaxiPayment} />
      <Stack.Screen name="BikeTaxiTracking" component={BikeTaxiTracking} />
      <Stack.Screen name="AdminHome" component={Home} />
      <Stack.Screen name="AddAdmin" component={AddAdmin} />
      <Stack.Screen name="AddOwner" component={AddOwner} />
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
      <Stack.Screen name="BikeTaxiWaiting" component={BikeTaxiWaiting} />
      <Stack.Screen name="Services" component={Services} />
      <Stack.Screen name="Users" component={Users} />
      <Stack.Screen name="FoodsBeverages" component={FoodsBeverages} />
      <Stack.Screen name="ManPower" component={ManPower} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />
      <Stack.Screen name="AddServices" component={AddServiceScreen} />
      <Stack.Screen name="AddManPower" component={AddManPower} />
    </Stack.Navigator>
  );
}

/* ================= DRIVER DRAWER ================= */
function DriverDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="DriverHome" component={DriverScreen} />
      <Drawer.Screen name="BikeTaxiWaiting" component={BikeTaxiWaiting} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="ChangePassword" component={ChangePassword} />
    </Drawer.Navigator>
  );
}


/* ================= ROOT APP ================= */

export default function App() {
  const navigationRef = useRef(null);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // 🔥 OTA UPDATE CHECK
  useOTAUpdate();

  // Provide an external hook to force clearing the app's user/role state.
  // Register this callback so other modules can call forceLogout() without circular dependency
  useEffect(() => {
    setForceLogoutCallback(() => {
      try {
        setUser(null);
        setRole(null);
        setInitializing(false);
        console.log('forceLogout called — cleared app user state');
      } catch (e) {
        console.warn('forceLogout failed:', e);
      }
    });
  }, []);

  /* 🔐 AUTH STATE LISTENER (SINGLE SOURCE OF TRUTH) */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged fired, firebaseUser:', firebaseUser ? firebaseUser.uid : null);
      if (!firebaseUser) {
        // Try to restore a persisted profile if the Firebase user is null.
        // This handles cases where the app was killed without explicit logout
        // but we still have a stored user profile locally.
        // However, if a logout is in progress (we set `loggingOut`), skip
        // restore to avoid immediately re-authenticating from local data.
        try {
          const loggingOut = await AsyncStorage.getItem('loggingOut');
          if (loggingOut) {
            console.log('App: skip restore because loggingOut flag present');
            await AsyncStorage.removeItem('loggingOut');
            setUser(null);
            setRole(null);
            setInitializing(false);
            return;
          }

          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('App: restored user from AsyncStorage', parsed.uid, parsed.role);
            setUser({ restored: true, uid: parsed.uid, email: parsed.email });
            setRole(parsed.role || 'user');
            setInitializing(false);
            return;
          }
        } catch (err) {
          console.warn('Failed to restore user from AsyncStorage:', err);
        }

        setUser(null);
        setRole(null);
        setInitializing(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        let userSnap;
        
        try {
          userSnap = await getDoc(userRef);
        } catch (fetchError) {
          // Network or permission error - Try to restore from AsyncStorage instead
          console.warn("Error fetching user from Firestore:", fetchError.code || fetchError.message);
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('App: Using cached user due to Firestore error', parsed.uid);
            setUser({ restored: true, uid: parsed.uid, email: parsed.email });
            setRole(parsed.role || 'user');
            setInitializing(false);
            return;
          }
          // If no cached user, throw the error
          throw fetchError;
        }

        if (!userSnap.exists()) {
          // Document doesn't exist - check if user is still in AsyncStorage
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('App: User doc missing but found in cache, restoring...', parsed.uid);
            setUser({ restored: true, uid: parsed.uid, email: parsed.email });
            setRole(parsed.role || 'user');
            setInitializing(false);
            return;
          }
          
          console.log('App: User document does not exist, signing out');
          await signOut(auth);
          setUser(null);
          setRole(null);
        } else {
          const data = userSnap.data();
          console.log('App: live user fetched from Firestore', firebaseUser.uid, data.role);
          setUser(firebaseUser);
          setRole(data.role || "user");
          AsyncStorage.setItem(
            "user",
            JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: data.role || "user",
              userData: data,
            }),
          );

          /* 🔥 DRIVER → update push token */
          if ((data.role === "driver" || data.role === "admin") && Constants.appOwnership !== "expo") {
            setTimeout(async () => {
              try {
                const tokenObject = await Notifications.getExpoPushTokenAsync({
                  projectId: Constants.expoConfig.extra.eas.projectId,
                });

                const token = tokenObject.data;

                if (token?.startsWith("ExponentPushToken")) {
                  await updateDoc(userRef, {
                    expoPushToken: token,
                    expoProjectId: Constants.expoConfig?.extra?.eas?.projectId,
                    updatedAt: new Date(),
                  });
                }
              } catch (err) {
                console.log("Token update error:", err);
              }
            }, 1500);
          }
        }
      } catch (error) {
        console.error("Auth listener error:", error);
        // Only sign out if it's a critical error, try to restore from cache first
        try {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log('App: Critical error but restoring from cache:', parsed.uid);
            setUser({ restored: true, uid: parsed.uid, email: parsed.email });
            setRole(parsed.role || 'user');
            setInitializing(false);
            return;
          }
        } catch (cacheErr) {
          console.warn('Failed to restore from cache:', cacheErr);
        }
        
        setUser(null);
        setRole(null);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  /* 🔄 Splash Loader */
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
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
                <Drawer.Screen name="ChangePassword" component={ChangePassword} />
                <Drawer.Screen name="CustomerCare" component={CustomerCare} />
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
    </SafeAreaProvider>
  );
}
