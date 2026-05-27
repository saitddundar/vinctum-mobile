import { useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFriends, useFriendDevices } from "../features/friends/hooks/useFriends";
import { useDeviceKey } from "../features/devices/hooks/useDeviceKeys";
import type { Device, DeviceType } from "../features/devices/types";
import type { Friend } from "../features/friends/types";
import { colors, spacing, radius } from "../lib/theme";

const deviceIcon: Record<number, string> = {
  [DeviceType.PC]: "desktop-outline",
  [DeviceType.PHONE]: "phone-portrait-outline",
  [DeviceType.TABLET]: "tablet-portrait-outline",
};

interface Props {
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
        <Ionicons
          name={(deviceIcon[device.device_type] as any) || "hardware-chip-outline"}
          size={20}
          color={hasKey ? colors.accent : colors.textMuted}
        />
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

function FriendRow({ friend, onSelect }: { friend: Friend; onSelect: (f: Friend) => void }) {
  return (
    <Pressable style={styles.friendRow} onPress={() => onSelect(friend)}>
      <View style={styles.friendIcon}>
        <Ionicons name="person-outline" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.friendName}>{friend.user.username}</Text>
        <Text style={styles.friendMeta}>@{friend.user.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function FriendDevicePicker({ onSelect, onCancel }: Props) {
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const { data: friendDevices, isLoading: devicesLoading } = useFriendDevices(
    selectedFriend?.user.user_id || null
  );

  const availableDevices = (friendDevices || []).filter(
    (d) => d.is_approved && !d.is_revoked && !!d.node_id
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send to Friend</Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {selectedFriend ? (
        <View style={styles.subHeader}>
          <Pressable style={styles.backBtn} onPress={() => setSelectedFriend(null)}>
            <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            <Text style={styles.backText}>Friends</Text>
          </Pressable>
          <Text style={styles.subTitle}>{selectedFriend.user.username}</Text>
        </View>
      ) : null}

      {friendsLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
      ) : !selectedFriend ? (
        (friends || []).length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No friends to send to</Text>
          </View>
        ) : (
          <FlatList
            data={friends || []}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => <FriendRow friend={item} onSelect={setSelectedFriend} />}
            scrollEnabled={(friends || []).length > 4}
            style={{ maxHeight: 280 }}
          />
        )
      ) : devicesLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
      ) : availableDevices.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="hardware-chip-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No public devices found</Text>
        </View>
      ) : (
        <FlatList
          data={availableDevices}
          keyExtractor={(d) => d.device_id}
          renderItem={({ item }) => <DeviceRow device={item} onSelect={onSelect} />}
          scrollEnabled={availableDevices.length > 4}
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
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.sm,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBg,
  },
  backText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  subTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 12,
  },
  friendIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  friendName: { fontSize: 14, fontWeight: "600", color: colors.text },
  friendMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
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
