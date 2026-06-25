import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
};

function DrawerMenu({ visible, onClose, onNavigate }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.drawer}>

              {/* App header */}
              <View style={styles.drawerHeader}>
                <Text style={styles.appName}>SMS Exporter</Text>
                <Text style={styles.appVersion}>v1.0.0</Text>
              </View>

              {/* Tools section */}
              <Text style={styles.sectionLabel}>TOOLS</Text>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => { onClose(); onNavigate('ExportHistory'); }}
              >
                <View style={[styles.itemIcon, { backgroundColor: '#E1F5EE' }]}>
                  <Text>🕐</Text>
                </View>
                <View>
                  <Text style={styles.itemLabel}>Export history</Text>
                  <Text style={styles.itemSub}>View past exports</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Preferences section */}
              <Text style={styles.sectionLabel}>PREFERENCES</Text>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => { onClose(); onNavigate('PrivacySettings'); }}
              >
                <View style={[styles.itemIcon, { backgroundColor: '#f5f5f5' }]}>
                  <Text>🔒</Text>
                </View>
                <View>
                  <Text style={styles.itemLabel}>Privacy settings</Text>
                  <Text style={styles.itemSub}>Data & permissions</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem}>
                <View style={[styles.itemIcon, { backgroundColor: '#f5f5f5' }]}>
                  <Text>⚙️</Text>
                </View>
                <View>
                  <Text style={styles.itemLabel}>App settings</Text>
                  <Text style={styles.itemSub}>Format defaults</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Danger */}
              <TouchableOpacity style={styles.drawerItem}>
                <View style={[styles.itemIcon, { backgroundColor: '#FCEBEB' }]}>
                  <Text>🗑️</Text>
                </View>
                <View>
                  <Text style={[styles.itemLabel, { color: '#A32D2D' }]}>Clear all data</Text>
                  <Text style={styles.itemSub}>Delete export history</Text>
                </View>
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
  },
  drawer: {
    width: '75%',
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 30,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    marginBottom: 8,
  },
  appName: { fontSize: 17, fontWeight: '600', color: '#111111' },
  appVersion: { fontSize: 12, color: '#aaaaaa', marginTop: 2 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#aaaaaa',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 14, color: '#111111', fontWeight: '500' },
  itemSub: { fontSize: 11, color: '#aaaaaa', marginTop: 1 },
  divider: { height: 0.5, backgroundColor: '#eeeeee', marginVertical: 6 },
});

export default DrawerMenu;