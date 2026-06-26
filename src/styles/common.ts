import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  screenHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
  },
  headerTitleLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  headerSpacer: {
    width: 38,
  },
});
