import { useAuthStore } from '@/store/authStore';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { fullName, username, roles } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beranda SEAPEDIA</Text>
      
      <View style={styles.card}>
        <Text style={styles.text}>Halo, <Text style={styles.bold}>{fullName}</Text>!</Text>
        <Text style={styles.text}>Username: {username}</Text>
        <Text style={styles.text}>Status Role: {JSON.stringify(roles)}</Text>
      </View>

      <Text style={styles.subtitle}>Katalog produk akan muncul di sini nanti.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    marginBottom: 20,
    elevation: 2, 
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  }
});