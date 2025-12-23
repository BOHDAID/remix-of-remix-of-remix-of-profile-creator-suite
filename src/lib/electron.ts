// Type definitions for Electron API
// Updated to support fingerprint settings and session capture

import { FingerprintSettings } from '@/types';

// Session capture types
export interface CapturedSession {
  id: string;
  profileId: string;
  domain: string;
  siteName: string;
  url: string;
  cookies: SessionCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  tokens: SessionToken[];
  capturedAt: string;
  status: string;
}

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  secure: boolean;
  httpOnly: boolean;
}

export interface SessionToken {
  type: string;
  name: string;
  value: string;
  maskedValue: string;
  source: string;
}

export interface SessionCaptureResult {
  success: boolean;
  session?: CapturedSession;
  error?: string;
}

export interface GetSessionsResult {
  success: boolean;
  sessions: CapturedSession[];
  error?: string;
}

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
  stopProfile: (profileId: string) => Promise<StopResult>;
  onProfileClosed: (callback: (profileId: string) => void) => void;
  
  // Browser window management
  tileProfileWindows: (layout: 'grid' | 'horizontal' | 'vertical') => Promise<TileResult>;
  minimizeAllProfiles: () => Promise<void>;
  restoreAllProfiles: () => Promise<void>;
  focusProfile: (profileId: string) => Promise<void>;
  getRunningProfiles: () => Promise<string[]>;
  
  // Utilities
  getAppPaths: () => Promise<AppPaths>;
  openFolder: (folderPath: string) => Promise<boolean>;
  extractExtensionZip: (zipPath: string) => Promise<ExtractResult>;
  
  // Auto-updater
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  installUpdate: () => Promise<void>;
  checkForUpdates: () => Promise<CheckUpdateResult>;
  
  // Session Capture API
  captureProfileSession: (profileId: string, url?: string) => Promise<SessionCaptureResult>;
  getCapturedSessions: () => Promise<GetSessionsResult>;
  deleteCapturedSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAllSessions: () => Promise<{ success: boolean; error?: string }>;
  captureUrlCookies: (profileId: string, url: string) => Promise<{ success: boolean; cookies: SessionCookie[]; error?: string }>;
  injectSession: (profileId: string, sessionData: CapturedSession) => Promise<{ success: boolean; error?: string }>;
  onSessionCaptured: (callback: (session: CapturedSession) => void) => void;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

export interface TileResult {
  success: boolean;
  error?: string;
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
  fingerprint?: FingerprintSettings;
}

export interface LaunchResult {
  success: boolean;
  pid?: number;
  error?: string;
}

export interface StopResult {
  success: boolean;
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

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface CheckUpdateResult {
  success: boolean;
  updateInfo?: UpdateInfo;
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

// Get Electron API
export const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

// Web fallback functions
export const webFallback = {
  showNotSupported: () => {
    console.warn('This feature requires the desktop app');
    return null;
  }
};

// Generate session injection script
export function generateSessionInjectionScript(session: CapturedSession): string {
  const cookieScript = session.cookies.map(c => 
    `document.cookie = "${c.name}=${c.value}; domain=${c.domain}; path=${c.path || '/'}${c.secure ? '; secure' : ''}";`
  ).join('\n');
  
  const localStorageScript = Object.entries(session.localStorage || {}).map(([k, v]) =>
    `localStorage.setItem("${k}", ${JSON.stringify(v)});`
  ).join('\n');
  
  return `// Session Injection Script for ${session.siteName}
// Domain: ${session.domain}
// Captured: ${session.capturedAt}

(function() {
  // Inject cookies
  ${cookieScript || '// No cookies'}
  
  // Inject localStorage
  ${localStorageScript || '// No localStorage'}
  
  console.log('[Session Injected] ${session.siteName} - ${session.cookies.length} cookies, ${Object.keys(session.localStorage || {}).length} localStorage items');
})();`;
}