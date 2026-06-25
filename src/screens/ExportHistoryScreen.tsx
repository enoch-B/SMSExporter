import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';

const DUMMY_HISTORY = [
  { id: '1', name: 'Sara (GF)', format: 'PDF', messages: 42180, date: 'Today, 10:24 AM', size: '18.4 MB', status: 'done' },
  { id: '2', name: 'Dawit', format: 'CSV', messages: 8340, date: 'Yesterday', size: '3.1 MB', status: 'done' },
  { id: '3', name: 'Mom', format: 'PDF', messages: 1890, date: 'Mon', size: '2.2 MB', status: 'failed' },
];

function ExportHistoryScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export history</Text>
        <TouchableOpacity>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={DUMMY_HISTORY}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={[styles.formatIcon, item.format === 'PDF' ? styles.pdfIcon : styles.csvIcon]}>
              <Text style={styles.formatIconText}>{item.format === 'PDF' ? '📄' : '📊'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name} — {item.format}</Text>
              <Text style={styles.meta}>{item.messages.toLocaleString()} msgs · {item.date} · {item.size}</Text>
            </View>
            <View style={styles.actions}>
              <View style={[styles.badge, item.status === 'done' ? styles.badgeDone : styles.badgeFail]}>
                <Text style={[styles.badgeText, item.status === 'done' ? styles.badgeTextDone : styles.badgeTextFail]}>
                  {item.status === 'done' ? '✓ Done' : '✗ Failed'}
                </Text>
              </View>
              <View style={styles.actionBtns}>
                {item.status === 'failed'
                  ? <TouchableOpacity style={styles.actionBtn}><Text>🔄</Text></TouchableOpacity>
                  : <TouchableOpacity style={styles.actionBtn}><Text>📤</Text></TouchableOpacity>
                }
                <TouchableOpacity style={styles.actionBtn}><Text>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exports yet</Text>
            <Text style={styles.emptySub}>Your export history will appear here</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  backBtn: { fontSize: 15, color: '#1D9E75', width: 60 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111111' },
  clearBtn: { fontSize: 14, color: '#A32D2D', width: 60, textAlign: 'right' },
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
  formatIconText: { fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '500', color: '#111111', marginBottom: 3 },
  meta: { fontSize: 11, color: '#aaaaaa' },
  actions: { alignItems: 'flex-end', gap: 6 },
  badge: {
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
  emptyText: { fontSize: 16, fontWeight: '500', color: '#111111', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#aaaaaa' },
});

export default ExportHistoryScreen;