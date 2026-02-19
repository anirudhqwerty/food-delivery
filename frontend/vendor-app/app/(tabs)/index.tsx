import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "../../lib/api";
import { getToken, removeToken } from "../../lib/auth";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  is_available: boolean;
}

interface Restaurant {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
}

export default function VendorHome() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [foodName, setFoodName] = useState("");
  const [foodPrice, setFoodPrice] = useState("");
  const [foodQuantity, setFoodQuantity] = useState("");
  const [foodDescription, setFoodDescription] = useState("");

  // Load restaurant and menu items
  async function loadData() {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      // Load restaurant
      const restaurantData = await apiRequest(
        "/vendor/restaurant",
        "GET",
        undefined,
        token
      );
      setRestaurant(restaurantData);
      setRestaurantName(restaurantData.name);

      // Load menu items
      const menuData = await apiRequest(
        "/vendor/menu",
        "GET",
        undefined,
        token
      );
      setMenuItems(menuData || []);
    } catch (e) {
      Alert.alert("Error", "Failed to load restaurant data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Update restaurant name
  async function updateRestaurant() {
    if (!restaurantName.trim()) {
      Alert.alert("Error", "Restaurant name cannot be empty");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await apiRequest(
        "/vendor/restaurant",
        "PUT",
        { name: restaurantName },
        token
      );
      setRestaurant(updated);
      setEditingRestaurant(false);
      Alert.alert("Success", "Restaurant updated");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update restaurant");
    }
  }

  // Add menu item
  async function addMenuItem() {
    if (!foodName.trim() || !foodPrice || !foodQuantity) {
      Alert.alert("Error", "Name, price, and quantity are required");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const newItem = await apiRequest(
        "/vendor/menu",
        "POST",
        {
          name: foodName,
          description: foodDescription,
          price: parseFloat(foodPrice),
          quantity: parseInt(foodQuantity),
        },
        token
      );

      setMenuItems([newItem, ...menuItems]);
      setFoodName("");
      setFoodPrice("");
      setFoodQuantity("");
      setFoodDescription("");
      setShowAddModal(false);
      Alert.alert("Success", "Menu item added");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add item");
    }
  }

  // Update menu item
  async function updateMenuItem() {
    if (!editingItem) return;

    if (!foodName.trim() || !foodPrice || !foodQuantity) {
      Alert.alert("Error", "Name, price, and quantity are required");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const updated = await apiRequest(
        `/vendor/menu/${editingItem.id}`,
        "PUT",
        {
          name: foodName,
          description: foodDescription,
          price: parseFloat(foodPrice),
          quantity: parseInt(foodQuantity),
        },
        token
      );

      setMenuItems(
        menuItems.map((item) => (item.id === editingItem.id ? updated : item))
      );
      setEditingItem(null);
      setFoodName("");
      setFoodPrice("");
      setFoodQuantity("");
      setFoodDescription("");
      setShowEditModal(false);
      Alert.alert("Success", "Menu item updated");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update item");
    }
  }

  // Delete menu item
  async function deleteMenuItem(itemId: string) {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) return;

            await apiRequest(
              `/vendor/menu/${itemId}`,
              "DELETE",
              undefined,
              token
            );

            setMenuItems(menuItems.filter((item) => item.id !== itemId));
            Alert.alert("Success", "Menu item deleted");
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete item");
          }
        },
      },
    ]);
  }

  // Open edit modal
  function openEditModal(item: MenuItem) {
    setEditingItem(item);
    setFoodName(item.name);
    setFoodPrice(item.price.toString());
    setFoodQuantity(item.quantity.toString());
    setFoodDescription(item.description || "");
    setShowEditModal(true);
  }

  async function handleLogout() {
    await removeToken();
    router.replace("/login");
  }

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh menu items when tab comes into focus (after accepting orders)
  useFocusEffect(
    useCallback(() => {
      // Refresh menu items to show updated quantities after orders
      const refreshMenu = async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const menuData = await apiRequest("/vendor/menu", "GET", undefined, token);
          setMenuItems(menuData || []);
        } catch (e) {
          console.error("Failed to refresh menu:", e);
        }
      };
      refreshMenu();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Manager</Text>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out" size={24} color="red" />
        </Pressable>
      </View>

      {/* Restaurant Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Details</Text>
        {!editingRestaurant ? (
          <View style={styles.restaurantCard}>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant?.name}</Text>
              {restaurant?.description && (
                <Text style={styles.restaurantDesc}>{restaurant.description}</Text>
              )}
            </View>
            <Pressable
              onPress={() => setEditingRestaurant(true)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              placeholder="Restaurant name"
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholderTextColor="#999"
            />
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingRestaurant(false);
                  setRestaurantName(restaurant?.name || "");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={updateRestaurant}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Menu Items Section */}
      <View style={styles.section}>
        <View style={styles.menuHeader}>
          <Text style={styles.sectionTitle}>Menu Items</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              setFoodName("");
              setFoodPrice("");
              setFoodQuantity("");
              setFoodDescription("");
              setEditingItem(null);
              setShowAddModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {menuItems.length === 0 ? (
          <Text style={styles.emptyText}>No items yet. Add your first one!</Text>
        ) : (
          menuItems.map((item) => (
            <View key={item.id} style={styles.menuItemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
                <View style={styles.itemDetails}>
                  <Text style={styles.itemPrice}>₹{Number(item.price).toFixed(2)}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.editIconButton}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil" size={18} color="#007AFF" />
                </Pressable>
                <Pressable
                  style={styles.deleteIconButton}
                  onPress={() => deleteMenuItem(item.id)}
                >
                  <Ionicons name="trash" size={18} color="red" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "Edit Item" : "Add New Item"}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFoodName("");
                  setFoodPrice("");
                  setFoodQuantity("");
                  setFoodDescription("");
                  setEditingItem(null);
                }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={foodName}
              onChangeText={setFoodName}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={foodDescription}
              onChangeText={setFoodDescription}
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={foodPrice}
              onChangeText={setFoodPrice}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={foodQuantity}
              onChangeText={setFoodQuantity}
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFoodName("");
                  setFoodPrice("");
                  setFoodQuantity("");
                  setFoodDescription("");
                  setEditingItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.button}
                onPress={editingItem ? updateMenuItem : addMenuItem}
              >
                <Text style={styles.buttonText}>
                  {editingItem ? "Update" : "Add"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  restaurantCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  restaurantDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  editForm: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#f9f9f9",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#000",
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  menuItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  itemDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemActions: {
    flexDirection: "row",
    gap: 12,
  },
  editIconButton: {
    padding: 8,
  },
  deleteIconButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
});
