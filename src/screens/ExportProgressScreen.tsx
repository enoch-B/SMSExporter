import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Share,
  ScrollView,
} from 'react-native';
import { exportToPdf, exportToCsv, ExportResult } from '../services/PdfService';
import { Conversation } from '../services/SmsService';

function ExportProgressScreen({ route, navigation }: any) {
  const { selected, totalMessages, format } = route.params;
  const [processed, setProcessed] = useState(0);
  const [currentConversation, setCurrentConversation] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [logs, setLogs] = useState<string[]>(['→ Starting export...']);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    startExport();
  }, []);

  const startExport = async () => {
    try {
      let totalProcessed = 0;
      const allFilePaths: string[] = [];

      for (let i = 0; i < selected.length; i++) {
        const conversation: Conversation = selected[i];
        setCurrentConversation(i);
        addLog(`→ Processing ${conversation.name}...`);

        const exportFn = format === 'PDF' ? exportToPdf : exportToCsv;

        const res = await exportFn(
          conversation,
          (proc, total) => {
            totalProcessed += proc;
            setProcessed(totalProcessed);
            addLog(`✓ ${proc.toLocaleString()} / ${total.toLocaleString()} messages processed`);
          }
        );

        allFilePaths.push(...res.filePaths);
        addLog(`✓ ${conversation.name} exported successfully`);
      }

      setResult({ filePaths: allFilePaths, totalMessages });
      addLog('✓ All exports complete!');
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Export failed');
      addLog('✗ Export failed');
    }
  };

  const progress = Math.min(processed / totalMessages, 1);
  const percent = Math.floor(progress * 100);

  const handleShare = async () => {
    if (!result?.filePaths.length) return;
    await Share.share({ url: result.filePaths[0], message: 'SMS Export' });
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

        {/* Current contact */}
        <View style={styles.contactRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {selected[currentConversation]?.name?.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.contactName}>
              {selected[currentConversation]?.name}
            </Text>
            <Text style={styles.contactSub}>
              {done ? 'Finished' : error ? 'Failed' : `Processing ${percent}%...`}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            <Text style={styles.statBold}>{processed.toLocaleString()}</Text>
            {' '}/ {totalMessages.toLocaleString()} messages
          </Text>
          <Text style={styles.stat}>
            {done ? '✓ Done' : `${percent}%`}
          </Text>
        </View>

        {/* Log box */}
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

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>✗ {error}</Text>
          </View>
        )}

        {/* Done card */}
        {done && (
          <View style={styles.doneCard}>
            <View style={styles.doneIcon}>
              <Text style={styles.doneCheck}>✓</Text>
            </View>
            <View>
              <Text style={styles.doneTitle}>Export successful</Text>
              <Text style={styles.doneSub}>
                {totalMessages.toLocaleString()} messages · {result?.filePaths.length} file(s) · saved to Downloads
              </Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
        {done && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.popToTop()}
            >
              <Text style={styles.actionBtnText}>🏠 Home</Text>
            </TouchableOpacity>
          </View>
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
  },
  errorText: { fontSize: 13, color: '#A32D2D' },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  doneTitle: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  doneSub: { fontSize: 12, color: '#0F6E56', marginTop: 2 },
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
});

export default ExportProgressScreen;