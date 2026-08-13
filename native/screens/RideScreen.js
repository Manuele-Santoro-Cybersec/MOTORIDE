import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';

export default function RideScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let subscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permesso di localizzazione negato');
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        (loc) => {
          setLocation(loc.coords);
        }
      );
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Questa è la tab viva: la Mappa!
  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        showsUserLocation={true}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : {
          latitude: 51.4543,
          longitude: -0.9781,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#121212'
  },
  map: { 
    width: '100%', 
    height: '100%' 
  }
});
