import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSessions } from "../features/sessions/hooks/useSessions";
import { useSessionKeys } from "../features/devices/hooks/useDeviceKeys";
import type { Session } from "../features/sessions/types";
import { colors, spacing, radius } from "../lib/theme";

interface Props {
  currentDeviceId: string | null;
  onSelect: (session: Session, deviceKeys: { device_id: string; node_id: string; kex_public_key: string }[]) => void;
  onCancel: () => void;
}

function SessionRow({
  session,
  currentDeviceId,
  onSelect,
}: {
  session: Session;
  currentDeviceId: string | null;
  onSelect: Props["onSelect"];
}) {
  const { data: keys, isLoading } = useSessionKeys(session.session_id);

  const handlePress = () => {
    if (!keys || keys.length === 0) return;

    // Build device key list excluding the current device
    const recipients = session.devices
      .filter((d) => d.node_id !== currentDeviceId && d.is_approved && !d.is_revoked)
      .map((d) => {
        const key = keys.find((k) => k.device_id === d.device_id);
        if (!key) return null;
        return { device_id: d.device_id, node_id: d.node_id, kex_public_key: key.kex_public_key };
      })
      .filter(Boolean) as { device_id: string; node_id: string; kex_public_key: string }[];

    if (recipients.length === 0) return;
    onSelect(session, recipients);
  };

  const recipientCount = session.devices.filter(
    (d) => d.node_id !== currentDeviceId && d.is_approved && !d.is_revoked
  ).length;

  return (
    <Pressable style={styles.row} onPress={handlePress} disabled={isLoading || recipientCount === 0}>
      <View style={styles.iconWrap}>
        <Ionicons name="people" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sessionName}>{session.name}</Text>
        <Text style={styles.sessionMeta}>
          {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export default function SessionPicker({ currentDeviceId, onSelect, onCancel }: Props) {
  const { data: sessions, isLoading } = useSessions();

  const activeSessions = (sessions || []).filter(
    (s) => s.is_active && s.devices.length > 1
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send to Session</Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
      ) : activeSessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No active sessions with multiple devices</Text>
        </View>
      ) : (
        <FlatList
          data={activeSessions}
          keyExtractor={(s) => s.session_id}
          renderItem={({ item }) => (
            <SessionRow session={item} currentDeviceId={currentDeviceId} onSelect={onSelect} />
          )}
          scrollEnabled={activeSessions.length > 4}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionName: { fontSize: 14, fontWeight: "600", color: colors.text },
  sessionMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyWrap: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyText: { fontSize: 13, color: colors.textMuted },
});
