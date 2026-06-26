import { generatePDF } from 'react-native-html-to-pdf';
import { PermissionsAndroid, Platform } from 'react-native';
import { Conversation, SmsMessage } from './SmsService';
import RNFS from 'react-native-fs';

async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'SMS Exporter needs storage access to save your export files.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function saveToDownloads(
  sourcePath: string,
  fileName: string,
  extension: string
): Promise<string> {
  const permitted = await requestStoragePermission();
  if (!permitted) {
    throw new Error(
      'Storage permission denied. Please allow storage access to save exports.'
    );
  }

  const destPath = `${RNFS.DownloadDirectoryPath}/${sanitizeFileName(fileName)}.${extension}`;

  try {
    const downloadsExists = await RNFS.exists(RNFS.DownloadDirectoryPath);
    if (!downloadsExists) {
      await RNFS.mkdir(RNFS.DownloadDirectoryPath);
    }

    if (await RNFS.exists(destPath)) {
      await RNFS.unlink(destPath);
    }

    await RNFS.copyFile(sourcePath, destPath);

    const saved = await RNFS.exists(destPath);
    if (!saved) {
      throw new Error('File was not saved to the Downloads folder.');
    }

    if (sourcePath !== destPath) {
      try {
        const sourceExists = await RNFS.exists(sourcePath);
        if (sourceExists) {
          await RNFS.unlink(sourcePath);
        }
      } catch {
        // Ignore cache cleanup failures
      }
    }

    return destPath;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to save file to Downloads.';
    throw new Error(message);
  }
}

async function writeCsvToDownloads(
  fileName: string,
  content: string
): Promise<string> {
  const permitted = await requestStoragePermission();
  if (!permitted) {
    throw new Error(
      'Storage permission denied. Please allow storage access to save exports.'
    );
  }

  const destPath = `${RNFS.DownloadDirectoryPath}/${sanitizeFileName(fileName)}.csv`;

  try {
    const downloadsExists = await RNFS.exists(RNFS.DownloadDirectoryPath);
    if (!downloadsExists) {
      await RNFS.mkdir(RNFS.DownloadDirectoryPath);
    }

    await RNFS.writeFile(destPath, content, 'utf8');

    const saved = await RNFS.exists(destPath);
    if (!saved) {
      throw new Error('CSV file was not saved to the Downloads folder.');
    }

    return destPath;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to save CSV to Downloads.';
    throw new Error(message);
  }
}

function formatDate(dateStr: string): string {
  return new Date(parseInt(dateStr)).toLocaleString();
}

function formatShortDate(dateStr: string): string {
  return new Date(parseInt(dateStr)).toDateString();
}

function buildMessagesHtml(messages: SmsMessage[]): string {
  const sorted = [...messages].sort(
    (a, b) => parseInt(a.date) - parseInt(b.date)
  );

  let html = '';
  let lastDate = '';

  sorted.forEach(msg => {
    const isSent = msg.type === 2;
    const currentDate = formatShortDate(msg.date);

    if (currentDate !== lastDate) {
      lastDate = currentDate;
      html += `
        <div class="date-separator">
          <span>${currentDate}</span>
        </div>
      `;
    }

    html += `
      <div class="bubble-row ${isSent ? 'sent' : 'received'}">
        <div class="bubble ${isSent ? 'bubble-sent' : 'bubble-received'}">
          <p class="bubble-text">${msg.body
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</p>
          <p class="bubble-time">${formatDate(msg.date)}</p>
        </div>
      </div>
    `;
  });

  return html;
}

