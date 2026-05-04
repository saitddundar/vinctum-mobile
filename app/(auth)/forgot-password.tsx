import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/api/client";
import { toast } from "../../src/lib/toast";
import { colors, spacing, radius } from "../../src/lib/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success("Reset link sent");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to send reset link");
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
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={28} color={colors.accent} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? "Check your email for a password reset link"
              : "Enter your email and we'll send you a reset link"}
          </Text>
        </View>

        {sent ? (
          <View style={styles.successCard}>
            <Ionicons name="mail-outline" size={32} color={colors.accent} />
            <Text style={styles.successTitle}>Email Sent</Text>
            <Text style={styles.successSub}>
              We sent a password reset link to {email}. Check your inbox and follow the
              instructions.
            </Text>
            <Link href="/(auth)/login" style={styles.backLink}>
              <Text style={styles.backLinkText}>Back to Sign In</Text>
            </Link>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <Pressable
              style={[styles.button, (loading || !email.trim()) && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading || !email.trim()}
            >
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: "rgba(124, 91, 245, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
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
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: "center",
    gap: 12,
  },
  successTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  successSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  backLink: { marginTop: 8 },
  backLinkText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});
