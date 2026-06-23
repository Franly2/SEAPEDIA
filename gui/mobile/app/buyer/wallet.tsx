import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
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
      const response = await fetch(`http://${api_address}/wallet`, {
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
      const response = await fetch(`http://${api_address}/wallet/topup`, {
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
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#1F2937" />
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
          />
          <TouchableOpacity 
            style={[styles.primaryButton, isToppingUp && { opacity: 0.7 }]} 
            onPress={handleTopUp}
            disabled={isToppingUp || !topupAmount}
          >
            {isToppingUp ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryButtonText}>Isi Saldo</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <IconSymbol name="doc.text.magnifyingglass" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Belum ada riwayat transaksi.</Text>
        </View>
      ) : (
        history.map((trx) => (
          <View key={trx.id} style={styles.historyItem}>
            <View style={[styles.iconWrapper, { backgroundColor: trx.type === 'TOP_UP' ? '#D1FAE5' : '#FEE2E2' }]}>
              <IconSymbol name={trx.type === 'TOP_UP' ? "arrow.down.left" : "arrow.up.right"} size={20} color={trx.type === 'TOP_UP' ? "#059669" : "#DC2626"} />
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  balanceText: { fontSize: 32, fontWeight: '800', color: '#10B981' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  topupRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1F2937', marginRight: 12 },
  primaryButton: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  emptyBox: { alignItems: 'center', padding: 32, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB' },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyInfo: { flex: 1, marginRight: 8 },
  historyDesc: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#9CA3AF' },
  historyAmount: { fontSize: 15, fontWeight: 'bold' },
});