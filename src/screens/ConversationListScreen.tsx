import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  requestSmsPermission,
  getAllConversations,
  Conversation,
} from '../services/SmsService';
import DrawerMenu from '../components/DrawerMenu';
import { commonStyles } from '../styles/common';

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

const COLORS = [
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#EEEDFE', text: '#534AB7' },
];

const ITEM_HEIGHT = 68;

function ConversationListScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadSms();
  }, []);

  const loadSms = async () => {
    setLoading(true);
    setLoadingCount(0);
    const granted = await requestSmsPermission();
    if (!granted) {
      setError('SMS permission denied. Please allow it in your phone settings.');
      setLoading(false);
      return;
    }
    try {
      const data = await getAllConversations(found => {
        setLoadingCount(found);
      });
      setConversations(data);
    } catch {
      setError('Failed to load messages.');
    }
    setLoading(false);
  };

  const filtered = conversations.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.includes(search)
  );

  const toggleSelect = (address: string) => {
    setSelected(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const totalMessages = conversations
    .filter(c => selected.includes(c.address))
    .reduce((sum, c) => sum + c.count, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
        <Text style={styles.loadingText}>Reading your messages...</Text>
        <Text style={styles.loadingCount}>
          {loadingCount.toLocaleString()} messages found so far
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSms}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={commonStyles.screenHeader}>
        <Text style={commonStyles.headerTitleLarge}>Messages</Text>
        <TouchableOpacity
          style={commonStyles.iconBtn}
          onPress={() => setDrawerOpen(true)}
        >
          <Icon name="menu" size={22} color="#111111" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#aaaaaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.address}
        initialNumToRender={20}
        getItemLayout={(_data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySub}>
              {search
                ? 'Try a different search term'
                : 'No SMS conversations on this device'}
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const color = COLORS[index % COLORS.length];
          const isSelected = selected.includes(item.address);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('MessageDetail', { conversation: item })
              }
            >
              <View style={styles.item}>
                <View style={[styles.avatar, { backgroundColor: color.bg }]}>
                  <Text style={[styles.avatarText, { color: color.text }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.time}>{item.lastDate}</Text>
                  <Text style={styles.count}>
                    {item.count.toLocaleString()} msgs
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkboxHitArea}
                  onPress={() => toggleSelect(item.address)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && (
                      <Icon name="check" size={14} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {selected.length > 0 && (
        <View style={styles.exportBar}>
          <Text style={styles.exportInfo}>
            {selected.length} selected · {totalMessages.toLocaleString()}{' '}
            messages
          </Text>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() =>
              navigation.navigate('ExportOptions', {
                selected: conversations.filter(c =>
                  selected.includes(c.address)
                ),
                totalMessages,
              })
            }
          >
            <Icon name="export" size={16} color="#ffffff" />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      )}

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={screen => navigation.navigate(screen)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#888888',
  },
  errorText: {
    fontSize: 14,
    color: '#A32D2D',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#ffffff', fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111111',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: '#111111', marginBottom: 3 },
  preview: { fontSize: 12, color: '#888888' },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { fontSize: 11, color: '#aaaaaa' },
  count: { fontSize: 10, color: '#aaaaaa' },
  checkboxHitArea: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  separator: {
    height: 0.5,
    backgroundColor: '#f0f0f0',
    marginLeft: 72,
  },
  exportBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  exportInfo: { fontSize: 13, color: '#555555' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1D9E75',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  loadingCount: {
    marginTop: 6,
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '500',
  },
  exportBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 6,
  },
  emptySub: { fontSize: 13, color: '#aaaaaa', textAlign: 'center' },
});

export default ConversationListScreen;
