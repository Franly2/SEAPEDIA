import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
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
        fetch(`${api_address}/cart`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api_address}/addresses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api_address}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
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
      const res = await fetch(`${api_address}/discount/validate`, {
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

      const res = await fetch(`${api_address}/orders/checkout`, {
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

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout Pesanan</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
        {addresses.length === 0 ? (
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/buyer/address')}>
            <Feather name="plus" size={20} color="#3B82F6" />
            <Text style={styles.addButtonText}> Tambah Alamat Baru</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.listContainer}>
            {addresses.map(addr => (
              <TouchableOpacity 
                key={addr.id} 
                style={[styles.selectionCard, selectedAddressId === addr.id && styles.selectionCardActive]} 
                activeOpacity={0.7}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.labelBadge}>
                    <Text style={styles.labelText}>{addr.label}</Text>
                  </View>
                  <View style={styles.radioCircle}>
                    {selectedAddressId === addr.id && <View style={styles.radioInnerCircle} />}
                  </View>
                </View>
                <Text style={styles.cardDescText}>{addr.addressLine}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Metode Pengiriman</Text>
        <View style={styles.listContainer}>
          {[
            { id: 'REGULAR', name: 'Regular', desc: 'Estimasi 3-5 Hari', price: 10000, icon: 'package' },
            { id: 'NEXT_DAY', name: 'Next Day', desc: 'Tiba Esok Hari', price: 15000, icon: 'sun' },
            { id: 'INSTANT', name: 'Instant (Sameday)', desc: 'Tiba Hari Ini', price: 20000, icon: 'zap' },
          ].map(method => (
            <TouchableOpacity 
              key={method.id} 
              style={[styles.selectionCard, deliveryMethod === method.id && styles.selectionCardActive]} 
              activeOpacity={0.7}
              onPress={() => setDeliveryMethod(method.id as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.methodHeaderLeft}>
                  <Feather name={method.icon as any} size={18} color={deliveryMethod === method.id ? '#3B82F6' : '#6B7280'} style={{marginRight: 8}}/>
                  <Text style={[styles.methodNameText, deliveryMethod === method.id && {color: '#1D4ED8'}]}>{method.name}</Text>
                </View>
                <View style={styles.radioCircle}>
                  {deliveryMethod === method.id && <View style={styles.radioInnerCircle} />}
                </View>
              </View>
              <View style={styles.methodFooter}>
                 <Text style={styles.methodDescText}>{method.desc}</Text>
                 <Text style={styles.methodPriceText}>{formatRupiah(method.price)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Gunakan Diskon</Text>
        <View style={styles.staticCard}>
          <View style={styles.discountInputRow}>
            <TextInput
              style={styles.input}
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
              <View style={styles.discountBadgeLeft}>
                <Feather name="tag" size={16} color="#059669" />
                <Text style={styles.activeDiscountText}>
                  Voucher: {appliedVoucher.code}
                </Text>
              </View>
              <View style={styles.discountBadgeRight}>
                 <Text style={styles.discountAmountText}>-{formatRupiah(appliedVoucher.value)}</Text>
                 <TouchableOpacity
                  style={styles.removeDiscountBtn}
                  onPress={() => {
                    setAppliedVoucher(null);
                    showAlert('Info', 'Voucher dilepas.');
                  }}
                 >
                  <Feather name="x" size={14} color="#FFF" />
                 </TouchableOpacity>
              </View>
            </View>
          )}

          {appliedPromo && (
            <View style={styles.activeDiscountBadge}>
              <View style={styles.discountBadgeLeft}>
                <Feather name="percent" size={16} color="#059669" />
                <Text style={styles.activeDiscountText}>
                  Promo: {appliedPromo.code}
                </Text>
              </View>
              <View style={styles.discountBadgeRight}>
                 <Text style={styles.discountAmountText}>-{formatRupiah(appliedPromo.value)}</Text>
                 <TouchableOpacity
                  style={styles.removeDiscountBtn}
                  onPress={() => {
                    setAppliedPromo(null);
                    showAlert('Info', 'Promo dilepas.');
                  }}
                 >
                  <Feather name="x" size={14} color="#FFF" />
                 </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
        <View style={styles.staticCard}>
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

        <View style={[styles.walletStatusCard, { backgroundColor: isBalanceSufficient ? '#F0FDF4' : '#FEF2F2', borderColor: isBalanceSufficient ? '#BBF7D0' : '#FECACA' }]}>
          <View style={styles.costRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Feather name="credit-card" size={18} color={isBalanceSufficient ? '#10B981' : '#DC2626'} style={{marginRight: 8}} />
               <Text style={styles.costLabelBold}>Saldo Dompet Anda</Text>
            </View>
            <Text style={[styles.costLabelBold, { color: isBalanceSufficient ? '#10B981' : '#DC2626' }]}>{formatRupiah(walletBalance)}</Text>
          </View>
          {!isBalanceSufficient && <Text style={styles.errorText}>Saldo kurang {formatRupiah(finalTotal - walletBalance)}. Silakan top up di menu Profil.</Text>}
        </View>
        
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
           <View style={styles.bottomBarTextContainer}>
              <Text style={styles.bottomBarLabel}>Total Pembayaran</Text>
              <Text style={styles.bottomBarTotal}>{formatRupiah(finalTotal)}</Text>
           </View>
          <TouchableOpacity style={[styles.payButton, (!isBalanceSufficient || cartData?.items.length === 0) && { backgroundColor: '#9CA3AF' }]} onPress={handleProcessCheckout} disabled={!isBalanceSufficient || cartData?.items.length === 0 || isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payButtonText}>Bayar Sekarang</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 120, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }, 
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12, marginTop: 8 },
  
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  addButtonText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
  
  listContainer: { marginBottom: 20 },
  selectionCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  selectionCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  labelBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  labelText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
  cardDescText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  radioInnerCircle: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
  
  methodHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  methodNameText: { fontSize: 15, fontWeight: 'bold', color: '#374151' },
  methodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  methodDescText: { fontSize: 13, color: '#6B7280' },
  methodPriceText: { fontSize: 14, fontWeight: '800', color: '#1F2937' },

  staticCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 20 },
  
  discountInputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1F2937', marginRight: 8 },
  applyBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10 },
  applyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  activeDiscountBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#D1FAE5', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#A7F3D0' },
  discountBadgeLeft: { flexDirection: 'row', alignItems: 'center' },
  activeDiscountText: { marginLeft: 8, color: '#065F46', fontWeight: 'bold', fontSize: 13 },
  discountBadgeRight: { flexDirection: 'row', alignItems: 'center' },
  discountAmountText: { color: '#065F46', fontWeight: '900', fontSize: 14, marginRight: 12 },
  removeDiscountBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },

  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, 
  costLabel: { fontSize: 14, color: '#6B7280' }, 
  costValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' }, 
  costLabelDiscount: { fontSize: 14, color: '#059669', fontWeight: 'bold' }, 
  costValueDiscount: { fontSize: 14, fontWeight: '900', color: '#059669' },
  costLabelBold: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' }, 
  totalValue: { fontSize: 20, fontWeight: '900', color: '#E11D48' }, 
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 14 },
  
  walletStatusCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 6, fontStyle: 'italic', fontWeight: '500' },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 16, paddingHorizontal: 20 },
  bottomBarContent: { width: '100%', maxWidth: 600, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomBarTextContainer: { flex: 1, marginRight: 16 },
  bottomBarLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  bottomBarTotal: { fontSize: 18, fontWeight: '900', color: '#E11D48' },
  payButton: { backgroundColor: '#10B981', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', minWidth: 160 }, 
  payButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});