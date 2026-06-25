import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ConversationListScreen from './src/screens/ConversationListScreen';
import ExportOptionsScreen from './src/screens/ExportOptionsScreen';
import ExportProgressScreen from './src/screens/ExportProgressScreen';
import ExportHistoryScreen from './src/screens/ExportHistoryScreen';
import PrivacySettingsScreen from './src/screens/PrivacySettingsScreen';
import MessageDetailScreen from './src/screens/MessageDetailScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ConversationList" component={ConversationListScreen} />
          <Stack.Screen name="ExportOptions" component={ExportOptionsScreen} />
          <Stack.Screen name="ExportProgress" component={ExportProgressScreen} />
          <Stack.Screen name="ExportHistory" component={ExportHistoryScreen} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
          <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;