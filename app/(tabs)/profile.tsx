import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuthStore } from "../../src/store/auth";
import { api } from "../../src/api/client";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

type Tab = "profile" | "security";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username || "---"}</Text>
        <Text style={styles.email}>{user?.email || "---"}</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(
          [
            { key: "profile" as Tab, label: "Profile", icon: "person-outline" },
            { key: "security" as Tab, label: "Security", icon: "shield-outline" },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={tab === t.key ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "profile" ? (
        <ProfileTab user={user} />
      ) : (
        <SecurityTab />
      )}

      {/* Settings */}
      <Pressable style={styles.settingsBtn} onPress={() => router.push("/(tabs)/settings")}>
        <Ionicons name="settings-outline" size={18} color={colors.accent} />
        <Text style={styles.settingsText}>Settings</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
      </Pressable>

      {/* Sign Out */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    if (user?.user_id) {
      await Clipboard.setStringAsync(user.user_id);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View>
      {/* Display Name */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Display name</Text>
          </View>
          <Text style={styles.infoValue}>{user?.username || "---"}</Text>
        </View>

        <View style={styles.divider} />

        {/* Email */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.infoValue}>{user?.email || "---"}</Text>
            {user?.email_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* User ID */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="finger-print-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>User ID</Text>
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.idText} numberOfLines={1}>
              {user?.user_id ? user.user_id.slice(0, 16) + "..." : "---"}
            </Text>
            <Pressable style={styles.copyBtn} onPress={copyId}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color={copied ? colors.accent : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Member Since */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Member since</Text>
          </View>
          <Text style={styles.infoValue}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "---"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError("");
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      toast.success("Password updated");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.securitySection}>
      <Text style={styles.secTitle}>Change Password</Text>
      <Text style={styles.secSub}>Used to decrypt your local key store on this device</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current password</Text>
        <TextInput
          style={[styles.input, focused === "current" && styles.inputFocused]}
          secureTextEntry
          value={currentPw}
          onChangeText={setCurrentPw}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused("current")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>New password</Text>
        <TextInput
          style={[styles.input, focused === "new" && styles.inputFocused]}
          secureTextEntry
          value={newPw}
          onChangeText={setNewPw}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused("new")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm new password</Text>
        <TextInput
          style={[styles.input, focused === "confirm" && styles.inputFocused]}
          secureTextEntry
          value={confirmPw}
          onChangeText={setConfirmPw}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused("confirm")}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Pressable
        style={[styles.changeBtn, loading && styles.disabled]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        <Text style={styles.changeBtnText}>
          {loading ? "Updating..." : "Update Password"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },
  profileHeader: {
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.accentDim,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 26, fontWeight: "800", color: colors.accent },
  username: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.accentDim },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  tabTextActive: { color: colors.accent },

  // Profile
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontSize: 14, fontWeight: "500", color: colors.text },
  infoValue: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.glassBorder },
  verifiedBadge: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  verifiedText: { fontSize: 9, fontWeight: "700", color: colors.success, letterSpacing: 0.5 },
  idText: { fontSize: 12, color: colors.textSecondary, fontFamily: "monospace", maxWidth: 140 },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // Security
  securitySection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  secTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 },
  secSub: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 13, color: colors.error, flex: 1 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.inputBorderFocus },
  changeBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: 4,
  },
  changeBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },

  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.md,
  },
  settingsText: { color: colors.accent, fontWeight: "600", fontSize: 14 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.15)",
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.lg,
  },
  logoutText: { color: colors.error, fontWeight: "600", fontSize: 14 },
});
