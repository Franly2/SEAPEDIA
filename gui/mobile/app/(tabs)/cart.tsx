import { Colors } from '@/constants/Colors';
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
        <Feather name="shopping-cart" size={64} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>Akses Ditolak</Text>
        <Text style={styles.errorText}>Silakan login sebagai Pembeli (BUYER) untuk membuka keranjang.</Text>
      </View>
    );
  }

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Keranjang Belanja</Text>
          <View style={{ width: 40 }} /> 
        </View>
        
        {!cartData || cartData.items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="shopping-cart" size={56} color={Colors.border} />
            <Text style={styles.emptyText}>Keranjangmu masih kosong.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>
              <Text style={styles.primaryButtonText}>Mulai Belanja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.storeBadge}>
              <Feather name="briefcase" size={18} color={Colors.primary} />
              <Text style={styles.storeName}>Toko: {cartData.storeName}</Text>
            </View>

            {cartData.items.map((item: any) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.imagePlaceholder}>
                  {item.product.imageUrl ? (
                      <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
                  ) : (
                      <Feather name="box" size={32} color={Colors.textMuted} />
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemPrice}>{formatRupiah(item.product.price)}</Text>
                  
                  <View style={styles.actionRow}>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Feather name="minus" size={16} color={Colors.secondary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Feather name="plus" size={16} color={Colors.secondary} />
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 120, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }, 
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.secondary },
  
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.secondary, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  
  emptyBox: { alignItems: 'center', padding: 40, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginTop: 20 },
  emptyText: { marginTop: 16, marginBottom: 24, color: Colors.textMuted, fontSize: 15 },
  
  primaryButton: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  primaryButtonText: { color: Colors.surface, fontWeight: 'bold' },
  
  storeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 10, marginBottom: 16 },
  storeName: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: Colors.secondary },
  
  cartItem: { flexDirection: 'row', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  imagePlaceholder: { width: 80, height: 80, backgroundColor: Colors.background, borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  itemDetails: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.secondary, marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: Colors.primary, marginBottom: 12 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8 },
  qtyBtn: { padding: 8, backgroundColor: Colors.background, borderRadius: 8 },
  qtyText: { paddingHorizontal: 16, fontWeight: 'bold', fontSize: 14, color: Colors.secondary },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 16, paddingHorizontal: 20 },
  bottomBarContent: { width: '100%', maxWidth: 600, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBox: { flex: 1, marginRight: 16 },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '900', color: Colors.secondary },
  checkoutButton: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, minWidth: 140, alignItems: 'center' },
  checkoutText: { color: Colors.surface, fontSize: 15, fontWeight: 'bold' }
});