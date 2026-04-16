import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { api } from "../../src/api/client";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) return;
    setLoading(true);
    try {
      await api.post("/api/v1/auth/register", { username, email, password });
      toast.success("Account created. Verify your email and sign in.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.brand}>V</Text>
          <Text style={styles.title}>Vinctum</Text>
          <Text style={styles.subtitle}>Create a new account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, focused === "username" && styles.inputFocused]}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocused("username")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focused === "email" && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focused === "password" && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.disabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Sign Up"}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  brand: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.accent, color: "#fff",
    fontSize: 28, fontWeight: "800", textAlign: "center", lineHeight: 56,
    overflow: "hidden", marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "500", color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.inputBorderFocus },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});
