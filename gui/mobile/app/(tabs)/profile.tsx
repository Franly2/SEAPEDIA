import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  // Asumsi: updateActiveRole adalah fungsi di Zustand untuk menyimpan token & peran aktif baru
  const { fullName, username, activeRole, token, logout, updateActiveRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [buyerExpense, setBuyerExpense] = useState(0);
  const [sellerIncome, setSellerIncome] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchFinancialReports = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const [walletRes, buyerRes, sellerRes] = await Promise.all([
            fetch(`${api_address}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${api_address}/orders/report/buyer`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${api_address}/orders/report/seller`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          if (walletRes.ok) setWalletBalance((await walletRes.json()).balance);
          if (buyerRes.ok) setBuyerExpense((await buyerRes.json()).totalPengeluaran);
          if (sellerRes.ok) setSellerIncome((await sellerRes.json()).totalPendapatan);
          
        } catch (error) {
          console.error("Gagal memuat laporan finansial", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFinancialReports();
    }, [token, activeRole]) // Ditambahkan activeRole sebagai dependency agar data reload saat ganti peran
  );

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const handleSwitchRole = async (targetRole: 'BUYER' | 'SELLER' | 'DRIVER' | 'ADMIN') => {
    if (activeRole === targetRole) return;
    
    setIsSwitching(true);
    try {
      const res = await fetch(`${api_address}/auth/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();

      if (res.ok) {
        // Backend mengembalikan token baru dengan payload role yang baru
        // Simpan token baru dan role baru ke Zustand store Anda
        if (updateActiveRole) {
          updateActiveRole(data.activeRole, data.accessToken || data.token);
        }
        showAlert('Sukses', `Berhasil beralih ke peran ${targetRole}!`);
        router.replace('/profile');
      } else {
        showAlert('Gagal', data.message || 'Anda tidak memiliki otoritas untuk peran ini.');
      }
    } catch (error) {
      showAlert('Error', 'Terjadi kesalahan jaringan saat berpindah peran.');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Apakah kamu yakin ingin keluar?');
      if (confirm) {
        logout();
        router.replace('/');
      }
    } else {
      Alert.alert('Keluar', 'Apakah kamu yakin ingin keluar dari SEAPEDIA?', [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Keluar', 
          style: 'destructive', 
          onPress: () => {
            logout();
            router.replace('/');
          } 
        },
      ]);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* --- KARTU PROFIL --- */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
             <Feather name="user" size={40} color="#6B7280" />
          </View>
        </View>
        <Text style={styles.fullName}>{fullName || 'Pengguna SEAPEDIA'}</Text>
        <Text style={styles.username}>@{username || 'guest'}</Text>
        
        <View style={styles.roleBadge}>
          <Feather name="shield" size={14} color="#1D4ED8" />
          <Text style={styles.roleText}>Peran Aktif: {activeRole || 'GUEST'}</Text>
        </View>
      </View>

      {/* --- SECTION PILIH PERAN AKTIF --- */}
      <View style={styles.sectionHeaderRow}>
         <Text style={styles.sectionTitle}>Beralih Peran Aktif</Text>
         {isSwitching && <ActivityIndicator size="small" color="#3B82F6" />}
      </View>
      
      <View style={styles.roleSelectorContainer}>
        {[
          { id: 'BUYER', name: 'Pembeli', icon: 'shopping-bag' },
          { id: 'SELLER', name: 'Penjual', icon: 'briefcase' },
          { id: 'DRIVER', name: 'Kurir / Driver', icon: 'truck' },
          { id: 'ADMIN', name: 'Admin', icon: 'command' }
        ].map((roleOption) => {
          const isActive = activeRole === roleOption.id;
          return (
            <TouchableOpacity
              key={roleOption.id}
              style={[styles.roleCard, isActive && styles.roleCardActive]}
              onPress={() => handleSwitchRole(roleOption.id as any)}
              disabled={isSwitching || isActive}
              activeOpacity={0.7}
            >
              <Feather name={roleOption.icon as any} size={20} color={isActive ? '#1D4ED8' : '#4B5563'} />
              <Text style={[styles.roleCardText, isActive && styles.roleCardTextActive]}>
                {roleOption.name}
              </Text>
              {isActive && (
                <View style={styles.activeIndicatorDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- SUMMARY FINANSIAL --- */}
      <View style={styles.sectionHeaderRow}>
         <Text style={styles.sectionTitle}>Ringkasan Finansial</Text>
         {isLoading && <ActivityIndicator size="small" color="#1D4ED8" />}
      </View>
      
      <View style={styles.financialContainer}>
        <View style={styles.financialRow}>
          <View style={styles.financialIconWrapper}>
            <Feather name="credit-card" size={22} color="#10B981" />
          </View>
          <View style={styles.financialInfo}>
            <Text style={styles.financialLabel}>Saldo Dompet (Wallet)</Text>
            <Text style={styles.financialValue}>{formatRupiah(walletBalance)}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.financialRow}>
          <View style={[styles.financialIconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="arrow-up-right" size={22} color="#DC2626" />
          </View>
          <View style={styles.financialInfo}>
            <Text style={styles.financialLabel}>Pengeluaran Belanja (Buyer)</Text>
            <Text style={[styles.financialValue, { color: '#DC2626' }]}>{formatRupiah(buyerExpense)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.financialRow}>
          <View style={[styles.financialIconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="shopping-bag" size={22} color="#D97706" />
          </View>
          <View style={styles.financialInfo}>
            <Text style={styles.financialLabel}>Pendapatan Kotor (Seller)</Text>
            <Text style={[styles.financialValue, { color: '#D97706' }]}>{formatRupiah(sellerIncome)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        *Angka di atas dihitung otomatis berdasarkan riwayat transaksi yang sah dan mengikat di seluruh peran Anda.
      </Text>

      {/* --- ACCORDION MENU SETTING --- */}
      <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
      <View style={styles.menuContainer}>
        {activeRole === 'BUYER' && (
          <>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/buyer/wallet')}
            >
              <Feather name="credit-card" size={20} color="#10B981" style={{ width: 24 }} />
              <Text style={styles.menuText}>Dompet Pembeli (Top Up & Riwayat)</Text>
              <Feather name="chevron-right" size={18} color="#D1D5DB" />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/buyer/address')}
            >
              <Feather name="map-pin" size={20} color="#3B82F6" style={{ width: 24 }} />
              <Text style={styles.menuText}>Daftar Alamat Pengiriman</Text>
              <Feather name="chevron-right" size={18} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}
        
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#DC2626" style={{ width: 24 }} />
          <Text style={[styles.menuText, { color: '#DC2626' }]}>Keluar Akun</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  profileCard: { alignItems: 'center', backgroundColor: '#FFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  avatarContainer: { marginBottom: 12 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  fullName: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  username: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: '#1D4ED8' },
  
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 8 },
  
  // Gaya Baru: Grid/List Pemilih Peran Aktif yang Mewah
  roleSelectorContainer: { marginBottom: 24 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  roleCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  roleCardText: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: '#4B5563' },
  roleCardTextActive: { color: '#1D4ED8', fontWeight: 'bold' },
  activeIndicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
  
  financialContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 8 },
  financialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  financialIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  financialInfo: { flex: 1 },
  financialLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  financialValue: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  disclaimerText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 24, paddingHorizontal: 4 },
  
  menuContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#374151', marginLeft: 12 }
});