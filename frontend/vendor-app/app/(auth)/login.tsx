import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { apiRequest } from "../../lib/api";
import { saveToken } from "../../lib/auth";

const APP_ROLE = "vendor";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const response = await apiRequest("/auth/login", "POST", {
        email,
        password,
      });

      if (response.user.role !== APP_ROLE) {
        throw new Error("Access denied: not a vendor account");
      }

      await saveToken(response.token);
      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Login</Text>
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={{ color: "#fff" }}>Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15 },
  button: { backgroundColor: "black", padding: 15, alignItems: "center" },
});
