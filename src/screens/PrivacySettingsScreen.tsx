import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { commonStyles } from '../styles/common';

function PrivacySettingsScreen({ navigation }: any) {
  const [readContacts, setReadContacts] = useState(true);
  const [localOnly, setLocalOnly] = useState(true);
  const [blurNumbers, setBlurNumbers] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [analytics, setAnalytics] = useState(false);

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
        <Text style={commonStyles.headerTitle}>Privacy settings</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView>
        {[
          {
            label: 'Read contacts',
            desc: 'Show real names instead of phone numbers',
            value: readContacts,
            setter: setReadContacts,
          },
          {
            label: 'Save exports locally only',
            desc: 'Never share files outside this device',
            value: localOnly,
            setter: setLocalOnly,
          },
          {
            label: 'Blur phone numbers in PDF',
            desc: 'Hide numbers when sharing screenshots',
            value: blurNumbers,
            setter: setBlurNumbers,
          },
          {
            label: 'Auto-delete exports after 7 days',
            desc: 'Keep storage clean automatically',
            value: autoDelete,
            setter: setAutoDelete,
          },
          {
            label: 'Analytics',
            desc: 'Help improve the app anonymously',
            value: analytics,
            setter: setAnalytics,
          },
        ].map((setting, index) => (
          <View key={index} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{setting.label}</Text>
              <Text style={styles.settingDesc}>{setting.desc}</Text>
            </View>
            <Switch
              value={setting.value}
              onValueChange={setting.setter}
              trackColor={{ false: '#e0e0e0', true: '#1D9E75' }}
              thumbColor="#ffffff"
            />
          </View>
        ))}

        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>Danger zone</Text>
          <TouchableOpacity style={styles.dangerBtn}>
            <Icon name="trash-can-outline" size={18} color="#A32D2D" />
            <Text style={styles.dangerBtnText}>Delete all exported files</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: { flex: 1, paddingRight: 12 },
  settingLabel: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '500',
    marginBottom: 3,
  },
  settingDesc: { fontSize: 12, color: '#aaaaaa' },
  dangerZone: {
    margin: 16,
    backgroundColor: '#FCEBEB',
    borderRadius: 12,
    padding: 14,
  },
  dangerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A32D2D',
    marginBottom: 10,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: '#F09595',
  },
  dangerBtnText: { fontSize: 13, color: '#A32D2D' },
});

export default PrivacySettingsScreen;
