import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface UserStat {
  id: string;
  username: string;
  fullName: string;
  roles: string[];
  totalBuy: number;
  totalSell: number;
  totalSpend: number;
}

interface UserStatsModalProps {
  visible: boolean;
  onClose: () => void;
  data: UserStat[];
  isLoading: boolean;
}

export default function UserStatsModal({ visible, onClose, data, isLoading }: UserStatsModalProps) {
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Pengguna Platform</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.modalLoader}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{ marginTop: 12, color: '#6B7280' }}>Memuat data pengguna...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {data.map((user) => (
                <View key={user.id} style={styles.userItemCard}>
                  <View style={styles.userInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    </View>
                    <View style={styles.roleContainer}>
                      {user.roles.map((r: string) => (
                        <View key={r} style={styles.roleTag}>
                          <Text style={styles.roleTagText}>{r}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.transactionStatsRow}>
                    <View style={styles.statBox}>
                      <Feather name="shopping-bag" size={16} color="#10B981" />
                      <Text style={styles.statLabel}>Beli: <Text style={{ fontWeight: 'bold' }}>{user.totalBuy}</Text></Text>
                    </View>
                    <View style={styles.statBox}>
                      <Feather name="truck" size={16} color="#F59E0B" />
                      <Text style={styles.statLabel}>Jual: <Text style={{ fontWeight: 'bold' }}>{user.totalSell}</Text></Text>
                    </View>
                  </View>

                  <View style={styles.financeBox}>
                    <Text style={styles.financeLabel}>Total Belanja (Spend):</Text>
                    <Text style={styles.financeValue}>{formatRupiah(user.totalSpend)}</Text>
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
  
  userItemCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  userUsername: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', width: 90, justifyContent: 'flex-end', gap: 4 },
  roleTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleTagText: { fontSize: 9, fontWeight: 'bold', color: '#1D4ED8' },
  
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  transactionStatsRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, marginBottom: 12 },
  statBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  statLabel: { fontSize: 12, color: '#374151', marginLeft: 6 },

  financeBox: { backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1FAE5' },
  financeLabel: { fontSize: 12, color: '#065F46', fontWeight: '500' },
  financeValue: { fontSize: 14, fontWeight: 'bold', color: '#047857' },
});