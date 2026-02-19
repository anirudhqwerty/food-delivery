import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { getToken } from "../../lib/auth";

interface OrderItem {
  id: string;
  item_name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface Restaurant {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial load on mount
    loadOrdersData();
  }, []);

  // Auto-refresh orders whenever this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrdersData();
    }, [])
  );

  async function loadOrdersData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      // Load restaurant first
      const restaurantData = await apiRequest(
        "/vendor/restaurant",
        "GET",
        undefined,
        token
      );
      setRestaurant(restaurantData);

      // Load orders for this restaurant
      const ordersData = await apiRequest(
        `/order/restaurant/${restaurantData.id}`,
        "GET",
        undefined,
        token
      );
      
      // Ensure data is in correct format and convert numeric strings to numbers
      const formattedOrders = (ordersData || []).map((order: any) => ({
        ...order,
        total_amount: Number(order.total_amount) || 0,
        items: Array.isArray(order.items) ? order.items.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
        })) : [],
      }));
      
      setOrders(formattedOrders);
    } catch (e: any) {
      console.error("Error loading orders:", e);
      Alert.alert("Error", e.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function acceptOrder(orderId: string) {
    try {
      const token = await getToken();
      if (!token) return;

      await apiRequest(
        `/order/${orderId}/status`,
        "PATCH",
        { status: "VENDOR_ACCEPTED" },
        token
      );

      // Refresh orders list
      loadOrdersData();
      Alert.alert("Success", "Order accepted");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept order");
    }
  }

  async function rejectOrder(orderId: string) {
    Alert.alert("Reject Order", "Are you sure you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return;

            await apiRequest(
              `/order/${orderId}/status`,
              "PATCH",
              { status: "CANCELLED" },
              token
            );

            loadOrdersData();
            Alert.alert("Success", "Order rejected");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to reject order");
          }
        },
      },
    ]);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "CREATED":
        return "#FF6B6B";
      case "VENDOR_ACCEPTED":
        return "#4ECDC4";
      case "PREPARING":
        return "#45B7D1";
      case "READY":
        return "#95E1D3";
      case "OUT_FOR_DELIVERY":
        return "#FFA07A";
      case "DELIVERED":
        return "#90EE90";
      case "CANCELLED":
        return "#D3D3D3";
      default:
        return "#808080";
    }
  }

  function renderOrderItem({ item }: { item: Order }) {
    const totalAmount = Number(item.total_amount) || 0;
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.label}>Customer ID: <Text style={styles.value}>{item.customer_id.slice(0, 8)}</Text></Text>
          <Text style={styles.label}>
            Total: <Text style={styles.value}>₹{totalAmount.toFixed(2)}</Text>
          </Text>
          <Text style={styles.label}>
            Time: <Text style={styles.value}>{new Date(item.created_at).toLocaleString()}</Text>
          </Text>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Items:</Text>
          {Array.isArray(item.items) && item.items.length > 0 ? (
            item.items.map((orderItem, index) => {
              const itemPrice = Number(orderItem.price) || 0;
              const itemQty = Number(orderItem.quantity) || 0;
              return (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{orderItem.item_name}</Text>
                  <Text style={styles.itemQuantity}>x{itemQty}</Text>
                  <Text style={styles.itemPrice}>₹{(itemPrice * itemQty).toFixed(2)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.itemName}>No items</Text>
          )}
        </View>

        {item.status === "CREATED" && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.button, styles.acceptButton]}
              onPress={() => acceptOrder(item.id)}
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.rejectButton]}
              onPress={() => rejectOrder(item.id)}
            >
              <Ionicons name="close-circle" size={18} color="white" />
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="list" size={28} color="#000" />
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <Pressable onPress={() => loadOrdersData()}>
          <Ionicons name="refresh" size={24} color="#000" />
        </Pressable>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text" size={64} color="#DDD" />
          <Text style={styles.emptyText}>No pending orders</Text>
          <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadOrdersData();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEE",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    color: "#333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomColor: "#EEE",
    borderBottomWidth: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderDetails: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  value: {
    color: "#000",
    fontWeight: "600",
  },
  itemsSection: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  itemQuantity: {
    fontSize: 13,
    color: "#666",
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    minWidth: 60,
    textAlign: "right",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: "#4ECDC4",
  },
  rejectButton: {
    backgroundColor: "#FF6B6B",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