function buildHtml(
  conversation: Conversation,
  pageNumber: number,
  totalPages: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .header {
          background: #1D9E75;
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .header h1 { font-size: 22px; margin-bottom: 4px; }
        .header p { font-size: 13px; opacity: 0.85; }
        .date-separator { text-align: center; margin: 16px 0; }
        .date-separator span {
          background: #e0e0e0;
          color: #888;
          font-size: 11px;
          padding: 3px 12px;
          border-radius: 10px;
        }
        .bubble-row { display: flex; margin: 4px 0; }
        .sent { justify-content: flex-end; }
        .received { justify-content: flex-start; }
        .bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 16px;
          word-break: break-word;
        }
        .bubble-sent {
          background: #1D9E75;
          border-bottom-right-radius: 4px;
        }
        .bubble-received {
          background: #ffffff;
          border-bottom-left-radius: 4px;
          border: 1px solid #e0e0e0;
        }
        .bubble-sent .bubble-text { color: #ffffff; font-size: 13px; line-height: 1.5; }
        .bubble-received .bubble-text { color: #111111; font-size: 13px; line-height: 1.5; }
        .bubble-time { font-size: 10px; margin-top: 4px; opacity: 0.7; }
        .bubble-sent .bubble-time { color: #ffffff; text-align: right; }
        .bubble-received .bubble-time { color: #888888; }
        .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #aaaaaa; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${conversation.name}</h1>
        <p>${conversation.count.toLocaleString()} messages · Exported on ${new Date().toLocaleDateString()} · Page ${pageNumber} of ${totalPages}</p>
      </div>
      ${buildMessagesHtml(conversation.messages)}
      <div class="footer">
        Exported by SMS Exporter · Page ${pageNumber} of ${totalPages}
      </div>
    </body>
    </html>
  `;
}

const CHUNK_SIZE = 500;

export interface ExportResult {
  filePaths: string[];
  totalMessages: number;
}

export async function exportToPdf(
  conversation: Conversation,
  onProgress: (processed: number, total: number) => void
): Promise<ExportResult> {
  const messages = [...conversation.messages].sort(
    (a, b) => parseInt(a.date) - parseInt(b.date)
  );

  const totalMessages = messages.length;
  const chunks: SmsMessage[][] = [];

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE));
  }

  const totalPages = Math.max(chunks.length, 1);
  const filePaths: string[] = [];
  const safeName = sanitizeFileName(conversation.name);

  for (let i = 0; i < chunks.length; i++) {
    const chunkConversation: Conversation = {
      ...conversation,
      messages: chunks[i],
    };

    const html = buildHtml(chunkConversation, i + 1, totalPages);
    const partSuffix = totalPages > 1 ? `_part${i + 1}` : '';
    const fileName = `${safeName}${partSuffix}`;

    try {
      const pdf = await generatePDF({
        html,
        fileName,
        directory: RNFS.CachesDirectoryPath,
      });

      if (!pdf.filePath) {
        throw new Error('PDF generation failed — no file path returned.');
      }

      const downloadsPath = await saveToDownloads(pdf.filePath, fileName, 'pdf');
      filePaths.push(downloadsPath);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'PDF export failed.';
      throw new Error(message);
    }

    onProgress(
      Math.min((i + 1) * CHUNK_SIZE, totalMessages),
      totalMessages
    );
  }

  return { filePaths, totalMessages };
}

export async function exportToCsv(
  conversation: Conversation,
  onProgress: (processed: number, total: number) => void
): Promise<ExportResult> {
  const messages = [...conversation.messages].sort(
    (a, b) => parseInt(a.date) - parseInt(b.date)
  );

  let csv = 'Contact,Phone,Direction,Date,Message\n';

  messages.forEach((msg, index) => {
    const direction = msg.type === 2 ? 'Sent' : 'Received';
    const date = formatDate(msg.date);
    const body = msg.body.replace(/"/g, '""').replace(/\n/g, ' ');
    csv += `"${conversation.name}","${conversation.address}","${direction}","${date}","${body}"\n`;

    if (index % 500 === 0 || index === messages.length - 1) {
      onProgress(index + 1, messages.length);
    }
  });

  const fileName = `${sanitizeFileName(conversation.name)}_export`;

  try {
    const destPath = await writeCsvToDownloads(fileName, csv);
    return {
      filePaths: [destPath],
      totalMessages: messages.length,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'CSV export failed.';
    throw new Error(message);
  }
}

export async function getFileSizeLabel(filePath: string): Promise<string> {
  try {
    const stat = await RNFS.stat(filePath);
    const bytes = stat.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return 'Unknown size';
  }
}
