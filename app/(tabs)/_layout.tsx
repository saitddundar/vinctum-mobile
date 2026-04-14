import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="devices" options={{ title: "Cihazlar" }} />
      <Tabs.Screen name="pairing" options={{ title: "Eşleştir" }} />
      <Tabs.Screen name="transfers" options={{ title: "Transfer" }} />
    </Tabs>
  );
}
