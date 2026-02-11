import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#000" }}>
      <Tabs.Screen name="index" options={{ title: "Deliveries", tabBarIcon: ({ color }) => <Ionicons name="car" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tabs>
  );
}
