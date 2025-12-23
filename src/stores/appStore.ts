import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Extension, LicenseInfo, AppSettings, ProxySettings, SecuritySettings, ActivityLog, BackupData, CustomTheme, ProxyChain, ProfileSchedule, AppNotification, UsageStats, LeakTestResult } from '@/types';

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
  
  // Schedules
  schedules: ProfileSchedule[];
  addSchedule: (schedule: ProfileSchedule) => void;
  updateSchedule: (id: string, updates: Partial<ProfileSchedule>) => void;
  deleteSchedule: (id: string) => void;
  
  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Usage Stats
  usageStats: UsageStats[];
  addUsageStat: (stat: UsageStats) => void;
  
  // Leak Test Results
  leakTestResults: LeakTestResult[];
  addLeakTestResult: (result: LeakTestResult) => void;
  
  // UI State
  activeView: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates' | 'proxy' | 'security' | 'backup' | 'dashboard' | 'schedule' | 'leakTest' | 'aiHub' | 'identity' | 'fingerprint' | 'autonomous' | 'thermal' | 'behavioral' | 'session' | 'dna' | 'captcha' | 'vision';
  setActiveView: (view: 'profiles' | 'extensions' | 'settings' | 'license' | 'updates' | 'proxy' | 'security' | 'backup' | 'dashboard' | 'schedule' | 'leakTest' | 'aiHub' | 'identity' | 'fingerprint' | 'autonomous' | 'thermal' | 'behavioral' | 'session' | 'dna' | 'captcha' | 'vision') => void;
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
      
      // Profiles - Start with demo profiles
      profiles: [
        {
          id: 'profile-1',
          name: 'Facebook Account',
          icon: '📘',
          color: '#1877F2',
          status: 'stopped',
          proxy: { type: 'socks5', host: '192.168.1.100', port: '1080', username: '', password: '' },
          extensions: [],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          notes: 'حساب فيسبوك للأعمال',
          fingerprint: {
            screenWidth: 1920,
            screenHeight: 1080,
            colorDepth: 24,
            pixelRatio: 1,
            platform: 'Win32',
            language: 'en-US',
            languages: ['en-US', 'en'],
            timezone: 'America/New_York',
            cpu: 'Intel Core i7-10700K',
            cpuCores: 8,
            gpu: 'NVIDIA GeForce RTX 3080',
            gpuVendor: 'NVIDIA Corporation',
            deviceMemory: 16,
            hardwareConcurrency: 8,
            webglVendor: 'NVIDIA Corporation',
            webglRenderer: 'NVIDIA GeForce RTX 3080/PCIe/SSE2',
            randomize: false,
          },
          createdAt: new Date(),
          autoLoadExtensions: true,
        },
        {
          id: 'profile-2',
          name: 'Instagram Business',
          icon: '📸',
          color: '#E4405F',
          status: 'running',
          proxy: { type: 'http', host: '10.0.0.50', port: '8080', username: 'user', password: 'pass' },
          extensions: [],
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          notes: 'حساب إنستاغرام للتسويق',
          fingerprint: {
            screenWidth: 2560,
            screenHeight: 1440,
            colorDepth: 24,
            pixelRatio: 2,
            platform: 'MacIntel',
            language: 'en-US',
            languages: ['en-US'],
            timezone: 'Europe/London',
            cpu: 'Apple M2 Pro',
            cpuCores: 10,
            gpu: 'Apple M2 Pro GPU',
            gpuVendor: 'Apple Inc.',
            deviceMemory: 32,
            hardwareConcurrency: 10,
            webglVendor: 'Apple Inc.',
            webglRenderer: 'Apple M2 Pro GPU',
            randomize: false,
          },
          createdAt: new Date(),
          autoLoadExtensions: true,
        },
        {
          id: 'profile-3',
          name: 'Twitter Marketing',
          icon: '🐦',
          color: '#1DA1F2',
          status: 'stopped',
          proxy: null,
          extensions: [],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          notes: 'حساب تويتر الرسمي',
          createdAt: new Date(),
          autoLoadExtensions: true,
        },
        {
          id: 'profile-4',
          name: 'Amazon Seller',
          icon: '🛒',
          color: '#FF9900',
          status: 'stopped',
          proxy: { type: 'socks5', host: '45.67.89.123', port: '9050', username: '', password: '' },
          extensions: [],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
          notes: 'حساب بائع أمازون',
          fingerprint: {
            screenWidth: 1920,
            screenHeight: 1080,
            colorDepth: 24,
            pixelRatio: 1,
            platform: 'Win32',
            language: 'de-DE',
            languages: ['de-DE', 'en'],
            timezone: 'Europe/Berlin',
            cpu: 'AMD Ryzen 9 5900X',
            cpuCores: 12,
            gpu: 'AMD Radeon RX 6800 XT',
            gpuVendor: 'AMD',
            deviceMemory: 32,
            hardwareConcurrency: 12,
            webglVendor: 'AMD',
            webglRenderer: 'AMD Radeon RX 6800 XT',
            randomize: false,
          },
          createdAt: new Date(),
          autoLoadExtensions: true,
        },
      ],
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
      
      // Schedules
      schedules: [],
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule],
      })),
      updateSchedule: (id, updates) => set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      })),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 100),
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Usage Stats
      usageStats: [],
      addUsageStat: (stat) => set((state) => ({
        usageStats: [...state.usageStats, stat].slice(-1000),
      })),
      
      // Leak Test Results
      leakTestResults: [],
      addLeakTestResult: (result) => set((state) => ({
        leakTestResults: [result, ...state.leakTestResults].slice(0, 100),
      })),
      
      // UI State
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'profile-manager-pro-storage',
    }
  )
);
