import { Platform, Share, Linking, NativeModules } from 'react-native';

const { ShareFile } = NativeModules;

function getMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.csv')) return 'text/csv';
  return '*/*';
}

export async function shareExportFile(filePath: string): Promise<void> {
  if (!filePath) {
    throw new Error('No export file found.');
  }

  if (Platform.OS === 'android' && ShareFile?.shareFile) {
    await ShareFile.shareFile(filePath, getMimeType(filePath));
    return;
  }

  await Share.share({
    title: 'SMS Export',
    url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
  });
}

export async function openExportFile(filePath: string): Promise<void> {
  if (!filePath) {
    throw new Error('No export file found.');
  }

  if (Platform.OS === 'android' && ShareFile?.openFile) {
    await ShareFile.openFile(filePath, getMimeType(filePath));
    return;
  }

  const url = Platform.OS === 'ios' ? filePath : `file://${filePath}`;
  await Linking.openURL(url);
}

export async function openDownloadsFolder(): Promise<void> {
  if (Platform.OS === 'android' && ShareFile?.openDownloads) {
    await ShareFile.openDownloads();
    return;
  }

  await Linking.openURL(
    'content://com.android.externalstorage.documents/document/primary:Download'
  );
}
