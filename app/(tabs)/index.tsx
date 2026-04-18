import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/auth";
import { useDevices } from "../../src/features/devices/hooks/useDevices";
import { DeviceType } from "../../src/features/devices/types";
import { useSessions } from "../../src/features/sessions/hooks/useSessions";
import { useNodeTransfers } from "../../src/features/transfer/hooks/useTransfers";
import { getStoredDeviceId } from "../../src/lib/device";
import { TransferStatus } from "../../src/features/transfer/types";
import { colors, spacing, radius } from "../../src/lib/theme";
import { useState, useEffect, useCallback } from "react";

function StatCard({ icon, label, value, color, onPress }: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: devices, isLoading: devicesLoading, refetch: refetchDevices } = useDevices();
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = useSessions();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const { data: transfers, refetch: refetchTransfers } = useNodeTransfers(nodeId || "");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getStoredDeviceId().then(setNodeId);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDevices(), refetchSessions(), refetchTransfers()]);
    setRefreshing(false);
  }, []);

  const approvedDevices = devices?.filter((d) => d.is_approved) || [];
  const pendingDevices = devices?.filter((d) => !d.is_approved && !d.is_revoked) || [];
  const activeSessions = sessions?.filter((s) => s.is_active) || [];
  const activeTransfers = transfers?.filter(
    (t) => t.status === TransferStatus.PENDING || t.status === TransferStatus.IN_PROGRESS
  ) || [];
  const completedTransfers = transfers?.filter((t) => t.status === TransferStatus.COMPLETED) || [];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.hello}>Welcome back</Text>
          <Text style={styles.username}>{user?.username || "—"}</Text>
        </View>
        <Pressable style={styles.avatarCircle} onPress={logout}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || "V"}</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="phone-portrait"
          label="Devices"
          value={approvedDevices.length}
          color={colors.accent}
          onPress={() => router.push("/(tabs)/devices")}
        />
        <StatCard
          icon="time"
          label="Pending"
          value={pendingDevices.length}
          color={colors.warning}
          onPress={() => router.push("/(tabs)/devices")}
        />
        <StatCard
          icon="people"
          label="Sessions"
          value={activeSessions.length}
          color={colors.success}
          onPress={() => router.push("/(tabs)/sessions")}
        />
        <StatCard
          icon="swap-horizontal"
          label="Active"
          value={activeTransfers.length}
          color="#60a5fa"
          onPress={() => router.push("/(tabs)/transfers")}
        />
      </View>

      {activeTransfers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Transfers</Text>
            <Pressable onPress={() => router.push("/(tabs)/transfers")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {activeTransfers.slice(0, 3).map((t) => (
            <View key={t.transfer_id} style={styles.transferItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.transferName} numberOfLines={1}>{t.filename}</Text>
                <Text style={styles.transferMeta}>
                  {(t.total_size_bytes / 1024).toFixed(0)} KB
                </Text>
              </View>
              <View style={styles.transferRight}>
                <View style={styles.miniProgress}>
                  <View style={[styles.miniProgressFill, { width: `${t.progress_percent}%` }]} />
                </View>
                <Text style={styles.transferPercent}>{t.progress_percent}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {approvedDevices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Devices</Text>
            <Pressable onPress={() => router.push("/(tabs)/devices")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {approvedDevices.slice(0, 4).map((d) => (
            <View key={d.device_id} style={styles.deviceItem}>
              <View style={styles.deviceIcon}>
                <Ionicons
                  name={d.device_type === DeviceType.PHONE ? "phone-portrait" : d.device_type === DeviceType.TABLET ? "tablet-portrait" : "desktop"}
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Text style={styles.deviceMeta}>
                  {d.last_active ? new Date(d.last_active).toLocaleDateString() : "Never active"}
                </Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionCard} onPress={() => router.push("/(tabs)/pairing")}>
            <Ionicons name="qr-code" size={20} color={colors.accent} />
            <Text style={styles.actionLabel}>Pair Device</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push("/(tabs)/transfers")}>
            <Ionicons name="cloud-upload" size={20} color={colors.success} />
            <Text style={styles.actionLabel}>Send File</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push("/(tabs)/sessions")}>
            <Ionicons name="add-circle" size={20} color="#60a5fa" />
            <Text style={styles.actionLabel}>New Session</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  hello: { fontSize: 14, color: colors.textSecondary },
  username: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.accent },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  seeAll: { fontSize: 13, color: colors.accent, fontWeight: "500" },
  transferItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  transferName: { fontSize: 14, fontWeight: "500", color: colors.text },
  transferMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  transferRight: { alignItems: "flex-end", marginLeft: 12 },
  miniProgress: {
    width: 60,
    height: 3,
    backgroundColor: colors.inputBg,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniProgressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 2 },
  transferPercent: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceName: { fontSize: 14, fontWeight: "500", color: colors.text },
  deviceMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    gap: 6,
  },
  actionLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.15)",
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.sm,
  },
  logoutText: { color: colors.error, fontWeight: "600", fontSize: 14 },
});
