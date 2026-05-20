import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Drawer
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          drawerStyle: { backgroundColor: '#1a1a2e' },
          drawerActiveTintColor: '#e8c97e',
          drawerInactiveTintColor: '#ccc',
        }}
      >
        <Drawer.Screen name="index" options={{ drawerLabel: 'Home', title: 'Real Estates' }} />
        <Drawer.Screen name="listings/index" options={{ drawerLabel: 'All Properties', title: 'All Properties' }} />
        <Drawer.Screen name="listings/new" options={{ drawerLabel: 'New Listings', title: 'New Listings' }} />
        <Drawer.Screen name="listings/luxury" options={{ drawerLabel: 'Luxury Homes', title: 'Luxury Homes' }} />
        <Drawer.Screen name="listings/affordable" options={{ drawerLabel: 'Affordable Homes', title: 'Affordable Homes' }} />
        <Drawer.Screen name="listings/houses" options={{ drawerLabel: 'Houses', title: 'Houses' }} />
        <Drawer.Screen name="listings/apartments" options={{ drawerLabel: 'Apartments', title: 'Apartments' }} />
        <Drawer.Screen name="listings/developments" options={{ drawerLabel: 'New Developments', title: 'New Developments' }} />
        <Drawer.Screen name="properties/new" options={{ drawerLabel: 'List Your Property', title: 'List Your Property' }} />
        <Drawer.Screen name="agents/index" options={{ drawerLabel: 'Find an Agent', title: 'Find an Agent' }} />
        <Drawer.Screen name="agents/top-rated" options={{ drawerLabel: 'Top-Rated Agents', title: 'Top-Rated Agents' }} />
        <Drawer.Screen name="agents/featured" options={{ drawerLabel: 'Featured Agents', title: 'Featured Agents' }} />
        <Drawer.Screen name="feed" options={{ drawerLabel: 'Feed', title: 'Feed' }} />
        <Drawer.Screen name="messages" options={{ drawerLabel: 'Messages', title: 'Messages' }} />
        <Drawer.Screen name="auth" options={{ drawerLabel: 'Sign In', title: 'Sign In' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
