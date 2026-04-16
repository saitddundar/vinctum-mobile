import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useDevices, useRevokeDevice } from "../../src/features/devices/hooks/useDevices";
import { useApprovePairing } from "../../src/features/devices/hooks/usePairing";
import { Device, DeviceType } from "../../src/features/devices/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

const deviceTypeLabel: Record<DeviceType, string> = {
  [DeviceType.PC]: "PC",
  [DeviceType.PHONE]: "Phone",
  [DeviceType.TABLET]: "Tablet",
};

interface DeviceItemProps {
  device: Device;
  isSelf: boolean;
  onRevoke: (id: string) => void;
  onApprove: (id: string, approve: boolean) => void;
  approving: boolean;
}

function DeviceItem({ device, isSelf, onRevoke, onApprove, approving }: DeviceItemProps) {
  const showApprovalActions = !device.is_approved && !device.is_revoked && !isSelf;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <View style={[styles.badge, device.is_approved ? styles.approved : styles.pending]}>
          <Text style={[styles.badgeText, device.is_approved ? styles.approvedText : styles.pendingText]}>
            {device.is_approved ? "Approved" : "Pending"}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>{deviceTypeLabel[device.device_type]}</Text>
      <Text style={styles.meta}>
        Last active: {device.last_active ? new Date(device.last_active).toLocaleDateString() : "—"}
      </Text>

      {showApprovalActions && (
        <View style={styles.approvalRow}>
          <Pressable
            style={[styles.approvalBtn, approving && styles.disabled]}
            onPress={() => onApprove(device.device_id, false)}
            disabled={approving}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={[styles.approvalBtn, approving && styles.disabled]}
            onPress={() => onApprove(device.device_id, true)}
            disabled={approving}
          >
            <Text style={styles.approveText}>Approve</Text>
          </Pressable>
        </View>
      )}

      {!device.is_revoked && device.is_approved && !isSelf && (
        <Pressable style={styles.revokeBtn} onPress={() => onRevoke(device.device_id)}>
          <Text style={styles.revokeText}>Revoke</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function DevicesScreen() {
  const [selfDeviceId, setSelfDeviceId] = useState<string | null>(null);
  const { data: devices, isLoading, refetch } = useDevices();
  const revoke = useRevokeDevice();
  const approve = useApprovePairing();

  useEffect(() => {
    getStoredDeviceId().then(setSelfDeviceId);
  }, []);

  const handleRevoke = (id: string) => {
    Alert.alert("Revoke Device", "Are you sure you want to revoke this device?", [
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

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
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
          <Text style={styles.empty}>{isLoading ? "Loading..." : "No registered devices"}</Text>
        }
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  deviceName: { fontSize: 16, fontWeight: "600", color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: 11, fontWeight: "600" },
  approved: { backgroundColor: "rgba(52, 211, 153, 0.15)" },
  approvedText: { color: colors.success },
  pending: { backgroundColor: "rgba(251, 191, 36, 0.15)" },
  pendingText: { color: colors.warning },
  meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  approvalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 10 },
  approvalBtn: { paddingVertical: 4 },
  approveText: { color: colors.success, fontSize: 14, fontWeight: "600" },
  rejectText: { color: colors.error, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  revokeBtn: { marginTop: 10, alignSelf: "flex-end" },
  revokeText: { color: colors.error, fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
