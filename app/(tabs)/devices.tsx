import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDevices, useRevokeDevice } from "../../src/features/devices/hooks/useDevices";
import { useApprovePairing } from "../../src/features/devices/hooks/usePairing";
import { Device, DeviceType } from "../../src/features/devices/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

const typeIcon: Record<DeviceType, string> = {
  [DeviceType.PC]: "desktop-outline",
  [DeviceType.PHONE]: "phone-portrait-outline",
  [DeviceType.TABLET]: "tablet-portrait-outline",
};

function DeviceItem({ device, isSelf, onRevoke, onApprove, approving }: {
  device: Device;
  isSelf: boolean;
  onRevoke: (id: string) => void;
  onApprove: (id: string, approve: boolean) => void;
  approving: boolean;
}) {
  const showApprovalActions = !device.is_approved && !device.is_revoked && !isSelf;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name={typeIcon[device.device_type] as any} size={18} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text>
            {isSelf && <Text style={styles.selfTag}>This device</Text>}
          </View>
          <Text style={styles.meta}>
            {device.last_active ? `Active ${new Date(device.last_active).toLocaleDateString()}` : "Never active"}
          </Text>
        </View>
        <View style={[
          styles.badge,
          device.is_revoked ? styles.revokedBadge :
          device.is_approved ? styles.approvedBadge : styles.pendingBadge,
        ]}>
          <View style={[
            styles.badgeDot,
            { backgroundColor: device.is_revoked ? colors.error : device.is_approved ? colors.success : colors.warning },
          ]} />
          <Text style={[
            styles.badgeText,
            { color: device.is_revoked ? colors.error : device.is_approved ? colors.success : colors.warning },
          ]}>
            {device.is_revoked ? "Revoked" : device.is_approved ? "Approved" : "Pending"}
          </Text>
        </View>
      </View>

      {showApprovalActions && (
        <View style={styles.approvalRow}>
          <Pressable
            style={[styles.rejectBtn, approving && styles.disabled]}
            onPress={() => onApprove(device.device_id, false)}
            disabled={approving}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={[styles.approveBtn, approving && styles.disabled]}
            onPress={() => onApprove(device.device_id, true)}
            disabled={approving}
          >
            <Text style={styles.approveText}>Approve</Text>
          </Pressable>
        </View>
      )}

      {!device.is_revoked && device.is_approved && !isSelf && (
        <Pressable style={styles.revokeRow} onPress={() => onRevoke(device.device_id)}>
          <Text style={styles.revokeText}>Revoke Access</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
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
      { text: "Revoke", style: "destructive", onPress: () => revoke.mutate(id) },
    ]);
  };

  const handleApprove = (pendingId: string, doApprove: boolean) => {
    if (!selfDeviceId) {
      toast.error("Could not resolve this device's ID");
      return;
    }
    approve.mutate(
      { approver_device_id: selfDeviceId, pending_device_id: pendingId, approve: doApprove },
      {
        onSuccess: () => toast.success(doApprove ? "Device approved" : "Device rejected"),
        onError: (e: any) => toast.error(e?.response?.data?.error || "Operation failed"),
      }
    );
  };

  const approved = devices?.filter((d) => d.is_approved && !d.is_revoked) || [];
  const pending = devices?.filter((d) => !d.is_approved && !d.is_revoked) || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Devices</Text>
      <FlatList
        data={[...pending, ...approved]}
        keyExtractor={(d) => d.device_id}
        renderItem={({ item }) => (
          <DeviceItem
            device={item}
            isSelf={item.device_id === selfDeviceId}
            onRevoke={handleRevoke}
            onApprove={handleApprove}
            approving={approve.isPending}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="phone-portrait-outline" size={40} color={colors.textMuted} />
            <Text style={styles.empty}>{isLoading ? "Loading..." : "No registered devices"}</Text>
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
  container: { flex: 1, paddingHorizontal: spacing.md },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm, letterSpacing: -0.5 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceName: { fontSize: 15, fontWeight: "600", color: colors.text, flexShrink: 1 },
  selfTag: { fontSize: 11, color: colors.accent, fontWeight: "500" },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginLeft: 8,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  approvedBadge: { backgroundColor: "rgba(52,211,153,0.1)" },
  pendingBadge: { backgroundColor: "rgba(251,191,36,0.1)" },
  revokedBadge: { backgroundColor: "rgba(248,113,113,0.1)" },
  approvalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  rejectBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: "rgba(248,113,113,0.1)" },
  rejectText: { color: colors.error, fontSize: 13, fontWeight: "600" },
  approveBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: "rgba(52,211,153,0.1)" },
  approveText: { color: colors.success, fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  revokeRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.glassBorder, alignItems: "flex-end" },
  revokeText: { color: colors.error, fontSize: 13, fontWeight: "500" },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14 },
});
