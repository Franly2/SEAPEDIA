import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
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
  const primaryColor = '#1976D2';
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;

  const { token, fullName } = useAuthStore();

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      if (typeof atob !== 'undefined') {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id || null;
      }
      return null;
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
      const response = await fetch(`${api_address}:3000/reviews/user/${userId}`);
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

      const response = await fetch(`${api_address}:3000/reviews`, {
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
            <IconSymbol 
              key={star} 
              name={star <= item.rating ? "star.fill" : "star"} 
              size={16} 
              color={star <= item.rating ? "#F59E0B" : "#D1D5DB"} 
            />
          ))}
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ulasan Aplikasi</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Belum ada ulasan. Jadilah yang pertama!</Text>
        }
        ListHeaderComponent={
          hasReviewed ? (
            <View style={[styles.formContainer, { alignItems: 'center', paddingVertical: 40 }]}>
              <IconSymbol name="checkmark.circle.fill" size={48} color="#10B981" />
              <Text style={[styles.formTitle, { marginTop: 16, marginBottom: 8, textAlign: 'center' }]}>Terima Kasih!</Text>
              <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                Kamu sudah membagikan pengalamanmu. Ulasanmu sangat berarti bagi pengembangan SEAPEDIA.
              </Text>
              <View style={styles.divider} />
              <Text style={[styles.formTitle, { alignSelf: 'flex-start' }]}>Ulasan Pengguna Lainnya</Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Bagaimana pengalamanmu menggunakan SEAPEDIA?</Text>
              
              <Text style={styles.label}>Nama Kamu</Text>
              <TextInput
                style={[styles.input, token && styles.inputDisabled]}
                placeholder="Masukkan nama..."
                value={name}
                onChangeText={setName}
                editable={!token}
              />

              <Text style={styles.label}>Rating Aplikasi</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} style={{ padding: 4 }}>
                    <IconSymbol 
                      name={star <= rating ? "star.fill" : "star"} 
                      size={36} 
                      color={star <= rating ? "#F59E0B" : "#D1D5DB"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Komentar / Saran</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ceritakan pengalamanmu..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} 
                onPress={handleSubmit} 
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Kirim Ulasan</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider} />
              <Text style={styles.formTitle}>Ulasan Pengguna Lainnya</Text>
            </View>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#1976D2', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  listContent: { padding: 20 },
  formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24, elevation: 2 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, height: 45, backgroundColor: '#F9FAFB', color: '#1F2937' },
  inputDisabled: { backgroundColor: '#E5E7EB', color: '#6B7280' },
  textArea: { height: 100, paddingTop: 12 },
  ratingSelector: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
  submitButton: { backgroundColor: '#1976D2', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24, width: '100%' },
  emptyText: { textAlign: 'center', color: '#6B7280', fontStyle: 'italic', marginTop: 20 },
  reviewCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  myReviewCard: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewerName: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  myReviewBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  myReviewBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#1D4ED8' },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },
  starRow: { flexDirection: 'row', marginBottom: 8 },
  reviewComment: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});