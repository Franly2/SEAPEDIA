import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  roles: string[];
  activeRole: string | null; // <-- Properti baru untuk sesi saat ini
  username: string | null;
  fullName: string | null;
  isLoading: boolean;
  
  login: (token: string, roles: string[], activeRole: string, username: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
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
      ['userActiveRole', activeRole], // Simpan peran aktif ke memori
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
}));