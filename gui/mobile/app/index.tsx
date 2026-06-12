// Lokasi file: app/index.tsx
import { useAuthStore } from '@/store/authStore';
import { Redirect } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { token, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />; 
  }

  return <Redirect href="/login" />;
}