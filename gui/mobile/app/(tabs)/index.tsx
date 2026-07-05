import { Product, ProductGrid } from '@/components/ui/ProductGrid';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { token, fullName, activeRole } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  
  const [hasReviewed, setHasReviewed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload: any = jwtDecode(token);
      return payload.sub || payload.id || null;
    } catch (e) {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${api_address}/products`);
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
          const response = await fetch(`${api_address}/reviews/user/${userId}`);
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
      
      <View style={[styles.heroSection, { backgroundColor: Colors.secondary }]}>
        <View style={styles.heroContent}>
          <Text style={[styles.heroBadge, { color: Colors.secondary, backgroundColor: Colors.primary }]}>
          SEAPEDIA
          </Text>
          <Text style={styles.title}>Belanja Cerdas,{'\n'}Pengiriman Cepat.</Text>
        </View>
        <Feather name="box" size={80} color="#1E293B" style={styles.heroIconBg} />
      </View>

      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="shield" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>Transaksi Aman</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="truck" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>SLA Terjamin</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBox, { backgroundColor: Colors.primaryLight }]}>
            <Feather name="tag" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>Banyak Promo</Text>
        </View>
      </View>
      
      {token ? (
        <View style={styles.welcomeBox}>
           <View>
             <Text style={styles.welcomeGreeting}>Selamat datang kembali,</Text>
             <Text style={[styles.welcomeName, { color: Colors.secondary }]}>{fullName}</Text>
           </View>
           <View style={[styles.roleBadge, { backgroundColor: Colors.primary }]}>
             <Feather name="user-check" size={12} color={Colors.secondary} style={{ marginRight: 4 }} />
             <Text style={[styles.roleBadgeText, { color: Colors.secondary }]}>{activeRole}</Text>
           </View>
        </View>
      ) : (
        <View style={styles.guestBox}>
          <View style={styles.guestTextContainer}>
            <Text style={styles.guestTitle}>Belum Punya Akun?</Text>
            <Text style={styles.guestText}>Daftar sekarang untuk mulai bertransaksi atau buka tokomu sendiri.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/login')} style={[styles.guestButton, { backgroundColor: Colors.secondary }]} activeOpacity={0.8}>
            <Text style={styles.guestButtonText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.reviewBanner, hasReviewed ? styles.reviewBannerSuccess : { borderColor: Colors.primaryLight, backgroundColor: '#FFF' }]}>
        {hasReviewed ? (
          <View style={styles.reviewBannerContent}>
            <View style={styles.reviewTextWrap}>
              <Text style={[styles.reviewBannerTitle, { color: '#059669' }]}>Terima Kasih!</Text>
              <Text style={styles.reviewBannerText}>Ulasanmu membantu kami menjadi lebih baik.</Text>
            </View>
            <TouchableOpacity style={[styles.reviewButton, { backgroundColor: '#10B981' }]} onPress={() => router.push('/reviews')}>
              <Text style={styles.reviewButtonText}>Lihat Ulasan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.reviewBannerContent}>
            <View style={styles.reviewTextWrap}>
              <Text style={[styles.reviewBannerTitle, { color: Colors.secondary }]}>Bantu Kami Berkembang</Text>
              <Text style={styles.reviewBannerText}>Bagikan pengalamanmu menggunakan SEAPEDIA.</Text>
            </View>
            <TouchableOpacity style={[styles.reviewButton, { backgroundColor: Colors.primary }]} onPress={() => router.push('/reviews')}>
              <Text style={[styles.reviewButtonText, { color: Colors.secondary }]}>Tulis Ulasan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.headerTitleRow}>
        <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>Eksplorasi Katalog</Text>
        <Text style={styles.subtitleCount}>{products.length} Produk</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F59E0B" />
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
    backgroundColor: '#F8FAFC',
  },
  pageWrapper: {
    flex: 1,
    width: '90%', 
    maxWidth: 1200, 
    alignSelf: 'center',
    paddingTop: 24,
  },
  headerContainer: {
    marginBottom: 16,
  },
  
  heroSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900', 
    color: '#FFFFFF', 
    marginBottom: 8,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    maxWidth: '80%',
  },
  heroIconBg: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
    zIndex: 1,
    transform: [{ rotate: '-15deg' }]
  },

  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  welcomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeGreeting: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  guestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  guestTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9A3412',
    marginBottom: 4,
  },
  guestText: {
    fontSize: 12,
    color: '#C2410C',
    lineHeight: 18,
  },
  guestButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  categorySection: {
    marginBottom: 24,
  },
  categoryScroll: {
    paddingVertical: 8,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 80,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  reviewBanner: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  reviewBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  reviewBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  reviewBannerText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  reviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reviewButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitleCount: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  }
});