import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from "@/components/ui/icon-symbol";
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

export default function RegisterScreen() {
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  const router = useRouter();

  const primaryColor = '#1976D2'; 

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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <IconSymbol name="bag.fill" size={48} color={primaryColor} />
            </View>

            <ThemedText style={styles.brandTitle}>BERGABUNG SEKARANG</ThemedText>
            <ThemedText style={styles.title}>SEAPEDIA</ThemedText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NAMA LENGKAP</ThemedText>
              <TextInput
                style={[styles.input, { borderBottomColor: primaryColor }]}
                onChangeText={setFullName}
                value={fullName}
                placeholder="Misal: Budi Santoso"
                placeholderTextColor="#A0A0A0"
                editable={!successMessage}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NAMA PENGGUNA (USERNAME)</ThemedText>
              <TextInput
                style={[styles.input, { borderBottomColor: primaryColor }]}
                onChangeText={setUsername}
                value={username}
                placeholder="budi_pembeli"
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
                placeholder="Minimal 6 karakter"
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
                <ThemedText style={{fontSize: 12, color: '#15803D', marginTop: 4}}>Mengalihkan ke halaman login...</ThemedText>
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
                  onPress={handleRegister} 
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.loginButtonText}>Daftar</ThemedText>
                </TouchableOpacity>
              )
            )}

            <View style={styles.loginLinkContainer}>
              <ThemedText style={styles.loginLinkText}>Sudah punya akun? </ThemedText>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <ThemedText style={[styles.loginLinkHighlight, { color: primaryColor }]}>Masuk di sini</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>© 2026 Seapedia</ThemedText>
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
  
  logoWrapper: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },

  brandTitle: { fontSize: 11, fontWeight: '700', color: '#636E72', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3436', letterSpacing: -0.5 },
  
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#2D3436', marginBottom: 8, letterSpacing: 1 },
  input: { height: 45, borderBottomWidth: 2, borderColor: '#DFE6E9', paddingHorizontal: 4, fontSize: 16, color: '#2D3436' },
  
  errorContainer: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#FF7675' },
  errorText: { color: '#D63031', fontSize: 13, fontWeight: '600' },
  
  successContainer: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 8, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#22C55E' },
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