import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAuthStore } from "../../src/store/auth";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Vinctum</Text>
        <Text style={styles.subtitle}>Decentralized Data Courier</Text>
      </View>

      {user && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Welcome</Text>
          <Text style={styles.cardValue}>{user.username}</Text>
          <Text style={styles.cardMeta}>{user.email}</Text>
        </View>
      )}

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingBottom: 100 },
  hero: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  title: { fontSize: 36, fontWeight: "800", color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  logoutBtn: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.2)",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  logoutText: { color: colors.error, fontWeight: "600", fontSize: 15 },
});
