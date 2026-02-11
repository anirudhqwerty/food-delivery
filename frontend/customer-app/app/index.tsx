import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getToken } from "../lib/auth";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    console.log("Auth check: token present?", !!token);
    setLoading(false);
    if (token) {
      console.log("Redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("Redirecting to login");
      router.replace("/(auth)/login");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
