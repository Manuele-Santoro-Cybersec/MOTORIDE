import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, saveProfile } from '../utils/storage';

export default function BikerScreen() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      setProfile(data);
      setEditData(data);
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

  return (
    <ScrollView style={styles.container}>
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
              placeholderTextColor="#888"
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
            placeholderTextColor="#888"
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
              placeholderTextColor="#888"
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
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={styles.statusText}>{profile.motExpiry || '--/--/----'}</Text>
        )}
        
        <Text style={styles.statLabel}>Road Tax Expiry</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputSmall} 
            value={editData.taxExpiry} 
            onChangeText={(text) => handleChange('taxExpiry', text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={styles.statusText}>{profile.taxExpiry || '--/--/----'}</Text>
        )}

        <Text style={styles.statLabel}>Insurance Expiry</Text>
        {isEditing ? (
          <TextInput 
            style={styles.inputSmall} 
            value={editData.insExpiry} 
            onChangeText={(text) => handleChange('insExpiry', text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={styles.statusText}>{profile.insExpiry || '--/--/----'}</Text>
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
            <Text style={styles.statValue}>{profile.totalDist} mi</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabelCenter}>Top Speed</Text>
            <Text style={styles.statValue}>{profile.topSpeed} mph</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabelCenter}>Total Rides</Text>
            <Text style={styles.statValue}>{profile.totalRides}</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#FF6B00',
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
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  inputName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 0,
    marginBottom: 2,
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
  inputMount: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 4,
  },
  odometerContainer: {
    marginTop: 15,
  },
  inputSmall: {
    color: '#e0e0e0',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingVertical: 4,
    marginBottom: 6,
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
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  statLabelCenter: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: '#00E5FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
