import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface DeliveryStat {
  id: string;
  orderId: string;
  driverUsername: string;
  fee: number;
  status: string;
}

export default function DeliveryStatsModal({ visible, onClose, data, isLoading }: { visible: boolean, onClose: () => void, data: DeliveryStat[], isLoading: boolean }) {
  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Pekerjaan Kurir</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><Feather name="x" size={24} color="#6B7280" /></TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.modalLoader}><ActivityIndicator size="large" color="#3B82F6" /></View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((del) => (
                <View key={del.id} style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Order: #{del.orderId.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.badge}>{del.status.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="truck" size={16} color="#4B5563" style={{ marginRight: 8 }} />
                      <Text style={styles.title}>@{del.driverUsername}</Text>
                    </View>
                    <Text style={styles.value}>{formatRupiah(del.fee)}</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  label: { fontSize: 13, color: '#4B5563', fontWeight: 'bold' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#10B981' },
  badge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F3F4F6', color: '#374151', overflow: 'hidden' },
});