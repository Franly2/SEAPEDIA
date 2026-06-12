import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { fullName, username, roles, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    const executeLogout = async () => {
      await logout(); 
      router.replace('/login'); 
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Apakah kamu yakin ingin keluar dari SEAPEDIA?");
      if (confirmed) {
        await executeLogout();
      }
    } 
    // Jika dibuka di perangkat mobile (Android / iOS)
    else {
      Alert.alert(
        "Keluar Akun",
        "Apakah kamu yakin ingin keluar dari SEAPEDIA?",
        [
          {
            text: "Batal",
            style: "cancel"
          },
          { 
            text: "Keluar", 
            style: "destructive",
            onPress: executeLogout
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Profil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <IconSymbol name="person.fill" size={40} color="#FFF" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.username}>@{username}</Text>
        </View>
      </View>

      {/* Menu Area */}
      <View style={styles.menuContainer}>
        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={20} color="#D63031" />
          <Text style={styles.logoutText}>Keluar Akun</Text>
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
    padding: 24,
    paddingTop: 60, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#E0F2FE',
  },
  menuContainer: {
    padding: 20,
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF7675',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D63031',
  }
});