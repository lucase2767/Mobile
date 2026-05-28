import AsyncStorage from '@react-native-async-storage/async-storage';
import { encrypt, decrypt } from '../utils/crypto';
import { MachineOilInfo } from './geminiService';

function sanitize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export async function saveOilInfo(modelName: string, data: MachineOilInfo): Promise<void> {
  const key = `machine_${sanitize(modelName)}`;
  const encrypted = encrypt(data);
  await AsyncStorage.setItem(key, encrypted);
}

export async function loadOilInfo(modelName: string): Promise<MachineOilInfo | null> {
  const key = `machine_${sanitize(modelName)}`;
  const encrypted = await AsyncStorage.getItem(key);
  if (!encrypted) return null;
  
  try {
    return decrypt(encrypted);
  } catch (e) {
    console.error('Error decrypting data for', modelName, e);
    return null;
  }
}
