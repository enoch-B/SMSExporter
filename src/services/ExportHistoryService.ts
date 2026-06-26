import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExportRecord {
  id: string;
  name: string;
  format: 'PDF' | 'CSV';
  messages: number;
  date: string;
  filePaths: string[];
  sizeLabel: string;
  status: 'done' | 'failed';
  error?: string;
  selectedAddresses: string[];
  totalMessages: number;
}

const STORAGE_KEY = '@sms_exporter_history';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getExportHistory(): Promise<ExportRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExportRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addExportRecord(
  record: Omit<ExportRecord, 'id'>
): Promise<ExportRecord> {
  const entry: ExportRecord = { ...record, id: generateId() };
  try {
    const history = await getExportHistory();
    history.unshift(entry);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return entry;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not save export history.';
    throw new Error(message);
  }
}

export async function deleteExportRecord(id: string): Promise<void> {
  try {
    const history = await getExportHistory();
    const updated = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not delete export record.';
    throw new Error(message);
  }
}

export async function clearExportHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not clear export history.';
    throw new Error(message);
  }
}

export function formatExportDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const time = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) return `Today, ${time}`;
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  } catch {
    return isoDate;
  }
}
