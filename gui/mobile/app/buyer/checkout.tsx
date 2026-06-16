// Lokasi file: app/buyer/checkout.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutScreen() {
  const { token, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartData, setCartData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'INSTANT' | 'NEXT_DAY' | 'REGULAR'>('REGULAR');

  useEffect(() => {
    if (activeRole !== 'BUYER') {
      router.replace('/');
      return;
    }
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      const [cartRes, addrRes, walletRes] = await Promise.all([
        fetch(`http://${api_address}:3000/cart`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://${api_address}:3000/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://${api_address}:3000/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [cart, addr, wallet] = await Promise.all([cartRes.json(), addrRes.json(), walletRes.json()]);

      setCartData(cart);
      setAddresses(addr);
      setWalletBalance(wallet.balance);
      if (addr.length > 0) setSelectedAddressId(addr[0].id);

    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const subtotal = cartData?.subtotal || 0;
  const deliveryFee = deliveryMethod === 'INSTANT' ? 20000 : deliveryMethod === 'NEXT_DAY' ? 15000 : 10000;
  const ppn = Math.round((subtotal + deliveryFee) * 0.12);
  const finalTotal = subtotal + deliveryFee + ppn;
  const isBalanceSufficient = walletBalance >= finalTotal;

  const handleProcessCheckout = async () => {
    if (!selectedAddressId) return Alert.alert('Validasi', 'Silakan tambah/pilih alamat pengiriman.');
    if (!isBalanceSufficient) return Alert.alert('Dompet Kosong', 'Saldo Anda tidak mencukupi. Silakan top up.');

    setIsProcessing(true);
    try {
      const res = await fetch(`http://${api_address}:3000/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressId: selectedAddressId, deliveryMethod }),
      });

      const data = await res.json();
      if (res.ok) {
        if (Platform.OS === 'web') window.alert('Pesanan Berhasil Dibuat!');
        else Alert.alert('Sukses', 'Pesanan berhasil dibuat!');
        router.replace('/(tabs)/orders'); // Langsung lempar ke riwayat pesanan
      } else {
        Alert.alert('Gagal', data.message);
      }
    } catch (e) {
      Alert.alert('Error', 'Kesalahan koneksi');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#10B981" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><IconSymbol name="chevron.left" size={24} color="#1F2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Pesanan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Alamat */}
        <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
        <View style={styles.card}>
          {addresses.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/buyer/address')}>
              <Text style={styles.linkText}>+ Tambah Alamat Baru</Text>
            </TouchableOpacity>
          ) : (
            addresses.map(addr => (
              <TouchableOpacity key={addr.id} style={[styles.optionRow, selectedAddressId === addr.id && styles.optionSelected]} onPress={() => setSelectedAddressId(addr.id)}>
                <IconSymbol name={selectedAddressId === addr.id ? 'checkmark.circle.fill' : 'circle'} size={20} color={selectedAddressId === addr.id ? '#3B82F6' : '#9CA3AF'} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{addr.label}</Text>
                  <Text style={styles.optionDesc}>{addr.addressLine}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 2. Metode Pengiriman */}
        <Text style={styles.sectionTitle}>Pilih Pengiriman</Text>
        <View style={styles.card}>
          {[
            { id: 'REGULAR', name: 'Regular', price: 10000 },
            { id: 'NEXT_DAY', name: 'Next Day', price: 15000 },
            { id: 'INSTANT', name: 'Instant (Sameday)', price: 20000 },
          ].map(method => (
            <TouchableOpacity key={method.id} style={[styles.optionRow, deliveryMethod === method.id && styles.optionSelected]} onPress={() => setDeliveryMethod(method.id as any)}>
              <IconSymbol name={deliveryMethod === method.id ? 'checkmark.circle.fill' : 'circle'} size={20} color={deliveryMethod === method.id ? '#3B82F6' : '#9CA3AF'} />
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{method.name}</Text>
                <Text style={styles.optionDesc}>{formatRupiah(method.price)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. Rincian Biaya */}
        <Text style={styles.sectionTitle}>Rincian Biaya</Text>
        <View style={styles.card}>
          <View style={styles.costRow}><Text style={styles.costLabel}>Subtotal Produk</Text><Text style={styles.costValue}>{formatRupiah(subtotal)}</Text></View>
          <View style={styles.costRow}><Text style={styles.costLabel}>Biaya Pengiriman</Text><Text style={styles.costValue}>{formatRupiah(deliveryFee)}</Text></View>
          <View style={styles.costRow}><Text style={styles.costLabel}>PPN (12%)</Text><Text style={styles.costValue}>{formatRupiah(ppn)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.costRow}><Text style={styles.costLabelBold}>Total Tagihan</Text><Text style={styles.totalValue}>{formatRupiah(finalTotal)}</Text></View>
        </View>

        {/* 4. Dompet */}
        <View style={[styles.card, { backgroundColor: isBalanceSufficient ? '#F0FDF4' : '#FEF2F2' }]}>
          <View style={styles.costRow}>
            <Text style={styles.costLabelBold}>Saldo Dompet Anda</Text>
            <Text style={[styles.costLabelBold, { color: isBalanceSufficient ? '#10B981' : '#DC2626' }]}>{formatRupiah(walletBalance)}</Text>
          </View>
          {!isBalanceSufficient && <Text style={styles.errorText}>Saldo kurang {formatRupiah(finalTotal - walletBalance)}</Text>}
        </View>
      </ScrollView>

      {/* 5. Tombol Bayar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.payButton, (!isBalanceSufficient || cartData?.items.length === 0) && { backgroundColor: '#9CA3AF' }]} onPress={handleProcessCheckout} disabled={!isBalanceSufficient || cartData?.items.length === 0 || isProcessing}>
          {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payButtonText}>Bayar Sekarang</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, backBtn: { padding: 4 }, headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  content: { padding: 20, paddingBottom: 100, width: '100%', maxWidth: 600, alignSelf: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }, optionSelected: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  optionInfo: { marginLeft: 12, flex: 1 }, optionLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' }, optionDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  linkText: { color: '#3B82F6', fontWeight: 'bold' },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, costLabel: { fontSize: 14, color: '#6B7280' }, costValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' }, costLabelBold: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' }, totalValue: { fontSize: 18, fontWeight: '900', color: '#E11D48' }, divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  payButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', width: '100%', maxWidth: 600, alignSelf: 'center' }, payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});