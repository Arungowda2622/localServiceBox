import { StyleSheet, View } from 'react-native';
import LocationSelection from './map/LocationSelection';

const BikeTaxi = ({ navigation }) => {
  return (
    <View style={styles.main}>
      <LocationSelection navigation={navigation}/>
    </View>
  );
};

export default BikeTaxi;

const styles = StyleSheet.create({
  main: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
});

