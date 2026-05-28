import * as Calendar from 'expo-calendar';
import { Platform, Linking } from 'react-native';

export interface CalendarResult {
  success: boolean;
  method: 'native' | 'deeplink';
  error?: any;
}

export async function addOilReminder(date: Date, modelName: string, pontosOleo: string[]): Promise<CalendarResult> {
  try {
    // Tenta usar o calendário nativo
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal = calendars.find(c => c.allowsModifications) || calendars[0];
      
      if (defaultCal) {
        await Calendar.createEventAsync(defaultCal.id, {
          title: `🪡 Lubrificar ${modelName}`,
          startDate: date,
          endDate: new Date(date.getTime() + 60 * 60 * 1000), // +1 hora
          notes: `Pontos: ${pontosOleo.join(', ')}`,
          alarms: [{ relativeOffset: -60 }], // lembrete 1h antes
        });
        return { success: true, method: 'native' };
      }
    }
  } catch (err) {
    console.log('Error creating native calendar event, falling back to deep link:', err);
  }
  
  // Fallback: deep link para Google Calendar
  const title = encodeURIComponent(`Lubrificar ${modelName}`);
  const details = encodeURIComponent(`Pontos: ${pontosOleo.join(', ')}`);
  const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
  
  try {
    await Linking.openURL(url);
    return { success: true, method: 'deeplink' };
  } catch (err) {
    return { success: false, method: 'deeplink', error: err };
  }
}
