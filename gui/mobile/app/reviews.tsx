import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewsScreen() {
  const router = useRouter();
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const { token, fullName } = useAuthStore();

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload: any = jwtDecode(token);
      return payload.sub || payload.id || null;
    } catch (e) {
      return null;
    }
  };

  const userId = getUserIdFromToken();

  const [name, setName] = useState(fullName || '');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (userId) {
      checkUserReviewStatus();
    } else {
      setIsLoading(false);
    }
  }, [userId, fullName, token]); 

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${api_address}/reviews`);
      if (response.ok) {
        const data: Review[] = await response.json();
        
        if (token && fullName) {
          const sortedData = data.sort((a, b) => {
            if (a.reviewerName === fullName) return -1;
            if (b.reviewerName === fullName) return 1; 
            return 0; 
          });
          setReviews(sortedData);
        } else {
          setReviews(data);
        }
      }
    } catch (error) {
      console.error('Gagal memuat daftar ulasan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserReviewStatus = async () => {
    try {
      const response = await fetch(`${api_address}/reviews/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasReviewed) {
          setHasReviewed(true);
        }
      }
    } catch (error) {
      console.error('Gagal mengecek status ulasan:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || rating === 0 || !comment.trim()) {
      if (Platform.OS === 'web') window.alert('Mohon isi nama, pilih rating bintang, dan tulis ulasanmu.');
      else Alert.alert('Form Belum Lengkap', 'Mohon isi nama, pilih rating bintang, dan tulis ulasanmu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        reviewerName: name.trim(),
        rating,
        comment: comment.trim(),
      };

      if (userId) {
        payload.userId = userId;
      }

      const response = await fetch(`${api_address}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setReviews([data, ...reviews]);
        
        if (userId) {
          setHasReviewed(true); 
        } else {
          setName('');
          setRating(0);
          setComment('');
        }

        if (Platform.OS === 'web') window.alert('Terima kasih atas ulasanmu!');
        else Alert.alert('Sukses', 'Terima kasih atas ulasanmu!');
      } else {
        const errorMsg = data.message || 'Gagal mengirim ulasan.';
        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert('Gagal', errorMsg);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('Gagal terhubung ke server.');
      else Alert.alert('Error', 'Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const isMyReview = token && fullName && item.reviewerName === fullName;

    return (
      <View style={[styles.reviewCard, isMyReview && styles.myReviewCard]}>
        <View style={styles.reviewHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.reviewerName}>{item.reviewerName}</Text>
            {isMyReview && (
              <View style={styles.myReviewBadge}>
                <Text style={styles.myReviewBadgeText}>Ulasan Kamu</Text>
              </View>
            )}
          </View>
          <Text style={styles.reviewDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Feather 
              key={star} 
              name="star" 
              size={14} 
              color={star <= item.rating ? Colors.primary : Colors.border} 
              style={{ marginRight: 2 }}
            />
          ))}
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    );
  };

  const headerElement = (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ulasan Aplikasi</Text>
        <View style={{ width: 40 }} />
      </View>

      {hasReviewed ? (
        <View style={[styles.formContainer, { alignItems: 'center', paddingVertical: 40 }]}>
          <Feather name="check-circle" size={56} color="#10B981" />
          <Text style={[styles.formTitle, { marginTop: 16, marginBottom: 8, textAlign: 'center' }]}>Terima Kasih!</Text>
          <Text style={{ textAlign: 'center', color: Colors.textMuted, fontSize: 14 }}>
            Kamu sudah membagikan pengalamanmu. Ulasanmu sangat berarti bagi pengembangan SEAPEDIA.
          </Text>
          <View style={styles.divider} />
          <Text style={[styles.formTitle, { alignSelf: 'flex-start', marginBottom: 0 }]}>Ulasan Pengguna Lainnya</Text>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Bagaimana pengalamanmu menggunakan SEAPEDIA?</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Kamu</Text>
            <TextInput
              style={[styles.input, token && styles.inputDisabled]}
              placeholder="Masukkan nama..."
              value={name}
              onChangeText={setName}
              editable={!token}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rating Aplikasi</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} style={{ padding: 8 }}>
                  <Feather 
                    name="star" 
                    size={36} 
                    color={star <= rating ? Colors.primary : Colors.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Komentar / Saran</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ceritakan pengalamanmu..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSubmit} 
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Kirim Ulasan</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={[styles.formTitle, { marginBottom: 0 }]}>Ulasan Pengguna Lainnya</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={headerElement}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="message-square" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Belum ada ulasan. Jadilah yang pertama!</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, width: '100%', maxWidth: 600, alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
  
  formContainer: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 24, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: '900', color: Colors.secondary, marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.secondary },
  inputDisabled: { backgroundColor: Colors.border, color: Colors.textMuted },
  textArea: { minHeight: 120 },
  
  ratingSelector: { flexDirection: 'row', justifyContent: 'center', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14 },
  
  primaryButton: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '900' },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 24, width: '100%' },
  
  emptyBox: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.border },
  emptyText: { marginTop: 12, color: Colors.textMuted, fontSize: 14, textAlign: 'center', fontWeight: '500' },
  
  reviewCard: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  myReviewCard: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewerName: { fontSize: 15, fontWeight: '900', color: Colors.secondary },
  
  myReviewBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  myReviewBadgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.surface },
  
  reviewDate: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  starRow: { flexDirection: 'row', marginBottom: 12 },
  reviewComment: { fontSize: 14, color: Colors.secondary, lineHeight: 24 },
});