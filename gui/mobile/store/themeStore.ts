  import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DEFAULT_THEME } from '../constants/theme';

  interface ThemeState {
    colors: typeof DEFAULT_THEME.colors;
    logoUrl: string | null;
    isThemeLoading: boolean;

    setBranding: (branding: { 
      colorPrimary?: string | null; 
      colorSecondary?: string | null; 
      colorTertiary?: string | null; 
      logoUrl?: string | null 
    }) => Promise<void>;
    resetTheme: () => Promise<void>;
    loadTheme: () => Promise<void>;
  }

  export const useThemeStore = create<ThemeState>((set) => ({
    colors: DEFAULT_THEME.colors,
    logoUrl: DEFAULT_THEME.logoUrl,
    isThemeLoading: true,

    setBranding: async (branding) => {
      const newColors = {
        primary: branding.colorPrimary || DEFAULT_THEME.colors.primary,
        secondary: branding.colorSecondary || DEFAULT_THEME.colors.secondary,
        tertiary: branding.colorTertiary || DEFAULT_THEME.colors.tertiary,
        background: DEFAULT_THEME.colors.background,
        text: DEFAULT_THEME.colors.text,     
      };
      const newLogoUrl = branding.logoUrl || null;

      await AsyncStorage.setItem('tenantColors', JSON.stringify(newColors));
      if (newLogoUrl) {
        await AsyncStorage.setItem('tenantLogo', newLogoUrl);
      } else {
        await AsyncStorage.removeItem('tenantLogo'); 
      }

      set({ colors: newColors, logoUrl: newLogoUrl });
    },

    resetTheme: async () => {
      await AsyncStorage.multiRemove(['tenantColors', 'tenantLogo']);
      set({ colors: DEFAULT_THEME.colors, logoUrl: DEFAULT_THEME.logoUrl });
    },

    loadTheme: async () => {
      try {
        const storedColors = await AsyncStorage.getItem('tenantColors');
        const storedLogo = await AsyncStorage.getItem('tenantLogo');

        if (storedColors) {
          set({ 
            colors: JSON.parse(storedColors), 
            logoUrl: storedLogo, 
            isThemeLoading: false 
          });
        } else {
          set({ isThemeLoading: false });
        }
      } catch (error) {
        set({ isThemeLoading: false });
      }
    },
  }));