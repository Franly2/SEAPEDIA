import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
  const { token, activeRole } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);

  const [discountType, setDiscountType] = useState<'VOUCHER' | 'PROMO'>('VOUCHER');
  const [formCode, setFormCode] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formQuota, setFormQuota] = useState('');
  const [formExpiry, setFormExpiry] = useState(''); 

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const fetchStats = async () => {
    if (!token || activeRole !== 'ADMIN') return;
    try {
      const res = await fetch(`${api_address}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoadingStats(true);
      fetchStats();
    }, [activeRole, token])
  );

  const handleSimulateDay = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${api_address}/admin/simulate-day`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Berhasil', data.message);
        fetchStats(); // Segarkan data statistik
      } else {
        showAlert('Gagal', data.message);
      }
    } catch (e) {
      showAlert('Error', 'Gagal memanggil Mesin Waktu');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTriggerOverdue = async () => {
    setIsRefunding(true);
    try {
      const res = await fetch(`${api_address}/admin/trigger-overdue`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Selesai', `Diproses: ${data.totalRefunded} pesanan telat telah di-refund.`);
        fetchStats(); 
      } else {
        showAlert('Gagal', data.message);
      }
    } catch (e) {
      showAlert('Error', 'Gagal mengeksekusi Refund Engine');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCreateDiscount = async () => {
    if (!formCode || !formValue || !formExpiry) {
      showAlert('Peringatan', 'Harap isi Kode, Nilai Diskon, dan Tanggal Berakhir.');
      return;
    }

    setIsCreatingDiscount(true);
    const endpoint = discountType === 'VOUCHER' ? 'vouchers' : 'promos';
    
    const isoExpiryDate = `${formExpiry}T23:59:59Z`;

    const payload: any = {
      code: formCode,
      discountValue: Number(formValue),
      expiryDate: isoExpiryDate,
    };

    if (discountType === 'VOUCHER') {
      if (!formQuota) {
        showAlert('Peringatan', 'Voucher wajib mengisi Kuota Penggunaan.');
        setIsCreatingDiscount(false);
        return;
      }
      payload.usageQuota = Number(formQuota);
    }

    try {
      const res = await fetch(`${api_address}/admin/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showAlert('Sukses', `${discountType} ${formCode.toUpperCase()} berhasil dibuat!`);
        setFormCode(''); setFormValue(''); setFormQuota(''); setFormExpiry('');
        fetchStats();
      } else {
        showAlert('Gagal', typeof data.message === 'object' ? data.message[0] : data.message);
      }
    } catch (e) {
      showAlert('Error', 'Koneksi ke server gagal.');
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  if (!token || activeRole !== 'ADMIN') {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="lock.fill" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Akses Dibatasi</Text>
        <Text style={{ color: '#6B7280', marginTop: 8 }}>Halaman ini khusus untuk Administrator.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Admin Control Center</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📈 Statistik Marketplace</Text>
        {isLoadingStats || !stats ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.gridItem}><Text style={styles.gridValue}>{stats.totals.users}</Text><Text style={styles.gridLabel}>Pengguna</Text></View>
            <View style={styles.gridItem}><Text style={styles.gridValue}>{stats.totals.stores}</Text><Text style={styles.gridLabel}>Toko Aktif</Text></View>
            <View style={styles.gridItem}><Text style={styles.gridValue}>{stats.totals.products}</Text><Text style={styles.gridLabel}>Produk</Text></View>
            <View style={styles.gridItem}><Text style={styles.gridValue}>{stats.totals.orders}</Text><Text style={styles.gridLabel}>Total Pesanan</Text></View>
            <View style={styles.gridItem}><Text style={styles.gridValue}>{stats.totals.deliveryJobs}</Text><Text style={styles.gridLabel}>Pengiriman</Text></View>
            <View style={[styles.gridItem, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.gridValue, { color: '#B91C1C' }]}>{stats.totals.overdueOrders}</Text>
              <Text style={[styles.gridLabel, { color: '#B91C1C' }]}>Dikembalikan</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.sectionCard, { borderColor: '#FCA5A5', borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>⚠️ Operasi Logistik & SLA</Text>
        <Text style={styles.description}>
          Gunakan tombol di bawah ini untuk menguji mekanisme pembatalan otomatis pesanan yang melewati batas SLA.
        </Text>
        
        <TouchableOpacity 
          style={[styles.dangerButton, { backgroundColor: '#F59E0B' }]} 
          onPress={handleSimulateDay} 
          disabled={isSimulating}
        >
          {isSimulating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>⏩ Simulasikan +1 Hari (Time Travel)</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.dangerButton, { backgroundColor: '#EF4444' }]} 
          onPress={handleTriggerOverdue} 
          disabled={isRefunding}
        >
          {isRefunding ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>🔄 Trigger Refund Pesanan Overdue</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🎟️ Generator Diskon</Text>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleButton, discountType === 'VOUCHER' && styles.toggleActive]} onPress={() => setDiscountType('VOUCHER')}>
            <Text style={[styles.toggleText, discountType === 'VOUCHER' && styles.toggleTextActive]}>Voucher (Kuota)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, discountType === 'PROMO' && styles.toggleActive]} onPress={() => setDiscountType('PROMO')}>
            <Text style={[styles.toggleText, discountType === 'PROMO' && styles.toggleTextActive]}>Promo (Waktu)</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Kode (Cth: MERDEKA99)" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
        <TextInput style={styles.input} placeholder="Nilai Diskon (Cth: 15000)" value={formValue} onChangeText={setFormValue} keyboardType="numeric" />
        
        {discountType === 'VOUCHER' && (
          <TextInput style={styles.input} placeholder="Kuota Penggunaan (Cth: 100)" value={formQuota} onChangeText={setFormQuota} keyboardType="numeric" />
        )}
        
        <TextInput style={styles.input} placeholder="Tgl Kadaluarsa (YYYY-MM-DD)" value={formExpiry} onChangeText={setFormExpiry} />

        <TouchableOpacity style={styles.submitButton} onPress={handleCreateDiscount} disabled={isCreatingDiscount}>
          {isCreatingDiscount ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Generate {discountType}</Text>}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, maxWidth: 600, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#111827', marginBottom: 20 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  
  sectionCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  description: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { flexBasis: '31%', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  gridValue: { fontSize: 20, fontWeight: '900', color: '#1F2937' },
  gridLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  
  dangerButton: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#111827' },
  
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 14, fontSize: 14, marginBottom: 12 },
  submitButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 }
});