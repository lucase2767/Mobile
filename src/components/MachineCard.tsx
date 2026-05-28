import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MachineOilInfo } from '../services/geminiService';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  info: MachineOilInfo;
}

export function MachineCard({ info }: Props) {
  return (
    <View style={styles.card}>
      {info.imageUrl ? (
        <Image 
          source={info.imageUrl} 
          style={styles.image} 
          contentFit="cover"
          accessibilityLabel={`Imagem de ${info.modelo}`}
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="precision-manufacturing" size={60} color="#D4A373" />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{info.modelo}</Text>
        
        <View style={styles.badge}>
          <MaterialIcons name="water-drop" size={16} color="#FFF" />
          <Text style={styles.badgeText}>{info.tipoOleo}</Text>
        </View>

        <Text style={styles.sectionTitle}>Pontos de Lubrificação:</Text>
        {info.pontosOleo.map((ponto, index) => (
          <View key={index} style={styles.pointRow}>
            <MaterialIcons name="check-circle" size={16} color="#BC6C25" />
            <Text style={styles.pointText}>{ponto}</Text>
          </View>
        ))}

        {!!info.observacoes && (
          <Text style={styles.observacoes}>{info.observacoes}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
  },
  placeholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#FEFAE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BC6C25',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pointText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  observacoes: {
    marginTop: 16,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  }
});
