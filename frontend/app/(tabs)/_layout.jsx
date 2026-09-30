import { Tabs } from 'expo-router';
import BottomNav from '../../src/components/layout/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}
