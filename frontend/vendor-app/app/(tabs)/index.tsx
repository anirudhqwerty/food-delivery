import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { apiRequest } from "../../lib/api";
import { getToken } from "../../lib/auth";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  is_available: boolean;
};

type PublicRestaurant = {
  id: string;
  name: string;
  description: string | null;
  menu: MenuItem[];
};

export default function VendorDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantDescription, setRestaurantDescription] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemAvailable, setNewItemAvailable] = useState(true);

  const [editItemId, setEditItemId] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemAvailable, setEditItemAvailable] = useState(true);

  const [deleteItemId, setDeleteItemId] = useState("");

  const [publicRestaurants, setPublicRestaurants] = useState<PublicRestaurant[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const savedToken = await getToken();
    setToken(savedToken);

    if (!savedToken) {
      setStatus("Please login again.");
      return;
    }

    await Promise.all([
      loadRestaurant(savedToken),
      loadMenu(savedToken),
      loadPublicRestaurants(),
    ]);
  }

  async function loadRestaurant(activeToken: string) {
    try {
      const data = await apiRequest("/vendor/restaurants", "GET", undefined, activeToken);
      setRestaurant(data);
      if (data) {
        setRestaurantName(data.name ?? "");
        setRestaurantDescription(data.description ?? "");
      }
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function loadMenu(activeToken: string) {
    try {
      const data = await apiRequest("/vendor/menu", "GET", undefined, activeToken);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function loadPublicRestaurants() {
    try {
      const data = await apiRequest("/vendor/restaurants/public", "GET");
      setPublicRestaurants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function createRestaurant() {
    if (!token) return;

    try {
      const data = await apiRequest(
        "/vendor/restaurants",
        "POST",
        { name: restaurantName, description: restaurantDescription },
        token
      );

      setRestaurant(data);
      setStatus(`Restaurant created: ${data.name}`);
      await loadPublicRestaurants();
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function updateRestaurant() {
    if (!token) return;

    try {
      const data = await apiRequest(
        "/vendor/restaurants",
        "PATCH",
        { name: restaurantName, description: restaurantDescription },
        token
      );

      setRestaurant(data);
      setStatus(`Restaurant updated: ${data.name}`);
      await loadPublicRestaurants();
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function addMenuItem() {
    if (!token) return;

    try {
      await apiRequest(
        "/vendor/menu",
        "POST",
        {
          name: newItemName,
          description: newItemDescription,
          price: Number(newItemPrice),
          is_available: newItemAvailable,
        },
        token
      );

      setStatus("Menu item added");
      setNewItemName("");
      setNewItemDescription("");
      setNewItemPrice("");
      setNewItemAvailable(true);
      await Promise.all([loadMenu(token), loadPublicRestaurants()]);
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function updateMenuItem() {
    if (!token) return;

    try {
      await apiRequest(
        "/vendor/menu",
        "PATCH",
        {
          item_id: editItemId,
          name: editItemName,
          description: editItemDescription,
          price: Number(editItemPrice),
          is_available: editItemAvailable,
        },
        token
      );

      setStatus("Menu item updated");
      await Promise.all([loadMenu(token), loadPublicRestaurants()]);
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  async function deleteMenuItem() {
    if (!token) return;

    try {
      await apiRequest(
        "/vendor/menu",
        "DELETE",
        { item_id: deleteItemId },
        token
      );

      setStatus("Menu item deleted");
      setDeleteItemId("");
      await Promise.all([loadMenu(token), loadPublicRestaurants()]);
    } catch (err: any) {
      setStatus(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Vendor Dashboard</Text>
      {status ? <Text style={styles.message}>{status}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Restaurant</Text>
        <TextInput
          placeholder="Restaurant name"
          style={styles.input}
          value={restaurantName}
          onChangeText={setRestaurantName}
        />
        <TextInput
          placeholder="Description"
          style={styles.input}
          value={restaurantDescription}
          onChangeText={setRestaurantDescription}
        />
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={createRestaurant}>
            <Text style={styles.buttonText}>Create</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={updateRestaurant}>
            <Text style={styles.buttonText}>Update</Text>
          </Pressable>
        </View>
        {restaurant ? <Text style={styles.smallText}>Current: {restaurant.id}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Menu Item</Text>
        <TextInput
          placeholder="Item name"
          style={styles.input}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          placeholder="Description"
          style={styles.input}
          value={newItemDescription}
          onChangeText={setNewItemDescription}
        />
        <TextInput
          placeholder="Price"
          keyboardType="decimal-pad"
          style={styles.input}
          value={newItemPrice}
          onChangeText={setNewItemPrice}
        />
        <View style={styles.switchRow}>
          <Text>Available</Text>
          <Switch value={newItemAvailable} onValueChange={setNewItemAvailable} />
        </View>
        <Pressable style={styles.button} onPress={addMenuItem}>
          <Text style={styles.buttonText}>Add Item</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Update Menu Item</Text>
        <TextInput
          placeholder="Item ID"
          style={styles.input}
          value={editItemId}
          onChangeText={setEditItemId}
        />
        <TextInput
          placeholder="Name"
          style={styles.input}
          value={editItemName}
          onChangeText={setEditItemName}
        />
        <TextInput
          placeholder="Description"
          style={styles.input}
          value={editItemDescription}
          onChangeText={setEditItemDescription}
        />
        <TextInput
          placeholder="Price"
          keyboardType="decimal-pad"
          style={styles.input}
          value={editItemPrice}
          onChangeText={setEditItemPrice}
        />
        <View style={styles.switchRow}>
          <Text>Available</Text>
          <Switch value={editItemAvailable} onValueChange={setEditItemAvailable} />
        </View>
        <Pressable style={styles.button} onPress={updateMenuItem}>
          <Text style={styles.buttonText}>Update Item</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Delete Menu Item</Text>
        <TextInput
          placeholder="Item ID"
          style={styles.input}
          value={deleteItemId}
          onChangeText={setDeleteItemId}
        />
        <Pressable style={[styles.button, styles.deleteButton]} onPress={deleteMenuItem}>
          <Text style={styles.buttonText}>Delete Item</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My Menu</Text>
        {menuItems.length === 0 ? <Text style={styles.smallText}>No items yet.</Text> : null}
        {menuItems.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.smallText}>ID: {item.id}</Text>
            <Text style={styles.smallText}>Price: ${Number(item.price).toFixed(2)}</Text>
            <Text style={styles.smallText}>Available: {item.is_available ? "Yes" : "No"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Public Listing Preview</Text>
        {publicRestaurants.length === 0 ? (
          <Text style={styles.smallText}>No restaurants in public listing.</Text>
        ) : null}
        {publicRestaurants.map((entry) => (
          <View key={entry.id} style={styles.menuItem}>
            <Text style={styles.menuName}>{entry.name}</Text>
            <Text style={styles.smallText}>{entry.description ?? "No description"}</Text>
            <Text style={styles.smallText}>Items: {entry.menu.length}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  message: {
    color: "#b00020",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  deleteButton: {
    backgroundColor: "#9f1239",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  smallText: {
    color: "#555",
    fontSize: 12,
  },
  menuItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  menuName: {
    fontWeight: "600",
    fontSize: 15,
  },
});
