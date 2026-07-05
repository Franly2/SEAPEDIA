import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [topupAmount, setTopupAmount] = useState('');

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${api_address}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setHistory(data.history);
      }
    } catch (error) {
      showAlert('Error', 'Gagal memuat data dompet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopUp = async () => {
    const amountInt = parseInt(topupAmount.replace(/[^0-9]/g, ''), 10);
    
    if (isNaN(amountInt) || amountInt < 1000) {
      return showAlert('Validasi', 'Minimal top-up adalah Rp 1.000');
    }

    setIsToppingUp(true);
    try {
      const response = await fetch(`${api_address}/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountInt }),
      });

      if (response.ok) {
        showAlert('Sukses', `Berhasil mengisi saldo sebesar ${formatRupiah(amountInt)}`);
        setTopupAmount('');
        fetchWalletData(); 
      } else {
        const err = await response.json();
        showAlert('Gagal', err.message || 'Terjadi kesalahan saat top-up.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    } finally {
      setIsToppingUp(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dompet Pembeli</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>Total Saldo Tersedia</Text>
        <Text style={styles.balanceText}>{formatRupiah(balance)}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.label}>Isi Saldo (Dummy Top-up)</Text>
        <View style={styles.topupRow}>
          <TextInput
            style={styles.input}
            placeholder="Nominal (Min. 1000)"
            keyboardType="numeric"
            value={topupAmount}
            onChangeText={(text) => setTopupAmount(text.replace(/[^0-9]/g, ''))}
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity 
            style={[styles.primaryButton, (!topupAmount || isToppingUp) && { opacity: 0.7, backgroundColor: Colors.textMuted }]} 
            onPress={handleTopUp}
            disabled={isToppingUp || !topupAmount}
          >
            {isToppingUp ? <ActivityIndicator size="small" color={Colors.surface} /> : <Text style={styles.primaryButtonText}>Isi Saldo</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="file-text" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>Belum ada riwayat transaksi.</Text>
        </View>
      ) : (
        history.map((trx) => (
          <View key={trx.id} style={styles.historyItem}>
            <View style={[styles.iconWrapper, { backgroundColor: trx.type === 'TOP_UP' ? '#D1FAE5' : '#FEE2E2' }]}>
              <Feather name={trx.type === 'TOP_UP' ? "arrow-down-left" : "arrow-up-right"} size={20} color={trx.type === 'TOP_UP' ? "#059669" : "#DC2626"} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDesc} numberOfLines={1}>{trx.description}</Text>
              <Text style={styles.historyDate}>{formatDate(trx.createdAt)}</Text>
            </View>
            <Text style={[styles.historyAmount, { color: trx.type === 'TOP_UP' ? '#059669' : '#DC2626' }]}>
              {trx.type === 'TOP_UP' ? '+' : '-'}{formatRupiah(trx.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
  
  card: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 24, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardSubtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 8, fontWeight: '600' },
  balanceText: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  
  label: { fontSize: 14, fontWeight: '800', color: Colors.secondary, marginBottom: 12 },
  topupRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.secondary, marginRight: 12 },
  primaryButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '900' },
  
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.secondary, marginBottom: 16 },
  
  emptyBox: { alignItems: 'center', padding: 40, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border },
  emptyText: { marginTop: 16, color: Colors.textMuted, fontSize: 14, fontWeight: '500' },
  
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  historyInfo: { flex: 1, marginRight: 8 },
  historyDesc: { fontSize: 15, fontWeight: '800', color: Colors.secondary, marginBottom: 4 },
  historyDate: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  historyAmount: { fontSize: 16, fontWeight: '900' },
});