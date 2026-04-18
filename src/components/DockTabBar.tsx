import { View, Pressable, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../lib/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TABS = [
  { name: "index", icon: "home-outline", iconActive: "home", label: "Home" },
  { name: "devices", icon: "phone-portrait-outline", iconActive: "phone-portrait", label: "Devices" },
  { name: "transfers", icon: "swap-horizontal-outline", iconActive: "swap-horizontal", label: "Transfer" },
  { name: "pairing", icon: "qr-code-outline", iconActive: "qr-code", label: "Pair" },
  { name: "sessions", icon: "people-outline", iconActive: "people", label: "Sessions" },
] as const;

type IconName = typeof TABS[number]["icon"] | typeof TABS[number]["iconActive"];

function TabItem({ active, icon, iconActive, onPress }: {
  active: boolean;
  icon: IconName;
  iconActive: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabPressable,
        pressed && { transform: [{ scale: 0.88 }] },
      ]}
    >
      <View style={[styles.pill, active && styles.pillActive]}>
        <Ionicons
          name={active ? iconActive : icon}
          size={22}
          color={active ? colors.accent : colors.textSecondary}
        />
      </View>
      {active && <View style={styles.dot} />}
    </Pressable>
  );
}

export default function DockTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.innerBorder}>
          {TABS.map((tab, i) => (
            <TabItem
              key={tab.name}
              active={state.index === i}
              icon={tab.icon}
              iconActive={tab.iconActive}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: state.routes[i].key,
                  canPreventDefault: true,
                });
                if (!event.defaultPrevented) {
                  navigation.navigate(state.routes[i].name);
                }
              }}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  blur: {
    borderRadius: radius.xl,
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  innerBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.xl,
    backgroundColor: colors.glass,
  },
  tabPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  pill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.accentDim,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
});
