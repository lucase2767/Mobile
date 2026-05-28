import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMachineOilInfo, MachineOilInfo } from '../src/services/geminiService';
import { loadOilInfo, saveOilInfo } from '../src/services/storageService';
import { MachineCard } from '../src/components/MachineCard';
import { MaterialIcons } from '@expo/vector-icons';

export default function Resultado() {
  const { modelo } = useLocalSearchParams<{ modelo: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<MachineOilInfo | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      if (!modelo) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 1. Tentar ler do cache
        const cached = await loadOilInfo(modelo);
        if (cached) {
          setInfo(cached);
          setLoading(false);
          return;
        }

        // 2. Se não tem no cache, chama a API
        const data = await getMachineOilInfo(modelo);
        setInfo(data);
        
        // 3. Salva no cache criptografado
        await saveOilInfo(modelo, data);
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocorreu um erro ao buscar os dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchInfo();
  }, [modelo]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#BC6C25" />
        <Text style={styles.loadingText}>Analisando {modelo}...</Text>
      </View>
    );
  }

  if (error || !info) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={60} color="#D4A373" />
        <Text style={styles.errorTitle}>Ops!</Text>
        <Text style={styles.errorText}>{error || 'Não foi possível encontrar informações.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MachineCard info={info} />
      
      <TouchableOpacity 
        style={styles.calendarButton}
        onPress={() => router.push({
          pathname: '/calendario',
          params: { infoString: JSON.stringify(info) }
        })}
      >
        <MaterialIcons name="event" size={24} color="#FFF" />
        <Text style={styles.calendarButtonText}>Ver datas de lubrificação</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#BC6C25',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4A373',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  calendarButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});
