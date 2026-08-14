import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import StatsScreen from './screens/StatsScreen';
import HubScreen from './screens/HubScreen';
import DiaryScreen from './screens/DiaryScreen';
import RideScreen from './screens/RideScreen';
import GarageScreen from './screens/GarageScreen';
import BikerScreen from './screens/BikerScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- SCHERMATE SEGNAPOSTO ---





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
            else if (route.name === 'Garage') iconName = 'wrench';
            else if (route.name === 'Biker') iconName = 'motorbike';

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#e63946', 
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { 
            paddingBottom: Platform.OS === 'android' ? 20 : 0, 
            height: Platform.OS === 'android' ? 70 : 60, 
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
        <Tab.Screen name="Garage" component={GarageScreen} />
        <Tab.Screen name="Biker" component={BikerScreen} />
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
