import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#BC6C25',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#FEFAE0',
        }
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Cuidados de Costura',
        }} 
      />
      <Stack.Screen 
        name="resultado" 
        options={{ 
          title: 'Detalhes da Máquina',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="calendario" 
        options={{ 
          title: 'Datas de Lubrificação',
        }} 
      />
    </Stack>
  );
}
