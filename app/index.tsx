import { useState, useCallback } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SearchBar } from '../src/components/SearchBar';
import { MaterialIcons } from '@expo/vector-icons';
import { getTrackedMachines, untrackMachine } from '../src/services/storageService';
import { MachineOilInfo } from '../src/services/geminiService';
import { MachineCard } from '../src/components/MachineCard';

export default function Home() {
  const router = useRouter();
  const [tracked, setTracked] = useState<MachineOilInfo[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrackedMachines().then(setTracked);
    }, [])
  );

  const handleSearch = (text: string) => {
    router.push({
      pathname: '/resultado',
      params: { modelo: text }
    });
  };

  const handleUntrack = async (modelo: string) => {
    await untrackMachine(modelo);
    setTracked(prev => prev.filter(m => m.modelo !== modelo));
  };

  const renderTrackedItem = ({ item }: { item: MachineOilInfo }) => (
    <View style={styles.trackedItemContainer}>
      <MachineCard info={item} />
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleUntrack(item.modelo)}
      >
        <MaterialIcons name="close" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#F9F9F9' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <MaterialIcons name="precision-manufacturing" size={64} color="#BC6C25" />
            <Text style={styles.title}>Encontre sua Máquina</Text>
            <Text style={styles.subtitle}>
              Busque pelo modelo para saber como e quando lubrificar corretamente.
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <SearchBar 
              placeholder="Ex: Singer Heavy Duty 4432..."
              onSearch={handleSearch}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.listSection}>
        {tracked.length > 0 && (
          <>
            <Text style={styles.listTitle}>Minhas Máquinas</Text>
            <FlatList
              data={tracked}
              keyExtractor={item => item.modelo}
              renderItem={renderTrackedItem}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    padding: 24,
    paddingTop: 60, // Safe margin top
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    zIndex: 2,
  },
  listSection: {
    flex: 1,
    padding: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  searchContainer: {
    width: '100%',
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  trackedItemContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#D90429',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
