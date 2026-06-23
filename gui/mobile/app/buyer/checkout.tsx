import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface DiscountApplier {
  id: string;
  code: string;
  value: number;
}

export default function CheckoutScreen() {
  const { token, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  
  const [cartData, setCartData] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'INSTANT' | 'NEXT_DAY' | 'REGULAR'>('REGULAR');

  const [discountInput, setDiscountInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<DiscountApplier | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<DiscountApplier | null>(null);

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

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setIsValidatingDiscount(true);

    try {
      const res = await fetch(`http://${api_address}:3000/discount/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: discountInput.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.type === 'VOUCHER') {
          if (appliedVoucher) return showAlert('Info', 'Anda sudah menggunakan Voucher. Hapus yang lama terlebih dahulu.');
          setAppliedVoucher({ id: data.id, code: data.code, value: data.discountValue });
        } else if (data.type === 'PROMO') {
          if (appliedPromo) return showAlert('Info', 'Anda sudah menggunakan Promo. Hapus yang lama terlebih dahulu.');
          setAppliedPromo({ id: data.id, code: data.code, value: data.discountValue });
        }
        setDiscountInput('');
        showAlert('Sukses', `${data.type} berhasil diterapkan!`);
      } else {
        showAlert('Gagal', data.message || 'Kode tidak valid.');
      }
    } catch (e) {
      showAlert('Error', 'Kesalahan koneksi saat memvalidasi kode.');
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const subtotal = cartData?.subtotal || 0;
  const deliveryFee = deliveryMethod === 'INSTANT' ? 20000 : deliveryMethod === 'NEXT_DAY' ? 15000 : 10000;
  
  const totalDiscount = (appliedVoucher?.value || 0) + (appliedPromo?.value || 0);
  const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
  const dpp = subtotalAfterDiscount + deliveryFee; 
  const ppn = Math.round(dpp * 0.12);
  const finalTotal = dpp + ppn;
  
  const isBalanceSufficient = walletBalance >= finalTotal;

  const handleProcessCheckout = async () => {
    if (!selectedAddressId) return showAlert('Validasi', 'Silakan tambah/pilih alamat pengiriman.');
    if (!isBalanceSufficient) return showAlert('Dompet Kosong', 'Saldo Anda tidak mencukupi. Silakan top up.');

    setIsProcessing(true);
    try {
      const payload = {
        addressId: selectedAddressId,
        deliveryMethod,
        voucherId: appliedVoucher?.id, 
        promoId: appliedPromo?.id      
      };

      const res = await fetch(`http://${api_address}:3000/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('Sukses', 'Pesanan berhasil dibuat!');
        router.replace('/(tabs)/orders'); 
      } else {
        showAlert('Gagal', data.message);
      }
    } catch (e) {
      showAlert('Error', 'Kesalahan koneksi');
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
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

        <Text style={styles.sectionTitle}>Gunakan Diskon</Text>
        <View style={styles.card}>
          <View style={styles.discountInputRow}>
            <TextInput
              style={styles.discountInput}
              placeholder="Kode Voucher/Promo"
              value={discountInput}
              onChangeText={setDiscountInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.applyBtn, (!discountInput || isValidatingDiscount) && { opacity: 0.7 }]} 
              onPress={handleApplyDiscount}
              disabled={!discountInput || isValidatingDiscount}
            >
              {isValidatingDiscount ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.applyBtnText}>Terapkan</Text>}
            </TouchableOpacity>
          </View>

          {appliedVoucher && (
            <View style={styles.activeDiscountBadge}>
              <IconSymbol name="ticket.fill" size={16} color="#059669" />
              <Text style={styles.activeDiscountText}>
                Voucher: {appliedVoucher.code} (-{formatRupiah(appliedVoucher.value)})
              </Text>
              <TouchableOpacity
                style={styles.removeDiscountBtn}
                onPress={() => {
                  setAppliedVoucher(null);
                  showAlert('Info', 'Voucher berhasil dilepas.');
                }}
              >
                <Text style={styles.removeDiscountText}>X</Text>
              </TouchableOpacity>
            </View>
          )}

          {appliedPromo && (
            <View style={styles.activeDiscountBadge}>
              <IconSymbol name="tag.fill" size={16} color="#059669" />
              <Text style={styles.activeDiscountText}>
                Promo: {appliedPromo.code} (-{formatRupiah(appliedPromo.value)})
              </Text>
              <TouchableOpacity 
                style={styles.removeDiscountBtn} 
                onPress={() => {
                  setAppliedPromo(null);
                  showAlert('Info', 'Promo berhasil dilepas.');
                }}
              >
                <Text style={styles.removeDiscountText}>X</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Rincian Biaya</Text>
        <View style={styles.card}>
          <View style={styles.costRow}><Text style={styles.costLabel}>Subtotal Produk</Text><Text style={styles.costValue}>{formatRupiah(subtotal)}</Text></View>
          
          {totalDiscount > 0 && (
            <View style={styles.costRow}>
              <Text style={styles.costLabelDiscount}>Total Diskon</Text>
              <Text style={styles.costValueDiscount}>-{formatRupiah(totalDiscount)}</Text>
            </View>
          )}

          <View style={styles.costRow}><Text style={styles.costLabel}>Biaya Pengiriman</Text><Text style={styles.costValue}>{formatRupiah(deliveryFee)}</Text></View>
          <View style={styles.costRow}><Text style={styles.costLabel}>PPN (12%)</Text><Text style={styles.costValue}>{formatRupiah(ppn)}</Text></View>
          
          <View style={styles.divider} />
          <View style={styles.costRow}><Text style={styles.costLabelBold}>Total Tagihan</Text><Text style={styles.totalValue}>{formatRupiah(finalTotal)}</Text></View>
        </View>

        <View style={[styles.card, { backgroundColor: isBalanceSufficient ? '#F0FDF4' : '#FEF2F2' }]}>
          <View style={styles.costRow}>
            <Text style={styles.costLabelBold}>Saldo Dompet Anda</Text>
            <Text style={[styles.costLabelBold, { color: isBalanceSufficient ? '#10B981' : '#DC2626' }]}>{formatRupiah(walletBalance)}</Text>
          </View>
          {!isBalanceSufficient && <Text style={styles.errorText}>Saldo kurang {formatRupiah(finalTotal - walletBalance)}</Text>}
        </View>
      </ScrollView>

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
  content: { padding: 20, paddingBottom: 120, width: '100%', maxWidth: 600, alignSelf: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }, optionSelected: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  optionInfo: { marginLeft: 12, flex: 1 }, optionLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' }, optionDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  linkText: { color: '#3B82F6', fontWeight: 'bold' },
  
  discountInputRow: { flexDirection: 'row', marginBottom: 8 },
  discountInput: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, color: '#1F2937' },
  applyBtn: { backgroundColor: '#374151', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  activeDiscountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 10, borderRadius: 8, marginTop: 8 },
  activeDiscountText: { flex: 1, marginLeft: 8, color: '#065F46', fontWeight: '600', fontSize: 13 },
  
  removeDiscountBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeDiscountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, 
  costLabel: { fontSize: 14, color: '#6B7280' }, costValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' }, 
  costLabelDiscount: { fontSize: 14, color: '#059669', fontWeight: '500' }, costValueDiscount: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  costLabelBold: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' }, totalValue: { fontSize: 18, fontWeight: '900', color: '#E11D48' }, divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  payButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 10, alignItems: 'center', width: '100%', maxWidth: 600, alignSelf: 'center' }, payButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});