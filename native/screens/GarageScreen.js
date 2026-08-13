import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GarageScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Garage 🔧</Text>
      <Text style={styles.text}>Next MOT</Text>
      <Text style={styles.text}>Service Due</Text>
      <Text style={styles.text}>Chain Maintenance</Text>
    </View>
  );
}

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
    marginBottom: 20,
    color: '#ffffff'
  },
  text: {
    color: '#cccccc',
    fontSize: 16,
    marginBottom: 5
  }
});
