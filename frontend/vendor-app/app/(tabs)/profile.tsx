import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { removeToken } from "../../lib/auth";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Vendor Profile</Text>
      <Button
        title="Logout"
        color="red"
        onPress={async () => {
          await removeToken();
          router.replace("/(auth)/login");
        }}
      />
    </View>
  );
}
