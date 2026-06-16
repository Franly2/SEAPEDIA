import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { activeRole } = useAuthStore(); 
  
  const primaryColor = '#1976D2';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          elevation: 5, 
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        }
      }}>
      
      {/* 1. Tab Beranda */}
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Beranda',
          href: activeRole === 'SELLER' ? null : '/', 
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* 2. Tab Penjual */}
      <Tabs.Screen
        name="seller"
        options={{
          title: 'Toko Saya',
          href: activeRole === 'SELLER' ? '/seller' : null, 
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
        }}
      />
      
      {/* 3. Tab Pesanan (PERUBAHAN: Sekarang Selalu Muncul) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          href: '/orders', // <-- Ubah menjadi rute statis agar selalu tampil
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
        }}
      />

      {/* 4. Tab Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          href: '/profile', 
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}