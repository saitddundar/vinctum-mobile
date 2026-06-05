import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/auth";
import { useDevices } from "../../src/features/devices/hooks/useDevices";
import { useSessions } from "../../src/features/sessions/hooks/useSessions";
import { useNodeTransfers } from "../../src/features/transfer/hooks/useTransfers";
import { getStoredDeviceId } from "../../src/lib/device";
import { TransferStatus } from "../../src/features/transfer/types";
import { colors, spacing, radius } from "../../src/lib/theme";
import { useState, useEffect, useCallback } from "react";
import { useTransferEvents } from "../../src/features/transfer/hooks/useTransferEvents";
import {
  IncomingTransferBanner,
  useIncomingTransfers,
} from "../../src/components/IncomingTransferBanner";
import { useRespondToTransfer } from "../../src/features/friends/hooks/useFriends";
import { useDownload } from "../../src/features/transfer/hooks/useDownload";
import {
  useActivityHeatmap,
  useTransferSpeed,
} from "../../src/features/transfer/hooks/useTransferMetrics";
import { toast } from "../../src/lib/toast";
import type { Transfer } from "../../src/features/transfer/types";
import ActivityHeatmap from "../../src/components/ActivityHeatmap";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatSpeed(bytesPerSec?: number) {
  if (!bytesPerSec) return "0 B/s";
  return `${formatSize(bytesPerSec)}/s`;
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function TransferRow({
  name,
  speed,
  percent,
}: {
  name: string;
  speed: string;
  percent: number;
}) {
  return (
    <View style={styles.transferRow}>
      <View style={styles.transferMeta}>
        <Text style={styles.transferName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.transferSpeed}>{speed}</Text>
      </View>
      <View style={styles.transferRight}>
        <Text style={styles.transferPercent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${percent}%` as any }]}
        />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    data: devices,
    isLoading: devicesLoading,
    refetch: refetchDevices,
  } = useDevices();
  const {
    data: sessions,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useSessions();
  const [nodeId, setNodeId] = useState<string | null>(null);
  const { data: transfers, refetch: refetchTransfers } = useNodeTransfers(
    nodeId || ""
  );
  const { data: activityDays = [], refetch: refetchActivity } =
    useActivityHeatmap(nodeId);
  const { data: speed, refetch: refetchSpeed } = useTransferSpeed(nodeId);
  const [refreshing, setRefreshing] = useState(false);
  const downloadHook = useDownload();
  const respondTransfer = useRespondToTransfer();
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);

  const handleDownload = useCallback(
    (t: Transfer) => {
      setActiveDownloadId(t.transfer_id);
      downloadHook
        .download(t.transfer_id, t.sender_ephemeral_pubkey, t.filename, t.wrapped_file_key)
        .then((path) => toast.success(`Saved: ${path.split("/").pop()}`))
        .catch((e: any) => toast.error(e?.message || "Download failed"))
        .finally(() => setActiveDownloadId(null));
    },
    [downloadHook]
  );

  const handleRespond = useCallback(
    (transfer: Transfer, accept: boolean) => {
      respondTransfer.mutate(
        { transferId: transfer.transfer_id, receiverNodeId: transfer.receiver_node_id, accept },
        {
          onSuccess: () => toast.success(accept ? "Transfer accepted" : "Transfer rejected"),
          onError: () => toast.error("Failed to respond"),
        }
      );
    },
    [respondTransfer]
  );

  const { incoming, handleEvent, dismiss } = useIncomingTransfers(nodeId, {
    onDownload: handleDownload,
    onDismiss: () => {},
  });

  useTransferEvents(nodeId, { onEvent: handleEvent });

  useEffect(() => {
    getStoredDeviceId().then(setNodeId);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDevices(),
      refetchSessions(),
      refetchTransfers(),
      refetchActivity(),
      refetchSpeed(),
    ]);
    setRefreshing(false);
  }, [
    refetchDevices,
    refetchSessions,
    refetchTransfers,
    refetchActivity,
    refetchSpeed,
  ]);

  const approvedDevices = devices?.filter((d) => d.is_approved) || [];
  const pendingDevices =
    devices?.filter((d) => !d.is_approved && !d.is_revoked) || [];
  const activeSessions = sessions?.filter((s) => s.is_active) || [];
  const activeTransfers =
    transfers?.filter(
      (t) =>
        t.status === TransferStatus.PENDING ||
        t.status === TransferStatus.IN_PROGRESS
    ) || [];
  const completedTransfers =
    transfers?.filter((t) => t.status === TransferStatus.COMPLETED) || [];

  const totalDataBytes = completedTransfers.reduce(
    (acc, t) => acc + t.total_size_bytes,
    0
  );

  const quickActions = [
    {
      icon: "paper-plane-outline" as const,
      label: "Send",
      color: colors.accent,
      route: "/(tabs)/transfers" as const,
    },
    {
      icon: "shield-outline" as const,
      label: "Pair",
      color: colors.accent,
      route: "/(tabs)/pairing" as const,
    },
    {
      icon: "pulse-outline" as const,
      label: "Health",
      color: colors.warning,
      route: "/(tabs)/network" as const,
    },
    {
      icon: "people-outline" as const,
      label: "Sessions",
      color: colors.orange,
      route: "/(tabs)/sessions" as const,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      {/* Incoming transfer banner */}
      <IncomingTransferBanner
        transfers={incoming}
        onDownload={handleDownload}
        onDismiss={dismiss}
        onAccept={(t) => handleRespond(t, true)}
        onReject={(t) => handleRespond(t, false)}
      />

      <ActivityHeatmap days={activityDays} />

      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSub}>
            {approvedDevices.length} devices · {activeTransfers.length} active
            transfers
          </Text>
        </View>
        <Pressable
          style={styles.avatarCircle}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.avatarText}>
            {user?.username?.[0]?.toUpperCase() || "V"}
          </Text>
        </Pressable>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="ACTIVE"
          value={activeTransfers.length}
          color={colors.accent}
        />
        <StatCard
          label="WEEK"
          value={completedTransfers.length + activeTransfers.length}
          color={colors.blue}
        />
        <StatCard
          label="DATA"
          value={formatSize(totalDataBytes)}
          color={colors.purple}
        />
        <StatCard
          label="SPEED"
          value={formatSpeed(speed?.bytes_per_sec)}
          color={colors.warning}
        />
      </View>

      {/* Live Transfers */}
      {activeTransfers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live transfers</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          {activeTransfers.slice(0, 3).map((t) => (
            <TransferRow
              key={t.transfer_id}
              name={t.filename}
              speed={""}
              percent={t.progress_percent}
            />
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as any)}
            >
              <Ionicons name={a.icon} size={22} color={a.color} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Devices Summary */}
      {approvedDevices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your devices</Text>
            <Pressable onPress={() => router.push("/(tabs)/devices")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {approvedDevices.slice(0, 3).map((d) => (
            <View key={d.device_id} style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Ionicons
                  name="desktop-outline"
                  size={15}
                  color={colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{d.name}</Text>
                <Text style={styles.deviceMeta} numberOfLines={1}>
                  {d.node_id?.slice(0, 12) || "—"}
                </Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.md, paddingBottom: 120 },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSub: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.accent },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
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
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statValue: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },

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
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 13, color: colors.accent, fontWeight: "500" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.5,
  },

  transferRow: { marginBottom: 14 },
  transferMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  transferName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  transferSpeed: { fontSize: 12, color: colors.textSecondary },
  transferRight: { position: "absolute", right: 0, top: 0 },
  transferPercent: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  progressTrack: {
    height: 3,
    backgroundColor: colors.inputBg,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
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
  deviceName: { fontSize: 13, fontWeight: "600", color: colors.text },
  deviceMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "monospace" as any,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});
