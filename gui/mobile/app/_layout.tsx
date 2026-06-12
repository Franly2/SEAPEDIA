import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  
  // 1. Ambil segments untuk mendeteksi struktur folder internal
  const segments = useSegments(); 
  
  const { token, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  useEffect(() => { 
    checkAuth(); 
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthLoading) return;

    // 2. Cek apakah array segments mengandung folder '(tabs)'
    // Jika user membuka /orders, segments nilainya adalah ['(tabs)', 'orders']
    const isProtectedRoute = segments.includes('(tabs)');
    
    const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    const isAuthRoute = cleanPath === '/' || cleanPath === '/login' || cleanPath === '/register';

    if (!token && isProtectedRoute) {
      router.replace('/login');
    } 
    else if (token && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [token, isAuthLoading, segments, pathname, router]); // Tambahkan segments ke dependency

  if (isAuthLoading) {
    return null; 
  }

  return (
    <>
      <Head>
        <title>Seapedia</title>
        <meta name="description" content="Aplikasi Marketplace Logistik Cerdas" />
        <meta name="dicoding:email" content="franlybudipramana588@gmail.com" />
      </Head>
      
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" /> 
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" /> 
      </Stack>
    </>
  );
}