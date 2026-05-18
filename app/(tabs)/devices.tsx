import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useDevices,
  useRevokeDevice,
} from "../../src/features/devices/hooks/useDevices";
import { useApprovePairing } from "../../src/features/devices/hooks/usePairing";
import { Device, DeviceType } from "../../src/features/devices/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

const typeIcon: Record<DeviceType, keyof typeof Ionicons.glyphMap> = {
  [DeviceType.PC]: "desktop-outline",
  [DeviceType.PHONE]: "phone-portrait-outline",
  [DeviceType.TABLET]: "tablet-portrait-outline",
};

function PairingRequestCard({
  device,
  onApprove,
  onReject,
  approving,
}: {
  device: Device;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}) {
  // Show last 6 chars of device_id as pairing code
  const code = device.device_id
    .replace(/-/g, "")
    .slice(-6)
    .toUpperCase()
    .split("")
    .join(" ");

  return (
    <View style={styles.pairingCard}>
      <View style={styles.pairingHeader}>
        <View style={styles.pairingIconWrap}>
          <Ionicons name="flash" size={18} color={colors.warning} />
        </View>
        <View>
          <Text style={styles.pairingTitle}>Pairing request</Text>
          <Text style={styles.pairingDeviceName}>{device.name}</Text>
        </View>
      </View>

      <Text style={styles.pairingCode}>{code}</Text>

      <View style={styles.pairingActions}>
        <Pressable
          style={[styles.rejectBtn, approving && styles.disabled]}
          onPress={onReject}
          disabled={approving}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
        <Pressable
          style={[styles.approveBtn, approving && styles.disabled]}
          onPress={onApprove}
          disabled={approving}
        >
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DeviceCard({
  device,
  isSelf,
  onRevoke,
}: {
  device: Device;
  isSelf: boolean;
  onRevoke: (id: string) => void;
}) {
  const shortKey = device.node_id
    ? device.node_id.slice(0, 10)
    : device.device_id.slice(0, 10);

  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceCardTop}>
        <View style={styles.deviceIconWrap}>
          <Ionicons
            name={typeIcon[device.device_type]}
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.deviceNameRow}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {device.name}
            </Text>
            {isSelf && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.deviceOS}>
            {device.device_type === DeviceType.PC
              ? "Desktop / PC"
              : device.device_type === DeviceType.PHONE
              ? "Mobile Device"
              : "Tablet"}
          </Text>
        </View>
      </View>

      {/* Node ID */}
      <View style={styles.nodeIdRow}>
        <Ionicons name="key-outline" size={11} color={colors.textMuted} />
        <Text style={styles.nodeId}>{shortKey}…</Text>
      </View>

      {/* Stats */}
      <View style={styles.deviceStats}>
        <View style={styles.onlineDot} />
        <Text style={styles.statText}>
          ↑ 12.4 GB {"  "}↓ 3.1 GB
        </Text>
      </View>

      {!isSelf && device.is_approved && !device.is_revoked && (
        <Pressable
          style={styles.revokeRow}
          onPress={() => onRevoke(device.device_id)}
        >
          <Text style={styles.revokeText}>Revoke access</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selfDeviceId, setSelfDeviceId] = useState<string | null>(null);
  const { data: devices, isLoading, refetch } = useDevices();
  const revoke = useRevokeDevice();
  const approve = useApprovePairing();

  useEffect(() => {
    getStoredDeviceId().then(setSelfDeviceId);
  }, []);

  const handleRevoke = (id: string) => {
    Alert.alert("Revoke Device", "This device will lose access. Continue?", [
      { text: "Cancel" },
      {
        text: "Revoke",
        style: "destructive",
        onPress: () => revoke.mutate(id),
      },
    ]);
  };

  const handleApprove = (pendingId: string, doApprove: boolean) => {
    if (!selfDeviceId) {
      toast.error("Could not resolve this device's ID");
      return;
    }
    approve.mutate(
      {
        approver_device_id: selfDeviceId,
        pending_device_id: pendingId,
        approve: doApprove,
      },
      {
        onSuccess: () =>
          toast.success(doApprove ? "Device approved" : "Device rejected"),
        onError: (e: any) =>
          toast.error(e?.response?.data?.error || "Operation failed"),
      }
    );
  };

  const approved = devices?.filter((d) => d.is_approved && !d.is_revoked) || [];
  const pending = devices?.filter((d) => !d.is_approved && !d.is_revoked) || [];

  type ListItem =
    | { type: "pending"; device: Device }
    | { type: "approved"; device: Device };

  const listData: ListItem[] = [
    ...pending.map((d) => ({ type: "pending" as const, device: d })),
    ...approved.map((d) => ({ type: "approved" as const, device: d })),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.header}>Devices</Text>
          <Text style={styles.headerSub}>
            {approved.length} online · {pending.length} pending
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/(tabs)/pairing")}
        >
          <Ionicons name="add" size={22} color={colors.bg} />
        </Pressable>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.device.device_id}
        renderItem={({ item }) => {
          if (item.type === "pending") {
            return (
              <PairingRequestCard
                device={item.device}
                onApprove={() => handleApprove(item.device.device_id, true)}
                onReject={() => handleApprove(item.device.device_id, false)}
                approving={approve.isPending}
              />
            );
          }
          return (
            <DeviceCard
              device={item.device}
              isSelf={item.device.device_id === selfDeviceId}
              onRevoke={handleRevoke}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons
              name="phone-portrait-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.empty}>
              {isLoading ? "Loading..." : "No registered devices"}
            </Text>
          </View>
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  // Pairing request card
  pairingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.warning + "60",
    padding: spacing.md,
    marginBottom: 12,
  },
  pairingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  pairingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warningDim,
    alignItems: "center",
    justifyContent: "center",
  },
  pairingTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
  pairingDeviceName: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  pairingCode: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 20,
    fontVariant: ["tabular-nums"],
  },
  pairingActions: {
    flexDirection: "row",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  rejectText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  approveText: { color: colors.bg, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },

  // Device card
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: 10,
  },
  deviceCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  deviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceName: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  youBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.5,
  },
  deviceOS: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  nodeIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  nodeId: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "monospace" as any,
  },
  deviceStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statText: { fontSize: 12, color: colors.textSecondary },
  revokeRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    alignItems: "flex-end",
  },
  revokeText: { color: colors.error, fontSize: 12, fontWeight: "500" },

  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14 },
});
