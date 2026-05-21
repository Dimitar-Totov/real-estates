import { Drawer } from 'expo-router/drawer';

export default function ScreensLayout() {
  return (
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
      <Drawer.Screen name="properties/new" options={{ drawerLabel: 'List Your Property', title: 'List Your Property' }} />
      <Drawer.Screen name="agents/index" options={{ drawerLabel: 'Find an Agent', title: 'Find an Agent' }} />
      <Drawer.Screen name="feed" options={{ drawerLabel: 'Feed', title: 'Feed' }} />
      <Drawer.Screen name="auth" options={{ drawerLabel: 'Sign In', title: 'Sign In' }} />
    </Drawer>
  );
}
