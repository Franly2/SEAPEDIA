import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const { token } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://${api_address}:3000/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name,
            description: data.description,
            price: data.price.toString(),
            stock: data.stock.toString(),
            imageUrl: data.imageUrl || '',
          });
        } else {
          showAlert('Gagal', 'Produk tidak ditemukan.');
          router.back();
        }
      } catch (error) {
        showAlert('Error', 'Gagal memuat produk.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchProduct();
  }, [id]);

  const handleUpdateProduct = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.price || !formData.stock) {
      return showAlert('Validasi Gagal', 'Nama, deskripsi, harga, dan stok wajib diisi.');
    }

    const priceInt = parseInt(formData.price, 10);
    const stockInt = parseInt(formData.stock, 10);

    if (isNaN(priceInt) || priceInt < 0) return showAlert('Error', 'Harga tidak valid.');
    if (isNaN(stockInt) || stockInt < 0) return showAlert('Error', 'Stok tidak valid.');

    setIsSaving(true);

    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceInt,
        stock: stockInt,
        imageUrl: formData.imageUrl.trim() || null,
      };

      const response = await fetch(`http://${api_address}:3000/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert('Sukses', 'Produk berhasil diperbarui!');
        router.back(); 
      } else {
        const err = await response.json();
        showAlert('Gagal Update', err.message || 'Terjadi kesalahan.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = () => {
    const confirmDelete = async () => {
      setIsDeleting(true);
      try {
        const response = await fetch(`http://${api_address}:3000/products/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          showAlert('Sukses', 'Produk dihapus secara permanen.');
          router.back();
        } else {
          const err = await response.json();
          showAlert('Gagal', err.message || 'Gagal menghapus produk.');
        }
      } catch (error) {
        showAlert('Error', 'Terjadi kesalahan koneksi.');
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) confirmDelete();
    } else {
      Alert.alert('Konfirmasi Hapus', 'Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Permanen', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Produk</Text>
        
        <TouchableOpacity 
          style={styles.deleteButtonHeader} 
          onPress={handleDeleteProduct}
          disabled={isDeleting}
        >
          {isDeleting ? <ActivityIndicator size="small" color="#DC2626" /> : <IconSymbol name="trash.fill" size={20} color="#DC2626" />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Produk</Text>
          <TextInput style={styles.input} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deskripsi Produk</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} textAlignVertical="top" value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Harga (Rp)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9]/g, '') })} />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Stok</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={formData.stock} onChangeText={(text) => setFormData({ ...formData, stock: text.replace(/[^0-9]/g, '') })} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL Gambar</Text>
          <TextInput style={styles.input} value={formData.imageUrl} onChangeText={(text) => setFormData({ ...formData, imageUrl: text })} autoCapitalize="none" />
        </View>
      </View>

      <TouchableOpacity style={[styles.submitButton, isSaving && { opacity: 0.7 }]} onPress={handleUpdateProduct} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Simpan Perubahan</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  deleteButtonHeader: { padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8 },
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  textArea: { minHeight: 100 },
  submitButton: { backgroundColor: '#D97706', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});