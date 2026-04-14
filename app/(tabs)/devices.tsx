import { View, Text, FlatList, StyleSheet, Pressable, Alert } from "react-native";
import { useDevices, useRevokeDevice } from "../../src/features/devices/hooks/useDevices";
import { Device, DeviceType } from "../../src/features/devices/types";

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
        <Text style={[styles.badge, device.is_approved ? styles.approved : styles.pending]}>
          {device.is_approved ? "Onaylı" : "Bekliyor"}
        </Text>
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
      {
        text: "Kaldır",
        style: "destructive",
        onPress: () => revoke.mutate(id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.device_id}
        renderItem={({ item }) => <DeviceItem device={item} onRevoke={handleRevoke} />}
        ListEmptyComponent={<Text style={styles.empty}>Kayıtlı cihaz yok</Text>}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 10, padding: 16,
    marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  deviceName: { fontSize: 16, fontWeight: "600" },
  badge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  approved: { backgroundColor: "#d4edda", color: "#155724" },
  pending: { backgroundColor: "#fff3cd", color: "#856404" },
  meta: { fontSize: 13, color: "#888", marginBottom: 2 },
  revokeBtn: { marginTop: 10, alignSelf: "flex-end" },
  revokeText: { color: "#e74c3c", fontSize: 13, fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
