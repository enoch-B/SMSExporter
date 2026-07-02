# SMS Exporter

A fast, privacy-focused Android app that exports your SMS conversations 
to PDF or CSV — built with React Native CLI and TypeScript.

---

## Why SMS Exporter?

Your text messages are irreplaceable. Conversations with your partner, 
family, and friends represent years of memories. If your phone is lost, 
stolen, or dies suddenly — those messages are gone forever.

SMS Exporter gives you a clean, readable backup of every conversation 
you care about, saved directly to your Downloads folder.

---

## Features

### Core
- Export SMS conversations to **PDF** or **CSV**
- Beautiful chat-bubble PDF layout (sent messages right, received left)
- Date separators between days
- Multi-conversation export — select multiple contacts at once
- Accurate message count (inbox + sent combined)

### Smart Loading
- Loads conversation list instantly with no full message scan
- Shows last 20 messages immediately when you open a conversation
- Full message history loads silently in the background
- No double loading screens

### Message Detail
- Full chat bubble view of any conversation
- **Search inside messages** with keyword highlighting
- Match count displayed ("12 of 340 matches")
- Jump to first message / latest message buttons
- Export directly from the conversation view

### Export Options
- Choose format: PDF or CSV
- Filter by date range: All time, Last 30 days, Last 90 days, Custom
- Summary card showing message count and estimated output before export
- Real-time progress with live message counter and log

### Privacy & Security
- All processing happens **on your device** — no data leaves your phone
- No internet connection required
- No analytics or tracking (optional, off by default)
- Privacy settings: blur phone numbers, local-only saves, auto-delete exports

### History & Management
- Export history with file size, date, and status
- Share exported files directly from the app
- Retry failed exports
- Clear individual records or entire history

---

## Screenshots

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native CLI 0.86.0 |
| Language | TypeScript |
| Navigation | @react-navigation/native-stack |
| SMS Reading | react-native-get-sms-android |
| Contacts | react-native-contacts |
| PDF Generation | react-native-html-to-pdf |
| File System | react-native-fs |
| Icons | react-native-vector-icons (MaterialCommunityIcons) |
| Storage | AsyncStorage |

---

## Architecture

``` 
src/
├── screens/
│   ├── ConversationListScreen.tsx   # Main conversation list with search
│   ├── MessageDetailScreen.tsx      # Chat bubble view with search
│   ├── ExportOptionsScreen.tsx      # Format and date range selection
│   ├── ExportProgressScreen.tsx     # Live export progress
│   ├── ExportHistoryScreen.tsx      # Past exports with AsyncStorage
│   └── PrivacySettingsScreen.tsx    # Privacy toggles
├── services/
│   ├── SmsService.ts               # SMS reading and contact resolution
│   └── PdfService.ts               # PDF/CSV generation and file saving
├── components/
│   └── DrawerMenu.tsx              # Side navigation drawer (Modal-based)
└── styles/
└── common.ts                   # Shared design tokens and styles
```


### PDF Generation

Messages are sorted chronologically (inbox + sent interleaved by timestamp), 
converted to HTML with chat bubble styling, then rendered to PDF using 
the device's built-in PDF engine. The file is saved to your Downloads folder.

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- JDK 17
- Android Studio (for SDK and emulator)
- Android device or emulator running Android 6.0+

### Install

```bash
git clone https://github.com/enoch-B/sms-exporter
cd sms-exporter
npm install
```

### Run on device

```bash
# Terminal 1 — start Metro bundler
npx react-native start

# Terminal 2 — build and install
npx react-native run-android
```

### First run

The app will request two permissions on first launch:
- **Read SMS** — required to access your messages
- **Read Contacts** — required to show contact names instead of phone numbers

---

## Permissions

| Permission | Why |
|---|---|
| `READ_SMS` | Read your SMS messages for export |
| `READ_CONTACTS` | Resolve phone numbers to contact names |
| `WRITE_EXTERNAL_STORAGE` | Save exported files to Downloads folder |
| `READ_EXTERNAL_STORAGE` | Access saved export files |

All permissions are requested at runtime. The app functions with SMS 
permission only — contacts permission is optional but recommended.

---

## Known Limitations

- **Android only** — iOS locks down SMS access entirely
- **MMS not supported** — images and media in messages are not exported
- **Large conversations** — exporting 40,000+ messages to PDF takes 
  2-5 minutes depending on device speed
- **Data lag** — messages appear as sent to contacts that are not in 
  your phonebook show as phone numbers

---

## Performance Notes

| Metric | Value |
|---|---|
| Conversation list load time | ~3-8 seconds (first load) |
| Messages held in memory (list view) | 20 per conversation |
| Max tested message count | 42,000+ messages |
| PDF generation (1,000 messages) | ~10 seconds |
| PDF generation (42,000 messages) | ~3-5 minutes |

---

## Design System

| Token | Value |
|---|---|
| Primary | `#1D9E75` |
| Background | `#ffffff` |
| Text Primary | `#111111` |
| Text Secondary | `#888888` |
| Border | `#e0e0e0` |
| Success | `#E1F5EE` / `#0F6E56` |
| Error | `#FCEBEB` / `#A32D2D` |
| Border radius | `10-12px` |

---

## Roadmap

- [ ] Scheduled auto-backup (weekly/monthly)
- [ ] Google Drive upload after export
- [ ] Conversation stats (sent vs received, most active month)
- [ ] PIN lock / biometric protection
- [ ] Password protected PDF export
- [ ] Multiple PDF themes (document style, minimal)
- [ ] WhatsApp chat export parser
- [ ] Dual SIM support

---

## Developer

**Henok Birhanu**  

- GitHub: [@enoch-B](https://github.com/enoch-B)  
- Portfolio: [henok-birhanu.vercel.app](https://henok-dev.vercel.app)

---

## License

MIT License — free to use, modify, and distribute.

---

## Acknowledgements

Built to solve a real problem — 42,000 messages worth of memories 
deserve a proper backup.