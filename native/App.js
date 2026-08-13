import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapView from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- SCHERMATE SEGNAPOSTO ---

function StatsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Stats & Benzina ⛽</Text>
      <Text>Qui metteremo la barra del serbatoio virtuale</Text>
    </View>
  );
}

function HubScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Smart Hub 🍻</Text>
      <Text>Pub, Charity e Bike Nights</Text>
    </View>
  );
}

function DiaryScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Diary & Planning 📅</Text>
      <Text>Storico giri e pianificazione</Text>
    </View>
  );
}

function LogScreen() {
  // Questa è la tab viva: la Mappa!
  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        showsUserLocation={true}
        initialRegion={{
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
      <Text style={styles.title}>Manutenzione 🔧</Text>
      <Text>Prossimi tagliandi e MOT</Text>
    </View>
  );
}

function RiderScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Rider & Moto 🏍️</Text>
      <Text>Profilo utente</Text>
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
            else if (route.name === 'Log') iconName = 'map';
            else if (route.name === 'Maint') iconName = 'wrench';
            else if (route.name === 'Rider') iconName = 'motorbike';

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#e63946', 
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { paddingBottom: 5, height: 60 }
        })}
      >
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Hub" component={HubScreen} />
        <Tab.Screen name="Diary" component={DiaryScreen} />
        <Tab.Screen name="Log" component={LogScreen} />
        <Tab.Screen name="Maint" component={MaintScreen} />
        <Tab.Screen name="Rider" component={RiderScreen} />
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
    backgroundColor: '#f8f9fa'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10
  },
  container: { 
    flex: 1 
  },
  map: { 
    width: '100%', 
    height: '100%' 
  },
});
