import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Tambahkan 'token' dari useAuthStore untuk mengecek status login
  const { activeRole, token } = useAuthStore(); 
  
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
      
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Beranda',
          href: activeRole === 'SELLER' ? null : undefined,
          tabBarItemStyle: activeRole === 'SELLER' ? { display: 'none' } : undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="seller"
        options={{
          title: 'Toko Saya',
          href: activeRole === 'SELLER' ? undefined : null, 
          tabBarItemStyle: activeRole === 'SELLER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Keranjang',
          href: activeRole === 'BUYER' ? undefined : null,
          tabBarItemStyle: activeRole === 'BUYER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          href: (activeRole === 'BUYER' || activeRole === 'SELLER') ? undefined : null,
          tabBarItemStyle: (activeRole === 'BUYER' || activeRole === 'SELLER') ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="driver"
        options={{
          title: 'Driver',
          href: activeRole === 'DRIVER' ? undefined : null,
          tabBarItemStyle: activeRole === 'DRIVER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="car.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: activeRole === 'ADMIN' ? undefined : null,
          tabBarItemStyle: activeRole === 'ADMIN' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          // Ubah title dinamis berdasarkan status token
          title: token ? 'Profil' : 'Login',
          href: undefined, 
          tabBarItemStyle: undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}