import { Product, ProductGrid } from '@/components/ui/ProductGrid';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
      const storeRes = await fetch(`${api_address}/stores/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData);
        setEditStoreName(storeData.name);

        const prodRes = await fetch(`${api_address}/products/my-products`, {
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
      const response = await fetch(`${api_address}/users/upgrade-role`, {
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
      const response = await fetch(`${api_address}/stores`, {
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
      const response = await fetch(`${api_address}/stores/my-store`, {
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

  if (!token) {
    return (
      <View style={[styles.container, styles.center]}>
        <Feather name="lock" size={64} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>Akses Ditolak</Text>
        <Text style={styles.errorText}>Silakan masuk (login) terlebih dahulu.</Text>
      </View>
    );
  }

  if (activeRole !== 'SELLER') {
    const hasSellerRole = roles.includes('SELLER');
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.upgradeCard}>
          <View style={[styles.iconWrapper, { backgroundColor: Colors.primaryLight, marginBottom: 20 }]}>
             <Feather name="briefcase" size={32} color={Colors.primary} />
          </View>
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
                {isUpgrading ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.primaryButtonText}>Tingkatkan Jadi Penjual</Text>}
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
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderDashboardHeader = () => {
    if (!store) {
      return (
        <View style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: Colors.primaryLight, marginBottom: 16 }]}>
            <IconSymbol name="storefront.fill" size={32} color={Colors.primary} />
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
              placeholderTextColor={Colors.textMuted}
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
            <View style={[styles.iconWrapper, { backgroundColor: Colors.primaryLight }]}>
              <IconSymbol name="building.2.fill" size={28} color={Colors.primary} />
            </View>
            <View style={styles.storeInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editStoreName}
                  onChangeText={setEditStoreName}
                  autoFocus
                  placeholderTextColor={Colors.textMuted}
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
              <IconSymbol name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.outlineButtonText}> Edit Nama Toko</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Etalase Produkku</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/seller/add-product')}>
            <IconSymbol name="plus" size={16} color={Colors.surface} />
            <Text style={styles.addButtonText}>Tambah Produk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageWrapper}>
        {!store ? (
          <View style={{ paddingTop: 20 }}>
            {renderDashboardHeader()}
          </View>
        ) : (
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListHeaderComponent={renderDashboardHeader()}
            emptyMessage="Toko kamu belum memiliki produk. Klik 'Tambah Produk' untuk mulai berjualan."
            storeOverride={{ name: store.name }}
            onProductPress={(product) => router.push(`/seller/edit-product/${product.id}`)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageWrapper: { 
    flex: 1, 
    width: '100%', 
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: '900', color: Colors.secondary, marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  pageHeader: { fontSize: 24, fontWeight: '900', color: Colors.secondary, marginBottom: 20, letterSpacing: -0.5 },
  card: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 24, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, alignItems: 'flex-start' },
  iconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: Colors.secondary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 24, lineHeight: 22 },
  inputContainer: { width: '100%', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  input: { width: '100%', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.secondary },
  editInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: 'bold', color: Colors.secondary, marginBottom: 4 },
  primaryButton: { backgroundColor: Colors.primary, width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '900' },
  storeHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  storeInfo: { marginLeft: 16, flex: 1 },
  storeName: { fontSize: 20, fontWeight: '900', color: Colors.secondary, marginBottom: 4 },
  storeId: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', borderRadius: 12, backgroundColor: Colors.primaryLight },
  outlineButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  actionRow: { flexDirection: 'row', width: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.secondary },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addButtonText: { color: Colors.surface, fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  
  upgradeCard: { backgroundColor: Colors.surface, padding: 32, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', width: '100%', maxWidth: 450, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 4 },
  upgradeTitle: { fontSize: 22, fontWeight: '900', color: Colors.secondary, marginBottom: 12, textAlign: 'center' },
  upgradeText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 10 }
});