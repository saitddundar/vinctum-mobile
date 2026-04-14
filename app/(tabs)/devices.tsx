import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useDevices, useRevokeDevice } from "../../src/features/devices/hooks/useDevices";
import { Device, DeviceType } from "../../src/features/devices/types";
import { colors, spacing, radius } from "../../src/lib/theme";

const deviceTypeLabel: Record<DeviceType, string> = {
  [DeviceType.PC]: "PC",
  [DeviceType.PHONE]: "Telefon",
  [DeviceType.TABLET]: "Tablet",
};

function DeviceItem({ device, onRevoke }: { device: Device; onRevoke: (id: string) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <View style={[styles.badge, device.is_approved ? styles.approved : styles.pending]}>
          <Text style={[styles.badgeText, device.is_approved ? styles.approvedText : styles.pendingText]}>
            {device.is_approved ? "Onaylı" : "Bekliyor"}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>{deviceTypeLabel[device.device_type]}</Text>
      <Text style={styles.meta}>
        Son aktif: {device.last_active ? new Date(device.last_active).toLocaleDateString("tr") : "—"}
      </Text>
      {!device.is_revoked && (
        <Pressable style={styles.revokeBtn} onPress={() => onRevoke(device.device_id)}>
          <Text style={styles.revokeText}>Kaldır</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function DevicesScreen() {
  const { data: devices, isLoading, refetch } = useDevices();
  const revoke = useRevokeDevice();

  const handleRevoke = (id: string) => {
    Alert.alert("Cihaz Kaldır", "Bu cihazı kaldırmak istediğine emin misin?", [
      { text: "İptal" },
      { text: "Kaldır", style: "destructive", onPress: () => revoke.mutate(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.device_id}
        renderItem={({ item }) => <DeviceItem device={item} onRevoke={handleRevoke} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? "Yükleniyor..." : "Kayıtlı cihaz yok"}</Text>
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
  revokeBtn: { marginTop: 10, alignSelf: "flex-end" },
  revokeText: { color: colors.error, fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
