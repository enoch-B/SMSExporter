import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  exportToPdf,
  exportToCsv,
  ExportResult,
  getFileSizeLabel,
} from '../services/PdfService';
import { Conversation } from '../services/SmsService';
import { addExportRecord } from '../services/ExportHistoryService';
import {
  shareExportFile,
  openExportFile,
  openDownloadsFolder,
} from '../services/FileShareService';
import { commonStyles } from '../styles/common';

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
  const [logs, setLogs] = useState<string[]>(['Starting export...']);
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
        filePaths.length > 0 ? await getFileSizeLabel(filePaths[0]) : '—';

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
      addLog(message);
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
          `Exporting ${conversation.name} (${i + 1} of ${selected.length})...`
        );

        const res = await exportFn(conversation, proc => {
          setProcessed(messagesCompleted + proc);
        });

        allFilePaths.push(...res.filePaths);
        messagesCompleted += conversation.messages.length;
        setProcessed(messagesCompleted);
        setCompletedConversations(i + 1);
        addLog(`${conversation.name} exported successfully`);
      }

      setResult({ filePaths: allFilePaths, totalMessages });
      addLog('All exports complete');
      setDone(true);
      await saveHistory('done', allFilePaths);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Export failed. Please try again.';
      setError(message);
      addLog('Export failed');
      await saveHistory('failed', allFilePaths, message);
    } finally {
      setIsExporting(false);
    }
  };

  const rawProgress = totalMessages > 0 ? processed / totalMessages : 0;
  const progress =
    isExporting && !done && !error ? Math.max(rawProgress, 0.05) : rawProgress;
  const percent = Math.min(Math.floor(progress * 100), 100);

  const currentConversation = selected[currentConversationIndex];

  const handleShare = async () => {
    if (!result?.filePaths.length) return;
    try {
      await shareExportFile(result.filePaths[0]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not share the export file.';
      Alert.alert('Share failed', message);
    }
  };

  const handleOpenInFiles = async () => {
    if (!result?.filePaths.length) return;
    try {
      await openExportFile(result.filePaths[0]);
    } catch {
      try {
        await openDownloadsFolder();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Could not open the file. Check your Downloads folder.';
        Alert.alert(
          'Open failed',
          result.filePaths[0]
            ? `${message}\n\nFile saved to:\n${result.filePaths[0]}`
            : message
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={commonStyles.screenHeader}>
        <View style={commonStyles.headerSpacer} />
        <Text style={commonStyles.headerTitle}>
          {done ? 'Export complete' : error ? 'Export failed' : 'Exporting...'}
        </Text>
        <View style={commonStyles.headerSpacer} />
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
            <Text style={styles.statBold}>{processed.toLocaleString()}</Text> /{' '}
            {totalMessages.toLocaleString()} messages
          </Text>
          <View style={styles.statRight}>
            {done ? (
              <Icon name="check" size={16} color="#0F6E56" />
            ) : (
              <Text style={styles.stat}>{percent}%</Text>
            )}
          </View>
        </View>

        {!done && !error && selected.length > 1 && (
          <Text style={styles.conversationProgress}>
            Conversation {Math.min(currentConversationIndex + 1, selected.length)}{' '}
            of {selected.length}
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
            <View style={styles.errorHeader}>
              <Icon name="close" size={18} color="#A32D2D" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity style={styles.retryBtn} onPress={startExport}>
              <Icon name="refresh" size={18} color="#ffffff" />
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <View style={styles.doneCard}>
            <View style={styles.doneIcon}>
              <Icon name="check" size={18} color="#ffffff" />
            </View>
            <View style={styles.doneInfo}>
              <Text style={styles.doneTitle}>Export successful</Text>
              <Text style={styles.doneSub}>
                {totalMessages.toLocaleString()} messages ·{' '}
                {result?.filePaths.length} file(s) · saved to Downloads
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
            <TouchableOpacity style={styles.primaryBtn} onPress={handleShare}>
              <Icon name="share-variant" size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenInFiles}>
              <Icon name="folder-open" size={18} color="#555555" />
              <Text style={styles.secondaryBtnText}>Open</Text>
            </TouchableOpacity>
          </View>
        )}

        {done && (
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.popToTop()}
          >
            <Icon name="home" size={18} color="#555555" />
            <Text style={styles.homeBtnText}>Back to home</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: { fontSize: 12, color: '#888888' },
  statBold: { fontWeight: '600', color: '#111111' },
  statRight: { flexDirection: 'row', alignItems: 'center' },
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
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: '#A32D2D' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
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
  doneInfo: { flex: 1 },
  doneTitle: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  doneSub: { fontSize: 12, color: '#0F6E56', marginTop: 2 },
  filePath: { fontSize: 10, color: '#0F6E56', marginTop: 6, opacity: 0.8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '500', color: '#111111' },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  homeBtnText: { fontSize: 13, fontWeight: '500', color: '#111111' },
});

export default ExportProgressScreen;
