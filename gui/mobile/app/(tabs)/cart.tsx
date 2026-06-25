import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CartScreen() {
  const { token, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [cartData, setCartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${api_address}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCartData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeRole === 'BUYER') fetchCart();
    }, [activeRole])
  );

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return removeItem(itemId);
    try {
      const res = await fetch(`${api_address}/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) fetchCart();
      else {
        const err = await res.json();
        Alert.alert('Gagal', err.message);
      }
    } catch (e) { }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`${api_address}/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCart();
    } catch (e) { }
  };

  if (!token || activeRole !== 'BUYER') {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="shopping-cart" size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Akses Ditolak</Text>
        <Text style={styles.errorText}>Silakan login sebagai Pembeli (BUYER) untuk membuka keranjang.</Text>
      </View>
    );
  }

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* --- HEADER (Sekarang memiliki Tombol Back dan Teks di Tengah seperti Address Screen) --- */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Keranjang Belanja</Text>
          <View style={{ width: 40 }} /> {/* Spacer agar teks persis di tengah */}
        </View>
        
        {!cartData || cartData.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="shopping-cart" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>Keranjangmu masih kosong.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>
              <Text style={styles.primaryButtonText}>Mulai Belanja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.storeBadge}>
              <Feather name="briefcase" size={18} color="#1D4ED8" />
              <Text style={styles.storeName}>Toko: {cartData.storeName}</Text>
            </View>

            {cartData.items.map((item: any) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.imagePlaceholder}>
                  {item.product.imageUrl ? (
                     <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
                  ) : (
                     <Feather name="box" size={32} color="#9CA3AF" />
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemPrice}>{formatRupiah(item.product.price)}</Text>
                  
                  <View style={styles.actionRow}>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Feather name="minus" size={16} color="#4B5563" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Feather name="plus" size={16} color="#4B5563" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* --- BOTTOM BAR --- */}
      {cartData && cartData.items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarContent}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Belanja</Text>
              <Text style={styles.summaryValue}>{formatRupiah(cartData.subtotal)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/buyer/checkout')}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 120, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  // Header dimodifikasi persis seperti Checkout dan Address (Flex Row, Space Between)
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 }, 
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  
  emptyBox: { alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', marginTop: 20 },
  emptyText: { marginTop: 16, marginBottom: 24, color: '#6B7280', fontSize: 15 },
  
  primaryButton: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold' },
  
  storeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', padding: 12, borderRadius: 10, marginBottom: 16 },
  storeName: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#1D4ED8' },
  
  cartItem: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  imagePlaceholder: { width: 80, height: 80, backgroundColor: '#F3F4F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  itemDetails: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: '#E11D48', marginBottom: 12 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 },
  qtyBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8 },
  qtyText: { paddingHorizontal: 16, fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 16, paddingHorizontal: 20 },
  bottomBarContent: { width: '100%', maxWidth: 600, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBox: { flex: 1, marginRight: 16 },
  summaryLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
  checkoutButton: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, minWidth: 140, alignItems: 'center' },
  checkoutText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});