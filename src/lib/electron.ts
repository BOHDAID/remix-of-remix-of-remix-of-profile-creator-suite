// Type definitions for Electron API
export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // File dialogs
  selectExtensionFolder: () => Promise<string | null>;
  selectExtensionZip: () => Promise<string | null>;
  selectChromiumPath: () => Promise<string | null>;
  
  // Profile management
  launchProfile: (profileData: LaunchProfileData) => Promise<LaunchResult>;
  
  // Utilities
  getAppPaths: () => Promise<AppPaths>;
  openFolder: (folderPath: string) => Promise<boolean>;
  extractExtensionZip: (zipPath: string) => Promise<ExtractResult>;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

export interface LaunchProfileData {
  chromiumPath: string;
  proxy: {
    type: string;
    host: string;
    port: string;
  } | null;
  extensions: string[];
  userAgent: string;
  profileId: string;
}

export interface LaunchResult {
  success: boolean;
  pid?: number;
  error?: string;
}

export interface AppPaths {
  userData: string;
  extensions: string;
  profiles: string;
}

export interface ExtractResult {
  success: boolean;
  path?: string;
  error?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
};

// Get Electron API with fallbacks for web
export const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return window.electronAPI!;
  }
  return null;
};

// Web fallback functions
export const webFallback = {
  showNotSupported: () => {
    console.warn('This feature requires the desktop app');
    return null;
  }
};
