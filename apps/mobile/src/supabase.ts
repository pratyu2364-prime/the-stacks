import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createStacksClient, type StacksStorage } from '@stacks/data';

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Tokens live in the Android Keystore, not in plain app storage: a password
 * session readable by anything on the device is the one thing here worth
 * getting right.
 */
const secureStorage: StacksStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createStacksClient({
  url: String(extra.supabaseUrl ?? ''),
  anonKey: String(extra.supabaseAnonKey ?? ''),
  storage: secureStorage,
});