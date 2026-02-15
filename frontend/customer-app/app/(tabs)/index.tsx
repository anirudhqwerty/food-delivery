import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { apiRequest } from "../../lib/api";

interface FoodItem {
  id: number;
  item_name: string;
  description: string;
  price: string | number;
  restaurant_name: string;
}

export default function HomeScreen() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFoodFeed();
  }, []);

  const fetchFoodFeed = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/vendor/public/menu", "GET");
      setFoodItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => console.log(`Clicked ${item.item_name}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.foodTitle}>{item.item_name}</Text>
        <Text style={styles.priceText}>₹{item.price}</Text>
      </View>
      <Text style={styles.restaurantName}>from {item.restaurant_name}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hungry?</Text>
      <Text style={styles.subtext}>Explore all available dishes.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={foodItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFoodItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 32, fontWeight: "bold", marginTop: 20 },
  subtext: { fontSize: 16, color: "gray", marginTop: 5 },
  loader: { marginTop: 40 },
  errorText: { color: "red", marginTop: 20, textAlign: "center" },
  listContainer: { marginTop: 20, paddingBottom: 20 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
    marginLeft: 10,
  },
  restaurantName: {
    fontSize: 14,
    color: "#e67e22",
    fontWeight: "600",
    marginTop: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    marginTop: 15,
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
