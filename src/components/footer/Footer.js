import { View, Text, Pressable, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const Footer = ({ navigation }) => {
  return (
    <View style={styles.wrapper}>
      {/* LEFT */}
      <Pressable
        style={styles.navItem}
        onPress={() => navigation.navigate("Orders")}
      >
        <Ionicons name="cube-outline" size={22} color="#666" />
        <Text style={styles.text}>Orders</Text>
      </Pressable>

      {/* CENTER FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("BikeTaxi")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      {/* RIGHT */}
      <Pressable style={styles.navItem} onPress={() => navigation.openDrawer()}>
        <Ionicons name="person-outline" size={22} color="#666" />
        <Text style={styles.text}>Profile</Text>
      </Pressable>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 40,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
  },
  navItem: {
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    color: "#666",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2F6BFF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    elevation: 25,
  },
});
