import { useState } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from '../src/components/SearchBar';
import { MaterialIcons } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();

  const handleSearch = (text: string) => {
    router.push({
      pathname: '/resultado',
      params: { modelo: text }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  }
});
