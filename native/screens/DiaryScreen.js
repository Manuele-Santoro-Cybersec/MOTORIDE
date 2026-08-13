import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { getRideDiary, saveRideDiary } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function DiaryScreen() {
  const [diary, setDiary] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [topSpeed, setTopSpeed] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadDiary = async () => {
      const data = await getRideDiary();
      setDiary(data);
    };
    loadDiary();
  }, []);

  const handleSave = async () => {
    if (title.trim() === '') return;
    const newRide = {
      id: Date.now().toString(),
      title,
      distance,
      topSpeed,
      notes,
      date: new Date().toLocaleDateString()
    };
    const newDiary = [newRide, ...diary];
    setDiary(newDiary);
    await saveRideDiary(newDiary);
    
    setTitle('');
    setDistance('');
    setTopSpeed('');
    setNotes('');
    setShowForm(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setTitle('');
    setDistance('');
    setTopSpeed('');
    setNotes('');
    setShowForm(false);
    Keyboard.dismiss();
  };

  const handleDelete = async (id) => {
    const newDiary = diary.filter(ride => ride.id !== id);
    setDiary(newDiary);
    await saveRideDiary(newDiary);
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride Diary</Text>
      </View>

      {!showForm && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>Add Manual Ride</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log a Ride</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ride Title"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Distance (mi)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              value={distance}
              onChangeText={setDistance}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Top Speed (mph)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              returnKeyType="done"
              value={topSpeed}
              onChangeText={setTopSpeed}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, marginRight: 10 }]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={handleCancel}>
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      <ScrollView style={styles.listContainer} keyboardShouldPersistTaps='handled'>
        {diary.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideTitle}>{ride.title}</Text>
              <Text style={styles.rideDate}>{ride.date}</Text>
              
              <View style={styles.statsRow}>
                {ride.distance ? <Text style={styles.rideStat}>Distance: {ride.distance} mi</Text> : null}
                {ride.topSpeed ? <Text style={styles.rideStat}>Top Speed: {ride.topSpeed} mph</Text> : null}
              </View>
              
              {ride.notes ? <Text style={styles.rideNotes}>{ride.notes}</Text> : null}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => handleDelete(ride.id)} style={styles.deleteButton}>
                <Text style={styles.deleteActionText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {diary.length === 0 && !showForm && (
          <Text style={styles.noHistoryText}>No rides logged yet.</Text>
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
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  },
  cancelButton: {
    backgroundColor: COLORS.border,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rideCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  rideInfo: {
    flex: 1,
    marginRight: 10,
  },
  rideTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rideDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  rideStat: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 15,
  },
  rideNotes: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
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
