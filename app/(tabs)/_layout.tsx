import { Tabs } from "expo-router";
import DockTabBar from "../../src/components/DockTabBar";
import { colors } from "../../src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DockTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Main dock tabs (visible in dock) */}
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transfers" options={{ title: "Transfers" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="network" options={{ title: "Network" }} />
      <Tabs.Screen name="files" options={{ title: "Files" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* Hidden tabs (accessible via navigation, not shown in dock) */}
      <Tabs.Screen name="devices" options={{ title: "Devices", href: null }} />
      <Tabs.Screen name="pairing" options={{ title: "Pair", href: null }} />
      <Tabs.Screen name="sessions" options={{ title: "Sessions", href: null }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", href: null }} />
    </Tabs>
  );
}
