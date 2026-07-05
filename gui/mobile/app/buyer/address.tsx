import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Address {
  id: string;
  label: string;
  addressLine: string;
}

export default function AddressScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ label: '', addressLine: '' });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${api_address}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      showAlert('Error', 'Gagal memuat alamat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({ label: '', addressLine: '' });
    setEditId(null);
    setIsFormVisible(false);
  };

  const handleOpenEdit = (addr: Address) => {
    setFormData({ label: addr.label, addressLine: addr.addressLine });
    setEditId(addr.id);
    setIsFormVisible(true);
  };

  const handleSave = async () => {
    if (!formData.label.trim() || !formData.addressLine.trim()) {
      return showAlert('Validasi', 'Semua kolom wajib diisi.');
    }

    setIsSaving(true);
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${api_address}/addresses/${editId}` : `${api_address}/addresses`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlert('Sukses', editId ? 'Alamat diperbarui!' : 'Alamat ditambahkan!');
        resetForm();
        fetchAddresses();
      } else {
        const err = await response.json();
        showAlert('Gagal', err.message || 'Terjadi kesalahan.');
      }
    } catch (error) {
      showAlert('Error', 'Tidak dapat terhubung ke server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    const confirmDelete = async () => {
      try {
        const response = await fetch(`${api_address}/addresses/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          showAlert('Sukses', 'Alamat dihapus.');
          if (editId === id) {
             resetForm();
          }
          fetchAddresses();
        } else {
          showAlert('Gagal', 'Tidak dapat menghapus alamat.');
        }
      } catch (error) {
        showAlert('Error', 'Terjadi kesalahan jaringan.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin menghapus alamat ini?')) confirmDelete();
    } else {
      Alert.alert('Hapus Alamat', 'Yakin ingin menghapus alamat ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
        <View style={{ width: 40 }} />
      </View>

      {isFormVisible ? (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{editId ? 'Edit Alamat' : 'Tambah Alamat Baru'}</Text>
            {editId && (
              <TouchableOpacity onPress={() => handleDelete(editId)} style={styles.deleteFormBtn}>
                 <Feather name="trash-2" size={16} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Label Alamat (Misal: Rumah, Kantor)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Rumah Utama"
              value={formData.label}
              onChangeText={(text) => setFormData({ ...formData, label: text })}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detail Alamat Lengkap</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contoh: Jl. Sudirman No. 123, RT 01/02, Jakarta"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.addressLine}
              onChangeText={(text) => setFormData({ ...formData, addressLine: text })}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.outlineButton, { flex: 1, marginRight: 8 }]} onPress={resetForm}>
              <Text style={styles.outlineButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color={Colors.surface} /> : <Text style={styles.primaryButtonText}>Simpan</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsFormVisible(true)}>
          <Feather name="plus" size={20} color={Colors.primary} />
          <Text style={styles.addButtonText}> Tambah Alamat Baru</Text>
        </TouchableOpacity>
      )}

      <View style={styles.listContainer}>
        <Text style={styles.listSectionTitle}>Daftar Alamat</Text>
        {addresses.length === 0 && !isFormVisible ? ( 
          <View style={styles.emptyBox}>
            <Feather name="map" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Belum ada alamat tersimpan.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity 
              key={addr.id} 
              style={[styles.addressCard, editId === addr.id && styles.addressCardActive]} 
              activeOpacity={0.7}
              onPress={() => handleOpenEdit(addr)}
            >
              <View style={styles.addressHeader}>
                <View style={styles.labelBadge}>
                  <Text style={styles.labelText}>{addr.label}</Text>
                </View>
                
                <View style={styles.actionIcons}>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(addr.id);
                    }} 
                    style={styles.iconButton}
                  >
                    <Feather name="trash-2" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.addressLine}>{addr.addressLine}</Text>
              
              <View style={styles.clickHint}>
                 <Feather name="chevron-right" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
  
  card: { backgroundColor: Colors.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 24, elevation: 2, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  deleteFormBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.secondary },
  textArea: { minHeight: 100 },
  actionRow: { flexDirection: 'row', marginTop: 12 },
  outlineButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.surface },
  outlineButtonText: { color: Colors.textMuted, fontSize: 15, fontWeight: '700' },
  primaryButton: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '900' },

  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', borderStyle: 'dashed', paddingVertical: 18, borderRadius: 16, marginBottom: 28 },
  addButtonText: { color: Colors.primary, fontSize: 15, fontWeight: '800' },
  
  listContainer: { marginTop: 8 },
  listSectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.secondary, marginBottom: 16 },
  emptyBox: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border },
  emptyText: { marginTop: 12, color: Colors.textMuted, fontSize: 14, fontWeight: '500' },
  
  addressCard: { backgroundColor: Colors.surface, padding: 18, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, elevation: 1, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  addressCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight, borderWidth: 1.5 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelBadge: { backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  labelText: { fontSize: 12, fontWeight: '800', color: Colors.secondary },
  actionIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 6, backgroundColor: '#FEE2E2', borderRadius: 8 },
  addressLine: { fontSize: 14, color: Colors.textMuted, lineHeight: 22, marginBottom: 16 },
  clickHint: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.background, paddingTop: 12 },
  clickHintText: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginRight: 4, fontWeight: '500' }
});