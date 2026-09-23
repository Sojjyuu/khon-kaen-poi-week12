import Constants from 'expo-constants';
import { LogBox, Platform } from 'react-native';

// These warnings describe known Expo Go native limitations, not app errors.
// Keep all other warnings and errors visible while developing.
if (__DEV__ && Platform.OS === 'android' && Constants.appOwnership === 'expo') {
  LogBox.ignoreLogs([
    'Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library',
    'expo-notifications: Android Push notifications (remote notifications) functionality',
    '`expo-notifications` functionality is not fully supported in Expo Go',
  ]);
}
