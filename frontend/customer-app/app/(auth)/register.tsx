import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { apiRequest } from "../../lib/api";
import { saveToken } from "../../lib/auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    console.log("Register attempt for email:", email);
    if (!email || !password) return Alert.alert("Error", "Fill all fields");

    setLoading(true);
    try {
      // HARDCODED ROLE
      const response = await apiRequest("/auth/register", "POST", {
        email,
        password,
        role: "customer"
      });
      console.log("Register response:", response);

      await saveToken(response.token);
      console.log("Token saved, redirecting to tabs");
      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("Register error:", err.message);
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Customer</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Creating..." : "Sign Up"}</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={{ color: "blue", textAlign: "center" }}>Back to Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 15, marginBottom: 15 },
  button: { backgroundColor: "#000", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
