import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StatsScreen from './screens/StatsScreen';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapView from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- SCHERMATE SEGNAPOSTO ---



function HubScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Smart Hub 🍻</Text>
      <Text style={styles.text}>Pubs, Charity and Bike Nights</Text>
    </View>
  );
}

function DiaryScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Diary & Planning 📅</Text>
      <Text style={styles.text}>Ride history and planning</Text>
    </View>
  );
}

function RideScreen() {
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

function MaintScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Maintenance 🔧</Text>
      <Text style={styles.text}>Upcoming services and MOT</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Rider & Bike 🏍️</Text>
      <Text style={styles.text}>User profile</Text>
    </View>
  );
}

// --- CONFIGURAZIONE NAVIGAZIONE CON ICONE ---

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator 
        screenOptions={({ route }) => ({ 
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Stats') iconName = 'gas-station';
            else if (route.name === 'Hub') iconName = 'glass-mug-variant';
            else if (route.name === 'Diary') iconName = 'calendar';
            else if (route.name === 'Ride') iconName = 'map';
            else if (route.name === 'Maint') iconName = 'wrench';
            else if (route.name === 'Profile') iconName = 'motorbike';

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#e63946', 
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { 
            paddingBottom: 5, 
            height: 60, 
            backgroundColor: '#1a1a1a', 
            borderTopColor: '#333' 
          },
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#ffffff'
        })}
      >
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Hub" component={HubScreen} />
        <Tab.Screen name="Diary" component={DiaryScreen} />
        <Tab.Screen name="Ride" component={RideScreen} />
        <Tab.Screen name="Maint" component={MaintScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// --- STILI ---

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#121212'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff'
  },
  text: {
    color: '#cccccc',
    fontSize: 16
  },
  container: { 
    flex: 1,
    backgroundColor: '#121212'
  },
  map: { 
    width: '100%', 
    height: '100%' 
  },
});
