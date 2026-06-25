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

function readSmsBox(box: string): Promise<SmsMessage[]> {
  return new Promise((resolve, reject) => {
    const filter = { box, maxCount: 15000 };
    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => reject(fail),
      (_count: number, smsList: string) => {
        resolve(JSON.parse(smsList));
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

  // Try exact match
  if (contactsMap[cleaned]) return contactsMap[cleaned];

  // +251XXXXXXXXX → 0XXXXXXXXX
  if (cleaned.startsWith('+251')) {
    const local = '0' + cleaned.slice(4);
    if (contactsMap[local]) return contactsMap[local];
  }

  // 0XXXXXXXXX → +251XXXXXXXXX
  if (cleaned.startsWith('0')) {
    const international = '+251' + cleaned.slice(1);
    if (contactsMap[international]) return contactsMap[international];
    const noPlus = '251' + cleaned.slice(1);
    if (contactsMap[noPlus]) return contactsMap[noPlus];
  }

  // 251XXXXXXXXX → 0XXXXXXXXX
  if (cleaned.startsWith('251') && !cleaned.startsWith('+')) {
    const local = '0' + cleaned.slice(3);
    if (contactsMap[local]) return contactsMap[local];
  }

  // Last 9 digits fuzzy match
  const last9 = cleaned.slice(-9);
  const match = Object.keys(contactsMap).find(k => k.slice(-9) === last9);
  if (match) return contactsMap[match];

  // Fallback to raw address
  return address;
}

export async function getAllConversations(): Promise<Conversation[]> {
  const [inboxMessages, sentMessages, contactsMap] = await Promise.all([
    readSmsBox('inbox'),
    readSmsBox('sent'),
    buildContactsMap(),
  ]);

  const allMessages = [...inboxMessages, ...sentMessages];

  // Group by address
  const grouped: { [address: string]: SmsMessage[] } = {};
  allMessages.forEach(msg => {
    const address = msg.address?.trim();
    if (!address) return;
    if (!grouped[address]) grouped[address] = [];
    grouped[address].push(msg);
  });

  // Build conversations
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
        lastDate: new Date(
          parseInt(sorted[0]?.date)
        ).toLocaleDateString(),
        count: msgs.length,
        messages: sorted,
      };
    }
  );

  // Sort by most recent message
  conversations.sort(
    (a, b) =>
      parseInt(b.messages[0]?.date) - parseInt(a.messages[0]?.date)
  );

  return conversations;
}