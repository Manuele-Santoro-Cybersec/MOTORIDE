import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DiaryScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Diary & Planning 📅</Text>
      <Text style={styles.text}>Ride Calendar</Text>
      <Text style={styles.text}>Past Routes</Text>
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
