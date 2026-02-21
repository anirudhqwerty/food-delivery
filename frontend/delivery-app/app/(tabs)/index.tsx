import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { apiRequest } from '../../lib/api';
import { getToken } from '../../lib/auth';

export default function DriverDashboard() {
  const [availableDeliveries, setAvailableDeliveries] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      const token = await getToken();
      setUserToken(token);
    };
    initializeToken();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/delivery/available', 'GET', undefined, userToken);
      setAvailableDeliveries(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we have a token and don't have an active delivery, poll for new ones
    if (!activeDelivery && userToken) {
      fetchDeliveries();
      const interval = setInterval(fetchDeliveries, 10000);
      return () => clearInterval(interval);
    }
  }, [activeDelivery, userToken]);

  const updateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updated = await apiRequest(`/delivery/${deliveryId}/status`, 'PUT', { status: newStatus }, userToken);
      
      if (newStatus === 'DELIVERED') {
        setActiveDelivery(null);
        Alert.alert('Success', 'Delivery completed!');
        fetchDeliveries();
      } else {
        setActiveDelivery(updated);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading && !availableDeliveries.length) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  // ACTIVE DELIVERY VIEW
  if (activeDelivery) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Active Delivery</Text>
        <View style={styles.card}>
          <Text style={styles.orderId}>Order ID: {activeDelivery.order_id}</Text>
          <Text style={styles.status}>Current Status: {activeDelivery.status}</Text>
          
          {activeDelivery.status === 'ASSIGNED' && (
            <TouchableOpacity style={styles.button} onPress={() => updateStatus(activeDelivery.id, 'AT_RESTAURANT')}>
              <Text style={styles.buttonText}>I have arrived at Restaurant</Text>
            </TouchableOpacity>
          )}
          {activeDelivery.status === 'AT_RESTAURANT' && (
            <TouchableOpacity style={styles.button} onPress={() => updateStatus(activeDelivery.id, 'PICKED_UP')}>
              <Text style={styles.buttonText}>I have picked up the food</Text>
            </TouchableOpacity>
          )}
          {activeDelivery.status === 'PICKED_UP' && (
            <TouchableOpacity style={[styles.button, styles.deliverButton]} onPress={() => updateStatus(activeDelivery.id, 'DELIVERED')}>
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // AVAILABLE DELIVERIES FEED
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Orders</Text>
      {availableDeliveries.length === 0 ? (
        <Text style={styles.empty}>No pending deliveries. Waiting for food to be ready...</Text>
      ) : (
        <FlatList
          data={availableDeliveries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.orderId}>Order: {item.order_id}</Text>
              <TouchableOpacity style={styles.acceptButton} onPress={() => updateStatus(item.id, 'ASSIGNED')}>
                <Text style={styles.buttonText}>Accept Delivery</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, elevation: 3 },
  orderId: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
  status: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  acceptButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  deliverButton: { backgroundColor: '#ff9900' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  empty: { fontSize: 16, color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: 40 }
});
