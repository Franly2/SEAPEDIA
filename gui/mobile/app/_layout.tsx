import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments(); 
  
  const { token, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  useEffect(() => { 
    checkAuth(); 
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthLoading) return;

    // 1. Daftar segmen halaman yang WAJIB LOGIN (Ruang Privat)
    const privatePages = ['orders', 'profile', 'checkout', 'dashboard'];
    
    // 2. Cek apakah pengguna sedang berada di salah satu halaman privat tersebut
    // Jika di Beranda, segments = ['(tabs)', 'index'] -> bernilai FALSE (Boleh diakses Guest)
    // Jika di Pesanan, segments = ['(tabs)', 'orders'] -> bernilai TRUE (Akan dicegat)
    const isProtectedRoute = segments.some(segment => privatePages.includes(segment));
    
    const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    
    const isAuthRoute = cleanPath === '/login' || cleanPath === '/register';

    if (!token && isProtectedRoute) {
      // Jika Guest mencoba buka Pesanan/Profil, tendang ke Login
      router.replace('/login');
    } 
    else if (token && isAuthRoute) {
      // Jika sudah Login tapi iseng buka halaman Login lagi, kembalikan ke Beranda
      router.replace('/(tabs)');
    }
  }, [token, isAuthLoading, segments, pathname, router]); 

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