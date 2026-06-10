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

const TRACKED_MACHINES_KEY = 'TRACKED_MACHINES_LIST';

export async function getTrackedMachines(): Promise<MachineOilInfo[]> {
  try {
    const listStr = await AsyncStorage.getItem(TRACKED_MACHINES_KEY);
    if (!listStr) return [];
    
    const models: string[] = JSON.parse(listStr);
    const machines = await Promise.all(models.map(m => loadOilInfo(m)));
    
    // Filter out nulls in case some data was corrupted
    return machines.filter((m): m is MachineOilInfo => m !== null);
  } catch (e) {
    console.error('Error loading tracked machines', e);
    return [];
  }
}

export async function trackMachine(modelName: string): Promise<void> {
  try {
    const listStr = await AsyncStorage.getItem(TRACKED_MACHINES_KEY);
    const models: string[] = listStr ? JSON.parse(listStr) : [];
    
    if (!models.includes(modelName)) {
      models.push(modelName);
      await AsyncStorage.setItem(TRACKED_MACHINES_KEY, JSON.stringify(models));
    }
  } catch (e) {
    console.error('Error tracking machine', e);
  }
}

export async function untrackMachine(modelName: string): Promise<void> {
  try {
    const listStr = await AsyncStorage.getItem(TRACKED_MACHINES_KEY);
    if (!listStr) return;
    
    const models: string[] = JSON.parse(listStr);
    const updated = models.filter(m => m !== modelName);
    
    await AsyncStorage.setItem(TRACKED_MACHINES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error untracking machine', e);
  }
}
