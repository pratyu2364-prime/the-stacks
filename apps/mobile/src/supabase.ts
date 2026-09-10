/**
 * supabase-js builds request URLs with the WHATWG URL API, which React
 * Native does not implement completely. Without this polyfill, loaded before
 * the client is created, getSession can hang and leave the app on a blank
 * screen with no error to show for it.
 */
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createStacksClient, type StacksStorage } from '@stacks/data';
import { createChunkedStorage } from './chunkedStorage';

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Tokens live in the Android Keystore, not in plain app storage: a password
 * session readable by anything on the device is the one thing here worth
 * getting right.
 */
const secureStorage: StacksStorage = createChunkedStorage(SecureStore);

export const supabase = createStacksClient({
  url: String(extra.supabaseUrl ?? ''),
  anonKey: String(extra.supabaseAnonKey ?? ''),
  storage: secureStorage,
});