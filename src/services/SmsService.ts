import { PermissionsAndroid } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import Contacts from 'react-native-contacts';

export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  date: string;
  date_sent: string;
  type: number;
  read: number;
}

export interface Conversation {
  address: string;
  name: string;
  lastMessage: string;
  lastDate: string;
  count: number;
  messages: SmsMessage[];
}

let conversationCache: Conversation[] = [];

export function setConversationCache(conversations: Conversation[]): void {
  conversationCache = conversations;
}

export function getConversationCache(): Conversation[] {
  return conversationCache;
}

export function getConversationsByAddresses(
  addresses: string[]
): Conversation[] {
  return addresses
    .map(addr => conversationCache.find(c => c.address === addr))
    .filter((c): c is Conversation => c !== undefined);
}

export async function requestSmsPermission(): Promise<boolean> {
  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    ]);
    return (
      results[PermissionsAndroid.PERMISSIONS.READ_SMS] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.READ_CONTACTS] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
}

async function buildContactsMap(): Promise<{ [phone: string]: string }> {
  try {
    const contacts = await Contacts.getAll();
    const map: { [phone: string]: string } = {};
    contacts.forEach(contact => {
      const name = `${contact.givenName} ${contact.familyName}`.trim();
      contact.phoneNumbers.forEach(p => {
        const normalized = normalizePhone(p.number);
        map[normalized] = name;
      });
    });
    return map;
  } catch {
    return {};
  }
}

function readSmsChunk(
  box: string,
  minDate: number,
  maxDate: number
): Promise<SmsMessage[]> {
  return new Promise((resolve, reject) => {
    const filter = {
      box,
      minDate,
      maxDate,
      maxCount: 10000,
    };
    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => reject(fail),
      (_count: number, smsList: string) => {
        try {
          resolve(JSON.parse(smsList));
        } catch {
          resolve([]);
        }
      }
    );
  });
}

function normalizePhone(phone: string): string {
  return phone
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '');
}

function findContactName(
  address: string,
  contactsMap: { [phone: string]: string }
): string {
  const cleaned = normalizePhone(address);

  if (contactsMap[cleaned]) return contactsMap[cleaned];

  if (cleaned.startsWith('+251')) {
    const local = '0' + cleaned.slice(4);
    if (contactsMap[local]) return contactsMap[local];
  }

  if (cleaned.startsWith('0')) {
    const international = '+251' + cleaned.slice(1);
    if (contactsMap[international]) return contactsMap[international];
    const noPlus = '251' + cleaned.slice(1);
    if (contactsMap[noPlus]) return contactsMap[noPlus];
  }

  if (cleaned.startsWith('251') && !cleaned.startsWith('+')) {
    const local = '0' + cleaned.slice(3);
    if (contactsMap[local]) return contactsMap[local];
  }

  const last9 = cleaned.slice(-9);
  const match = Object.keys(contactsMap).find(k => k.slice(-9) === last9);
  if (match) return contactsMap[match];

  return address;
}

function groupIntoConversations(
  messages: SmsMessage[],
  contactsMap: { [phone: string]: string }
): Conversation[] {
  const grouped: { [address: string]: SmsMessage[] } = {};

  messages.forEach(msg => {
    const address = msg.address?.trim();
    if (!address) return;
    if (!grouped[address]) grouped[address] = [];
    grouped[address].push(msg);
  });

  const conversations: Conversation[] = Object.entries(grouped).map(
    ([address, msgs]) => {
      const sorted = msgs.sort(
        (a, b) => parseInt(b.date) - parseInt(a.date)
      );
      const name = findContactName(address, contactsMap);
      return {
        address,
        name,
        lastMessage: sorted[0]?.body || '',
        lastDate: new Date(parseInt(sorted[0]?.date)).toLocaleDateString(),
        count: msgs.length,
        messages: sorted,
      };
    }
  );

  conversations.sort(
    (a, b) =>
      parseInt(b.messages[0]?.date) - parseInt(a.messages[0]?.date)
  );

  return conversations;
}

export async function getAllConversations(
  onProgress: (found: number) => void
): Promise<Conversation[]> {
  const contactsMap = await buildContactsMap();

  const messageMap = new Map<string, SmsMessage>();
  const CHUNK_MS = 180 * 24 * 60 * 60 * 1000; // 6 months per chunk
  const now = Date.now();
  const oldestDate = new Date('2015-01-01').getTime();

  let currentMax = now;
  let emptyChunks = 0;

  while (currentMax > oldestDate) {
    const currentMin = Math.max(currentMax - CHUNK_MS, oldestDate);

    const [inboxChunk, sentChunk] = await Promise.all([
      readSmsChunk('inbox', currentMin, currentMax),
      readSmsChunk('sent', currentMin, currentMax),
    ]);

    const chunk = [...inboxChunk, ...sentChunk];

    if (chunk.length === 0) {
      emptyChunks++;
      if (emptyChunks >= 2) break;
    } else {
      emptyChunks = 0;
      chunk.forEach(msg => {
        if (msg._id) {
          messageMap.set(msg._id, msg);
        }
      });
      onProgress(messageMap.size);
    }

    currentMax = currentMin;
  }

  const uniqueMessages = Array.from(messageMap.values());
  const conversations = groupIntoConversations(uniqueMessages, contactsMap);
  setConversationCache(conversations);
  return conversations;
}
