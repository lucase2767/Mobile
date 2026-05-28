import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MachineOilInfo } from '../src/services/geminiService';
import { OilDateCard } from '../src/components/OilDateCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from 'react-native';

export default function Calendario() {
  const { infoString } = useLocalSearchParams<{ infoString: string }>();
  
  const [lastDate, setLastDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  let info: MachineOilInfo;
  try {
    info = JSON.parse(infoString as string);
  } catch (e) {
    return <View style={styles.center}><Text>Erro ao carregar dados.</Text></View>;
  }

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setLastDate(selectedDate);
    }
  };

  // Calcular as próximas 4 datas
  const futureDates = [];
  const intervalMonths = info.intervaloMeses || 3; // fallback 3 meses

  for (let i = 1; i <= 4; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + (intervalMonths * i));
    futureDates.push(nextDate);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{info.modelo}</Text>
      <Text style={styles.headerSubtitle}>Intervalo recomendado: {info.intervaloMeses} meses</Text>

      <View style={styles.pickerSection}>
        <Text style={styles.pickerLabel}>Data da última lubrificação:</Text>
        
        {Platform.OS === 'android' ? (
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {lastDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        ) : null}

        {(showPicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={lastDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            maximumDate={new Date()}
            style={styles.datePicker}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>Próximas lubrificações:</Text>

      <View style={styles.list}>
        {futureDates.map((date, index) => (
          <OilDateCard 
            key={index}
            date={date}
            index={index}
            modelName={info.modelo}
            pontosOleo={info.pontosOleo}
          />
        ))}
      </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  pickerSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  datePicker: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  }
});
