import { IconSymbol } from '@/components/ui/icon-symbol';
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
      if (activeTab === 'AVAILABLE') url = `http://${api_address}:3000/delivery/available`;
      else if (activeTab === 'ACTIVE') url = `http://${api_address}:3000/delivery/my-jobs?status=ACTIVE`;
      else if (activeTab === 'HISTORY') {
        url = `http://${api_address}:3000/delivery/my-jobs?status=COMPLETED`;
        // Fetch pendapatan secara berbarengan jika di tab History
        const earnRes = await fetch(`http://${api_address}:3000/delivery/earnings`, {
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
      const res = await fetch(`http://${api_address}:3000/delivery/${orderId}/take`, {
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
      const res = await fetch(`http://${api_address}:3000/delivery/${orderId}/complete`, {
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
        <Text style={{ color: '#6B7280', marginTop: 8 }}>Halaman ini khusus untuk Mitra Pengemudi (Driver).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dasbor Kurir</Text>
      </View>

      {/* SEGMENTED CONTROL (TABS) */}
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

      {/* BANNER PENDAPATAN (Hanya muncul di Tab History) */}
      {activeTab === 'HISTORY' && (
        <View style={styles.earningsBanner}>
          <IconSymbol name="banknote.fill" size={32} color="#D97706" />
          <View style={{ marginLeft: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Total Pendapatan Bersih</Text>
            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>{formatRupiah(earnings.totalPendapatan)}</Text>
            <Text style={{ color: '#D1D5DB', fontSize: 12 }}>Dari {earnings.totalJobs} pengiriman selesai</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          data={jobs}
          // Gunakan index sebagai fallback key agar tidak error jika id bentrok
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: '#9CA3AF' }}>Tidak ada paket di kategori ini.</Text>
            </View>
          }
          renderItem={({ item }) => {
            // SOLUSI ANTI-CRASH: Cek langsung struktur datanya!
            // Jika ada objek 'order', berarti ini data dari tab Tugas Aktif/Riwayat (DeliveryJob).
            // Jika tidak ada, berarti ini data dari tab Bursa Pekerjaan (Order).
            const isDeliveryJob = !!item.order; 
            const orderData = isDeliveryJob ? item.order : item;
            const fee = isDeliveryJob ? item.driverFee : item.deliveryFee;

            // Guard Clause pengaman ganda: Jika data tidak valid sesaat saat loading, jangan render (hindari crash)
            if (!orderData || !orderData.deliveryMethod) return null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.storeName}>🏪 {orderData.store?.name || 'Toko'}</Text>
                  <View style={styles.badge}>
                    {/* Gunakan optional chaining (?.) untuk keamanan ekstra */}
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

                {/* TOMBOL AKSI BERDASARKAN TAB */}
                {activeTab === 'AVAILABLE' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                    onPress={() => handleTakeJob(orderData.id)}
                    disabled={processingId === orderData.id}
                  >
                    {processingId === orderData.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionText}>Ambil Pekerjaan</Text>}
                  </TouchableOpacity>
                )}

                {activeTab === 'ACTIVE' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleCompleteJob(orderData.id)}
                    disabled={processingId === orderData.id}
                  >
                    {processingId === orderData.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionText}>Selesaikan Pengiriman</Text>}
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1F2937' },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#3B82F6' },

  earningsBanner: { backgroundColor: '#1F2937', margin: 16, borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center' },

  list: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
  badge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#1D4ED8', fontSize: 10, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  sectionLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  buyerName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  addressText: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  feeLabel: { fontSize: 13, color: '#6B7280' },
  feeValue: { fontSize: 18, fontWeight: '900', color: '#059669' },
  
  actionButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});