import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, TouchableWithoutFeedback, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getRideDiary, saveRideDiary } from '../utils/storage';
import { COLORS, globalStyles } from '../constants/theme';

export default function DiaryScreen() {
  const [diary, setDiary] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [distance, setDistance] = useState('');
  const [topSpeed, setTopSpeed] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUris, setImageUris] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const loadDiary = async () => {
      const data = await getRideDiary();
      setDiary(data);
    };
    loadDiary();
  }, []);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImageUris([...imageUris, ...newUris]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImageUris(imageUris.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (title.trim() === '') return;
    
    let newDiary = [...diary];
    
    const formattedDistance = distance ? parseFloat(distance.replace(',', '.')) : 0;
    const formattedTopSpeed = topSpeed ? parseFloat(topSpeed.replace(',', '.')) : 0;
    
    if (editingIndex !== null) {
      newDiary[editingIndex] = {
        ...newDiary[editingIndex],
        title,
        distance: formattedDistance.toString(),
        topSpeed: formattedTopSpeed.toString(),
        notes,
        imageUris
      };
    } else {
      const newRide = {
        id: Date.now().toString(),
        title,
        distance: formattedDistance.toString(),
        topSpeed: formattedTopSpeed.toString(),
        notes,
        date: new Date().toLocaleDateString(),
        type: 'Manual',
        imageUris
      };
      newDiary = [newRide, ...diary];
    }
    
    setDiary(newDiary);
    await saveRideDiary(newDiary);
    
    setTitle('');
    setDistance('');
    setTopSpeed('');
    setNotes('');
    setImageUris([]);
    setEditingIndex(null);
    setShowForm(false);
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    setTitle('');
    setDistance('');
    setTopSpeed('');
    setNotes('');
    setImageUris([]);
    setEditingIndex(null);
    setShowForm(false);
    Keyboard.dismiss();
  };

  const editRide = (index) => {
    const ride = diary[index];
    setTitle(ride.title);
    setDistance(ride.distance || '');
    setTopSpeed(ride.topSpeed || '');
    setNotes(ride.notes || '');
    setImageUris(ride.imageUris || []);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = async (index) => {
    const newDiary = [...diary];
    newDiary.splice(index, 1);
    setDiary(newDiary);
    await saveRideDiary(newDiary);
    
    if (editingIndex === index) {
      handleCancel();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
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
            <Text style={styles.formTitle}>{editingIndex !== null ? 'Edit Ride' : 'Log a Ride'}</Text>
            
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

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
              <Text style={styles.imagePickerButtonText}>📸 Add Photos</Text>
            </TouchableOpacity>

            {imageUris.length > 0 && (
              <ScrollView horizontal style={styles.thumbnailsContainer}>
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.thumbnailWrapper}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                      <Text style={styles.removeImageText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, marginRight: 10 }]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{editingIndex !== null ? 'Update Ride' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={handleCancel}>
                <Text style={styles.saveButtonText}>{editingIndex !== null ? 'Cancel Edit' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      <ScrollView style={styles.listContainer} keyboardShouldPersistTaps='handled'>
        {diary.map((ride, index) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideInfo}>
              <View style={styles.rideTitleRow}>
                <Text style={styles.rideTitle}>{ride.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {(ride.type === 'GPS' || ride.type === '📍 GPS') ? '📍 GPS' : '✍️ Manual'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.rideDate}>{ride.date}</Text>

              {ride.imageUris && ride.imageUris.length > 0 && (
                <ScrollView horizontal style={styles.galleryContainer} showsHorizontalScrollIndicator={false}>
                  {ride.imageUris.map((uri, imgIndex) => (
                    <Image key={imgIndex} source={{ uri }} style={styles.galleryImage} />
                  ))}
                </ScrollView>
              )}
              
              <View style={styles.statsRow}>
                {ride.distance ? <Text style={styles.rideStat}>Distance: {ride.distance} mi</Text> : null}
                {ride.topSpeed ? <Text style={styles.rideStat}>Top Speed: {ride.topSpeed} mph</Text> : null}
              </View>
              
              {ride.stops && ride.stops.length > 0 ? (
                <Text style={styles.rideStopsCount}>🚏 {ride.stops.length} stop{ride.stops.length > 1 ? 's' : ''}</Text>
              ) : null}
              
              {ride.notes ? <Text style={styles.rideNotes}>{ride.notes}</Text> : null}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => editRide(index)} style={styles.actionButton}>
                <Text style={styles.editActionText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(index)} style={styles.actionButton}>
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
  imagePickerButton: {
    backgroundColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  thumbnailsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
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
  rideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  rideTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  badge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  rideDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  galleryContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 10,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
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
  rideStopsCount: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
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
