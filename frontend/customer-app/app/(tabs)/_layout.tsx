import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
