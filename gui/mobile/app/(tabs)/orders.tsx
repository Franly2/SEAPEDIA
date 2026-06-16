// Lokasi file: app/(tabs)/orders.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from 'react-native';

export default function OrdersScreen() {
  const { token, activeRole } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchOrders = async () => {
        // Hentikan proses jika peran bukan BUYER atau SELLER
        if (!token || (activeRole !== 'BUYER' && activeRole !== 'SELLER')) {
          setIsLoading(false);
          return;
        }

        try {
          // Tentukan endpoint berdasarkan peran aktif
          const endpoint = activeRole === 'BUYER' ? 'my-orders' : 'store-orders';
          
          const res = await fetch(`http://${api_address}:3000/orders/${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            setOrders(await res.json());
          }
        } catch (e) {
          console.error(e);
        } finally { 
          setIsLoading(false); 
        }
      };
      
      fetchOrders();
    }, [activeRole, token]) // Pastikan dependency array mutakhir
  );

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  // GUARD CLAUSE: Tolak jika bukan BUYER dan bukan SELLER
  if (!token || (activeRole !== 'BUYER' && activeRole !== 'SELLER')) {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="shield.slash.fill" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Akses Dibatasi</Text>
        <Text style={{ color: '#6B7280', marginTop: 8 }}>Halaman ini hanya untuk Pembeli dan Penjual.</Text>
      </View>
    );
  }

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  const isBuyer = activeRole === 'BUYER';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Ubah judul halaman berdasarkan peran */}
        <Text style={styles.headerTitle}>
          {isBuyer ? 'Riwayat Pesanan' : 'Pesanan Masuk'}
        </Text>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#9CA3AF' }}>Belum ada pesanan.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              
              {/* Tampilkan Nama Toko (untuk Pembeli) atau Nama Pembeli (untuk Penjual) */}
              <Text style={styles.entityName}>
                <IconSymbol 
                  name={isBuyer ? "building.2.fill" : "person.fill"} 
                  size={14} 
                  color="#4B5563" 
                /> 
                {' '}
                {isBuyer ? item.store?.name : (item.buyer?.fullName || item.buyer?.username)}
              </Text>
              
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            {/* Tampilkan item yang dibeli */}
            {item.items.map((orderItem: any) => (
              <Text key={orderItem.id} style={styles.itemName}>
                • {orderItem.quantity}x {orderItem.product.name}
              </Text>
            ))}

            {/* Khusus Penjual, tampilkan metode pengiriman agar mereka tahu */}
            {!isBuyer && (
              <Text style={styles.deliveryMethodText}>
                Metode Pengiriman: <Text style={{ fontWeight: 'bold' }}>{item.deliveryMethod.replace('_', ' ')}</Text>
              </Text>
            )}

            <View style={styles.divider} />
            
            <View style={styles.cardFooter}>
              <Text style={styles.totalLabel}>
                {isBuyer ? 'Total Belanja:' : 'Pendapatan Kotor:'}
              </Text>
              <Text style={styles.totalValue}>{formatRupiah(item.finalTotal)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, 
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 }, 
  list: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' }, 
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entityName: { fontSize: 14, fontWeight: 'bold', color: '#374151' }, 
  statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }, 
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#D97706' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }, 
  itemName: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  deliveryMethodText: { fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, 
  totalLabel: { fontSize: 13, color: '#6B7280' }, 
  totalValue: { fontSize: 16, fontWeight: '900', color: '#E11D48' }
});