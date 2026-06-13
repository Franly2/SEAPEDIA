import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthStore } from '@/store/authStore';
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
  const { login } = useAuthStore(); 

  const primaryColor = '#1976D2'; 

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State untuk menahan data jika user harus memilih role
  const [pendingRoleData, setPendingRoleData] = useState<any>(null);

  async function handleLogin() {
    if (!username || !password) {
      setErrorMessage('Username dan kata sandi harus diisi.');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`http://${api_address}:3000/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Cek jumlah role
        if (data.roles && data.roles.length > 1) {
          // Tahan! Minta user memilih active role terlebih dahulu
          setPendingRoleData(data);
        } else {
          // Hanya punya 1 role (atau tidak ada role, set fallback ke BUYER)
          const defaultRole = data.roles?.[0] || 'BUYER';
          executeFinalLogin(data, defaultRole);
        }
      } else {
        setErrorMessage(data.message || 'Username atau password salah.');
      }
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  }

  // Fungsi untuk mengeksekusi login final setelah peran dipilih/ditentukan
  function executeFinalLogin(data: any, selectedRole: string) {
    setSuccessMessage(`Masuk sebagai ${selectedRole}`);
    login(data.access_token, data.roles, selectedRole, data.username, data.fullName);

    setTimeout(() => {
      router.replace('/(tabs)'); 
    }, 1500);
  }

  function handleGuestAccess() {
    router.replace('/(tabs)');
  }

  // --- KOMPONEN PEMILIHAN PERAN (ACTIVE ROLE) ---
  if (pendingRoleData) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.scrollContainer, { alignItems: 'center' }]}>
          <IconSymbol name="person.2.fill" size={64} color={primaryColor} />
          <ThemedText style={[styles.title, { marginTop: 24, textAlign: 'center' }]}>Pilih Peran</ThemedText>
          <ThemedText style={[styles.loginLinkText, { textAlign: 'center', marginBottom: 32 }]}>
            Akun ini memiliki beberapa peran aktif. Silakan pilih peran yang ingin kamu gunakan di sesi ini.
          </ThemedText>

          {pendingRoleData.roles.map((role: string) => (
            <TouchableOpacity 
              key={role}
              style={[styles.loginButton, { backgroundColor: primaryColor, width: '100%', marginBottom: 12 }]} 
              onPress={() => executeFinalLogin(pendingRoleData, role)} 
              activeOpacity={0.8}
            >
              <ThemedText style={styles.loginButtonText}>Masuk sebagai {role}</ThemedText>
            </TouchableOpacity>
          ))}

          {successMessage ? (
            <View style={[styles.successContainer, { width: '100%', marginTop: 20 }]}>
              <ThemedText style={styles.successText}>{successMessage}</ThemedText>
              <ActivityIndicator size="small" color="#15803D" style={{ marginTop: 8 }} />
            </View>
          ) : null}
        </View>
      </ThemedView>
    );
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
                editable={!successMessage && !isLoading}
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
                editable={!successMessage && !isLoading}
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
                <View>
                  <TouchableOpacity style={[styles.loginButton, { backgroundColor: primaryColor }]} onPress={handleLogin} activeOpacity={0.8}>
                    <ThemedText style={styles.loginButtonText}>Masuk</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.guestButton} onPress={handleGuestAccess} activeOpacity={0.7}>
                    <ThemedText style={styles.guestButtonText}>Lanjutkan sebagai Tamu</ThemedText>
                  </TouchableOpacity>
                </View>
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
  successText: { color: '#15803D', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  loginButton: { height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  guestButton: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#DFE6E9', backgroundColor: 'transparent' },
  guestButtonText: { color: '#636E72', fontSize: 14, fontWeight: '600' },
  loaderContainer: { height: 54, justifyContent: 'center', alignItems: 'center' },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginLinkText: { fontSize: 13, color: '#636E72' },
  loginLinkHighlight: { fontSize: 13, fontWeight: '700' },
  footer: { marginTop: 60, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#B2BEC3' }
});