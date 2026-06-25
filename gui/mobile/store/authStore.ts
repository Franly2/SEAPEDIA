import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  roles: string[];
  activeRole: string | null; 
  username: string | null;
  fullName: string | null;
  isLoading: boolean;
  
  login: (token: string, roles: string[], activeRole: string, username: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // 1. Tambahkan deklarasi fungsi di interface
  updateActiveRole: (newRole: string, newToken?: string) => Promise<void>; 
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  roles: [],
  activeRole: null,
  username: null,
  fullName: null,
  isLoading: true,

  login: async (token, roles, activeRole, username, fullName) => {
    await AsyncStorage.multiSet([
      ['userToken', token],
      ['userRoles', JSON.stringify(roles)],
      ['userActiveRole', activeRole], 
      ['userName', username],
      ['userFullName', fullName],
    ]);
    set({ token, roles, activeRole, username, fullName });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRoles', 'userActiveRole', 'userName', 'userFullName']);
    set({ token: null, roles: [], activeRole: null, username: null, fullName: null });
  },

  checkAuth: async () => {
    try {
      const [token, rolesString, activeRole, username, fullName] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRoles'),
        AsyncStorage.getItem('userActiveRole'), 
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('userFullName'),
      ]);

      const roles = rolesString ? JSON.parse(rolesString) : [];

      set({ token, roles, activeRole, username, fullName, isLoading: false });
    } catch (error) {
      console.error('Gagal memuat sesi auth:', error);
      set({ isLoading: false });
    }
  },

  // 2. Implementasi fungsi pembaruan peran dan token
  updateActiveRole: async (newRole, newToken) => {
    // Siapkan array data yang akan diperbarui di penyimpanan HP
    const updates: [string, string][] = [['userActiveRole', newRole]];
    
    // Jika ada token baru dari backend, ikut perbarui juga
    if (newToken) {
      updates.push(['userToken', newToken]);
    }
    
    // Simpan perubahan ke memori HP (agar awet saat aplikasi ditutup)
    await AsyncStorage.multiSet(updates);
    
    // Perbarui state Zustand secara real-time agar UI langsung berubah
    set((state) => ({
      activeRole: newRole,
      token: newToken ? newToken : state.token
    }));
  }
}));