import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getExportHistory,
  deleteExportRecord,
  clearExportHistory,
  formatExportDate,
  ExportRecord,
} from '../services/ExportHistoryService';
import { getConversationsByAddresses } from '../services/SmsService';
import {
  shareExportFile,
  openExportFile,
} from '../services/FileShareService';
import { commonStyles } from '../styles/common';

function ExportHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await getExportHistory();
      setHistory(records);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load export history.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleClearAll = () => {
    Alert.alert(
      'Clear history',
      'Remove all export records? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearExportHistory();
              setHistory([]);
            } catch (err: unknown) {
              const message =
                err instanceof Error
                  ? err.message
                  : 'Could not clear export history.';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (item: ExportRecord) => {
    Alert.alert('Delete record', `Remove export for ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExportRecord(item.id);
            setHistory(prev => prev.filter(r => r.id !== item.id));
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : 'Could not delete export record.';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  };

  const handleShare = async (item: ExportRecord) => {
    if (!item.filePaths.length) {
      Alert.alert('Share unavailable', 'No export file found for this record.');
      return;
    }
    try {
      await shareExportFile(item.filePaths[0]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not share the export file.';
      Alert.alert('Share failed', message);
    }
  };

  const handleRetry = (item: ExportRecord) => {
    const conversations = getConversationsByAddresses(item.selectedAddresses);

    if (conversations.length === 0) {
      Alert.alert(
        'Retry unavailable',
        'The original conversations are no longer loaded. Go back to Messages and export again.'
      );
      return;
    }

    const totalMessages = conversations.reduce((sum, c) => sum + c.count, 0);

    navigation.navigate('ExportProgress', {
      selected: conversations,
      totalMessages,
      format: item.format,
    });
  };

  const handleOpen = async (item: ExportRecord) => {
    if (!item.filePaths.length) {
      Alert.alert('File unavailable', 'No export file found for this record.');
      return;
    }
    try {
      await openExportFile(item.filePaths[0]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not open the export file.';
      Alert.alert('Open failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={commonStyles.screenHeader}>
        <TouchableOpacity
          style={commonStyles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color="#111111" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Export history</Text>
        <TouchableOpacity
          style={styles.clearBtnWrap}
          onPress={handleClearAll}
          disabled={history.length === 0}
        >
          <Icon
            name="trash-can-outline"
            size={20}
            color={history.length === 0 ? '#cccccc' : '#A32D2D'}
          />
        </TouchableOpacity>
      </View>

      {error !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        initialNumToRender={20}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View
              style={[
                styles.formatIcon,
                item.format === 'PDF' ? styles.pdfIcon : styles.csvIcon,
              ]}
            >
              <Icon
                name={item.format === 'PDF' ? 'file-pdf-box' : 'file-delimited'}
                size={20}
                color={item.format === 'PDF' ? '#993556' : '#0F6E56'}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.name} — {item.format}
              </Text>
              <Text style={styles.meta}>
                {item.messages.toLocaleString()} msgs ·{' '}
                {formatExportDate(item.date)} · {item.sizeLabel}
              </Text>
            </View>
            <View style={styles.actions}>
              <View
                style={[
                  styles.badge,
                  item.status === 'done' ? styles.badgeDone : styles.badgeFail,
                ]}
              >
                {item.status === 'done' ? (
                  <Icon name="check" size={12} color="#0F6E56" />
                ) : (
                  <Icon name="close" size={12} color="#A32D2D" />
                )}
                <Text
                  style={[
                    styles.badgeText,
                    item.status === 'done'
                      ? styles.badgeTextDone
                      : styles.badgeTextFail,
                  ]}
                >
                  {item.status === 'done' ? 'Done' : 'Failed'}
                </Text>
              </View>
              <View style={styles.actionBtns}>
                {item.status === 'failed' ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleRetry(item)}
                  >
                    <Icon name="refresh" size={18} color="#555555" />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleShare(item)}
                    >
                      <Icon name="share-variant" size={18} color="#555555" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpen(item)}
                    >
                      <Icon name="folder-open" size={18} color="#555555" />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Icon name="trash-can-outline" size={18} color="#A32D2D" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() =>
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No exports yet</Text>
              <Text style={styles.emptySub}>
                Your export history will appear here
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  clearBtnWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: '#FCEBEB',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: { fontSize: 13, color: '#A32D2D' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  formatIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pdfIcon: { backgroundColor: '#FAECE7' },
  csvIcon: { backgroundColor: '#E1F5EE' },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '500', color: '#111111', marginBottom: 3 },
  meta: { fontSize: 11, color: '#aaaaaa' },
  actions: { alignItems: 'flex-end', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeDone: { backgroundColor: '#E1F5EE' },
  badgeFail: { backgroundColor: '#FCEBEB' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextDone: { color: '#0F6E56' },
  badgeTextFail: { color: '#A32D2D' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: 0.5, backgroundColor: '#f0f0f0', marginLeft: 68 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 6,
  },
  emptySub: { fontSize: 13, color: '#aaaaaa' },
});

export default ExportHistoryScreen;
