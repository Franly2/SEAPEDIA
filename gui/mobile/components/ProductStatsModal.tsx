import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ProductStat {
  id: string;
  name: string;
  storeName: string;
  price: number;
  stock: number;
  pcsSold: number;
  totalRevenue: number;
}

export default function ProductStatsModal({ visible, onClose, data, isLoading }: { visible: boolean, onClose: () => void, data: ProductStat[], isLoading: boolean }) {
  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Master Data Produk</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><Feather name="x" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.modalLoader}><ActivityIndicator size="large" color="#3B82F6" /></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((prod) => (
                <View key={prod.id} style={styles.card}>
                  <Text style={styles.title}>{prod.name}</Text>
                  <Text style={styles.subtitle}>Toko: {prod.storeName}</Text>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Harga / Pcs:</Text>
                    <Text style={[styles.value, { color: '#3B82F6' }]}>{formatRupiah(prod.price)}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Stok Sisa:</Text>
                    <Text style={styles.value}>{prod.stock} Pcs</Text>
                  </View>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Terjual:</Text>
                    <Text style={styles.value}>{prod.pcsSold} Pcs</Text>
                  </View>
                  
                  <View style={[styles.row, { marginTop: 8, backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6 }]}>
                    <Text style={[styles.label, { color: '#065F46' }]}>Total Penjualan:</Text>
                    <Text style={[styles.value, { color: '#047857', fontWeight: 'bold' }]}>{formatRupiah(prod.totalRevenue)}</Text>
                  </View>
                </View>
              ))}

              {data.length === 0 && !isLoading && (
                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>Belum ada produk yang terdaftar.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, maxHeight: '85%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  closeButton: { padding: 4 },
  modalLoader: { paddingVertical: 40, alignItems: 'center' },
  card: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, color: '#4B5563' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' }
});