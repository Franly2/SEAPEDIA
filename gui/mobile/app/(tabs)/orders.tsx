// Lokasi file: app/(tabs)/orders.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrdersScreen() {
  const router = useRouter();
  
  // State untuk melacak filter status yang sedang diklik
  const [activeFilter, setActiveFilter] = useState('Semua');
  const filters = ['Semua', 'Belum Bayar', 'Dikemas', 'Dikirim', 'Selesai'];

  return (
    <View style={styles.container}>
      {/* Header Statis */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      {/* Baris Filter Status (Bisa di-scroll menyamping) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((filter, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.filterBadge, 
                activeFilter === filter && styles.filterBadgeActive
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Area Konten Utama (Tampilan Kosong / Empty State) */}
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconCircle}>
          <IconSymbol name="doc.text.fill" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
        <Text style={styles.emptySubtitle}>
          Kamu belum memiliki pesanan dengan status &quot;{activeFilter}&quot;. Yuk, mulai belanja dan penuhi kebutuhanmu!
        </Text>
        
        {/* Tombol kembali ke Beranda */}
        <TouchableOpacity 
          style={styles.shopButton} 
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.shopButtonText}>Mulai Belanja</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 20,
    paddingTop: 60, 
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterBadgeActive: {
    backgroundColor: '#EFF6FF', 
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});