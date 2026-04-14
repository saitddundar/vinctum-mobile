import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../../src/store/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert("Hata", e?.response?.data?.error || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vinctum</Text>
      <Text style={styles.subtitle}>Giriş Yap</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={[styles.button, loading && styles.disabled]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Giriş yapılıyor..." : "Giriş Yap"}</Text>
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Hesabın yok mu? Kayıt ol
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
    padding: 14, fontSize: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: "#2c3e50", padding: 16, borderRadius: 8,
    alignItems: "center", marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2c3e50", textAlign: "center", marginTop: 16, fontSize: 14 },
});
