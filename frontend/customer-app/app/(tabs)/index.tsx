import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hungry?</Text>
      <Text style={styles.subtext}>Order from your favorite restaurants.</Text>
      {/* Restaurant List Component will go here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 32, fontWeight: "bold", marginTop: 20 },
  subtext: { fontSize: 16, color: "gray", marginTop: 5 },
});
