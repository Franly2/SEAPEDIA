// Lokasi file: app/(tabs)/index.tsx
import { Product, ProductGrid } from '@/components/ui/ProductGrid';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { token, fullName, username, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  
  const [hasReviewed, setHasReviewed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      if (typeof atob !== 'undefined') {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  const fetchProducts = async () => {
    try {
      const response = await fetch(`http://${api_address}:3000/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Gagal memuat produk:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      const checkStatus = async () => {
        if (!userId) {
          setHasReviewed(false); 
          return;
        }
        try {
          const response = await fetch(`http://${api_address}:3000/reviews/user/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setHasReviewed(!!data.hasReviewed);
          }
        } catch (error) {
          console.error('Gagal mengecek status ulasan di Beranda:', error);
        }
      };
      checkStatus();
    }, [userId, api_address]) 
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Beranda SEAPEDIA</Text>
      
      {token ? (
        <View style={styles.card}>
          <Text style={styles.text}>Halo, <Text style={styles.bold}>{fullName}</Text>!</Text>
          <Text style={styles.text}>Username: {username}</Text>
          <Text style={styles.text}>Peran Aktif: <Text style={styles.bold}>{activeRole}</Text></Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.text}>Halo, <Text style={styles.bold}>Pengunjung</Text>!</Text>
          <Text style={styles.text}>Selamat datang di SEAPEDIA.</Text>
          <Text style={styles.text}>Silakan jelajahi katalog produk kami secara bebas.</Text>
        </View>
      )}

      <View style={[styles.reviewBanner, hasReviewed && styles.reviewBannerSuccess]}>
        {hasReviewed ? (
          <>
            <Text style={[styles.reviewBannerTitle, { color: '#065F46' }]}>Terima Kasih!</Text>
            <Text style={[styles.reviewBannerText, { color: '#047857' }]}>
              Ulasanmu sangat berarti bagi pengembangan SEAPEDIA.
            </Text>
            <TouchableOpacity 
              style={[styles.reviewButton, { backgroundColor: '#059669' }]} 
              onPress={() => router.push('/reviews')}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText}>Lihat Ulasan Pengguna Lain</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.reviewBannerTitle}>Bantu kami berkembang!</Text>
            <Text style={styles.reviewBannerText}>Bagaimana pengalamanmu menggunakan aplikasi SEAPEDIA?</Text>
            <TouchableOpacity 
              style={styles.reviewButton} 
              onPress={() => router.push('/reviews')}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText}>Tulis Ulasan Aplikasi</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Katalog Produk</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageWrapper}>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListHeaderComponent={renderHeader()}
          emptyMessage="Belum ada produk yang dijual di SEAPEDIA."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  pageWrapper: {
    flex: 1,
    width: '85%', 
    maxWidth: 1400, 
    alignSelf: 'center',
    paddingTop: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800', 
    color: '#1E3A8A', 
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, 
  },
  text: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewBanner: {
    marginBottom: 24,
    backgroundColor: '#EFF6FF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    width: '100%',
    alignItems: 'center',
  },
  reviewBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  reviewBannerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 6,
  },
  reviewBannerText: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  reviewButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%', 
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    marginBottom: 16,
  },
});