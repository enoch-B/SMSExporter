import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SmsMessage, Conversation } from '../services/SmsService';

function formatTime(dateStr: string): string {
  const date = new Date(parseInt(dateStr));
  return date.toLocaleString();
}

function MessageDetailScreen({ route, navigation }: any) {
  const { conversation }: { conversation: Conversation } = route.params;
  const flatListRef = useRef<FlatList>(null);

  const renderMessage = ({ item, index }: { item: SmsMessage; index: number }) => {
    const isSent = item.type === 2;
    const currentDate = new Date(parseInt(item.date)).toDateString();
    const prevDate =
      index < conversation.messages.length - 1
        ? new Date(
            parseInt(conversation.messages[index + 1].date)
          ).toDateString()
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
            <Text
              style={[
                styles.bubbleText,
                isSent ? styles.bubbleTextSent : styles.bubbleTextReceived,
              ]}
            >
              {item.body}
            </Text>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={styles.headerCount}>
            {conversation.count.toLocaleString()} messages
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() =>
            navigation.navigate('ExportOptions', {
              selected: [conversation],
              totalMessages: conversation.count,
            })
          }
        >
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Jump buttons */}
      <View style={styles.jumpBar}>
        <TouchableOpacity
          style={styles.jumpBtn}
          onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
        >
          <Text style={styles.jumpBtnText}>⬆ First message</Text>
        </TouchableOpacity>
        <Text style={styles.jumpSeparator}>·</Text>
        <TouchableOpacity
          style={styles.jumpBtn}
          onPress={() =>
            flatListRef.current?.scrollToIndex({ index: 0, animated: true })
          }
        >
          <Text style={styles.jumpBtnText}>⬇ Latest message</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversation.messages}
        keyExtractor={item => item._id}
        renderItem={renderMessage}
        inverted
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  backBtn: { fontSize: 15, color: '#1D9E75', width: 55 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { fontSize: 15, fontWeight: '600', color: '#111111' },
  headerCount: { fontSize: 11, color: '#aaaaaa', marginTop: 1 },
  exportBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
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
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeSent: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  bubbleTimeReceived: { color: '#aaaaaa' },
});

export default MessageDetailScreen;