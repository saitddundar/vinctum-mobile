import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBiometricStore } from "../../src/store/biometric";
import { registerForPushNotifications } from "../../src/lib/notifications";
import { API_BASE_URL } from "../../src/api/client";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";
import * as Notifications from "expo-notifications";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isEnabled: biometricEnabled, isSupported, enable, disable } = useBiometricStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === "granted");
    });
  }, []);

  const toggleBiometric = async () => {
    if (biometricEnabled) {
      await disable();
      toast.info("Face ID disabled");
    } else {
      const ok = await enable();
      if (ok) toast.success("Face ID enabled");
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      Linking.openSettings();
    } else {
      const token = await registerForPushNotifications();
      if (token) {
        setNotificationsEnabled(true);
        toast.success("Notifications enabled");
      } else {
        Linking.openSettings();
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Settings</Text>

      {/* Security */}
      <Text style={styles.sectionLabel}>Security</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="scan-outline" size={18} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Face ID</Text>
              <Text style={styles.rowSub}>
                {isSupported ? "Lock app when backgrounded" : "Not available on this device"}
              </Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            disabled={!isSupported}
            trackColor={{ false: colors.inputBorder, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: "rgba(251,191,36,0.12)" }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Transfer alerts and friend requests</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.inputBorder, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Connection */}
      <Text style={styles.sectionLabel}>Connection</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: "rgba(52,211,153,0.12)" }]}>
              <Ionicons name="server-outline" size={18} color={colors.success} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Gateway</Text>
              <Text style={styles.rowSub}>{API_BASE_URL}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionLabel}>About</Text>
      <View style={styles.card}>
        <InfoRow label="App" value="Vinctum Mobile" />
        <View style={styles.divider} />
        <InfoRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <InfoRow label="Platform" value="React Native + Expo" />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: "500" },
});
