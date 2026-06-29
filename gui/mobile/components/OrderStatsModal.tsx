import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface OrderStat {
  id: string;
  buyerUsername: string;
  storeName: string;
  status: string;
  finalTotal: number;
  createdAt: string;
}

export default function OrderStatsModal({ visible, onClose, data, isLoading, title }: { visible: boolean, onClose: () => void, data: OrderStat[], isLoading: boolean, title: string }) {
  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><Feather name="x" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.modalLoader}><ActivityIndicator size="large" color="#3B82F6" /></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.title}>ID: {order.id.slice(-8).toUpperCase()}</Text>
                    <Text style={[styles.badge, order.status === 'DIKEMBALIKAN' ? styles.badgeRed : styles.badgeBlue]}>{order.status.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.label}>Pembeli: <Text style={{fontWeight: 'bold'}}>@{order.buyerUsername}</Text></Text>
                  <Text style={styles.label}>Toko: <Text style={{fontWeight: 'bold'}}>{order.storeName}</Text></Text>
                  <View style={[styles.row, { marginTop: 12 }]}>
                    <Text style={styles.label}>Total Tagihan:</Text>
                    <Text style={styles.value}>{formatRupiah(order.finalTotal)}</Text>
                  </View>
                </View>
              ))}
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
  title: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  value: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  badge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  badgeBlue: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  badgeRed: { backgroundColor: '#FEE2E2', color: '#B91C1C' }
});