import { View, Text, Button, StyleSheet } from "react-native";
import { router } from "expo-router";
import { removeToken } from "../../lib/auth";

export default function ProfileScreen() {
  async function handleLogout() {
    console.log("Logout initiated");
    await removeToken();
    console.log("Token removed, redirecting to login");
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Logout" color="red" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});
