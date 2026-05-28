import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addOilReminder } from '../services/calendarService';

interface Props {
  date: Date;
  index: number;
  modelName: string;
  pontosOleo: string[];
}

export function OilDateCard({ date, index, modelName, pontosOleo }: Props) {
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleAddCalendar = async () => {
    await addOilReminder(date, modelName, pontosOleo);
  };

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.label}>{index + 1}ª lubrificação</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleAddCalendar}
        accessibilityRole="button"
        accessibilityLabel={`Adicionar lembrete para ${formattedDate} ao calendário`}
      >
        <MaterialIcons name="calendar-today" size={20} color="#FFF" />
        <Text style={styles.buttonText}>Google Calendar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#BC6C25',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BC6C25',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  }
});
