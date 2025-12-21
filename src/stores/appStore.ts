import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Extension, LicenseInfo, AppSettings, ProxySettings } from '@/types';

interface AppState {
  // License
  license: LicenseInfo | null;
  setLicense: (license: LicenseInfo | null) => void;
  
  // Profiles
  profiles: Profile[];
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  
  // Extensions
  extensions: Extension[];
  addExtension: (extension: Extension) => void;
  updateExtension: (id: string, updates: Partial<Extension>) => void;
  deleteExtension: (id: string) => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // UI State
  activeView: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates';
  setActiveView: (view: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates') => void;
}

const defaultSettings: AppSettings = {
  language: 'ar',
  theme: 'dark',
  defaultUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  chromiumPath: '',
  autoUpdate: true,
  startMinimized: false,
  closeToTray: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // License
      license: null,
      setLicense: (license) => set({ license }),
      
      // Profiles
      profiles: [],
      addProfile: (profile) => set((state) => ({ 
        profiles: [...state.profiles, profile] 
      })),
      updateProfile: (id, updates) => set((state) => ({
        profiles: state.profiles.map((p) => 
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
      deleteProfile: (id) => set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
      })),
      
      // Extensions
      extensions: [],
      addExtension: (extension) => set((state) => ({
        extensions: [...state.extensions, extension],
      })),
      updateExtension: (id, updates) => set((state) => ({
        extensions: state.extensions.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),
      deleteExtension: (id) => set((state) => ({
        extensions: state.extensions.filter((e) => e.id !== id),
      })),
      
      // Settings
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      
      // UI State
      activeView: 'profiles',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'browser-manager-storage',
    }
  )
);
