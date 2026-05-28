import { useState, useEffect } from "react";
import { View, Text, SectionList, Pressable, TextInput, StyleSheet, Alert } from "react-native";
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
  const totalSessions = activeSessions.length + closedSessions.length;
  const sections = [
    { title: "Active", data: activeSessions },
    { title: "Closed", data: closedSessions },
  ].filter((section) => section.data.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.header}>Sessions</Text>
            <Text style={styles.subhead}>
              {activeSessions.length} active · {totalSessions} total
            </Text>
          </View>
          <Pressable style={styles.createToggle} onPress={() => setShowCreate(!showCreate)}>
            <Ionicons name={showCreate ? "close" : "add"} size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.kpis}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>YOUR DEVICE</Text>
            <Text style={styles.kpiValue}>{deviceId ? "Linked" : "Loading"}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>JOINED</Text>
            <Text style={styles.kpiValue}>{activeSessions.filter(isInSession).length}</Text>
          </View>
        </View>
      </View>

      {showCreate && (
        <View style={styles.createSection}>
          <View style={styles.createHeader}>
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <Text style={styles.createTitle}>Create a session</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Give it a name"
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

      <SectionList
        sections={sections}
        keyExtractor={(s) => s.session_id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionRule} />
          </View>
        )}
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
                {inSess && (
                  <View style={styles.inSessionPill}>
                    <Text style={styles.inSessionText}>In</Text>
                  </View>
                )}
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
            <Text style={styles.emptySub}>Create one to keep your devices in sync.</Text>
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
  hero: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  header: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subhead: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  createToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  kpis: { flexDirection: "row", gap: 10, marginTop: spacing.md },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.sm,
  },
  kpiLabel: { fontSize: 10, letterSpacing: 1.4, color: colors.textMuted },
  kpiValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 6 },
  createSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  createHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  createTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
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
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10, marginTop: spacing.sm },
  sectionTitle: { fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  cardTop: { flexDirection: "row", alignItems: "center" },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  sessionName: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  inSessionPill: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  inSessionText: { fontSize: 11, color: colors.accent, fontWeight: "600" },
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
  emptyWrap: { alignItems: "center", marginTop: 60, gap: 10 },
  empty: { color: colors.textMuted, fontSize: 14 },
  emptySub: { color: colors.textSecondary, fontSize: 12 },
});
