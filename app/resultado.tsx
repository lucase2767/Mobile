import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMachineOilInfo, MachineOilInfo } from '../src/services/geminiService';
import { searchMachineInApi, saveMachineToApi } from '../src/services/apiService';
import { loadOilInfo, saveOilInfo, trackMachine } from '../src/services/storageService';
import { MachineCard } from '../src/components/MachineCard';
import { MaterialIcons } from '@expo/vector-icons';

export default function Resultado() {
  const { modelo } = useLocalSearchParams<{ modelo: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infos, setInfos] = useState<MachineOilInfo[]>([]);
  const [source, setSource] = useState<'cache' | 'api' | 'gemini' | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      if (!modelo) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 1. Tentar ler do cache
        const cached = await loadOilInfo(modelo);
        if (cached) {
          setInfos([cached]);
          setSource('cache');
          setLoading(false);
          return;
        }

        // 2. Se não tem no cache, chama a API
        const apiData = await searchMachineInApi(modelo.trim());
        if (apiData && apiData.length > 0) {
          setInfos(apiData);
          setSource('api');
          // Salva o primeiro no cache para consultas diretas futuras se for exatamente o modelo
          await saveOilInfo(apiData[0].modelo, apiData[0]);
          setLoading(false);
          return;
        }
        
        // 3. Se a API retornou null (não encontrou), chama o Gemini
        const geminiData = await getMachineOilInfo(modelo.trim());
        if (geminiData && geminiData.length > 0) {
          setInfos(geminiData);
          setSource('gemini');
          
          // Salva no cache e na API em background
          geminiData.forEach(async (m) => {
            await saveOilInfo(m.modelo, m);
            await saveMachineToApi(m);
          });
          return;
        }

        throw new Error('Nenhuma máquina encontrada.');
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocorreu um erro ao buscar os dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchInfo();
  }, [modelo]);

  const handleTrackMachine = async (info: MachineOilInfo) => {
    await trackMachine(info.modelo);
    // Salvar no cache também para garantir que estará disponível offline
    await saveOilInfo(info.modelo, info);
    router.push({
      pathname: '/calendario',
      params: { infoString: JSON.stringify(info) }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#BC6C25" />
        <Text style={styles.loadingText}>Buscando resultados para {modelo}...</Text>
      </View>
    );
  }

  if (error || infos.length === 0) {
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
      {source && (
        <View style={styles.badgeContainer}>
          {source === 'cache' && <Text style={styles.badgeText}>📦 Cache local</Text>}
          {source === 'api' && <Text style={styles.badgeText}>🌐 Banco de dados</Text>}
          {source === 'gemini' && <Text style={styles.badgeText}>✨ Gerado por IA</Text>}
        </View>
      )}

      {infos.map((info, index) => (
        <View key={index} style={styles.cardWrapper}>
          <MachineCard info={info} />
          
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => handleTrackMachine(info)}
          >
            <MaterialIcons name="event" size={24} color="#FFF" />
            <Text style={styles.calendarButtonText}>Ver datas de lubrificação</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
    backgroundColor: '#F9F9F9',
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
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeText: {
    backgroundColor: '#E9EDC9',
    color: '#606C38',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  cardWrapper: {
    marginBottom: 32,
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
