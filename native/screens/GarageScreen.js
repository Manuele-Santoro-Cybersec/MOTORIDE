import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { getProfile, saveProfile, getGarageLog, saveGarageLog } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function GarageScreen() {
  const [profile, setProfile] = useState(null);
  const [garageLog, setGarageLog] = useState([]);
  const [serviceType, setServiceType] = useState('Washing Bike');
  const [mileage, setMileage] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const p = await getProfile();
        setProfile(p);
        setMileage(p.currentOdometer || '');
        const log = await getGarageLog();
        setGarageLog(log);
      };
      loadData();
    }, [])
  );

  const handleSaveRecord = async () => {
    if (serviceType.trim() === '' || mileage.trim() === '') return;
    
    let newLog = [...garageLog];
    let latestOdometer = profile.currentOdometer || '';
    
    if (editingIndex !== null) {
      newLog[editingIndex] = {
        ...newLog[editingIndex],
        type: serviceType,
        mileage: mileage,
      };
    } else {
      const newRecord = {
        id: Date.now().toString(),
        type: serviceType,
        mileage: mileage,
        date: new Date().toLocaleDateString()
      };
      newLog = [newRecord, ...garageLog];
      
      const insertedMileage = parseFloat(mileage);
      const currentOdo = parseFloat(profile.currentOdometer || '0');
      
      if (!isNaN(insertedMileage) && insertedMileage > currentOdo) {
        latestOdometer = mileage;
        const updatedProfile = { ...profile, currentOdometer: mileage };
        setProfile(updatedProfile);
        await saveProfile(updatedProfile);
      }
    }

    setGarageLog(newLog);
    await saveGarageLog(newLog);
    
    setServiceType('Washing Bike');
    setMileage(latestOdometer);
    setEditingIndex(null);
    Keyboard.dismiss();
  };

  const handleCancelEdit = () => {
    setServiceType('Washing Bike');
    setMileage(profile.currentOdometer || '');
    setEditingIndex(null);
    Keyboard.dismiss();
  };

  const editRecord = (index) => {
    const record = garageLog[index];
    setServiceType(record.type);
    setMileage(record.mileage);
    setEditingIndex(index);
  };

  const deleteRecord = async (index) => {
    const newLog = [...garageLog];
    newLog.splice(index, 1);
    setGarageLog(newLog);
    await saveGarageLog(newLog);
    
    if (editingIndex === index) {
      handleCancelEdit();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
  };

  if (!profile) {
    return (
      <View style={globalStyles.container}>
        <Text style={{ color: COLORS.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Bike Status</Text>
            <Text style={styles.odometerText}>{profile.currentOdometer || '0'} mi</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingIndex !== null ? 'Edit Service Record' : 'Log New Service'}</Text>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={serviceType}
                onValueChange={(itemValue) => setServiceType(itemValue)}
                style={styles.picker}
                itemStyle={{ color: COLORS.text, height: Platform.OS === 'ios' ? 120 : undefined }}
                dropdownIconColor={COLORS.text}
              >
                <Picker.Item label="Washing Bike" value="Washing Bike" />
                <Picker.Item label="Chain Service" value="Chain Service" />
                <Picker.Item label="Chain Cleaning" value="Chain Cleaning" />
                <Picker.Item label="Official Service" value="Official Service" />
                <Picker.Item label="Oil Change" value="Oil Change" />
                <Picker.Item label="Tyre Pressure" value="Tyre Pressure" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Mileage done at"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              value={mileage}
              onChangeText={setMileage}
            />
            
            {editingIndex !== null ? (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={[styles.saveButton, { flex: 1, marginRight: 10 }]} onPress={handleSaveRecord}>
                  <Text style={styles.saveButtonText}>Update Record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={handleCancelEdit}>
                  <Text style={styles.saveButtonText}>Cancel Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecord}>
                <Text style={styles.saveButtonText}>Save Record</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Text style={styles.sectionTitle}>Service History</Text>
      <ScrollView style={styles.historyContainer} keyboardShouldPersistTaps='handled'>
        {garageLog.map((item, index) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyType}>{item.type}</Text>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyMileage}>{item.mileage} mi</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => editRecord(index)} style={styles.actionButton}>
                <Text style={styles.editActionText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRecord(index)} style={styles.actionButton}>
                <Text style={styles.deleteActionText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {garageLog.length === 0 && (
          <Text style={styles.noHistoryText}>No service records yet.</Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  odometerText: {
    color: COLORS.secondary,
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    height: Platform.OS === 'ios' ? 120 : 'auto',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  picker: {
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.border,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 5,
  },
  historyContainer: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  historyMileage: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  editActionText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  deleteActionText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  noHistoryText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20,
  }
});
