import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, Keyboard, ScrollView, Switch } from 'react-native';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { getProfile, saveProfile, getRideDiary, saveRideDiary, getCustomHubs, saveCustomHubs } from '../utils/storage';
import { getRoute } from '../utils/routing';
import { COLORS, globalStyles } from '../constants/theme';

export default function RideScreen({ route, navigation }) {
  const [location, setLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [startOdometer, setStartOdometer] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [topSpeed, setTopSpeed] = useState(0);
  const [stops, setStops] = useState([]);
  const [plannedStops, setPlannedStops] = useState([]);
  const [distance, setDistance] = useState(0);
  const [attachHubId, setAttachHubId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (route?.params?.attachToHubId) {
      setAttachHubId(route.params.attachToHubId);
    }
  }, [route?.params?.attachToHubId]);
  const [isStopModalVisible, setIsStopModalVisible] = useState(false);
  const [stopLabel, setStopLabel] = useState('');
  const [tempStopCoord, setTempStopCoord] = useState(null);
  const lastCoord = useRef(null);
  const locationRef = useRef(null);
  const mapRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [avoidMotorways, setAvoidMotorways] = useState(false);

  const handleSaveTodoRide = async () => {
    if (plannedStops.length === 0) return;
    
    const diary = await getRideDiary();
    
    const newRide = {
      id: Date.now().toString(),
      title: `Planned Route - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      distance: routeData && routeData.distanceMiles ? parseFloat(routeData.distanceMiles) : 0,
      topSpeed: 0,
      notes: '',
      date: new Date().toLocaleDateString(),
      type: 'TODO',
      stops: [...plannedStops]
    };
    
    await saveRideDiary([newRide, ...diary]);
    setPlannedStops([]);
    setRouteData(null);
    alert('Route saved to diary as To-Do!');
  };

  const handleStartRide = async () => {
    const p = await getProfile();
    const currentOdo = parseFloat(p.currentOdometer) || 0;
    setStartOdometer(currentOdo);
    setCurrentDistance(0);
    setTopSpeed(0);
    setStops([]);
    lastCoord.current = null;
    setIsRecording(true);
    isRecordingRef.current = true;
  };

  const handleStopRide = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    const endOdometer = startOdometer + currentDistance;
    
    const diary = await getRideDiary();
    const allStops = [...plannedStops, ...stops];
    
    const newRide = {
      id: Date.now().toString(),
      title: `GPS Ride - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      distance: parseFloat(currentDistance.toFixed(1)),
      topSpeed: Math.round(topSpeed),
      notes: '',
      date: new Date().toLocaleDateString(),
      type: 'GPS',
      stops: allStops
    };
    await saveRideDiary([newRide, ...diary]);
    
    const p = await getProfile();
    const currentOdo = parseFloat(p.currentOdometer || '0');
    const newOdo = endOdometer > currentOdo ? endOdometer.toFixed(1) : p.currentOdometer;
    
    // Consumo carburante: basato sul profilo o ~22 miglia per litro (fallback)
    const userMpg = parseFloat(p.mpg) || 22;
    const userTank = parseFloat(p.tank) || 13;
    const fuelConsumed = currentDistance / userMpg;
    let newFuel = parseFloat(p.currentFuel !== undefined ? p.currentFuel : userTank) - fuelConsumed;
    if (newFuel < 0) newFuel = 0;

    await saveProfile({ 
      ...p, 
      currentOdometer: newOdo,
      currentFuel: newFuel
    });
    
    setCurrentDistance(0);
    setTopSpeed(0);
    setStartOdometer(0);
    setStops([]);
    setPlannedStops([]);
  };

  const handleAddStopPress = () => {
    if (lastCoord.current) {
      setTempStopCoord(lastCoord.current);
      setStopLabel('');
      setIsStopModalVisible(true);
    }
  };

  const saveStop = () => {
    if (tempStopCoord) {
      const newStop = {
        id: Date.now().toString(),
        latitude: tempStopCoord.latitude,
        longitude: tempStopCoord.longitude,
        label: stopLabel.trim(),
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        type: 'live'
      };
      setStops(prev => [...prev, newStop]);
    }
    setIsStopModalVisible(false);
    setTempStopCoord(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`, {
        headers: { 'User-Agent': 'MOTORIDE-App' }
      });
      const data = await response.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const addPlannedStop = (item) => {
    const newStop = {
      id: Date.now().toString(),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      label: item.display_name,
      type: 'planned'
    };
    setPlannedStops(prev => [...prev, newStop]);
    setSearchResults([]);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const removePlannedStop = (id) => {
    setPlannedStops(prev => prev.filter(s => s.id !== id));
  };

  const movePlannedStop = (index, direction) => {
    setPlannedStops(prev => {
      if (index + direction < 0 || index + direction >= prev.length) return prev;
      const newStops = [...prev];
      const temp = newStops[index];
      newStops[index] = newStops[index + direction];
      newStops[index + direction] = temp;
      return newStops;
    });
  };

  useEffect(() => {
    if (route?.params?.hubToRoute) {
      const hub = route.params.hubToRoute;
      if (hub.waypoints && hub.waypoints.length > 0) {
        const waypointsList = hub.waypoints.map((wp, i) => ({
          id: Date.now().toString() + i,
          latitude: parseFloat(wp.lat),
          longitude: parseFloat(wp.lon),
          label: `Waypoint ${i + 1}`,
          type: 'planned'
        }));
        setPlannedStops(waypointsList);
      } else if (hub.lat && hub.lon) {
        setPlannedStops(prev => {
          if (prev.some(s => s.label === hub.title)) return prev;
          const newStop = {
            id: Date.now().toString(),
            latitude: parseFloat(hub.lat),
            longitude: parseFloat(hub.lon),
            label: hub.title,
            type: 'planned'
          };
          return [...prev, newStop];
        });
      }
    }
  }, [route?.params?.hubToRoute]);

  const handleAttachToEvent = async () => {
    if (plannedStops.length === 0) return;
    const destination = plannedStops[plannedStops.length - 1];
    
    const hubs = await getCustomHubs();
    const updatedHubs = hubs.map(hub => {
      if (hub.id === attachHubId) {
        return {
          ...hub,
          lat: destination.latitude,
          lon: destination.longitude,
          destName: destination.label
        };
      }
      return hub;
    });
    
    await saveCustomHubs(updatedHubs);
    setAttachHubId(null);
    navigation.goBack();
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
          locationRef.current = loc.coords;
          
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

  const hasLocation = !!location;
  useEffect(() => {
    if (plannedStops.length === 0) {
      setRouteData(null);
      return;
    }
    if (!locationRef.current) {
      setRouteData({ error: 'Waiting for GPS...' });
      return;
    }

    let isSubscribed = true;

    const calculateRoute = async () => {
      setRouteData(prev => prev ? { ...prev, loading: true } : { loading: true });
      const coords = [
        { latitude: locationRef.current.latitude, longitude: locationRef.current.longitude },
        ...plannedStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))
      ];
      const result = await getRoute(coords, avoidMotorways);
      if (isSubscribed) {
        setRouteData(result);
      }
    };

    calculateRoute();

    return () => { isSubscribed = false; };
  }, [plannedStops, hasLocation, avoidMotorways]);

  // Questa è la tab viva: la Mappa!
  return (
    <View style={globalStyles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        showsUserLocation={true}
        initialRegion={location ? {
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
      >
        {stops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.label || 'Stop'}
            description={stop.timestamp}
            pinColor={COLORS.primary}
          />
        ))}
        {plannedStops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.label || 'Planned Stop'}
            pinColor={COLORS.secondary}
          />
        ))}
        {routeData && routeData.coordinates && routeData.coordinates.length > 0 && (
          <Polyline 
            coordinates={routeData.coordinates}
            strokeColor={COLORS.success}
            strokeWidth={4}
            zIndex={1}
          />
        )}
      </MapView>
      
      {!isRecording && (
        <View style={styles.planOverlay}>
          <Text style={styles.planTitle}>Plan Your Route</Text>
          <View style={styles.searchRow}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search a place..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.searchBtnText}>🔍</Text>
            </TouchableOpacity>
          </View>
          
          {searchResults.length > 0 && (
            <ScrollView style={styles.searchResultsContainer} keyboardShouldPersistTaps="handled">
              {searchResults.map(item => (
                <View key={item.place_id} style={styles.searchResultItem}>
                  <Text style={styles.searchResultText} numberOfLines={2}>{item.display_name}</Text>
                  <TouchableOpacity style={styles.searchAddBtn} onPress={() => addPlannedStop(item)}>
                    <Text style={styles.searchAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {plannedStops.length > 0 && (
            <ScrollView style={styles.plannedStopsContainer} keyboardShouldPersistTaps="handled">
              {plannedStops.map((stop, index) => (
                <View key={stop.id} style={styles.plannedStopRow}>
                  <Text style={styles.plannedStopText} numberOfLines={1}>{index + 1}. {stop.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {index > 0 ? (
                      <TouchableOpacity onPress={() => movePlannedStop(index, -1)} style={{ paddingHorizontal: 5 }}>
                        <Text>⬆️</Text>
                      </TouchableOpacity>
                    ) : <View style={{ width: 28 }} />}
                    
                    {index < plannedStops.length - 1 ? (
                      <TouchableOpacity onPress={() => movePlannedStop(index, 1)} style={{ paddingHorizontal: 5, marginRight: 10 }}>
                        <Text>⬇️</Text>
                      </TouchableOpacity>
                    ) : <View style={{ width: 38 }} />}
                    
                    <TouchableOpacity onPress={() => removePlannedStop(stop.id)}>
                      <Text style={styles.plannedStopRemove}>❌</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.routeOptionsContainer}>
            {plannedStops.length > 0 && (
              <View style={styles.routeSummary}>
                {routeData?.loading && !routeData?.coordinates && <Text style={styles.routeSummaryText}>Calculating route...</Text>}
                {routeData?.error && <Text style={styles.routeSummaryText}>{routeData.error}</Text>}
                {routeData?.coordinates && (
                  <Text style={styles.routeSummaryText}>
                    Total: {routeData.distanceMiles} mi • ~{routeData.durationMinutes} min {routeData.loading ? '(Updating...)' : ''}
                  </Text>
                )}
              </View>
            )}
            {plannedStops.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 10 }}>
                <Text style={{ color: COLORS.text, fontSize: 14 }}>Avoid Motorways</Text>
                <Switch
                  value={avoidMotorways}
                  onValueChange={setAvoidMotorways}
                  trackColor={{ false: COLORS.border, true: COLORS.success }}
                />
              </View>
            )}
            {attachHubId && plannedStops.length > 0 && (
              <TouchableOpacity style={styles.attachButton} onPress={handleAttachToEvent}>
                <Text style={styles.attachButtonText}>✅ Attach Route to Event</Text>
              </TouchableOpacity>
            )}
            {!attachHubId && plannedStops.length > 0 && (
              <TouchableOpacity style={styles.attachButton} onPress={handleSaveTodoRide}>
                <Text style={styles.attachButtonText}>📝 Save as To-Do Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      
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
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity style={[styles.stopButton, {flex: 1, marginRight: 10, backgroundColor: COLORS.primary}]} onPress={handleAddStopPress}>
              <Text style={styles.startButtonText}>🚏 ADD STOP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.stopButton, {flex: 1}]} onPress={handleStopRide}>
              <Text style={styles.startButtonText}>⏹ STOP & SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={isStopModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Stop</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Label (e.g. Coffee Break)"
              placeholderTextColor={COLORS.textMuted}
              value={stopLabel}
              onChangeText={setStopLabel}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsStopModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveStop}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={{
          position: 'absolute', 
          right: 20, 
          bottom: isRecording ? 40 : 120, 
          backgroundColor: COLORS.card, 
          width: 50, 
          height: 50, 
          borderRadius: 25, 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 9999, 
          elevation: 10, 
          borderWidth: 2, 
          borderColor: COLORS.primary
        }}
        onPress={() => {
          if (locationRef.current) {
            mapRef.current?.animateCamera({ 
              center: { 
                latitude: locationRef.current.latitude, 
                longitude: locationRef.current.longitude 
              }, 
              zoom: 15 
            });
          }
        }}
      >
        <Text style={{fontSize: 24}}>🎯</Text>
      </TouchableOpacity>
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
  planOverlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    width: '90%',
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    maxHeight: '60%',
  },

  planTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchBtnText: {
    color: COLORS.text,
    fontSize: 16,
  },
  searchResultsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    maxHeight: 150,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchResultText: {
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
    fontSize: 12,
  },
  searchAddBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  searchAddBtnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  plannedStopsContainer: {
    marginBottom: 5,
    maxHeight: 120,
  },
  plannedStopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plannedStopText: {
    color: COLORS.secondary,
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  plannedStopRemove: {
    fontSize: 14,
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modalBtnSave: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeOptionsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  routeSummary: {
    marginTop: 5,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  routeSummaryText: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  attachButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  attachButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
