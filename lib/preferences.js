import * as FileSystem from 'expo-file-system';
import { sanitizePreferences, PREFERENCE_DEFAULTS } from './preferences-schema';

export { sanitizePreferences, PREFERENCE_DEFAULTS };

const FILE = `${FileSystem.documentDirectory}preferences.json`;

export const loadPreferences = async () => {
  const info = await FileSystem.getInfoAsync(FILE);
  if (!info.exists) return { ...PREFERENCE_DEFAULTS };
  try {
    const text = await FileSystem.readAsStringAsync(FILE);
    return sanitizePreferences(JSON.parse(text));
  } catch {
    return { ...PREFERENCE_DEFAULTS };
  }
};

export const savePreferences = async (patch) => {
  const current = await loadPreferences();
  const next = sanitizePreferences({ ...current, ...patch });
  await FileSystem.writeAsStringAsync(FILE, JSON.stringify(next));
  return next;
};
