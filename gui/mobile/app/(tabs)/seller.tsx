// Lokasi file: app/(tabs)/seller.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Import komponen ProductGrid yang sudah kita buat
import { Product, ProductGrid } from '@/components/ui/ProductGrid';

export default function SellerDashboardScreen() {
  const { token, activeRole, roles } = useAuthStore();
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const [newStoreName, setNewStoreName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchMyStoreAndProducts = async () => {
    if (!token) return;
    try {
      // 1. Ambil Data Toko
      const storeRes = await fetch(`http://${api_address}:3000/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);
        setEditStoreName(storeData.name);

        // 2. Ambil Data Produk (Hanya produk milik penjual ini)
        const prodRes = await fetch(`http://${api_address}:3000/products/my-products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }
      } else if (storeRes.status === 404) {
        setStore(null);
      }
    } catch (error) {
      console.error('Kesalahan jaringan:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeRole === 'SELLER') {
        setIsLoading(true);
        fetchMyStoreAndProducts();
      } else {
        setIsLoading(false);
      }
    }, [activeRole])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMyStoreAndProducts();
  };

  const handleUpgradeToSeller = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch(`http://${api_address}:3000/users/upgrade-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'SELLER' }),
      });

      if (response.ok) {
        showAlert('Berhasil', 'Selamat! Akunmu sekarang memiliki peran Penjual. Silakan relogin untuk memperbarui sesi, atau ganti peran aktif di Profil.');
        router.push('/profile');
      } else {
        const err = await response.json();
        showAlert('Gagal', err.message || 'Gagal melakukan upgrade akun.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCreateStore = async () => {
    if (newStoreName.trim().length < 3) {
      return showAlert('Validasi Gagal', 'Nama toko minimal 3 karakter.');
    }
    try {
      const response = await fetch(`http://${api_address}:3000/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newStoreName.trim() }),
      });
      if (response.ok) {
        showAlert('Sukses', 'Toko berhasil dibuat!');
        setNewStoreName('');
        fetchMyStoreAndProducts(); 
      } else {
        const err = await response.json();
        showAlert('Gagal', err.message || 'Gagal membuat toko.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    }
  };

  const handleUpdateStore = async () => {
    if (editStoreName.trim().length < 3) {
      return showAlert('Validasi Gagal', 'Nama toko minimal 3 karakter.');
    }
    try {
      const response = await fetch(`http://${api_address}:3000/stores/my-store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editStoreName.trim() }),
      });
      if (response.ok) {
        showAlert('Sukses', 'Nama toko berhasil diperbarui!');
        setIsEditing(false);
        fetchMyStoreAndProducts();
      } else {
        const err = await response.json();
        showAlert('Gagal', err.message || 'Gagal mengubah nama toko.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    }
  };

  // --- 1. GUARD CLAUSE: Belum Login ---
  if (!token) {
    return (
      <View style={[styles.container, styles.center]}>
        <IconSymbol name="lock.shield.fill" size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Akses Ditolak</Text>
        <Text style={styles.errorText}>Silakan masuk (login) terlebih dahulu.</Text>
      </View>
    );
  }

  // --- 2. GUARD CLAUSE: Logika Upgrade Role ---
  if (activeRole !== 'SELLER') {
    const hasSellerRole = roles.includes('SELLER');
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.upgradeCard}>
          <IconSymbol name="bag.fill" size={56} color="#D97706" />
          {hasSellerRole ? (
            <>
              <Text style={styles.upgradeTitle}>Salah Peran Aktif</Text>
              <Text style={styles.upgradeText}>
                Kamu memiliki peran Penjual, tetapi saat ini sedang menggunakan peran {activeRole}. 
                Silakan ganti peran aktifmu di halaman Profil.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/profile')}>
                <Text style={styles.primaryButtonText}>Ke Halaman Profil</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.upgradeTitle}>Buka Toko di SEAPEDIA</Text>
              <Text style={styles.upgradeText}>
                Akunmu saat ini hanya terdaftar sebagai Pembeli. Tingkatkan akunmu menjadi Mitra Penjual secara gratis untuk mulai berbisnis.
              </Text>
              <TouchableOpacity 
                style={[styles.primaryButton, isUpgrading && { opacity: 0.7 }]} 
                onPress={handleUpgradeToSeller}
                disabled={isUpgrading}
              >
                {isUpgrading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Tingkatkan Jadi Penjual</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  // === KOMPONEN HEADER UNTUK FLATLIT ===
  // Ini menggantikan ScrollView yang lama
  const renderDashboardHeader = () => {
    if (!store) {
      return (
        <View style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7', marginBottom: 16 }]}>
            <IconSymbol name="storefront.fill" size={32} color="#D97706" />
          </View>
          <Text style={styles.title}>Mulai Berjualan di SEAPEDIA</Text>
          <Text style={styles.subtitle}>Buat identitas tokomu sekarang dan jangkau lebih banyak pembeli.</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nama Toko</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Toko Elektronik Jaya"
              value={newStoreName}
              onChangeText={setNewStoreName}
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleCreateStore}>
            <Text style={styles.primaryButtonText}>Buat Toko Sekarang</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.pageHeader}>Dasbor Penjual</Text>
        <View style={styles.card}>
          <View style={styles.storeHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <IconSymbol name="building.2.fill" size={28} color="#D97706" />
            </View>
            <View style={styles.storeInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editStoreName}
                  onChangeText={setEditStoreName}
                  autoFocus
                />
              ) : (
                <Text style={styles.storeName}>{store.name}</Text>
              )}
              <Text style={styles.storeId}>ID Toko: {store.id.split('-')[0]}</Text>
            </View>
          </View>
          {isEditing ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.outlineButton, { flex: 1, marginRight: 8 }]} onPress={() => setIsEditing(false)}>
                <Text style={styles.outlineButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleUpdateStore}>
                <Text style={styles.primaryButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.outlineButton} onPress={() => setIsEditing(true)}>
              <IconSymbol name="pencil" size={16} color="#D97706" />
              <Text style={styles.outlineButtonText}> Edit Nama Toko</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Etalase Produkku</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/seller/add-product')}>
            <IconSymbol name="plus" size={16} color="#FFF" />
            <Text style={styles.addButtonText}>Tambah Produk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- 3. LAYAR UTAMA DASBOR ---
  return (
    <View style={styles.container}>
      <View style={styles.pageWrapper}>
        {/* Jika belum punya toko, hanya render header tanpa FlatList Grid */}
        {!store ? (
          <View style={{ paddingTop: 20 }}>
            {renderDashboardHeader()}
          </View>
        ) : (
          /* Jika sudah punya toko, render ProductGrid dengan header Dasbor */
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListHeaderComponent={renderDashboardHeader()}
            emptyMessage="Toko kamu belum memiliki produk. Klik 'Tambah Produk' untuk mulai berjualan."
            storeOverride={{ name: store.name }} // <-- INILAH KUNCINYA!
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  pageWrapper: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 800, // Sedikit dilebarkan untuk grid produk
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  pageHeader: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: 'flex-start' },
  iconWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  inputContainer: { width: '100%', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { width: '100%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  editInput: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  primaryButton: { backgroundColor: '#D97706', width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  storeHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  storeInfo: { marginLeft: 16, flex: 1 },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  storeId: { fontSize: 12, color: '#9CA3AF' },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 12, borderWidth: 1, borderColor: '#D97706', borderRadius: 10, backgroundColor: '#FFFBEB' },
  outlineButtonText: { color: '#D97706', fontSize: 14, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', width: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  
  upgradeCard: { backgroundColor: '#FFF', padding: 32, borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  upgradeTitle: { fontSize: 22, fontWeight: '800', color: '#92400E', marginTop: 20, marginBottom: 12, textAlign: 'center' },
  upgradeText: { fontSize: 15, color: '#78350F', textAlign: 'center', lineHeight: 24, marginBottom: 32 }
});