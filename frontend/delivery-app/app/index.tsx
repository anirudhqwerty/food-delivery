import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getToken } from "../lib/auth";

export default function Index() {
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    if (token) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
