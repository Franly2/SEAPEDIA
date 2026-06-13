import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export interface StoreInfo {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  store?: StoreInfo; // Ubah ini jadi opsional (?) karena dari /my-products tidak ada
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
  emptyMessage?: string;
  // TAMBAHAN BARU:
  storeOverride?: { name: string };
}

export function ProductGrid({ 
  products, 
  isLoading, 
  onRefresh, 
  refreshing = false, 
  ListHeaderComponent,
  emptyMessage = "Belum ada produk.",
  storeOverride // Ambil prop baru di sini
}: ProductGridProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const getNumColumns = () => {
    if (width > 1024) return 4; 
    if (width > 768) return 3;  
    return 2;                   
  };

  const numColumns = getNumColumns();

  const getCardWidth = () => {
    if (numColumns === 4) return '23.5%'; 
    if (numColumns === 3) return '31.5%';
    return '48%'; 
  };
  
  const cardWidth = getCardWidth();

  const renderProductItem = ({ item }: { item: Product }) => {
    // LOGIKA CERDAS: Gunakan storeOverride jika ada, jika tidak, gunakan item.store
    const displayedStoreName = storeOverride?.name || item.store?.name || 'Toko Tidak Diketahui';

    return (
      <TouchableOpacity 
        style={[styles.productCard, { width: cardWidth }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <IconSymbol name="cube.box" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>
          <View style={styles.storeBadge}>
            <IconSymbol name="building.2" size={12} color="#6B7280" />
            <Text style={styles.storeName} numberOfLines={1}>{displayedStoreName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      // ... (Bagian FlatList tidak ada yang berubah)
      key={numColumns} 
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderProductItem}
      ListHeaderComponent={ListHeaderComponent}
      numColumns={numColumns} 
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />
        ) : undefined
      }
      ListEmptyComponent={
        !isLoading ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="cube.box" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : null
      }
    />
  );
}

// ... (Bagian styles tidak ada yang berubah)
const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 20,
    width: '100%', 
  },
  row: {
    justifyContent: 'flex-start', 
    gap: '2%', 
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, 
    backgroundColor: '#F9FAFB',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
    height: 40, 
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E11D48', 
    marginBottom: 10,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  storeName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
    maxWidth: '85%', 
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 15,
  }
});