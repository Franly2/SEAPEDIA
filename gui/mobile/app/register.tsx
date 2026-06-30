import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function RegisterScreen() {
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  const router = useRouter();

  const primaryColor = '#3B82F6'; 
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleRegister() {
    if (!fullName || !username || !password) {
      setErrorMessage('Semua kolom harus diisi.');
      setSuccessMessage('');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${api_address}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName, 
          username, 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Pendaftaran berhasil!');
        setFullName('');
        setUsername('');
        setPassword('');

        setTimeout(() => {
          router.replace('/'); 
        }, 2500);

      } else {
        const errorText = Array.isArray(data.message) ? data.message[0] : data.message;
        setErrorMessage(errorText || 'Gagal mendaftar akun.');
      }
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Feather name="user-plus" size={48} color={primaryColor} />
            </View>
            <Text style={styles.brandTitle}>BERGABUNG SEKARANG</Text>
            <Text style={styles.title}>SEAPEDIA</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                onChangeText={setFullName}
                value={fullName}
                placeholder="Misal: Budi Santoso"
                placeholderTextColor="#9CA3AF"
                editable={!successMessage && !isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Pengguna (Username)</Text>
              <TextInput
                style={styles.input}
                onChangeText={setUsername}
                value={username}
                placeholder="budi_pembeli"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={!successMessage && !isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                placeholder="Minimal 6 karakter"
                secureTextEntry
                placeholderTextColor="#9CA3AF"
                editable={!successMessage && !isLoading}
              />
            </View>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
                <Text style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>Mengalihkan ke halaman login...</Text>
                <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
              </View>
            ) : null}

            {isLoading && !successMessage ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={primaryColor} />
              </View>
            ) : (
              !successMessage && (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleRegister} 
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Daftar Akun</Text>
                </TouchableOpacity>
              )
            )}

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={[styles.loginLinkHighlight, { color: primaryColor }]}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>@ 2026 Seapedia </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 60, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center', flexGrow: 1, justifyContent: 'center' },
  
  headerSection: { marginBottom: 32, alignItems: 'center' },
  logoWrapper: { marginBottom: 16, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 24 },
  brandTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: '#1F2937', letterSpacing: -0.5 },
  
  card: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
  
  errorContainer: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  
  successContainer: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#86EFAC', alignItems: 'center' },
  successText: { color: '#059669', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  
  loaderContainer: { height: 54, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  
  primaryButton: { backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  loginLinkText: { fontSize: 14, color: '#6B7280' },
  loginLinkHighlight: { fontSize: 14, fontWeight: 'bold' },
  
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF' }
});