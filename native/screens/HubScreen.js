import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Share, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCustomHubs, saveCustomHubs, getProfile } from '../utils/storage';
import * as DocumentPicker from 'expo-document-picker';
function getDistanceFromLatLonInMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  var R = 3958.8; // Radius of the earth in miles
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
import { COLORS, globalStyles } from '../constants/theme';

const defaultHubs = [
  {
    title: "The Queen's Head",
    distance: 8.5,
    days: [],
    waze: "https://waze.com/ul?q=The%20Queen%27s%20Head",
    gmaps: "https://maps.google.com/?q=The+Queen's+Head",
    lat: 51.4958,
    lon: -0.2207
  },
  {
    title: "Pinewood Cafe",
    distance: 12.0,
    days: [2, 5],
    waze: "https://waze.com/ul?q=Pinewood%20Cafe",
    gmaps: "https://maps.google.com/?q=Pinewood+Cafe",
    lat: 51.3853,
    lon: -0.7850
  },
  {
    title: "Ryka's Cafe",
    distance: 38.0,
    days: [3],
    waze: "https://waze.com/ul?q=Ryka%27s%20Cafe",
    gmaps: "https://maps.google.com/?q=Ryka's+Cafe",
    lat: 51.2555,
    lon: -0.3223
  },
  {
    title: "H Cafe Run",
    distance: 18.5,
    days: [1],
    waze: "https://waze.com/ul?q=H%20Cafe",
    gmaps: "https://maps.google.com/?q=H+Cafe",
    lat: 51.6584,
    lon: -1.1760
  }
];

