import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  roles: string[]; // Berubah menjadi array untuk multi-role
  username: string | null;
  fullName: string | null; // Tambahan data dari backend
  isLoading: boolean;
  
  login: (token: string, roles: string[], username: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  roles: [],
  username: null,
  fullName: null,
  isLoading: true, // Menahan perpindahan layar sampai cek token selesai

  login: async (token, roles, username, fullName) => {
    await AsyncStorage.multiSet([
      ['userToken', token],
      ['userRoles', JSON.stringify(roles)], // Array diubah ke string agar bisa disimpan
      ['userName', username],
      ['userFullName', fullName],
    ]);
    set({ token, roles, username, fullName });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRoles', 'userName', 'userFullName']);
    set({ token: null, roles: [], username: null, fullName: null });
  },

  checkAuth: async () => {
    try {
      const [token, rolesString, username, fullName] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRoles'),
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('userFullName'),
      ]);

      // Parse string JSON kembali menjadi array. Jika kosong, berikan array kosong []
      const roles = rolesString ? JSON.parse(rolesString) : [];

      set({ token, roles, username, fullName, isLoading: false });
    } catch (error) {
      console.error('Gagal memuat sesi auth:', error);
      set({ isLoading: false });
    }
  },
}));