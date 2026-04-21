import { useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDevices } from "../features/devices/hooks/useDevices";
import { useDeviceKey } from "../features/devices/hooks/useDeviceKeys";
import { Device, DeviceType } from "../features/devices/types";
import { colors, spacing, radius } from "../lib/theme";

const deviceIcon: Record<number, string> = {
  [DeviceType.PC]: "desktop-outline",
  [DeviceType.PHONE]: "phone-portrait-outline",
  [DeviceType.TABLET]: "tablet-portrait-outline",
};

interface Props {
  currentDeviceId: string | null;
  onSelect: (device: Device, pubKey: string) => void;
  onCancel: () => void;
}

function DeviceRow({ device, onSelect }: { device: Device; onSelect: (d: Device, key: string) => void }) {
  const { data: keyData, isLoading } = useDeviceKey(device.device_id);

  const hasKey = !!keyData?.kex_public_key;

  return (
    <Pressable
      style={[styles.deviceRow, !hasKey && !isLoading && styles.deviceRowDisabled]}
      onPress={() => hasKey && onSelect(device, keyData!.kex_public_key)}
      disabled={!hasKey || isLoading}
    >
      <View style={[styles.iconWrap, hasKey && styles.iconWrapReady]}>
        <Ionicons name={deviceIcon[device.device_type] as any || "hardware-chip-outline"} size={20} color={hasKey ? colors.accent : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceMeta}>
          {device.node_id.slice(0, 8)}...{device.node_id.slice(-6)}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : hasKey ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : (
        <Text style={styles.noKey}>No key</Text>
      )}
    </Pressable>
  );
}

export default function DevicePicker({ currentDeviceId, onSelect, onCancel }: Props) {
  const { data: devices, isLoading } = useDevices();

  // only show approved, non-revoked devices that aren't the current device
  const available = (devices || []).filter(
    (d) => d.is_approved && !d.is_revoked && d.node_id !== currentDeviceId
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send to Device</Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
      ) : available.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No paired devices available</Text>
        </View>
      ) : (
        <FlatList
          data={available}
          keyExtractor={(d) => d.device_id}
          renderItem={({ item }) => <DeviceRow device={item} onSelect={onSelect} />}
          scrollEnabled={available.length > 4}
          style={{ maxHeight: 280 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 12,
  },
  deviceRowDisabled: { opacity: 0.4 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapReady: { backgroundColor: colors.accentDim },
  deviceName: { fontSize: 14, fontWeight: "600", color: colors.text },
  deviceMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  noKey: { fontSize: 11, color: colors.textMuted },
  emptyWrap: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 13, color: colors.textMuted },
});
