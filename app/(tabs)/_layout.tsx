import { Tabs } from "expo-router";
import DockTabBar from "../../src/components/DockTabBar";
import { colors } from "../../src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DockTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="devices" options={{ title: "Cihazlar" }} />
      <Tabs.Screen name="transfers" options={{ title: "Transfer" }} />
      <Tabs.Screen name="pairing" options={{ title: "Eşleştir" }} />
      <Tabs.Screen name="sessions" options={{ title: "Oturumlar" }} />
    </Tabs>
  );
}
