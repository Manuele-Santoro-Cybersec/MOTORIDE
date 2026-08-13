import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { getProfile, saveProfile, getRideDiary, saveRideDiary } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function RideScreen() {
  const [location, setLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [startOdometer, setStartOdometer] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [topSpeed, setTopSpeed] = useState(0);
  const lastCoord = useRef(null);

  const handleStartRide = async () => {
    const p = await getProfile();
    const currentOdo = parseFloat(p.currentOdometer) || 0;
    setStartOdometer(currentOdo);
    setCurrentDistance(0);
    setTopSpeed(0);
    lastCoord.current = null;
    setIsRecording(true);
    isRecordingRef.current = true;
  };

  const handleStopRide = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    const endOdometer = startOdometer + currentDistance;
    
    const diary = await getRideDiary();
    const newRide = {
      id: Date.now().toString(),
      title: `GPS Ride - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      distance: parseFloat(currentDistance.toFixed(1)),
      topSpeed: Math.round(topSpeed),
      notes: '',
      date: new Date().toLocaleDateString(),
      type: 'GPS'
    };
    await saveRideDiary([newRide, ...diary]);
    
    const p = await getProfile();
    const currentOdo = parseFloat(p.currentOdometer || '0');
    if (endOdometer > currentOdo) {
      await saveProfile({ ...p, currentOdometer: endOdometer.toFixed(1) });
    }
    
    setCurrentDistance(0);
    setTopSpeed(0);
    setStartOdometer(0);
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
          
          if (isRecordingRef.current) {
            let speedMph = loc.coords.speed && loc.coords.speed > 0 ? loc.coords.speed * 2.23694 : 0;
            
            setTopSpeed(prev => speedMph > prev ? speedMph : prev);
            
            if (lastCoord.current) {
              const dist = haversineDistance(
                lastCoord.current.latitude, lastCoord.current.longitude,
                loc.coords.latitude, loc.coords.longitude
              );
              
              if (dist < 1) { // Anti-artifact filter
                setCurrentDistance(prev => prev + dist);
              }
            }
            lastCoord.current = loc.coords;
          }
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
    <View style={globalStyles.container}>
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
      
      {!isRecording && (
        <View style={styles.overlayBottom}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
            <Text style={styles.startButtonText}>▶ START RIDE</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isRecording && (
        <View style={styles.statsOverlay}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ODO (mi)</Text>
              <Text style={styles.statValue}>{(startOdometer + currentDistance).toFixed(1)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DIST (mi)</Text>
              <Text style={styles.statValue}>{currentDistance.toFixed(1)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOP (mph)</Text>
              <Text style={styles.statValue}>{Math.round(topSpeed)}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRide}>
            <Text style={styles.startButtonText}>⏹ STOP & SAVE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { 
    width: '100%', 
    height: '100%' 
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: '80%',
  },
  startButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statsOverlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statValue: {
    color: COLORS.secondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  }
});
