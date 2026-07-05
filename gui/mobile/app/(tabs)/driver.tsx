import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabType = 'AVAILABLE' | 'ACTIVE' | 'HISTORY';

export default function DriverScreen() {
  const { token, activeRole } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [activeTab, setActiveTab] = useState<TabType>('AVAILABLE');
  const [jobs, setJobs] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ totalJobs: 0, totalPendapatan: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!token || activeRole !== 'DRIVER') return;
    setIsLoading(true);

    try {
      let url = '';
      if (activeTab === 'AVAILABLE') url = `${api_address}/delivery/available`;
      else if (activeTab === 'ACTIVE') url = `${api_address}/delivery/my-jobs?status=ACTIVE`;
      else if (activeTab === 'HISTORY') {
        url = `${api_address}/delivery/my-jobs?status=COMPLETED`;
        const earnRes = await fetch(`${api_address}/delivery/earnings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (earnRes.ok) setEarnings(await earnRes.json());
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setJobs(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [activeTab, activeRole, token])
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const handleTakeJob = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${api_address}/delivery/${orderId}/take`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Sukses', 'Pekerjaan berhasil diambil! Silakan cek tab Tugas Aktif.');
        fetchJobs();
      } else {
        showAlert('Gagal', data.message);
      }
    } catch (e) {
      showAlert('Error', 'Kesalahan jaringan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteJob = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`${api_address}/delivery/${orderId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Sukses', 'Pengiriman Selesai. Upah telah ditambahkan ke dompet Anda!');
        fetchJobs();
      } else {
        showAlert('Gagal', data.message);
      }
    } catch (e) {
      showAlert('Error', 'Kesalahan jaringan.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (!token || activeRole !== 'DRIVER') {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="car.fill" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Akses Dibatasi</Text>
        <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Halaman ini khusus untuk Mitra Pengemudi (Driver).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dasbor Kurir</Text>
      </View>

      <View style={styles.tabContainer}>
        {[
          { key: 'AVAILABLE', label: 'Bursa Pekerjaan' },
          { key: 'ACTIVE', label: 'Tugas Aktif' },
          { key: 'HISTORY', label: 'Riwayat' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'HISTORY' && (
        <View style={styles.earningsBanner}>
          <IconSymbol name="banknote.fill" size={32} color={Colors.primary} />
          <View style={{ marginLeft: 16 }}>
            <Text style={{ color: Colors.primaryLight, fontSize: 12 }}>Total Pendapatan Bersih</Text>
            <Text style={{ color: Colors.surface, fontSize: 24, fontWeight: '900' }}>{formatRupiah(earnings.totalPendapatan)}</Text>
            <Text style={{ color: Colors.border, fontSize: 12 }}>Dari {earnings.totalJobs} pengiriman selesai</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: Colors.textMuted }}>Tidak ada paket di kategori ini.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isDeliveryJob = !!item.order; 
            const orderData = isDeliveryJob ? item.order : item;
            const fee = isDeliveryJob ? item.driverFee : item.deliveryFee;

            if (!orderData || !orderData.deliveryMethod) return null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.storeName}>🏪 {orderData.store?.name || 'Toko'}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{orderData.deliveryMethod?.replace(/_/g, ' ') || 'REGULAR'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Tujuan Pengiriman:</Text>
                <Text style={styles.buyerName}>{orderData.buyer?.fullName || 'Pembeli'}</Text>
                <Text style={styles.addressText}>{orderData.address?.addressLine || 'Alamat tidak tersedia'}</Text>

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                  <Text style={styles.feeLabel}>Potensi Upah:</Text>
                  <Text style={styles.feeValue}>{formatRupiah(fee || 0)}</Text>
                </View>

                {activeTab === 'AVAILABLE' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                    onPress={() => handleTakeJob(orderData.id)}
                    disabled={processingId === orderData.id}
                  >
                    {processingId === orderData.id ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.actionText}>Ambil Pekerjaan</Text>}
                  </TouchableOpacity>
                )}

                {activeTab === 'ACTIVE' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleCompleteJob(orderData.id)}
                    disabled={processingId === orderData.id}
                  >
                    {processingId === orderData.id ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.actionText}>Selesaikan Pengiriman</Text>}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: Colors.surface, elevation: 2, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, zIndex: 10 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.secondary, letterSpacing: -0.5 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, color: Colors.secondary },
  
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '900' },

  earningsBanner: { backgroundColor: Colors.secondary, margin: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },

  list: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 15, fontWeight: '900', color: Colors.secondary },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: Colors.primary, fontSize: 11, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  sectionLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '600' },
  buyerName: { fontSize: 15, fontWeight: '800', color: Colors.secondary, marginBottom: 4 },
  addressText: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feeLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  feeValue: { fontSize: 20, fontWeight: '900', color: '#059669' },
  
  actionButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { color: Colors.surface, fontWeight: '900', fontSize: 14 },
});