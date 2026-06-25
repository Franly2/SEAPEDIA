import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoreInfo {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  store: StoreInfo;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  const { token, activeRole } = useAuthStore(); 
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`${api_address}/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        }
      } catch (error) {
        console.error('Gagal memuat detail produk:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleAddToCart = async () => {
    if (!token || activeRole !== 'BUYER') {
      const msg = !token 
        ? 'Silakan login terlebih dahulu untuk mulai berbelanja.' 
        : 'Anda sedang tidak menggunakan peran Pembeli. Silakan ganti peran aktif Anda di halaman Profil.';
        
      if (Platform.OS === 'web') return window.alert(msg);
      return Alert.alert('Akses Ditolak', msg);
    }

    if (product!.stock < 1) {
      const msg = 'Maaf, stok produk ini sedang habis.';
      if (Platform.OS === 'web') return window.alert(msg);
      return Alert.alert('Stok Habis', msg);
    }

    setIsAddingToCart(true);

    try {
      const response = await fetch(`${api_address}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product!.id, quantity: 1 }), 
      });

      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === 'web') window.alert('Produk berhasil ditambahkan ke keranjang!');
        else Alert.alert('Sukses', 'Produk berhasil ditambahkan ke keranjang!');
        router.push('/cart');
      } 
      else if (response.status === 409 && data.code === 'SINGLE_STORE_VIOLATION') {
        const clearAndAdd = async () => {
          setIsAddingToCart(true);
          await fetch(`${api_address}/cart/clear`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAddingToCart(false); 
          handleAddToCart(); 
        };

        if (Platform.OS === 'web') {
          const confirm = window.confirm('Keranjangmu berisi produk dari toko lain. Bersihkan keranjang dan ganti dengan produk ini?');
          if (confirm) clearAndAdd();
          else setIsAddingToCart(false);
        } else {
          Alert.alert(
            'Ganti Toko?',
            'Keranjangmu berisi produk dari toko lain. Sesuai aturan SEAPEDIA, satu keranjang hanya boleh berisi produk dari satu toko. Bersihkan keranjang dan ganti dengan produk ini?',
            [
              { text: 'Batal', style: 'cancel', onPress: () => setIsAddingToCart(false) },
              { text: 'Ya, Bersihkan', style: 'destructive', onPress: clearAndAdd }
            ]
          );
        }
      } 
      else {
        if (Platform.OS === 'web') window.alert(data.message || 'Gagal menambahkan produk.');
        else Alert.alert('Gagal', data.message || 'Gagal menambahkan produk.');
        setIsAddingToCart(false);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('Terjadi kesalahan jaringan.');
      else Alert.alert('Error', 'Terjadi kesalahan jaringan.');
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="alert-triangle" size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Produk tidak ditemukan.</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonErrorText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header sekarang berada di dalam ScrollView agar ikut terscroll bersama halaman */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Produk</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="box" size={64} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
          <Text style={styles.productName}>{product.name}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaSection}>
          <View style={styles.storeBadge}>
            <Feather name="briefcase" size={16} color="#4B5563" />
            <Text style={styles.storeName}>{product.store.name}</Text>
          </View>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>Stok: {product.stock}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
        </View>
          
      </ScrollView>

      {/* Bottom Bar tetap fixed di bawah */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              (isAddingToCart || product.stock < 1) && { opacity: 0.7, backgroundColor: '#9CA3AF' }
            ]} 
            activeOpacity={0.9}
            onPress={handleAddToCart}
            disabled={isAddingToCart || product.stock < 1}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="shopping-cart" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  {product.stock < 1 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' }, // Disamakan dengan Checkout Screen
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Padding atas yang adaptif seperti di Checkout Screen
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 120, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  // Header dimodifikasi tanpa background putih & border, murni mengambang
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  
  // Gambar sekarang melengkung menyesuaikan padding halaman (Modern Layout)
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  
  infoSection: { marginBottom: 16 },
  productPrice: { fontSize: 28, fontWeight: '900', color: '#E11D48', marginBottom: 8 },
  productName: { fontSize: 20, color: '#1F2937', fontWeight: 'bold', lineHeight: 28 },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  
  metaSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  storeName: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginLeft: 8 },
  stockBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  stockText: { color: '#1D4ED8', fontWeight: '800', fontSize: 13 },
  
  descriptionSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  productDescription: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingVertical: 16, paddingHorizontal: 20 },
  bottomBarContent: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  actionButton: { backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  
  errorText: { fontSize: 16, color: '#4B5563', marginTop: 16, marginBottom: 24 },
  backButtonError: { backgroundColor: '#1D4ED8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonErrorText: { color: '#FFF', fontWeight: 'bold' }
});