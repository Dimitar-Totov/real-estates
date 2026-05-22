import './globals.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={s.root}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(screens)" options={{ headerShown: false }} />
          <Stack.Screen
            name="property/[id]"
            options={{
              title: 'Property Details',
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#fff',
            }}
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});
