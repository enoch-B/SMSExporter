import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

const DATE_RANGES = ['All time', 'Last 30 days', 'Last 90 days', 'Custom'];

function ExportOptionsScreen({ route, navigation }: any) {
  const { selected, totalMessages } = route.params;
  const [format, setFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [dateRange, setDateRange] = useState('All time');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export options</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* Format */}
        <Text style={styles.sectionLabel}>FORMAT</Text>
        <View style={styles.formatRow}>
          {(['PDF', 'CSV'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.formatCard, format === f && styles.formatCardSelected]}
              onPress={() => setFormat(f)}
            >
              <Text style={styles.formatIcon}>{f === 'PDF' ? '📄' : '📊'}</Text>
              <Text style={[styles.formatName, format === f && styles.formatNameSelected]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Range */}
        <Text style={styles.sectionLabel}>DATE RANGE</Text>
        <View style={styles.dateGrid}>
          {DATE_RANGES.map(range => (
            <TouchableOpacity
              key={range}
              style={[styles.dateChip, dateRange === range && styles.dateChipSelected]}
              onPress={() => setDateRange(range)}
            >
              <Text style={[styles.dateChipText, dateRange === range && styles.dateChipTextSelected]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <Text style={styles.sectionLabel}>SUMMARY</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Conversations</Text>
            <Text style={styles.summaryVal}>{selected.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Total messages</Text>
            <Text style={styles.summaryVal}>{totalMessages.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Format</Text>
            <Text style={styles.summaryVal}>{format}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Date range</Text>
            <Text style={styles.summaryVal}>{dateRange}</Text>
          </View>
        </View>

        {/* Start Button */}
            <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.navigate('ExportProgress', {
                selected: route.params.selected,
                totalMessages: route.params.totalMessages,
                format,
            })}
            >
            <Text style={styles.startBtnText}>Start export</Text>
            </TouchableOpacity>

      </ScrollView>
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
  body: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaaaaa',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  formatRow: { flexDirection: 'row', gap: 10 },
  formatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formatCardSelected: { borderColor: '#1D9E75', backgroundColor: '#E1F5EE', borderWidth: 1.5 },
  formatIcon: { fontSize: 18 },
  formatName: { fontSize: 14, fontWeight: '500', color: '#111111' },
  formatNameSelected: { color: '#0F6E56' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateChipSelected: { borderColor: '#1D9E75', backgroundColor: '#E1F5EE', borderWidth: 1.5 },
  dateChipText: { fontSize: 13, color: '#555555' },
  dateChipTextSelected: { color: '#0F6E56', fontWeight: '500' },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryKey: { fontSize: 13, color: '#888888' },
  summaryVal: { fontSize: 13, fontWeight: '500', color: '#111111' },
  startBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});

export default ExportOptionsScreen;