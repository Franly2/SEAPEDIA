import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from '@/store/authStore'; // Import Zustand Store
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  const router = useRouter();
  
  // Panggil action 'login' dari store
  const { login } = useAuthStore(); 

  const primaryColor = '#1976D2'; 

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleLogin() {
    if (!username || !password) {
      setErrorMessage('Username dan kata sandi harus diisi.');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch(`http://${api_address}:3000/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Selamat datang kembali!');
        
        // Simpan data ke memori HP menggunakan Zustand
        login(data.access_token, data.roles, data.username, data.fullName);

        // Beri jeda animasi 1,5 detik, lalu pindah ke Dasbor Utama
        setTimeout(() => {
          router.replace('/(tabs)'); 
        }, 1500);

      } else {
        setErrorMessage(data.message || 'Username atau password salah.');
      }
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <IconSymbol name="bag.fill" size={48} color={primaryColor} />
            </View>

            <ThemedText style={styles.brandTitle}>SELAMAT DATANG DI</ThemedText>
            <ThemedText style={styles.title}>SEAPEDIA</ThemedText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NAMA PENGGUNA (USERNAME)</ThemedText>
              <TextInput
                style={[styles.input, { borderBottomColor: primaryColor }]}
                onChangeText={setUsername}
                value={username}
                placeholder="Masukkan username"
                autoCapitalize="none"
                placeholderTextColor="#A0A0A0"
                editable={!successMessage}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>KATA SANDI</ThemedText>
              <TextInput
                style={[styles.input, { borderBottomColor: primaryColor }]}
                onChangeText={setPassword}
                value={password}
                placeholder="••••••••"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
                editable={!successMessage}
              />
            </View>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successContainer}>
                <ThemedText style={styles.successText}>{successMessage}</ThemedText>
                <ActivityIndicator size="small" color="#15803D" style={{ marginTop: 8 }} />
              </View>
            ) : null}

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            ) : (
              !successMessage && (
                <TouchableOpacity 
                  style={[styles.loginButton, { backgroundColor: primaryColor }]} 
                  onPress={handleLogin} 
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.loginButtonText}>Masuk</ThemedText>
                </TouchableOpacity>
              )
            )}

            <View style={styles.loginLinkContainer}>
              <ThemedText style={styles.loginLinkText}>Belum punya akun? </ThemedText>
              <TouchableOpacity onPress={() => router.replace('/register')}>
                <ThemedText style={[styles.loginLinkHighlight, { color: primaryColor }]}>Daftar di sini</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>© 2026 PT Karya Seapedia Nusantara</ThemedText>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 40 },
  headerSection: { marginBottom: 40 },
  logoWrapper: { marginBottom: 20, alignItems: 'flex-start' },
  brandTitle: { fontSize: 11, fontWeight: '700', color: '#636E72', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3436', letterSpacing: -0.5 },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#2D3436', marginBottom: 8, letterSpacing: 1 },
  input: { height: 45, borderBottomWidth: 2, borderColor: '#DFE6E9', paddingHorizontal: 4, fontSize: 16, color: '#2D3436' },
  errorContainer: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#FF7675' },
  errorText: { color: '#D63031', fontSize: 13, fontWeight: '600' },
  successContainer: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#22C55E', alignItems: 'center' },
  successText: { color: '#15803D', fontSize: 14, fontWeight: '700' },
  loginButton: { height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  loaderContainer: { height: 54, justifyContent: 'center', alignItems: 'center' },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginLinkText: { fontSize: 13, color: '#636E72' },
  loginLinkHighlight: { fontSize: 13, fontWeight: '700' },
  footer: { marginTop: 60, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#B2BEC3' }
});