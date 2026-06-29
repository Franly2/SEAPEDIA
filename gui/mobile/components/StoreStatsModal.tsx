import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface StoreStat {
  id: string;
  name: string;
  ownerName: string;
  ownerUsername: string;
  totalProducts: number;
  totalOrders: number;
  totalIncome: number; 
}

interface StoreStatsModalProps {
  visible: boolean;
  onClose: () => void;
  data: StoreStat[];
  isLoading: boolean;
}

export default function StoreStatsModal({ visible, onClose, data, isLoading }: StoreStatsModalProps) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Toko Terdaftar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.modalLoader}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{ marginTop: 12, color: '#6B7280' }}>Memuat data toko...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((store) => (
                <View key={store.id} style={styles.storeItemCard}>
                  <View style={styles.storeInfoRow}>
                    <View style={styles.storeIconWrapper}>
                      <Feather name="shopping-cart" size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>{store.name}</Text>
                      <Text style={styles.ownerText}>
                        Pemilik: <Text style={{ fontWeight: 'bold', color: '#374151' }}>{store.ownerName}</Text> (@{store.ownerUsername})
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.transactionStatsRow}>
                    <View style={styles.statBox}>
                      <Feather name="package" size={16} color="#8B5CF6" />
                      <Text style={styles.statLabel}>Total Produk: <Text style={{ fontWeight: 'bold' }}>{store.totalProducts}</Text></Text>
                    </View>
                    <View style={styles.statBox}>
                      <Feather name="shopping-bag" size={16} color="#10B981" />
                      <Text style={styles.statLabel}>Total Pesanan: <Text style={{ fontWeight: 'bold' }}>{store.totalOrders}</Text></Text>
                    </View>
                  </View>

                  <View style={styles.financeBox}>
                    <Text style={styles.financeLabel}>Pendapatan Kotor Toko:</Text>
                    <Text style={styles.financeValue}>{formatRupiah(store.totalIncome)}</Text>
                  </View>
                </View>
              ))}
              
              {data.length === 0 && !isLoading && (
                <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>Belum ada toko yang terdaftar.</Text>
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
  
  storeItemCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  storeInfoRow: { flexDirection: 'row', alignItems: 'center' },
  storeIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  storeName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  ownerText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  transactionStatsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, marginBottom: 12 },
  statBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  statLabel: { fontSize: 12, color: '#374151', marginLeft: 6 },

  financeBox: { backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  financeLabel: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  financeValue: { fontSize: 14, fontWeight: 'bold', color: '#B45309' },
});