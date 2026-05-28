import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import Constants from 'expo-constants';

const KEY = Constants.expoConfig?.extra?.encryptionKey || 'default_key_if_not_set_123';

export function encrypt(jsonObj: any): string {
  const str = JSON.stringify(jsonObj);
  return CryptoJS.AES.encrypt(str, KEY).toString();
}

export function decrypt(cipherText: string): any {
  const bytes = CryptoJS.AES.decrypt(cipherText, KEY);
  const str = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(str);
}
