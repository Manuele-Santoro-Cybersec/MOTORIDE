import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, saveProfile, getRideDiary } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function BikerScreen() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({ totalDist: 0, topSpeed: 0, totalRides: 0 });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await getProfile();
        setProfile(data);
        setEditData(data);
        
        const diaryData = await getRideDiary();
        let totalDist = 0;
        let topSpeed = 0;
        
        diaryData.forEach(ride => {
          const dist = parseFloat(ride.distance) || 0;
          const speed = parseFloat(ride.topSpeed) || 0;
          totalDist += dist;
          if (speed > topSpeed) {
            topSpeed = speed;
          }
        });
        
        setStats({
          totalRides: diaryData.length,
          totalDist: parseFloat(totalDist.toFixed(1)),
          topSpeed: topSpeed
        });
      };
      loadData();
    }, [])
  );

  if (!profile) {
    return (
      <View style={globalStyles.container}>
        <Text style={{ color: COLORS.text }}>Loading...</Text>
      </View>
    );
  }

  const handleEditToggle = async () => {
    if (isEditing) {
      await saveProfile(editData);
      setProfile(editData);
    } else {
      setEditData(profile);
    }
    setIsEditing(!isEditing);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditData({ ...editData, avatarUri: result.assets[0].uri });
    }
  };

  const handleChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const expiry = new Date(parts[2], parts[1] - 1, parts[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const renderExpiryStatus = (dateString) => {
    if (!dateString || dateString.trim() === '') return <Text style={styles.statusText}>--/--/----</Text>;
    const days = getDaysRemaining(dateString);
    if (days === null || isNaN(days)) return <Text style={styles.statusText}>{dateString}</Text>;

    let color = COLORS.success; // success
    let text = `Valido (${days}g)`;

    if (days < 0) {
      color = COLORS.danger; // danger
      text = 'SCADUTO';
    } else if (days <= 30) {
      color = COLORS.primary; // warning
      text = `In scadenza (${days}g)`;
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 16, marginRight: 8 }}>{dateString}</Text>
        <Text style={{ color, fontSize: 14, fontWeight: 'bold' }}>{text}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={globalStyles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
          <Text style={styles.editButtonText}>{isEditing ? 'Save Profile' : 'Edit Profile'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        {isEditing ? (
          <TouchableOpacity style={styles.avatar} onPress={pickImage}>
            {editData.avatarUri ? (
              <Image source={{ uri: editData.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.avatar}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : null}
          </View>
        )}
        
        <View style={styles.headerTextContainer}>
          {isEditing ? (
            <TextInput 
              style={styles.inputName} 
              value={editData.name} 
              onChangeText={(text) => handleChange('name', text)}
              placeholder="Name"
              placeholderTextColor={COLORS.textMuted}
            />
          ) : (
            <Text style={styles.name}>{profile.name}</Text>
          )}
          <Text style={styles.subText}>Rider ID: {profile.riderId}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏍️ Current Mount</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputMount} 
            value={editData.bike} 
            onChangeText={(text) => handleChange('bike', text)}
            placeholder="Bike Model"
            placeholderTextColor={COLORS.textMuted}
          />
        ) : (
          <Text style={styles.mountText}>{profile.bike}</Text>
        )}
        
        <View style={styles.odometerContainer}>
          <Text style={styles.statLabel}>Current Odometer (mi)</Text>
          {isEditing ? (
            <TextInput 
              style={styles.inputSmall} 
              value={editData.currentOdometer} 
              onChangeText={(text) => handleChange('currentOdometer', text)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
            />
          ) : (
            <Text style={styles.statusText}>{profile.currentOdometer || '0'}</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📄 Document Expiry</Text>
        <Text style={styles.statLabel}>MOT Expiry</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputSmall} 
            value={editData.motExpiry} 
            onChangeText={(text) => handleChange('motExpiry', text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textMuted}
          />
        ) : (
          renderExpiryStatus(profile.motExpiry)
        )}
        
        <Text style={styles.statLabel}>Road Tax Expiry</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputSmall} 
            value={editData.taxExpiry} 
            onChangeText={(text) => handleChange('taxExpiry', text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textMuted}
          />
        ) : (
          renderExpiryStatus(profile.taxExpiry)
        )}

        <Text style={styles.statLabel}>Insurance Expiry</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputSmall} 
            value={editData.insExpiry} 
            onChangeText={(text) => handleChange('insExpiry', text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textMuted}
          />
        ) : (
          renderExpiryStatus(profile.insExpiry)
        )}
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
            <Text style={styles.statLabelCenter}>Total Dist</Text>
            <Text style={styles.statValue}>{stats.totalDist} mi</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabelCenter}>Top Speed</Text>
            <Text style={styles.statValue}>{stats.topSpeed} mph</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabelCenter}>Total Rides</Text>
            <Text style={styles.statValue}>{stats.totalRides}</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    marginRight: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  inputName: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 0,
    marginBottom: 2,
  },
  subText: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mountText: {
    color: COLORS.secondary,
    fontSize: 22,
    fontWeight: '700',
  },
  inputMount: {
    color: COLORS.secondary,
    fontSize: 22,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
  },
  odometerContainer: {
    marginTop: 15,
  },
  inputSmall: {
    color: COLORS.textMuted,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
    marginBottom: 6,
  },
  statusText: {
    color: COLORS.textMuted,
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
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statLabelCenter: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
