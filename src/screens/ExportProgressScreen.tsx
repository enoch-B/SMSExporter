import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Share,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import {
  exportToPdf,
  exportToCsv,
  ExportResult,
  getFileSizeLabel,
} from '../services/PdfService';
import { Conversation } from '../services/SmsService';
import { addExportRecord } from '../services/ExportHistoryService';

function ExportProgressScreen({ route, navigation }: any) {
  const { selected, totalMessages, format } = route.params as {
    selected: Conversation[];
    totalMessages: number;
    format: 'PDF' | 'CSV';
  };

  const [processed, setProcessed] = useState(0);
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [completedConversations, setCompletedConversations] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [logs, setLogs] = useState<string[]>(['→ Starting export...']);
  const [isExporting, setIsExporting] = useState(true);
  const exportStarted = useRef(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    if (exportStarted.current) return;
    exportStarted.current = true;
    startExport();
  }, []);

  const saveHistory = async (
    status: 'done' | 'failed',
    filePaths: string[],
    errorMessage?: string
  ) => {
    try {
      const primaryName =
        selected.length === 1
          ? selected[0].name
          : `${selected.length} conversations`;
      const sizeLabel =
        filePaths.length > 0
          ? await getFileSizeLabel(filePaths[0])
          : '—';

      await addExportRecord({
        name: primaryName,
        format,
        messages: totalMessages,
        date: new Date().toISOString(),
        filePaths,
        sizeLabel,
        status,
        error: errorMessage,
        selectedAddresses: selected.map(c => c.address),
        totalMessages,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not save export history.';
      addLog(`⚠ ${message}`);
    }
  };

  const startExport = async () => {
    setIsExporting(true);
    setError('');
    setDone(false);
    setProcessed(0);
    setCompletedConversations(0);
    setCurrentConversationIndex(0);

    let messagesCompleted = 0;
    const allFilePaths: string[] = [];

    try {
      const exportFn = format === 'PDF' ? exportToPdf : exportToCsv;

      for (let i = 0; i < selected.length; i++) {
        const conversation = selected[i];
        setCurrentConversationIndex(i);
        addLog(
          `→ Exporting ${conversation.name} (${i + 1} of ${selected.length})...`
        );

        const res = await exportFn(conversation, (proc, _total) => {
          setProcessed(messagesCompleted + proc);
        });

        allFilePaths.push(...res.filePaths);
        messagesCompleted += conversation.messages.length;
        setProcessed(messagesCompleted);
        setCompletedConversations(i + 1);
        addLog(`✓ ${conversation.name} exported successfully`);
      }

      setResult({ filePaths: allFilePaths, totalMessages });
      addLog('✓ All exports complete!');
      setDone(true);
      await saveHistory('done', allFilePaths);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Export failed. Please try again.';
      setError(message);
      addLog('✗ Export failed');
      await saveHistory('failed', allFilePaths, message);
    } finally {
      setIsExporting(false);
    }
  };

  const rawProgress = totalMessages > 0 ? processed / totalMessages : 0;
  const progress = isExporting && !done && !error
    ? Math.max(rawProgress, 0.05)
    : rawProgress;
  const percent = Math.min(Math.floor(progress * 100), 100);

  const currentConversation = selected[currentConversationIndex];

  const handleShare = async () => {
    if (!result?.filePaths.length) return;
    try {
      const filePath = result.filePaths[0];
      await Share.share({
        title: 'SMS Export',
        message: `SMS export: ${currentConversation?.name || 'conversation'}`,
        url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not share the export file.';
      Alert.alert('Share failed', message);
    }
  };

  const handleOpenInFiles = async () => {
    if (!result?.filePaths.length) return;
    try {
      const filePath = result.filePaths[0];
      const url = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(
          'Open file',
          `File saved to:\n${filePath}\n\nOpen your Files app and check Downloads.`
        );
        return;
      }
      await Linking.openURL(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not open the file. Check your Downloads folder.';
      Alert.alert('Open failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {done ? 'Export complete' : error ? 'Export failed' : 'Exporting...'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.contactRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentConversation?.name?.slice(0, 2).toUpperCase() || '—'}
            </Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {currentConversation?.name || '—'}
            </Text>
            <Text style={styles.contactSub}>
              {done
                ? 'Finished'
                : error
                  ? 'Failed'
                  : `${completedConversations} of ${selected.length} conversations · ${percent}%`}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            <Text style={styles.statBold}>{processed.toLocaleString()}</Text>
            {' '}/ {totalMessages.toLocaleString()} messages
          </Text>
          <Text style={styles.stat}>
            {done ? '✓ Done' : `${percent}%`}
          </Text>
        </View>

        {!done && !error && selected.length > 1 && (
          <Text style={styles.conversationProgress}>
            Conversation {Math.min(currentConversationIndex + 1, selected.length)} of{' '}
            {selected.length}
          </Text>
        )}

        <View style={styles.logBox}>
          {logs.map((log, i) => (
            <Text
              key={i}
              style={[styles.logLine, i === logs.length - 1 && styles.logActive]}
            >
              {log}
            </Text>
          ))}
        </View>

        {error !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>✗ {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={startExport}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <View style={styles.doneCard}>
            <View style={styles.doneIcon}>
              <Text style={styles.doneCheck}>✓</Text>
            </View>
            <View style={styles.doneInfo}>
              <Text style={styles.doneTitle}>Export successful</Text>
              <Text style={styles.doneSub}>
                {totalMessages.toLocaleString()} messages · {result?.filePaths.length}{' '}
                file(s) · saved to Downloads
              </Text>
              {result?.filePaths[0] ? (
                <Text style={styles.filePath} numberOfLines={2}>
                  {result.filePaths[0]}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {done && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleOpenInFiles}>
              <Text style={styles.actionBtnText}>📁 Open</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.homeBtnText}>🏠 Back to home</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111111' },
  body: { padding: 16, gap: 16 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBEAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#993556' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '500', color: '#111111' },
  contactSub: { fontSize: 12, color: '#888888', marginTop: 2 },
  progressBarWrap: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1D9E75',
    borderRadius: 100,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { fontSize: 12, color: '#888888' },
  statBold: { fontWeight: '600', color: '#111111' },
  conversationProgress: {
    fontSize: 12,
    color: '#1D9E75',
    fontWeight: '500',
    marginTop: -8,
  },
  logBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  logLine: { fontSize: 12, color: '#888888', fontFamily: 'monospace' },
  logActive: { color: '#1D9E75' },
  errorCard: {
    backgroundColor: '#FCEBEB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#F09595',
    gap: 10,
  },
  errorText: { fontSize: 13, color: '#A32D2D' },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#A32D2D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E1F5EE',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#9FE1CB',
  },
  doneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  doneInfo: { flex: 1 },
  doneTitle: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  doneSub: { fontSize: 12, color: '#0F6E56', marginTop: 2 },
  filePath: { fontSize: 10, color: '#0F6E56', marginTop: 6, opacity: 0.8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '500', color: '#111111' },
  homeBtn: {
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  homeBtnText: { fontSize: 13, fontWeight: '500', color: '#111111' },
});

export default ExportProgressScreen;
