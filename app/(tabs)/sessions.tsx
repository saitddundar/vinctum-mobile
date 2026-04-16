import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
import { useSessions, useCreateSession, useCloseSession, useJoinSession, useLeaveSession } from "../../src/features/sessions/hooks/useSessions";
import { Session } from "../../src/features/sessions/types";
import { getStoredDeviceId } from "../../src/lib/device";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function SessionsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
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
    Alert.alert("Close Session", "Are you sure you want to close this session?", [
      { text: "Cancel" },
      { text: "Close", style: "destructive", onPress: () => close.mutate(id) },
    ]);
  };

  const isInSession = (s: Session) => s.devices?.some((d) => d.device_id === deviceId);

  return (
    <View style={styles.container}>
      <Pressable style={styles.createToggle} onPress={() => setShowCreate(!showCreate)}>
        <Text style={styles.createToggleText}>{showCreate ? "Cancel" : "+ New Session"}</Text>
      </Pressable>

      {showCreate && (
        <View style={styles.createSection}>
          <TextInput
            style={[styles.input, inputFocused && styles.inputFocused]}
            placeholder="Session name"
            placeholderTextColor={colors.textMuted}
            value={sessionName}
            onChangeText={setSessionName}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <Pressable
            style={[styles.button, create.isPending && styles.disabled]}
            onPress={handleCreate}
            disabled={create.isPending}
          >
            <Text style={styles.buttonText}>{create.isPending ? "Creating..." : "Create"}</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.session_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sessionName}>{item.name}</Text>
              <View style={[styles.badge, item.is_active ? styles.active : styles.closed]}>
                <Text style={[styles.badgeText, item.is_active ? styles.activeText : styles.closedText]}>
                  {item.is_active ? "Active" : "Closed"}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {item.devices?.length || 0} devices • {new Date(item.created_at).toLocaleDateString()}
            </Text>

            {item.is_active && (
              <View style={styles.actions}>
                {isInSession(item) ? (
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
                    style={styles.actionBtn}
                    onPress={() => deviceId && join.mutate({ sessionId: item.session_id, deviceId })}
                  >
                    <Text style={styles.joinText}>Join</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{isLoading ? "Loading..." : "No sessions"}</Text>
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
  createToggle: { alignSelf: "flex-end", marginBottom: spacing.sm },
  createToggleText: { color: colors.accent, fontSize: 15, fontWeight: "600" },
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
  inputFocused: { borderColor: colors.inputBorderFocus },
  button: { backgroundColor: colors.accent, padding: 14, borderRadius: radius.md, alignItems: "center" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sessionName: { fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: 11, fontWeight: "600" },
  active: { backgroundColor: "rgba(52, 211, 153, 0.15)" },
  activeText: { color: colors.success },
  closed: { backgroundColor: "rgba(248, 113, 113, 0.1)" },
  closedText: { color: colors.error },
  meta: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  actionBtn: { paddingVertical: 4 },
  joinText: { color: colors.accent, fontWeight: "600", fontSize: 14 },
  leaveText: { color: colors.warning, fontWeight: "600", fontSize: 14 },
  closeText: { color: colors.error, fontWeight: "600", fontSize: 14 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
