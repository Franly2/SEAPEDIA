import DeliveryStatsModal, { DeliveryStat } from '@/components/DeliveryStatsModal';
import OrderStatsModal, { OrderStat } from '@/components/OrderStatsModal';
import ProductStatsModal, { ProductStat } from '@/components/ProductStatsModal';
import StoreStatsModal, { StoreStat } from '@/components/StoreStatsModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import UserStatsModal, { UserStat } from '@/components/userStatsModal';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
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

  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [userStatsList, setUserStatsList] = useState<UserStat[]>([]);

  const [isStoreModalVisible, setIsStoreModalVisible] = useState(false);
  const [storeStatsList, setStoreStatsList] = useState<StoreStat[]>([]);

  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [productStatsList, setProductStatsList] = useState<ProductStat[]>([]);

  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [orderStatsList, setOrderStatsList] = useState<OrderStat[]>([]);
  const [orderModalTitle, setOrderModalTitle] = useState('');

  const [isDeliveryModalVisible, setIsDeliveryModalVisible] = useState(false);
  const [deliveryStatsList, setDeliveryStatsList] = useState<DeliveryStat[]>([]);

  const [isModalLoading, setIsModalLoading] = useState(false);

  const [voucherList, setVoucherList] = useState<any[]>([]);
  const [promoList, setPromoList] = useState<any[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const fetchStats = async () => {
    if (!token || activeRole !== 'ADMIN') return;
    try {
      const res = await fetch(`${api_address}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchDiscounts = async () => {
    setIsLoadingDiscounts(true);
    try {
      const [resVoucher, resPromo] = await Promise.all([
        fetch(`${api_address}/admin/vouchers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api_address}/admin/promos`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resVoucher.ok) setVoucherList(await resVoucher.json());
      if (resPromo.ok) setPromoList(await resPromo.json());
    } catch (e) {
      console.error("Gagal memuat list diskon", e);
    } finally {
      setIsLoadingDiscounts(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoadingStats(true);
      fetchStats();
      fetchDiscounts();
    }, [activeRole, token])
  );

  const fetchModalData = async (endpoint: string, setter: any, setVisible: any) => {
    setVisible(true);
    setIsModalLoading(true);
    try {
      const res = await fetch(`${api_address}/admin/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setter(await res.json());
      else showAlert('Error', 'Gagal mengambil data.');
    } catch (e) {
      showAlert('Error', 'Terjadi kesalahan jaringan.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleSimulateDay = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${api_address}/admin/simulate-day`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showAlert('Berhasil', (await res.json()).message); fetchStats(); fetchDiscounts(); }
    } finally { setIsSimulating(false); }
  };

  const handleTriggerOverdue = async () => {
    setIsRefunding(true);
    try {
      const res = await fetch(`${api_address}/admin/trigger-overdue`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showAlert('Selesai', `Di-refund: ${(await res.json()).totalRefunded} pesanan.`); fetchStats(); }
    } finally { setIsRefunding(false); }
  };

  const handleCreateDiscount = async () => {
    if (!formCode || !formValue || !formExpiry) {
      showAlert('Peringatan', 'Harap isi Kode, Nilai Diskon, dan Tanggal Berakhir.');
      return;
    }
    setIsCreatingDiscount(true);
    const endpoint = discountType === 'VOUCHER' ? 'vouchers' : 'promos';
    const isoExpiryDate = `${formExpiry}T23:59:59Z`;
    const payload: any = { code: formCode, discountValue: Number(formValue), expiryDate: isoExpiryDate };
    
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Sukses', `${discountType} ${formCode.toUpperCase()} berhasil dibuat!`);
        setFormCode(''); setFormValue(''); setFormQuota(''); setFormExpiry('');
        fetchStats(); 
        fetchDiscounts(); 
      } else {
        showAlert('Gagal', typeof data.message === 'object' ? data.message[0] : data.message);
      }
    } catch (e) {
      showAlert('Error', 'Koneksi ke server gagal.');
    } finally {
      setIsCreatingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (id: string, type: 'VOUCHER' | 'PROMO') => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus ${type} ini?`;
    const action = async () => {
      try {
        const endpoint = type === 'VOUCHER' ? `vouchers/${id}` : `promos/${id}`;
        const res = await fetch(`${api_address}/admin/${endpoint}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showAlert('Sukses', `${type} berhasil dihapus.`);
          fetchStats();
          fetchDiscounts();
        } else {
          showAlert('Info', `Endpoint DELETE belum diimplementasikan di backend. Hapus data secara manual di database.`);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) action();
    } else {
      Alert.alert('Hapus Diskon', confirmMessage, [{ text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: action }]);
    }
  };

  if (!token || activeRole !== 'ADMIN') {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="lock.fill" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Akses Dibatasi</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Admin Control Center</Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Statistik Marketplace</Text>
          {isLoadingStats || !stats ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <View style={styles.gridContainer}>
              <TouchableOpacity style={styles.gridItemClickable} onPress={() => fetchModalData('users-stats', setUserStatsList, setIsUserModalVisible)} activeOpacity={0.7}>
                <Text style={styles.gridValue}>{stats.totals.users}</Text>
                <View style={styles.labelRow}>
                  <Text style={styles.gridLabelNoMargin}>Pengguna</Text>
                  <Feather name="chevron-right" size={12} color="#6B7280" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItemClickable} onPress={() => fetchModalData('stores-stats', setStoreStatsList, setIsStoreModalVisible)} activeOpacity={0.7}>
                <Text style={styles.gridValue}>{stats.totals.stores}</Text>
                <View style={styles.labelRow}>
                  <Text style={styles.gridLabelNoMargin}>Toko Aktif</Text>
                  <Feather name="chevron-right" size={12} color="#6B7280" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItemClickable} onPress={() => fetchModalData('products-stats', setProductStatsList, setIsProductModalVisible)} activeOpacity={0.7}>
                <Text style={styles.gridValue}>{stats.totals.products}</Text>
                <View style={styles.labelRow}>
                  <Text style={styles.gridLabelNoMargin}>Produk</Text>
                  <Feather name="chevron-right" size={12} color="#6B7280" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItemClickable} onPress={() => { setOrderModalTitle('Semua Pesanan'); fetchModalData('orders-stats?overdue=false', setOrderStatsList, setIsOrderModalVisible); }} activeOpacity={0.7}>
                <Text style={styles.gridValue}>{stats.totals.orders}</Text>
                <View style={styles.labelRow}>
                  <Text style={styles.gridLabelNoMargin}>Total Pesanan</Text>
                  <Feather name="chevron-right" size={12} color="#6B7280" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItemClickable} onPress={() => fetchModalData('deliveries-stats', setDeliveryStatsList, setIsDeliveryModalVisible)} activeOpacity={0.7}>
                <Text style={styles.gridValue}>{stats.totals.deliveryJobs}</Text>
                <View style={styles.labelRow}>
                  <Text style={styles.gridLabelNoMargin}>Pengiriman</Text>
                  <Feather name="chevron-right" size={12} color="#6B7280" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.gridItemClickable, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]} onPress={() => { setOrderModalTitle('Pesanan Overdue (Dikembalikan)'); fetchModalData('orders-stats?overdue=true', setOrderStatsList, setIsOrderModalVisible); }} activeOpacity={0.7}>
                <Text style={[styles.gridValue, { color: '#B91C1C' }]}>{stats.totals.overdueOrders}</Text>
                <View style={styles.labelRow}>
                  <Text style={[styles.gridLabelNoMargin, { color: '#B91C1C' }]}>Dikembalikan</Text>
                  <Feather name="chevron-right" size={12} color="#B91C1C" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              {/* STATISTIK VOUCHER & PROMO (NON-KLIK) */}
              <View style={[styles.gridItem, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', flexBasis: '48%' }]}>
                <Text style={[styles.gridValue, { color: '#4B5563' }]}>{stats.totals.vouchers}</Text>
                <Text style={[styles.gridLabel, { color: '#4B5563' }]}>Voucher Aktif</Text>
              </View>

              <View style={[styles.gridItem, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', flexBasis: '48%' }]}>
                <Text style={[styles.gridValue, { color: '#4B5563' }]}>{stats.totals.promos}</Text>
                <Text style={[styles.gridLabel, { color: '#4B5563' }]}>Promo Aktif</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { borderColor: '#FCA5A5', borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Logistik & SLA</Text>
          <TouchableOpacity style={[styles.dangerButton, { backgroundColor: '#F59E0B' }]} onPress={handleSimulateDay} disabled={isSimulating}>
            {isSimulating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Simulasikan +1 Hari</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, { backgroundColor: '#EF4444' }]} onPress={handleTriggerOverdue} disabled={isRefunding}>
            {isRefunding ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Trigger Refund Pesanan Overdue</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Diskon</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleButton, discountType === 'VOUCHER' && styles.toggleActive]} onPress={() => setDiscountType('VOUCHER')}>
              <Text style={[styles.toggleText, discountType === 'VOUCHER' && styles.toggleTextActive]}>Voucher (Kuota)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, discountType === 'PROMO' && styles.toggleActive]} onPress={() => setDiscountType('PROMO')}>
              <Text style={[styles.toggleText, discountType === 'PROMO' && styles.toggleTextActive]}>Promo (Waktu)</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="Kode (Cth: MERDEKA99)" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
          <TextInput style={styles.input} placeholder="Nilai Diskon Rp (Cth: 15000)" value={formValue} onChangeText={setFormValue} keyboardType="numeric" />
          {discountType === 'VOUCHER' && (
            <TextInput style={styles.input} placeholder="Kuota Penggunaan (Cth: 100)" value={formQuota} onChangeText={setFormQuota} keyboardType="numeric" />
          )}
          <TextInput style={styles.input} placeholder="Tgl Kadaluarsa (YYYY-MM-DD)" value={formExpiry} onChangeText={setFormExpiry} />
          <TouchableOpacity style={styles.submitButton} onPress={handleCreateDiscount} disabled={isCreatingDiscount}>
            {isCreatingDiscount ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Generate {discountType}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daftar Voucher Aktif</Text>
          {isLoadingDiscounts ? (
             <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              {voucherList.map((v) => (
                <View key={v.id} style={styles.discountCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.discountCode}>{v.code}</Text>
                    <View style={styles.rowBetween}>
                      <Text style={styles.discountBadge}>{formatRupiah(v.discountValue)}</Text>
                      <TouchableOpacity onPress={() => handleDeleteDiscount(v.id, 'VOUCHER')} style={styles.deleteIcon}>
                        <Feather name="trash-2" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.discountDetail}>Sisa Kuota: <Text style={{fontWeight: 'bold', color: '#111827'}}>{v.usageQuota}x</Text></Text>
                  <Text style={styles.discountDetail}>Berakhir: {formatDate(v.expiryDate)}</Text>
                </View>
              ))}
              {voucherList.length === 0 && <Text style={styles.emptyText}>Tidak ada voucher terdaftar.</Text>}
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daftar Promo Aktif</Text>
          {isLoadingDiscounts ? (
             <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              {promoList.map((p) => (
                <View key={p.id} style={styles.discountCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.discountCode}>{p.code}</Text>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.discountBadge, { backgroundColor: '#ECFDF5', color: '#047857' }]}>{formatRupiah(p.discountValue)}</Text>
                      <TouchableOpacity onPress={() => handleDeleteDiscount(p.id, 'PROMO')} style={styles.deleteIcon}>
                        <Feather name="trash-2" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.discountDetail}>Berakhir: <Text style={{fontWeight: 'bold', color: '#DC2626'}}>{formatDate(p.expiryDate)}</Text></Text>
                </View>
              ))}
              {promoList.length === 0 && <Text style={styles.emptyText}>Tidak ada promo terdaftar.</Text>}
            </>
          )}
        </View>

      </ScrollView>

      <UserStatsModal visible={isUserModalVisible} onClose={() => setIsUserModalVisible(false)} data={userStatsList} isLoading={isModalLoading} />
      <StoreStatsModal visible={isStoreModalVisible} onClose={() => setIsStoreModalVisible(false)} data={storeStatsList} isLoading={isModalLoading} />
      <ProductStatsModal visible={isProductModalVisible} onClose={() => setIsProductModalVisible(false)} data={productStatsList} isLoading={isModalLoading} />
      <OrderStatsModal visible={isOrderModalVisible} onClose={() => setIsOrderModalVisible(false)} data={orderStatsList} isLoading={isModalLoading} title={orderModalTitle} />
      <DeliveryStatsModal visible={isDeliveryModalVisible} onClose={() => setIsDeliveryModalVisible(false)} data={deliveryStatsList} isLoading={isModalLoading} />
    </>
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
  gridItemClickable: { flexBasis: '31%', backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  gridValue: { fontSize: 20, fontWeight: '900', color: '#1F2937' },
  gridLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center', fontWeight: 'bold' },
  
  dangerButton: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#111827' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 14, fontSize: 14, marginBottom: 12 },
  submitButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },

  discountCard: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  discountCode: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', letterSpacing: 0.5 },
  discountBadge: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#DBEAFE', color: '#1D4ED8', overflow: 'hidden' },
  discountDetail: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  deleteIcon: { padding: 4, marginLeft: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  labelRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 4 
  },
  gridLabelNoMargin: { 
    fontSize: 11, 
    color: '#6B7280', 
    textAlign: 'center', 
    fontWeight: 'bold' 
  },
});