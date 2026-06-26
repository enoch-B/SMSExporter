import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SmsMessage, Conversation } from '../services/SmsService';
import { commonStyles } from '../styles/common';

function formatTime(dateStr: string): string {
  const date = new Date(parseInt(dateStr));
  return date.toLocaleString();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({
  text,
  query,
  isSent,
}: {
  text: string;
  query: string;
  isSent: boolean;
}) {
  if (!query.trim()) {
    return (
      <Text
        style={[
          styles.bubbleText,
          isSent ? styles.bubbleTextSent : styles.bubbleTextReceived,
        ]}
      >
        {text}
      </Text>
    );
  }

  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text
      style={[
        styles.bubbleText,
        isSent ? styles.bubbleTextSent : styles.bubbleTextReceived,
      ]}
    >
      {parts.map((part, index) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <Text
            key={index}
            style={[
              styles.highlight,
              isSent ? styles.highlightSent : styles.highlightReceived,
            ]}
          >
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

function MessageDetailScreen({ route, navigation }: any) {
  const { conversation }: { conversation: Conversation } = route.params;
  const flatListRef = useRef<FlatList>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const matchingMessages = useMemo(() => {
    if (!isSearching) return conversation.messages;
    const lower = trimmedQuery.toLowerCase();
    return conversation.messages.filter(msg =>
      msg.body.toLowerCase().includes(lower)
    );
  }, [conversation.messages, isSearching, trimmedQuery]);

  const totalMatches = useMemo(() => {
    if (!isSearching) return 0;
    const lower = trimmedQuery.toLowerCase();
    return conversation.messages.filter(msg =>
      msg.body.toLowerCase().includes(lower)
    ).length;
  }, [conversation.messages, isSearching, trimmedQuery]);

  const handleExport = () => {
    navigation.navigate('ExportOptions', {
      selected: [conversation],
      totalMessages: conversation.count,
    });
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: SmsMessage;
    index: number;
  }) => {
    const isSent = item.type === 2;
    const currentDate = new Date(parseInt(item.date)).toDateString();
    const prevItem = matchingMessages[index + 1];
    const prevDate = prevItem
      ? new Date(parseInt(prevItem.date)).toDateString()
      : null;
    const showDate = currentDate !== prevDate;

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{currentDate}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubbleRow,
            isSent ? styles.bubbleRowSent : styles.bubbleRowReceived,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isSent ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            <HighlightedText
              text={item.body}
              query={trimmedQuery}
              isSent={isSent}
            />
            <Text
              style={[
                styles.bubbleTime,
                isSent ? styles.bubbleTimeSent : styles.bubbleTimeReceived,
              ]}
            >
              {formatTime(item.date)}
            </Text>
          </View>
        </View>
      </>
    );
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={styles.headerCount}>
            {conversation.count.toLocaleString()} messages
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Icon name="export" size={16} color="#ffffff" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor="#aaaaaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {isSearching && (
          <Text style={styles.matchCount}>
            {totalMatches.toLocaleString()} of{' '}
            {conversation.count.toLocaleString()} matches
          </Text>
        )}
      </View>

      <View style={styles.jumpBar}>
        <TouchableOpacity
          style={styles.jumpBtn}
          onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
        >
          <Icon name="chevron-double-up" size={16} color="#555555" />
          <Text style={styles.jumpBtnText}>First message</Text>
        </TouchableOpacity>
        <Text style={styles.jumpSeparator}>·</Text>
        <TouchableOpacity
          style={styles.jumpBtn}
          onPress={() =>
            flatListRef.current?.scrollToIndex({ index: 0, animated: true })
          }
        >
          <Icon name="chevron-double-down" size={16} color="#555555" />
          <Text style={styles.jumpBtnText}>Latest message</Text>
        </TouchableOpacity>
      </View>

      {isSearching && totalMatches === 0 ? (
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchText}>No messages found</Text>
          <Text style={styles.emptySearchSub}>Try a different keyword</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={matchingMessages}
          keyExtractor={item => item._id}
          renderItem={renderMessage}
          inverted
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          contentContainerStyle={styles.messageList}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            }, 500);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerName: { fontSize: 15, fontWeight: '600', color: '#111111' },
  headerCount: { fontSize: 11, color: '#aaaaaa', marginTop: 1 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D9E75',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    gap: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111111',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  matchCount: {
    fontSize: 11,
    color: '#1D9E75',
    fontWeight: '500',
    paddingHorizontal: 2,
  },
  clearSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  jumpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    gap: 12,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  jumpBtnText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },
  jumpSeparator: {
    color: '#cccccc',
    fontSize: 16,
  },
  messageList: { padding: 12 },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    fontSize: 11,
    color: '#aaaaaa',
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bubbleRow: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  bubbleRowSent: { justifyContent: 'flex-end' },
  bubbleRowReceived: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleSent: {
    backgroundColor: '#1D9E75',
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: '#ffffff' },
  bubbleTextReceived: { color: '#111111' },
  highlight: {
    fontWeight: '700',
    borderRadius: 2,
  },
  highlightSent: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    color: '#ffffff',
  },
  highlightReceived: {
    backgroundColor: '#FFF3B0',
    color: '#111111',
  },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeSent: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  bubbleTimeReceived: { color: '#aaaaaa' },
  emptySearch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 6,
  },
  emptySearchSub: { fontSize: 13, color: '#aaaaaa' },
});

export default MessageDetailScreen;
