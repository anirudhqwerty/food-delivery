import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from "react-native";
import { apiRequest } from "../../lib/api";

// Added restaurant_id because the backend order-service requires it
interface FoodItem {
  id: number;
  item_name: string;
  description: string;
  price: string | number;
  restaurant_name: string;
  restaurant_id: number; 
}

// Extends FoodItem to include the quantity added to the cart
interface CartItem extends FoodItem {
  cartQuantity: number;
}

export default function HomeScreen() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  // TODO: Retrieve your actual stored Auth token here (e.g., from SecureStore or Context)
  const userToken = "YOUR_JWT_TOKEN_HERE"; 

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

  const handleAddToCart = (item: FoodItem) => {
    // Enforce backend rule: Items must be from the same restaurant
    if (cart.length > 0 && cart[0].restaurant_id !== item.restaurant_id) {
      Alert.alert("Hold on!", "You can only order from one restaurant at a time.");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, cartQuantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setIsOrdering(true);
      
      // Format payload exactly as the backend controller expects it
      const payload = {
        restaurant_id: cart[0].restaurant_id,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.cartQuantity
        }))
      };

      // Ensure this endpoint matches your API gateway routing for order-service
      await apiRequest("/orders", "POST", payload, userToken);
      
      Alert.alert("Success!", "Your order has been placed successfully.");
      setCart([]); // Clear cart on success
    } catch (err: any) {
      Alert.alert("Order Failed", err.message || "Something went wrong.");
    } finally {
      setIsOrdering(false);
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    // Find if item is already in cart to show quantity
    const cartItem = cart.find(i => i.id === item.id);

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <Text style={styles.foodTitle}>{item.item_name}</Text>
          <Text style={styles.priceText}>₹{item.price}</Text>
        </View>
        <Text style={styles.restaurantName}>from {item.restaurant_name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addButtonText}>
            {cartItem ? `Add More (${cartItem.cartQuantity} in cart)` : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Calculate cart total dynamically
  const cartTotal = cart.reduce((total, item) => total + (Number(item.price) * item.cartQuantity), 0);

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

      {/* Floating Checkout Bar */}
      {cart.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutText}>{cart.length} Item(s)</Text>
            <Text style={styles.checkoutTotal}>Total: ₹{cartTotal}</Text>
          </View>
          <TouchableOpacity 
             style={styles.checkoutButton} 
             onPress={handleCheckout}
             disabled={isOrdering}
          >
            {isOrdering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
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
  listContainer: { marginTop: 20, paddingBottom: 100 }, // Added padding to avoid floating bar
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
  foodTitle: { fontSize: 20, fontWeight: "bold", color: "#333", flex: 1 },
  priceText: { fontSize: 18, fontWeight: "bold", color: "#2ecc71", marginLeft: 10 },
  restaurantName: { fontSize: 14, color: "#e67e22", fontWeight: "600", marginTop: 4 },
  cardDesc: { fontSize: 14, color: "#666", marginTop: 8, lineHeight: 20 },
  addButton: {
    marginTop: 15,
    backgroundColor: "#000",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  // Checkout Bar Styles
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  checkoutText: { fontSize: 14, color: "gray" },
  checkoutTotal: { fontSize: 18, fontWeight: "bold", color: "#333" },
  checkoutButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  checkoutButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});