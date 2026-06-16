import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments(); 
  
  const { token, activeRole, isLoading: isAuthLoading, checkAuth } = useAuthStore();

  useEffect(() => { 
    checkAuth(); 
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthLoading) return;

    // === A. GUARD CLAUSE: STATUS LOGIN (GUEST VS USER) ===
    const privatePages = ['orders', 'profile', 'checkout', 'dashboard', 'seller', 'add-product', 'edit-product', 'buyer'];
    const isProtectedRoute = segments.some(segment => privatePages.includes(segment));
    
    const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    const isAuthRoute = cleanPath === '/login' || cleanPath === '/register';

    if (!token && isProtectedRoute) {
      router.replace('/login');
      return;
    } 
    else if (token && isAuthRoute) {
      router.replace('/(tabs)');
      return;
    }

    // === B. GUARD CLAUSE: ROLE-BASED ACCESS CONTROL (RBAC) ===
    if (token && activeRole) {
      
      // Aturan ketat untuk SELLER
      if (activeRole === 'SELLER') {
        // PERUBAHAN: Hapus 'orders' dari sini
        const sellerForbidden = ['index', 'cart', 'checkout', 'buyer'];
        
        const isForbiddenForSeller = segments.some(segment => sellerForbidden.includes(segment)) || pathname === '/';
        
        if (isForbiddenForSeller) {
          router.replace('/seller');
          return;
        }
      } 
      
      // Aturan ketat untuk BUYER / DRIVER
      else if (activeRole === 'BUYER' || activeRole === 'DRIVER') {
        const buyerForbidden = ['seller', 'add-product', 'edit-product'];
        const isForbiddenForBuyer = segments.some(segment => buyerForbidden.includes(segment));
        
        if (isForbiddenForBuyer) {
          router.replace('/(tabs)');
          return;
        }
      }
    }

  }, [token, activeRole, isAuthLoading, segments, pathname, router]);

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
        <Stack.Screen name="seller" options={{ headerShown: false }} /> 
      </Stack>
    </>
  );
}