import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { activeRole, token } = useAuthStore(); 
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 65, 
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: Colors.secondary, 
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        }
      }}>
      
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Beranda',
          href: (activeRole === 'SELLER' || activeRole === 'DRIVER') ? null : undefined,
          tabBarItemStyle: (activeRole === 'SELLER' || activeRole === 'DRIVER') ? { display: 'none' } : undefined,
          tabBarIcon: ({ color }) => <Feather size={22} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="seller"
        options={{
          title: 'Toko Saya',
          href: activeRole === 'SELLER' ? undefined : null, 
          tabBarItemStyle: activeRole === 'SELLER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <Feather size={22} name="briefcase" color={color} />,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Keranjang',
          href: activeRole === 'BUYER' ? undefined : null,
          tabBarItemStyle: activeRole === 'BUYER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <Feather size={22} name="shopping-cart" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          href: (activeRole === 'BUYER' || activeRole === 'SELLER') ? undefined : null,
          tabBarItemStyle: (activeRole === 'BUYER' || activeRole === 'SELLER') ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <Feather size={22} name="shopping-bag" color={color} />,
        }}
      />

      <Tabs.Screen
        name="driver"
        options={{
          title: 'Driver',
          href: activeRole === 'DRIVER' ? undefined : null,
          tabBarItemStyle: activeRole === 'DRIVER' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <Feather size={22} name="truck" color={color} />,
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: activeRole === 'ADMIN' ? undefined : null,
          tabBarItemStyle: activeRole === 'ADMIN' ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => <Feather size={22} name="bar-chart-2" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: token ? 'Profil' : 'Login',
          href: undefined, 
          tabBarItemStyle: undefined,
          tabBarIcon: ({ color }) => <Feather size={22} name="user" color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (!token) {
              e.preventDefault();
              router.push('/login');
            }
          },
        }}
      />
    </Tabs>
  );
}