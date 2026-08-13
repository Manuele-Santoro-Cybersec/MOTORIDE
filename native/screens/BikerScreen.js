import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BikerScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Biker Profile 🏍️</Text>
      <Text style={styles.text}>Rider ID: Ghost_8492</Text>
      <Text style={styles.text}>Bike: Lexmoto LS-Z 125</Text>
      <Text style={styles.text}>Last Refuel Date: --</Text>
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
