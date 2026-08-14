import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfile, saveProfile, getRideDiary } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function StatsScreen() {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalDistance: 0,
    topSpeed: 0,
    longestRide: 0
  });

  const [fuel, setFuel] = useState({
    currentLiters: 13,
    maxLiters: 13
  });

  const loadData = async () => {
    const diary = await getRideDiary();
    let tRides = diary.length;
    let tDistance = 0;
    let tTopSpeed = 0;
    let tLongestRide = 0;

    diary.forEach(ride => {
      const dist = parseFloat(ride.distance) || 0;
      const speed = parseFloat(ride.topSpeed) || 0;
      
      tDistance += dist;
      if (speed > tTopSpeed) tTopSpeed = speed;
      if (dist > tLongestRide) tLongestRide = dist;
    });

    setStats({
      totalRides: tRides,
      totalDistance: tDistance.toFixed(1),
      topSpeed: Math.round(tTopSpeed),
      longestRide: tLongestRide.toFixed(1)
    });

    const profile = await getProfile();
    const currentFuel = profile.currentFuel !== undefined ? parseFloat(profile.currentFuel) : 13;
    setFuel(prev => ({ ...prev, currentLiters: currentFuel }));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const fillUp = async () => {
    const profile = await getProfile();
    profile.currentFuel = 13;
    await saveProfile(profile);
    setFuel(prev => ({ ...prev, currentLiters: 13 }));
  };

  const addLiters = async () => {
    let newFuel = fuel.currentLiters + 1;
    if (newFuel > fuel.maxLiters) newFuel = fuel.maxLiters;
    
    const profile = await getProfile();
    profile.currentFuel = newFuel;
    await saveProfile(profile);
    setFuel(prev => ({ ...prev, currentLiters: newFuel }));
  };

  const range = Math.round(fuel.currentLiters * 22);
  const fuelPercentage = (fuel.currentLiters / fuel.maxLiters) * 100;

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Section: Fuel Level */}
      <View style={styles.fuelCard}>
        <View style={styles.fuelHeaderRow}>
          <Text style={styles.fuelTitle}>FUEL LEVEL</Text>
          <Text style={styles.rangeText}>Range: ~{range} mi</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${fuelPercentage}%` }]} />
        </View>

        <View style={styles.fuelButtonsRow}>
          <TouchableOpacity style={styles.addLitersBtn} onPress={addLiters}>
            <Text style={styles.addLitersText}>+ ADD LITERS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.fillUpBtn} onPress={fillUp}>
            <Text style={styles.fillUpText}>FILL UP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statSquare}>
          <Text style={styles.statSquareTitle}>TOTAL RIDES</Text>
          <Text style={styles.statSquareValue}>{stats.totalRides}</Text>
        </View>
        <View style={styles.statSquare}>
          <Text style={styles.statSquareTitle}>TOTAL DISTANCE</Text>
          <Text style={styles.statSquareValue}>{stats.totalDistance} mi</Text>
        </View>
        <View style={styles.statSquare}>
          <Text style={styles.statSquareTitle}>TOP SPEED</Text>
          <Text style={styles.statSquareValue}>{stats.topSpeed} mph</Text>
        </View>
        <View style={styles.statSquare}>
          <Text style={styles.statSquareTitle}>LONGEST RIDE</Text>
          <Text style={styles.statSquareValue}>{stats.longestRide} mi</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  fuelCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  fuelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fuelTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
  },
  fuelButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addLitersBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLitersText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  fillUpBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillUpText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statSquare: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statSquareTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statSquareValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
