import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const api_address = process.env.EXPO_PUBLIC_API_IP_ADDRESS;
  const router = useRouter();
  const { login } = useAuthStore(); 

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [pendingRoleData, setPendingRoleData] = useState<any>(null);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
  };

  async function handleLogin() {
    if (!username || !password) {
      setErrorMessage('Username dan kata sandi harus diisi.');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${api_address}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.roles && data.roles.length > 1) {
          setPendingRoleData(data);
        } else {
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

  async function handleRoleSelection(selectedRole: string) {
    setIsSwitchingRole(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${api_address}/auth/switch-role`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingRoleData.access_token}` 
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const newData = await response.json();

      if (response.ok) {
        executeFinalLogin(newData, selectedRole);
      } else {
        setErrorMessage(newData.message || 'Gagal mengubah peran aktif.');
      }
    } catch (error) {
      setErrorMessage('Gagal terhubung ke server saat memilih peran.');
    } finally {
      setIsSwitchingRole(false);
    }
  }

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

  if (pendingRoleData) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Feather name="users" size={64} color={Colors.primary} />
            <Text style={[styles.title, { marginTop: 24, textAlign: 'center' }]}>Pilih Peran</Text>
            <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
              Akun ini memiliki beberapa peran aktif. Silakan pilih peran yang ingin kamu gunakan di sesi ini.
            </Text>

            {errorMessage ? (
              <View style={[styles.errorContainer, { width: '100%' }]}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isSwitchingRole ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              pendingRoleData.roles.map((role: string) => (
                <TouchableOpacity 
                  key={role}
                  style={[styles.primaryButton, { width: '100%', marginBottom: 12 }]} 
                  onPress={() => handleRoleSelection(role)} 
                  activeOpacity={0.8}
                  disabled={successMessage !== ''}
                >
                  <Text style={styles.primaryButtonText}>Masuk sebagai {role}</Text>
                </TouchableOpacity>
              ))
            )}

            {successMessage ? (
              <View style={[styles.successContainer, { width: '100%', marginTop: 20 }]}>
                <Text style={styles.successText}>{successMessage}</Text>
                <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.logoWrapper}>
            <Feather name="shopping-bag" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.brandTitle}>SELAMAT DATANG DI</Text>
          <Text style={styles.title}>SEAPEDIA</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Pengguna (Username)</Text>
            <TextInput
              style={styles.input}
              onChangeText={setUsername}
              value={username}
              placeholder="Masukkan username"
              autoCapitalize="none"
              placeholderTextColor={Colors.textMuted}
              editable={!successMessage && !isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor={Colors.textMuted}
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
              <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            !successMessage && (
              <View>
                <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Masuk</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.outlineButton} onPress={handleGuestAccess} activeOpacity={0.7}>
                  <Text style={styles.outlineButtonText}>Lanjutkan sebagai Tamu</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.replace('/register')}>
              <Text style={[styles.loginLinkHighlight, { color: Colors.primary }]}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Seapedia</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 60, paddingBottom: 40, width: '100%', maxWidth: 500, alignSelf: 'center', flexGrow: 1, justifyContent: 'center' },
  
  headerSection: { marginBottom: 32, alignItems: 'center' },
  logoWrapper: { marginBottom: 16, backgroundColor: Colors.primaryLight, padding: 16, borderRadius: 24 },
  brandTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.secondary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  
  card: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, elevation: 4, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.secondary },
  
  errorContainer: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  
  successContainer: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#86EFAC', alignItems: 'center' },
  successText: { color: '#059669', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  
  loaderContainer: { height: 54, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  
  primaryButton: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, marginTop: 8 },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '900' },
  
  outlineButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.surface, marginTop: 12 },
  outlineButtonText: { color: Colors.textMuted, fontSize: 15, fontWeight: '700' },
  
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  loginLinkText: { fontSize: 14, color: Colors.textMuted },
  loginLinkHighlight: { fontSize: 14, fontWeight: '800' },
  
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: Colors.textMuted }
});