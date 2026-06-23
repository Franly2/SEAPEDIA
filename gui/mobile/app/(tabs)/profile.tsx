import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { fullName, username, activeRole, token, logout } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
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
            fetch(`http://${api_address}:3000/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`http://${api_address}:3000/orders/report/buyer`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`http://${api_address}:3000/orders/report/seller`, { headers: { Authorization: `Bearer ${token}` } }),
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
    }, [token])
  );

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
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <IconSymbol name="person.crop.circle.fill" size={80} color="#9CA3AF" />
        </View>
        <Text style={styles.fullName}>{fullName || 'Pengguna SEAPEDIA'}</Text>
        <Text style={styles.username}>@{username || 'guest'}</Text>
        
        <View style={styles.roleBadge}>
          <IconSymbol name="checkmark.shield.fill" size={14} color="#1D4ED8" />
          <Text style={styles.roleText}>Peran Aktif: {activeRole || 'GUEST'}</Text>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
         <Text style={styles.sectionTitle}>Ringkasan Finansial</Text>
         {isLoading && <ActivityIndicator size="small" color="#1D4ED8" />}
      </View>
      
      <View style={styles.financialContainer}>
        
        <View style={styles.financialRow}>
          <View style={styles.financialIconWrapper}>
            <IconSymbol name="creditcard.fill" size={24} color="#10B981" />
          </View>
          <View style={styles.financialInfo}>
            <Text style={styles.financialLabel}>Saldo Dompet (Wallet)</Text>
            <Text style={styles.financialValue}>{formatRupiah(walletBalance)}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.financialRow}>
          <View style={[styles.financialIconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <IconSymbol name="arrow.up.right" size={24} color="#DC2626" />
          </View>
          <View style={styles.financialInfo}>
            <Text style={styles.financialLabel}>Pengeluaran Belanja (Buyer)</Text>
            <Text style={[styles.financialValue, { color: '#DC2626' }]}>{formatRupiah(buyerExpense)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.financialRow}>
          <View style={[styles.financialIconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <IconSymbol name="bag.fill" size={24} color="#D97706" />
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

      <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
      <View style={styles.menuContainer}>
        
        {activeRole === 'BUYER' && (
          <>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/buyer/wallet')}
            >
              <IconSymbol name="creditcard.fill" size={22} color="#10B981" />
              <Text style={styles.menuText}>Dompet Pembeli (Top Up & Riwayat)</Text>
              <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => router.push('/buyer/address')}
            >
              <IconSymbol name="map.fill" size={22} color="#3B82F6" />
              <Text style={styles.menuText}>Daftar Alamat Pengiriman</Text>
              <IconSymbol name="chevron.right" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}
        
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={22} color="#DC2626" />
          <Text style={[styles.menuText, { color: '#DC2626' }]}>Keluar Akun</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600, 
    alignSelf: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  sectionHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 12, 
    marginLeft: 4, 
    marginRight: 4 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  financialContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  financialIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  financialInfo: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  topupButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  topupButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 24,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 16,
  },
});