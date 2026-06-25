import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
  const { token, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); 
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token || (activeRole !== 'BUYER' && activeRole !== 'SELLER')) {
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = activeRole === 'BUYER' ? 'my-orders' : 'store-orders';
      const res = await fetch(`${api_address}/orders/${endpoint}`, {
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

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchOrders();
    }, [activeRole, token]) 
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const handleProcessOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${api_address}/orders/${orderId}/process`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (res.ok) {
        showAlert('Sukses', 'Pesanan diproses! Status berubah menjadi Menunggu Pengirim.');
        fetchOrders(); 
      } else {
        showAlert('Gagal', data.message || 'Tidak dapat memproses pesanan.');
      }
    } catch (e) {
      showAlert('Error', 'Kesalahan jaringan saat memproses pesanan.');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  if (!token || (activeRole !== 'BUYER' && activeRole !== 'SELLER')) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="shield-off" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Akses Dibatasi</Text>
        <Text style={{ color: '#6B7280', marginTop: 8 }}>Halaman ini hanya untuk Pembeli dan Penjual.</Text>
      </View>
    );
  }

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  const isBuyer = activeRole === 'BUYER';

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="chevron-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isBuyer ? 'Riwayat Pesanan' : 'Pesanan Masuk'}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Belum ada pesanan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedOrderId === item.id;

          return (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => toggleExpand(item.id)} 
              style={[styles.card, isExpanded && { borderColor: '#3B82F6', borderWidth: 1.5 }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.entityNameContainer}>
                  <Feather 
                    name={isBuyer ? "briefcase" : "user"} 
                    size={14} 
                    color="#4B5563" 
                  /> 
                  <Text style={styles.entityName}>
                    {isBuyer ? item.store?.name : (item.buyer?.fullName || item.buyer?.username)}
                  </Text>
                </View>
                
                <View style={styles.statusContainer}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
                  </View>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                </View>
              </View>

              <View style={styles.divider} />
              
              {item.items.map((orderItem: any) => (
                <Text key={orderItem.id} style={styles.itemName}>
                  • {orderItem.quantity}x {orderItem.product.name}
                </Text>
              ))}

              {isExpanded && (
                <View style={styles.expandedContainer}>
                  <View style={styles.divider} />
                  
                  <Text style={styles.detailTitle}>Informasi Pengiriman</Text>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Penerima:</Text>
                    <Text style={styles.detailValue}>{item.buyer?.fullName || item.buyer?.username || 'GUEST'}</Text>

                    <Text style={styles.detailLabel}>Alamat Tujuan ({item.address?.label}):</Text>
                    <Text style={styles.detailValue}>{item.address?.addressLine || 'Alamat tidak ditemukan'}</Text>

                    <Text style={styles.detailLabel}>Metode Pengiriman:</Text>
                    <Text style={styles.detailValue}>{item.deliveryMethod.replace('_', ' ')}</Text>
                  </View>

                  <Text style={styles.detailTitle}>Rincian Pembayaran</Text>
                  <View style={styles.detailBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Subtotal Produk</Text>
                      <Text style={styles.breakdownValue}>{formatRupiah(item.subtotal)}</Text>
                    </View>
                    {item.discountAmount > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabelDiscount}>Diskon (Voucher/Promo)</Text>
                        <Text style={styles.breakdownValueDiscount}>-{formatRupiah(item.discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Ongkos Kirim</Text>
                      <Text style={styles.breakdownValue}>{formatRupiah(item.deliveryFee)}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>PPN (12%)</Text>
                      <Text style={styles.breakdownValue}>{formatRupiah(item.ppnAmount)}</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.divider} />
              
              <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>
                  {isBuyer ? 'Total Belanja:' : 'Pendapatan Kotor:'}
                </Text>
                <Text style={styles.totalValue}>{formatRupiah(item.finalTotal)}</Text>
              </View>

              {!isBuyer && item.status === 'SEDANG_DIKEMAS' && (
                <TouchableOpacity 
                  style={[styles.processButton, processingId === item.id && { opacity: 0.7 }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleProcessOrder(item.id);
                  }}
                  disabled={processingId === item.id}
                >
                  {processingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.processButtonText}>Proses Pesanan (Siap Dikirim)</Text>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  list: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, maxWidth: 600, alignSelf: 'center', width: '100%' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }, 
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 }, 
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', marginTop: 20 },
  
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' }, 
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entityNameContainer: { flexDirection: 'row', alignItems: 'center' },
  entityName: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginLeft: 6 }, 
  
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 }, 
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#D97706' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 }, 
  itemName: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  
  expandedContainer: { marginTop: 4 },
  detailTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  detailBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  detailLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', marginBottom: 8 },
  
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakdownLabel: { fontSize: 12, color: '#6B7280' },
  breakdownValue: { fontSize: 12, color: '#374151', fontWeight: '500' },
  breakdownLabelDiscount: { fontSize: 12, color: '#059669' },
  breakdownValueDiscount: { fontSize: 12, color: '#059669', fontWeight: 'bold' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, 
  totalLabel: { fontSize: 13, color: '#6B7280' }, 
  totalValue: { fontSize: 16, fontWeight: '900', color: '#E11D48' },
  
  processButton: { backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  processButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});