import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name || 'cuidados-costura',
  slug: config.slug || 'cuidados-costura',
  android: {
    ...config.android,
    package: 'com.lucas.cuidadoscostura'
  },
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.lucas.cuidadoscostura'
  },
  plugins: [
    ...(config.plugins || []),
    "@react-native-community/datetimepicker"
  ],
  extra: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    encryptionKey: process.env.ENCRYPTION_KEY,
    ...config.extra,
  },
});
