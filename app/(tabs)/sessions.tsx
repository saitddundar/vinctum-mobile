import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSessions, useCreateSession, useCloseSession, useJoinSession, useLeaveSession } from "../../src/features/sessions/hooks/useSessions";
import { Session } from "../../src/features/sessions/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const { data: sessions, isLoading, refetch } = useSessions();
  const create = useCreateSession();
  const close = useCloseSession();
  const join = useJoinSession();
  const leave = useLeaveSession();

  useEffect(() => {
    getStoredDeviceId().then(setDeviceId);
  }, []);

  const handleCreate = () => {
    if (!sessionName || !deviceId) return;
    create.mutate({ name: sessionName, deviceId }, {
      onSuccess: () => {
        setSessionName("");
        setShowCreate(false);
        toast.success("Session created");
      },
      onError: (e: any) => toast.error(e?.response?.data?.error || "Could not create session"),
    });
  };

  const handleClose = (id: string) => {
    Alert.alert("Close Session", "All devices will be disconnected.", [
      { text: "Cancel" },
      { text: "Close", style: "destructive", onPress: () => close.mutate(id) },
    ]);
  };

  const isInSession = (s: Session) => s.devices?.some((d) => d.device_id === deviceId);
  const activeSessions = sessions?.filter((s) => s.is_active) || [];
  const closedSessions = sessions?.filter((s) => !s.is_active) || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <Text style={styles.header}>Sessions</Text>
        <Pressable style={styles.createToggle} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name={showCreate ? "close" : "add"} size={20} color="#fff" />
        </Pressable>
      </View>

      {showCreate && (
        <View style={styles.createSection}>
          <TextInput
            style={styles.input}
            placeholder="Session name"
            placeholderTextColor={colors.textMuted}
            value={sessionName}
            onChangeText={setSessionName}
          />
          <Pressable
            style={[styles.button, (!sessionName || create.isPending) && styles.disabled]}
            onPress={handleCreate}
            disabled={!sessionName || create.isPending}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{create.isPending ? "Creating..." : "Create Session"}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={[...activeSessions, ...closedSessions]}
        keyExtractor={(s) => s.session_id}
        renderItem={({ item }) => {
          const inSess = isInSession(item);
          const deviceCount = item.devices?.length || 0;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? colors.success : colors.textMuted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionName}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {deviceCount} device{deviceCount !== 1 ? "s" : ""} · {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {deviceCount > 0 && (
                <View style={styles.deviceChips}>
                  {item.devices!.slice(0, 4).map((d) => (
                    <View key={d.device_id} style={styles.chip}>
                      <Ionicons name="phone-portrait-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.chipText} numberOfLines={1}>{d.name}</Text>
                    </View>
                  ))}
                  {deviceCount > 4 && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>+{deviceCount - 4}</Text>
                    </View>
                  )}
                </View>
              )}

              {item.is_active && (
                <View style={styles.actions}>
                  {inSess ? (
                    <>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => deviceId && leave.mutate({ sessionId: item.session_id, deviceId })}
                      >
                        <Text style={styles.leaveText}>Leave</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => handleClose(item.session_id)}>
                        <Text style={styles.closeText}>Close</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={styles.joinBtn}
                      onPress={() => deviceId && join.mutate({ sessionId: item.session_id, deviceId })}
                    >
                      <Text style={styles.joinText}>Join</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.empty}>{isLoading ? "Loading..." : "No sessions yet"}</Text>
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
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, marginTop: spacing.sm },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  createToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  createSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  sessionName: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  deviceChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  chipText: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  actionBtn: { paddingVertical: 4 },
  joinBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.sm, backgroundColor: colors.accentDim },
  joinText: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  leaveText: { color: colors.warning, fontWeight: "600", fontSize: 13 },
  closeText: { color: colors.error, fontWeight: "600", fontSize: 13 },
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  empty: { color: colors.textMuted, fontSize: 14 },
});
