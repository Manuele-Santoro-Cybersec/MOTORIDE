import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HubScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Smart Hub 🍻</Text>
      <Text style={styles.text}>Local Pubs</Text>
      <Text style={styles.text}>Charity Runs</Text>
      <Text style={styles.text}>Bike Nights</Text>
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