export default function HubScreen({ route, navigation }) {
  const [customHubs, setCustomHubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartLoc, setNewStartLoc] = useState('');
  const [newDestName, setNewDestName] = useState('');
  const [newDepartureTime, setNewDepartureTime] = useState('');
  const [newDays, setNewDays] = useState([]);
  const [editingHubId, setEditingHubId] = useState(null);
  const [newIsSavedRoute, setNewIsSavedRoute] = useState(false);
  const [expandedHubId, setExpandedHubId] = useState(null);

  useEffect(() => {
    if (route?.params?.prefillHub) {
      setNewTitle(route.params.prefillHub.title || '');
      setNewStartLoc(route.params.prefillHub.startLoc || '');
      setNewDestName(route.params.prefillHub.destName || '');
      setNewIsSavedRoute(!!route.params.prefillHub.isSavedRoute);
      setShowForm(true);
      navigation.setParams({ prefillHub: undefined });
    }
  }, [route?.params?.prefillHub]);

  const handleSaveCustomHub = async () => {
    if (!newTitle.trim()) return;

    let updatedCustomHubs;

    if (editingHubId) {
      updatedCustomHubs = customHubs.map(h => 
        h.id === editingHubId 
          ? { ...h, title: newTitle, startLoc: newStartLoc, destName: newDestName || h.destName, departureTime: newDepartureTime, days: newDays, isSavedRoute: newIsSavedRoute } 
          : h
      );
    } else {
      const newHub = {
        id: Date.now().toString(),
        title: newTitle,
        startLoc: newStartLoc, 
        destName: newDestName || null,
        departureTime: newDepartureTime || null,
        days: newDays,
        lat: null,
        lon: null,
        isCustom: true,
        isSavedRoute: newIsSavedRoute
      };
      updatedCustomHubs = [...customHubs, newHub];
    }

    await saveCustomHubs(updatedCustomHubs);
    setCustomHubs(updatedCustomHubs);
    
    setNewTitle('');
    setNewStartLoc('');
    setNewDestName('');
    setNewDepartureTime('');
    setNewDays([]);
    setEditingHubId(null);
    setShowForm(false);
    setNewIsSavedRoute(false);
  };

  const handleEditCustomHub = (hub) => {
    setNewTitle(hub.title);
    setNewStartLoc(hub.startLoc);
    setNewDestName(hub.destName || '');
    setNewDepartureTime(hub.departureTime || '');
    setNewDays(hub.days || []);
    setNewIsSavedRoute(!!hub.isSavedRoute);
    setEditingHubId(hub.id);
    setShowForm(true);
  };

  const handleDeleteCustomHub = (id) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const updated = customHubs.filter(h => h.id !== id);
          await saveCustomHubs(updated);
          setCustomHubs(updated);
        }
      }
    ]);
  };

  const handleImportGPX = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      
      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const fileText = await response.text();

      const tagsMatch = fileText.match(/<(?:trkpt|wpt)[^>]+>/g) || [];
      const extractedWaypoints = [];
      tagsMatch.forEach(tag => {
        const latMatch = tag.match(/lat="([^"]+)"/);
        const lonMatch = tag.match(/lon="([^"]+)"/);
        if (latMatch && lonMatch) {
          extractedWaypoints.push({ lat: parseFloat(latMatch[1]), lon: parseFloat(lonMatch[1]) });
        }
      });

      if (extractedWaypoints.length > 0) {
        const newHub = {
          id: Date.now().toString(),
          title: 'Imported GPX Route',
          isSavedRoute: true,
          isCustom: true,
          waypoints: extractedWaypoints,
          days: [],
          startLoc: 'Imported Start',
          destName: 'Imported End'
        };
        const updatedCustomHubs = [...customHubs, newHub];
        await saveCustomHubs(updatedCustomHubs);
        setCustomHubs(updatedCustomHubs);
        Alert.alert('Success', `Imported GPX route with ${extractedWaypoints.length} waypoints!`);
      } else {
        Alert.alert('Notice', 'No waypoints found in the selected GPX file.');
      }
      
    } catch (error) {
      console.error("Error importing GPX: ", error);
      Alert.alert('Error', 'Failed to import GPX file.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadHubs = async () => {
        const hubs = await getCustomHubs();
        setCustomHubs(hubs);
      };
      loadHubs();
    }, [])
  );

  const handleShare = async (hub) => {
    let safeStartLoc = hub.startLoc || 'See App';
    if (hub.lat && hub.lon) {
      const profile = await getProfile();
      if (profile && profile.homeLat && profile.homeLon) {
        const dist = getDistanceFromLatLonInMiles(hub.lat, hub.lon, profile.homeLat, profile.homeLon);
        if (dist < 1) {
          safeStartLoc = '🔒 Secure Start Point (Location Hidden)';
        }
      }
    }
    
    Share.share({ 
      message: `🏍️ *RIDE CALL: ${hub.title}*\n⏰ *Departure:* ${hub.departureTime || 'TBD'}\n📍 *Start:* ${safeStartLoc}\n🏁 *Destination:* ${hub.destName || 'TBD'}\n\nRSVP: Reply with 👍 if you are in!` 
    });
  };

  const today = new Date().getDay();

  const sortedDefaultHubs = [...defaultHubs].sort((a, b) => {
    const aActive = a.days.includes(today);
    const bActive = b.days.includes(today);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  const sortedCustomHubs = [...customHubs].sort((a, b) => {
    const aActive = a.days.includes(today);
    const bActive = b.days.includes(today);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  const renderHubCard = (hub, index) => {
    const isActive = hub.days.includes(today);
    const borderColor = isActive ? COLORS.danger : COLORS.secondary;
    const badgeText = isActive ? '🔥 TONIGHT' : 'LOCAL';
    const badgeColor = isActive ? COLORS.danger : (COLORS.warning || COLORS.primary);

    return (
      <View key={`${hub.id || hub.title}-${index}`} style={[styles.hubCard, { borderLeftColor: borderColor }]}>
        <View style={styles.hubHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <Text style={styles.hubTitle}>{hub.title}</Text>
            <Text style={[styles.badge, { color: badgeColor }]}>{badgeText}</Text>
          </View>
          {hub.isCustom && (
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={() => handleEditCustomHub(hub)} style={{marginRight: 10}}>
                <Text style={{fontSize: 16}}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCustomHub(hub.id)}>
                <Text style={{fontSize: 16}}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.hubDistance}>
          {hub.isCustom ? `Start: ${hub.startLoc}` : `${hub.distance} mi away`}
        </Text>
        
        {hub.waypoints && hub.waypoints.length > 0 && (
          <>
            <TouchableOpacity 
              style={{ marginTop: 5, marginBottom: 10 }}
              onPress={() => setExpandedHubId(expandedHubId === hub.id ? null : hub.id)}
            >
              <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                🚏 {hub.waypoints.length} Stops {expandedHubId === hub.id ? '(Hide)' : '(Tap to view)'}
              </Text>
            </TouchableOpacity>
            
            {expandedHubId === hub.id && (
              <View style={{ backgroundColor: COLORS.background, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                {hub.waypoints.map((wp, i) => (
                  <Text key={i} numberOfLines={1} style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>
                    {i + 1}. {wp.label}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.actionRow}>
          {hub.isCustom && !hub.lat ? (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('Ride', { attachToHubId: hub.id })}
            >
              <Text style={styles.actionButtonText}>📍 Plan Route</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('Ride', { hubToRoute: hub })}
            >
              <Text style={styles.actionButtonText}>Ride</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => handleShare(hub)}
          >
            <Text style={styles.shareButtonText}>Share / RSVP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Smart Hub 🍻</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity style={styles.addHubBtn} onPress={handleImportGPX}>
            <Text style={styles.addHubBtnText}>📂 Import GPX</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addHubBtn} onPress={() => {
            if (showForm) {
              setEditingHubId(null);
              setNewTitle('');
              setNewStartLoc('');
              setNewDestName('');
              setNewDepartureTime('');
              setNewDays([]);
              setNewIsSavedRoute(false);
            }
            setShowForm(!showForm);
          }}>
            <Text style={styles.addHubBtnText}>{showForm ? 'Cancel' : '+ Personal Hub'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingHubId 
              ? (newIsSavedRoute ? 'Edit Saved Route' : 'Edit Personal Hub') 
              : (newIsSavedRoute ? 'Add Saved Route' : 'Add Personal Hub')}
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder="Title (e.g. My Secret Spot)" 
            placeholderTextColor={COLORS.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Start Location (e.g. Central Square)" 
            placeholderTextColor={COLORS.textMuted}
            value={newStartLoc}
            onChangeText={setNewStartLoc}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Destination (Optional)" 
            placeholderTextColor={COLORS.textMuted}
            value={newDestName}
            onChangeText={setNewDestName}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Departure Time (e.g. 10:00 AM)" 
            placeholderTextColor={COLORS.textMuted}
            value={newDepartureTime}
            onChangeText={setNewDepartureTime}
          />
          
          <Text style={styles.dayLabel}>Active Days:</Text>
          <View style={styles.daysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.dayBadge, newDays.includes(i) && styles.dayBadgeActive]}
                onPress={() => {
                  if (newDays.includes(i)) {
                    setNewDays(newDays.filter(d => d !== i));
                  } else {
                    setNewDays([...newDays, i]);
                  }
                }}
              >
                <Text style={[styles.dayText, newDays.includes(i) && styles.dayTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.saveHubBtn} onPress={handleSaveCustomHub}>
            <Text style={styles.saveHubBtnText}>Save Hub</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {sortedDefaultHubs.map(renderHubCard)}
      
      <Text style={{color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10}}>My Custom Routes</Text>
      
      {sortedCustomHubs.map(renderHubCard)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addHubBtn: {
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addHubBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayLabel: {
    color: COLORS.textMuted,
    marginBottom: 8,
    fontSize: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayBadge: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayTextActive: {
    color: COLORS.background,
  },
  saveHubBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveHubBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  hubCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  hubTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 10,
  },
  hubDistance: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1.5,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
