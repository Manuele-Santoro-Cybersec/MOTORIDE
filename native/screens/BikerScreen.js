import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { getProfile } from '../utils/storage';

export default function BikerScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      setProfile(data);
    };
    loadProfile();
  }, []);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#ffffff' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subText}>Rider ID: {profile.riderId}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏍️ Current Mount</Text>
        <Text style={styles.mountText}>{profile.bike}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🪪 Licence Status</Text>
        <Text style={styles.statusText}>CBT: {profile.cbt}</Text>
        <Text style={styles.statusText}>Theory Test: {profile.theory}</Text>
        <Text style={styles.statusText}>Full Cat A: {profile.catA}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Lifetime Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Total Dist</Text>
            <Text style={styles.statValue}>{profile.totalDist} mi</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Top Speed</Text>
            <Text style={styles.statValue}>{profile.topSpeed} mph</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Total Rides</Text>
            <Text style={styles.statValue}>{profile.totalRides}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B00',
    marginRight: 20,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subText: {
    color: '#e0e0e0',
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
    borderLeftWidth: 4,
    borderLeftColor: '#00E5FF',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mountText: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '700',
  },
  statusText: {
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#e0e0e0',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
