import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const { id } = useLocalSearchParams(); // Menangkap ID dari URL
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`http://${api_address}:3000/products/${id}`);
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
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#9CA3AF" />
        <Text style={styles.errorText}>Produk tidak ditemukan.</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonErrorText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Statis */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          
          {/* Gambar Produk */}
          <View style={styles.imageContainer}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <IconSymbol name="cube.box" size={64} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Info Utama Produk */}
          <View style={styles.infoSection}>
            <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
            <Text style={styles.productName}>{product.name}</Text>
          </View>

          <View style={styles.divider} />

          {/* Info Toko & Stok */}
          <View style={styles.metaSection}>
            <View style={styles.storeBadge}>
              <IconSymbol name="building.2.fill" size={16} color="#4B5563" />
              <Text style={styles.storeName}>{product.store.name}</Text>
            </View>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>Stok: {product.stock}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Deskripsi Produk */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Deskripsi Produk</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
          </View>
          
        </View>
      </ScrollView>

      {/* Bottom Bar Dummy (Read-Only) */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity 
            style={styles.dummyButton} 
            activeOpacity={0.9}
            onPress={() => {
              if (Platform.OS === 'web') window.alert('Fitur keranjang belanja akan tersedia di Level 3!');
            }}
          >
            <IconSymbol name="cart.badge.plus" size={20} color="#FFF" />
            <Text style={styles.dummyButtonText}>Tambah ke Keranjang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Ruang untuk bottom bar
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600, // UX: Mengunci lebar seperti mobile app saat di web
    alignSelf: 'center',
    backgroundColor: '#FFF',
    minHeight: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Persegi
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 20,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E11D48',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 26,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  stockBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 13,
  },
  descriptionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600, // Menyesuaikan dengan konten layar utama
    alignSelf: 'center',
  },
  dummyButton: {
    backgroundColor: '#9CA3AF', // Warna abu-abu (Disabled effect)
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  dummyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonError: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonErrorText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});