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
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="devices" options={{ title: "Devices" }} />
      <Tabs.Screen name="transfers" options={{ title: "Transfers" }} />
      <Tabs.Screen name="pairing" options={{ title: "Pair" }} />
      <Tabs.Screen name="sessions" options={{ title: "Sessions" }} />
    </Tabs>
  );
}
