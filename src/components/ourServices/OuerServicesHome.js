import { FlatList, Pressable, StyleSheet, Text, View, Dimensions, SafeAreaView } from 'react-native';
import React from 'react';
import Footer from '../footer/Footer';

// Get the device width for proportional styling
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // Subtracting total padding (2 * 30) for a full-width container.

const OuerServicesHome = ({ navigation }) => {
  const services = [
    { id: 1, serviceName: "Bike Taxi", title: "BikeTaxi", subtitle: "Book now" },
    { id: 2, serviceName: "Box Delivery", title: "BoxDelivery", subtitle: "Send anything" },
    { id: 3, serviceName: "Services", title: "Services", subtitle: "Your everyday rides" },
    { id: 4, serviceName: "Product", title: "Product", subtitle: "Get Products" },
  ];

  const handleSelectedService = (rowData) => {
    console.log(rowData, "thisIsData");
    navigation.navigate(rowData.title,{data: rowData});
  }

  const renderOurServices = ({ item, index }) => {
    const isEven = index % 2 === 0;

    // Custom icon/image display for visual similarity to the screenshot
    let iconContent = null;
    if (item.id === 1) iconContent = <Text style={styles.cardImageText}>🛵</Text>; // Bike Taxi
    else if (item.id === 2) iconContent = <Text style={styles.cardImageText}>📦</Text>; // Box Delivery
    else if (item.id === 3) iconContent = <Text style={styles.cardImageText}>🚗</Text>; // Rides/Services
    else if (item.id === 4) iconContent = <Text style={styles.cardImageText}>🛒</Text>; // Product

    return (
      <View style={[styles.serviceItem, isEven ? styles.leftItem : styles.rightItem]}>
        <Pressable
          style={({ pressed }) => [
            styles.btns,
            { opacity: pressed ? 0.95 : 1 }
          ]}
          onPress={() => handleSelectedService(item)}
        >
          {/* Top content area */}
          <View style={styles.cardImageContainer}>
            {iconContent}
          </View>

          {/* Bottom text content */}
          <View style={styles.cardTextContainer}>
            {/* Added subtitle to match the style of the screenshot */}
            <Text style={styles.btnSubTxt}>{item.subtitle || 'Book now'}</Text>
            {/* Keeping your original serviceName */}
            <Text style={styles.btnTxt}>{item.serviceName}</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>OuerServices</Text>
        {/* Services Grid (FlatList) */}
        <View style={styles.main}>
          <FlatList
            data={services}
            renderItem={renderOurServices}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        </View>

        {/* Placeholder for the other sections (e.g., 'Travel & Stays') */}
        {/* <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Travel & Stays with Rapido (Placeholder)</Text>
        </View> */}

      </View>
      {/* Footer / Bottom Navigation */}
      <Footer />
    </View>
  );
};

export default OuerServicesHome;

// --- STYLES ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7', // Overall screen background
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Set content background to white
    marginTop: 50
  },

  // --- Header/Search Bar Styles ---
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: 'gray',
  },
  searchText: {
    fontSize: 16,
    color: '#333',
  },
  sectionLabel: {
    fontWeight: "bold",
    fontSize: 20,
    color: '#1C1C1E',
    marginBottom: 10,
    textAlign: 'center',
  },

  // --- Grid Styles ---
  main: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 5,
  },
  listContent: {
    paddingVertical: 4,
  },
  serviceItem: {
    width: '50%',
    paddingVertical: 8,
  },
  leftItem: {
    paddingRight: 8,
  },
  rightItem: {
    paddingLeft: 8,
  },
  btns: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    height: 140, // Uniform card height
    // Style to make the card look like the screenshot's boxes
    borderWidth: 1,
    borderColor: '#EEEEEE',

    // Subtle Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  cardImageContainer: {
    flex: 1, // Takes up the top space
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 5,
  },
  cardImageText: {
    fontSize: 40, // Large icon/image placeholder
  },
  cardTextContainer: {
    padding: 5,
    paddingBottom: 0,
  },
  btnSubTxt: {
    // Top text (e.g., "Send anything")
    color: "gray",
    fontWeight: "500",
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 0,
  },
  btnTxt: {
    // Main Service Name (your original content)
    color: "#1C1C1E",
    fontWeight: "700",
    fontSize: 18,
    textAlign: 'left',
  },

  // --- Other Sections Placeholder ---
  placeholderCard: {
    backgroundColor: '#E6E6FA', // Light purple background for contrast
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  }
});
