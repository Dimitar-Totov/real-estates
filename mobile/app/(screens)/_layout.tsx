import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    try { await logout(); } catch {}
    router.replace('/');
  }

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      {user ? (
        <DrawerItem
          label="Sign Out"
          onPress={handleSignOut}
          labelStyle={{ color: '#ccc' }}
        />
      ) : (
        <DrawerItem
          label="Sign In"
          onPress={() => router.push('/(screens)/auth')}
          labelStyle={{ color: '#ccc' }}
        />
      )}
    </DrawerContentScrollView>
  );
}

export default function ScreensLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
      <Drawer.Screen name="auth" options={{ title: 'Sign In', drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
