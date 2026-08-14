import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Linking, Share, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCustomHubs, saveCustomHubs } from '../utils/storage';
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

export default function HubScreen({ navigation }) {
  const [customHubs, setCustomHubs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newGmaps, setNewGmaps] = useState('');
  const [newCoords, setNewCoords] = useState('');
  const [newDay, setNewDay] = useState(0);

  const handleSaveCustomHub = async () => {
    if (!newTitle.trim() || !newGmaps.trim()) return;
    
    let lat = 0, lon = 0;
    if (newCoords.includes(',')) {
      const parts = newCoords.split(',');
      lat = parseFloat(parts[0].trim());
      lon = parseFloat(parts[1].trim());
    }

    const newHub = {
      title: newTitle,
      distance: newDescription || 'Custom Location', 
      days: [newDay],
      waze: newGmaps, 
      gmaps: newGmaps,
      lat: lat,
      lon: lon
    };

    const updatedCustomHubs = [...customHubs, newHub];
    await saveCustomHubs(updatedCustomHubs);
    setCustomHubs(updatedCustomHubs);
    
    setNewTitle('');
    setNewDescription('');
    setNewGmaps('');
    setNewCoords('');
    setShowForm(false);
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

  const today = new Date().getDay();

  const combinedHubs = [...defaultHubs, ...customHubs];
  
  const sortedHubs = combinedHubs.sort((a, b) => {
    const aActive = a.days.includes(today);
    const bActive = b.days.includes(today);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Smart Hub 🍻</Text>
        <TouchableOpacity style={styles.addHubBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addHubBtnText}>{showForm ? 'Cancel' : '+ Personal Hub'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Personal Hub</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Title (e.g. My Secret Spot)" 
            placeholderTextColor={COLORS.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Description (e.g. Scenic Overlook)" 
            placeholderTextColor={COLORS.textMuted}
            value={newDescription}
            onChangeText={setNewDescription}
          />
          <TextInput 
            style={styles.input} 
            placeholder="G-Maps URL" 
            placeholderTextColor={COLORS.textMuted}
            value={newGmaps}
            onChangeText={setNewGmaps}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Coords (e.g. 51.5, -0.1) Optional" 
            placeholderTextColor={COLORS.textMuted}
            value={newCoords}
            onChangeText={setNewCoords}
          />
          
          <Text style={styles.dayLabel}>Active Day:</Text>
          <View style={styles.daysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.dayBadge, newDay === i && styles.dayBadgeActive]}
                onPress={() => setNewDay(i)}
              >
                <Text style={[styles.dayText, newDay === i && styles.dayTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.saveHubBtn} onPress={handleSaveCustomHub}>
            <Text style={styles.saveHubBtnText}>Save Hub</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {sortedHubs.map((hub, index) => {
        const isActive = hub.days.includes(today);
        const borderColor = isActive ? COLORS.danger : COLORS.secondary;
        const badgeText = isActive ? '🔥 TONIGHT' : 'LOCAL';
        const badgeColor = isActive ? COLORS.danger : (COLORS.warning || COLORS.primary);

        return (
          <View key={index} style={[styles.hubCard, { borderLeftColor: borderColor }]}>
            <View style={styles.hubHeader}>
              <Text style={styles.hubTitle}>{hub.title}</Text>
              <Text style={[styles.badge, { color: badgeColor }]}>{badgeText}</Text>
            </View>
            <Text style={styles.hubDistance}>
              {typeof hub.distance === 'number' ? `${hub.distance} mi away` : hub.distance}
            </Text>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('Ride', { hubToRoute: hub })}
              >
                <Text style={styles.actionButtonText}>Ride</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={() => Share.share({ message: `Join me at ${hub.title} for a ride! Destination: ${hub.gmaps}` })}
              >
                <Text style={styles.shareButtonText}>Share / RSVP</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
    flex: 1,
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
