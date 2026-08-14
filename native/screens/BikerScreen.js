import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getProfile, saveProfile } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';
import { UK_BIKES } from '../constants/bikes';

export default function BikerScreen() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [bikeModalVisible, setBikeModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const data = await getProfile();
        setProfile(data);
        setEditData(data);
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
      let finalData = { ...editData };
      if (finalData.homeBase && !finalData.homeLat) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalData.homeBase)}&limit=1`, {
            headers: { 'User-Agent': 'MotorideApp/1.0' }
          });
          const geodata = await response.json();
          if (geodata && geodata.length > 0) {
            finalData.homeLat = parseFloat(geodata[0].lat);
            finalData.homeLon = parseFloat(geodata[0].lon);
          }
        } catch (e) {
          console.log('Forward geocoding failed', e);
        }
      }
      await saveProfile(finalData);
      setProfile(finalData);
    } else {
      setEditData(profile);
      const matchIndex = UK_BIKES.findIndex(b => `${b.make} ${b.model}` === profile.bike);
      if (matchIndex !== -1) {
        setEditData(prev => ({ ...prev, bikePicker: matchIndex.toString() }));
      } else {
        setEditData(prev => ({ ...prev, bikePicker: 'Other' }));
      }
    }
    setIsEditing(!isEditing);
  };

  const handleBikeChange = (itemValue) => {
    if (itemValue === 'Other') {
      setEditData({ ...editData, bikePicker: 'Other', bike: '', mpg: '', tank: '' });
    } else {
      const selected = UK_BIKES[parseInt(itemValue)];
      if (selected) {
        setEditData({ 
          ...editData, 
          bikePicker: itemValue,
          bike: `${selected.make} ${selected.model}`, 
          mpg: selected.avgMpg.toString(), 
          tank: selected.tankLiters.toString() 
        });
      }
    }
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
    if (field === 'homeBase') {
      setEditData({ ...editData, [field]: value, homeLat: null, homeLon: null });
    } else {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`, {
        headers: {
          'User-Agent': 'MotorideApp/1.0'
        }
      });
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown Location';
      setEditData({ 
        ...editData, 
        homeBase: city, 
        homeLat: loc.coords.latitude, 
        homeLon: loc.coords.longitude 
      });
    } catch (e) {
      alert('Could not fetch location via Nominatim');
    }
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
    let text = `Valid (${days}d)`;

    if (days < 0) {
      color = COLORS.danger; // danger
      text = 'EXPIRED';
    } else if (days <= 30) {
      color = COLORS.primary; // warning
      text = `Expiring (${days}d)`;
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
        <Text style={styles.cardTitle}>🏠 Home Base / Start Loc</Text>
        {isEditing ? (
          <View>
            <TextInput 
              style={styles.inputMount} 
              value={editData.homeBase} 
              onChangeText={(text) => handleChange('homeBase', text)}
              placeholder="City, Area or Postcode"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={styles.locationBtn} onPress={handleUseCurrentLocation}>
              <Text style={styles.locationBtnText}>📍 Use Current Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.mountText}>{profile.homeBase || 'Not set'}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏍️ Current Mount</Text>
        {isEditing ? (
          <View>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.background, borderRadius: 8, marginBottom: 10, padding: 15 }}
              onPress={() => setBikeModalVisible(true)}
            >
              <Text style={{ color: COLORS.text }}>
                {editData.bikePicker === 'Other' 
                  ? 'Other / Not Listed' 
                  : (editData.bikePicker ? `${UK_BIKES[parseInt(editData.bikePicker)]?.make} ${UK_BIKES[parseInt(editData.bikePicker)]?.model}` : 'Select a bike...')}
              </Text>
            </TouchableOpacity>
            {editData.bikePicker === 'Other' && (
              <TextInput 
                style={styles.inputMount} 
                value={editData.bike} 
                onChangeText={(text) => handleChange('bike', text)}
                placeholder="Make and Model"
                placeholderTextColor={COLORS.textMuted}
              />
            )}
          </View>
        ) : (
          <Text style={styles.mountText}>{profile.bike || 'Not set'}</Text>
        )}
        
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 15}}>
          <View style={{flex: 1, marginRight: 10}}>
            <Text style={styles.statLabel}>Avg MPG</Text>
            {isEditing ? (
              <TextInput 
                style={styles.inputSmall} 
                value={editData.mpg} 
                onChangeText={(text) => handleChange('mpg', text)}
                keyboardType="numeric"
                placeholder="22"
                placeholderTextColor={COLORS.textMuted}
              />
            ) : (
              <Text style={styles.statusText}>{profile.mpg || '22'}</Text>
            )}
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.statLabel}>Tank Size (L)</Text>
            {isEditing ? (
              <TextInput 
                style={styles.inputSmall} 
                value={editData.tank} 
                onChangeText={(text) => handleChange('tank', text)}
                keyboardType="numeric"
                placeholder="13"
                placeholderTextColor={COLORS.textMuted}
              />
            ) : (
              <Text style={styles.statusText}>{profile.tank || '13'}</Text>
            )}
          </View>
        </View>

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

      <View style={{ height: 40 }} />

      <Modal visible={bikeModalVisible} transparent={true} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: COLORS.card, padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Select a Mount</Text>
            <ScrollView>
              {UK_BIKES.map((b, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                  onPress={() => {
                    handleBikeChange(i.toString());
                    setBikeModalVisible(false);
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 16 }}>{`${b.make} ${b.model}`}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={{ paddingVertical: 15 }}
                onPress={() => {
                  handleBikeChange('Other');
                  setBikeModalVisible(false);
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 16 }}>Other / Not Listed</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity 
              style={{ marginTop: 15, backgroundColor: COLORS.background, padding: 15, borderRadius: 8, alignItems: 'center' }}
              onPress={() => setBikeModalVisible(false)}
            >
              <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  locationBtn: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  locationBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
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
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
});
