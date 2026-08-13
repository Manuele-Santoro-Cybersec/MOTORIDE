import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

export default function StatsScreen() {
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [refuels, setRefuels] = useState([]);

  const handleSave = () => {
    if (!liters || !cost) return;
    
    const newRefuel = {
      id: Date.now().toString(),
      liters: parseFloat(liters.replace(',', '.')).toFixed(2),
      cost: parseFloat(cost.replace(',', '.')).toFixed(2),
      date: new Date().toLocaleDateString(),
    };
    
    setRefuels([newRefuel, ...refuels]);
    setLiters('');
    setCost('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.refuelCard}>
      <Text style={styles.refuelText}>📅 {item.date}</Text>
      <Text style={styles.refuelText}>⛽ {item.liters} L</Text>
      <Text style={styles.refuelText}>💸 £{item.cost}</Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <Text style={styles.title}>Stats & Benzina ⛽</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Litri (es. 15.5)"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={liters}
          onChangeText={setLiters}
        />
        <TextInput
          style={styles.input}
          placeholder="Costo £ (es. 20.00)"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={cost}
          onChangeText={setCost}
        />
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SALVA RIFORNIMENTO</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Storico Rifornimenti</Text>
      
      <FlatList
        data={refuels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nessun rifornimento salvato.</Text>
        }
      />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Stile dark
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e63946',
    marginTop: 10,
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2c2c2c',
    color: '#ffffff',
    fontSize: 18,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  saveButton: {
    backgroundColor: '#e63946', // Rosso accattivante/biker
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: {
    paddingBottom: 40,
  },
  refuelCard: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#e63946',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refuelText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontStyle: 'italic',
  }
});
