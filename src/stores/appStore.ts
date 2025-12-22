import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Extension, LicenseInfo, AppSettings, ProxySettings, SecuritySettings, ActivityLog, BackupData, CustomTheme, ProxyChain } from '@/types';

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
  
  // Proxies
  proxyChains: ProxyChain[];
  addProxyChain: (chain: ProxyChain) => void;
  updateProxyChain: (id: string, updates: Partial<ProxyChain>) => void;
  deleteProxyChain: (id: string) => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // Security
  security: SecuritySettings;
  updateSecurity: (updates: Partial<SecuritySettings>) => void;
  isLocked: boolean;
  setLocked: (locked: boolean) => void;
  
  // Activity Log
  activityLogs: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;
  clearActivityLogs: () => void;
  
  // Backups
  backups: BackupData[];
  addBackup: (backup: BackupData) => void;
  deleteBackup: (id: string) => void;
  
  // Custom Themes
  customThemes: CustomTheme[];
  addCustomTheme: (theme: CustomTheme) => void;
  updateCustomTheme: (id: string, updates: Partial<CustomTheme>) => void;
  deleteCustomTheme: (id: string) => void;
  
  // UI State
  activeView: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates' | 'proxy' | 'security' | 'backup';
  setActiveView: (view: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates' | 'proxy' | 'security' | 'backup') => void;
}

const defaultSettings: AppSettings = {
  language: 'ar',
  theme: 'dark',
  defaultUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  chromiumPath: '',
  autoUpdate: true,
  startMinimized: false,
  closeToTray: true,
  fontSize: 'medium',
  autoLoadExtensions: true,
};

const defaultSecurity: SecuritySettings = {
  appLockEnabled: false,
  autoLockEnabled: false,
  autoLockTimeout: 5,
  fingerprintEnabled: false,
  dataEncryptionEnabled: false,
  intrusionDetectionEnabled: false,
  failedAttempts: 0,
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
      
      // Proxies
      proxyChains: [],
      addProxyChain: (chain) => set((state) => ({
        proxyChains: [...state.proxyChains, chain],
      })),
      updateProxyChain: (id, updates) => set((state) => ({
        proxyChains: state.proxyChains.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      deleteProxyChain: (id) => set((state) => ({
        proxyChains: state.proxyChains.filter((c) => c.id !== id),
      })),
      
      // Settings
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      
      // Security
      security: defaultSecurity,
      updateSecurity: (updates) => set((state) => ({
        security: { ...state.security, ...updates },
      })),
      isLocked: false,
      setLocked: (locked) => set({ isLocked: locked }),
      
      // Activity Log
      activityLogs: [],
      addActivityLog: (log) => set((state) => ({
        activityLogs: [log, ...state.activityLogs].slice(0, 1000), // Keep last 1000 logs
      })),
      clearActivityLogs: () => set({ activityLogs: [] }),
      
      // Backups
      backups: [],
      addBackup: (backup) => set((state) => ({
        backups: [...state.backups, backup],
      })),
      deleteBackup: (id) => set((state) => ({
        backups: state.backups.filter((b) => b.id !== id),
      })),
      
      // Custom Themes
      customThemes: [],
      addCustomTheme: (theme) => set((state) => ({
        customThemes: [...state.customThemes, theme],
      })),
      updateCustomTheme: (id, updates) => set((state) => ({
        customThemes: state.customThemes.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
      deleteCustomTheme: (id) => set((state) => ({
        customThemes: state.customThemes.filter((t) => t.id !== id),
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
