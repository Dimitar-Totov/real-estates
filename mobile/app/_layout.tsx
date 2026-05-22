import './globals.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={s.root}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
