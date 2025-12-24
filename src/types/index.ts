export interface Profile {
  id: string;
  name: string;
  proxy: ProxySettings | null;
  extensions: string[];
  userAgent: string;
  status: 'stopped' | 'running';
  createdAt: Date;
  notes: string;
  icon?: string;
  color?: string;
  group?: string;
  antiTracking?: AntiTrackingSettings;
  fingerprint?: FingerprintSettings;
  autoLoadExtensions: boolean; // تشغيل الإضافات تلقائياً لهذا البروفايل
}

export interface ProxySettings {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
  username?: string;
  password?: string;
  speed?: number;
  status?: 'active' | 'failed' | 'testing';
  lastTested?: Date;
  expiresAt?: Date;
  dataUsed?: number;
  autoSwitch?: boolean;
}

export interface ProxyChain {
  id: string;
  name: string;
  proxies: ProxySettings[];
  enabled: boolean;
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  path: string;
}

export interface LicenseInfo {
  key: string;
  status: 'active' | 'expired' | 'invalid';
  expiresAt: Date | null;
  maxProfiles: number;
  type: 'trial' | 'basic' | 'pro' | 'enterprise';
}

export interface AppSettings {
  language: 'ar' | 'en';
  theme: 'dark' | 'light' | 'system';
  defaultUserAgent: string;
  chromiumPath: string;
  autoUpdate: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  customTheme?: CustomTheme;
  autoLoadExtensions: boolean; // تشغيل الإضافات تلقائياً عند فتح البروفايل
}

export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  cardColor: string;
  accentColor: string;
}

export interface SecuritySettings {
  appLockEnabled: boolean;
  passwordHash?: string;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
  fingerprintEnabled: boolean;
  dataEncryptionEnabled: boolean;
  intrusionDetectionEnabled: boolean;
  failedAttempts: number;
  lastFailedAttempt?: Date;
}

export interface BackupData {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  encrypted: boolean;
  profiles: Profile[];
  extensions: Extension[];
  settings: AppSettings;
}

export interface ActivityLog {
  id: string;
  type: 'profile_launch' | 'profile_stop' | 'extension_add' | 'settings_change' | 'login' | 'logout' | 'backup' | 'restore';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface GeneratedIdentity {
  name: string;
  email: string;
  phone: string;
  address: string;
  userAgent: string;
  country: string;
  city: string;
  zipCode: string;
}

export interface AntiTrackingSettings {
  canvasFingerprint: boolean;
  webglFingerprint: boolean;
  audioFingerprint: boolean;
  fontFingerprint: boolean;
  mouseMovementSimulation: boolean;
  timezoneSpoof: boolean;
  languageSpoof: boolean;
  screenResolutionSpoof: boolean;
  webrtcLeakPrevention: boolean;
  doNotTrack: boolean;
}

export interface FingerprintSettings {
  // Hardware
  gpu: string;
  gpuVendor: string;
  cpu: string;
  cpuCores: number;
  deviceMemory: number; // GB
  
  // Screen
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  
  // Locale
  timezone: string;
  language: string;
  languages: string[];
  
  // Platform
  platform: string;
  hardwareConcurrency: number;
  
  // WebGL
  webglVendor: string;
  webglRenderer: string;
  
  // Browser
  userAgent?: string;
  
  // Random
  randomize: boolean;
}

// Scheduling
export interface ProfileSchedule {
  id: string;
  profileId: string;
  enabled: boolean;
  type: 'once' | 'daily' | 'weekly' | 'custom';
  time: string; // HH:mm format
  days?: number[]; // 0-6 for weekly (Sunday = 0)
  date?: string; // YYYY-MM-DD for once
  duration?: number; // minutes to run before auto-stop
  lastRun?: Date;
  nextRun?: Date;
}

// Notifications
export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  category: 'proxy' | 'profile' | 'schedule' | 'security' | 'system';
}

// Usage Statistics
export interface UsageStats {
  profileId: string;
  date: string; // YYYY-MM-DD
  runTime: number; // minutes
  launchCount: number;
}

// Leak Test Result
export interface LeakTestResult {
  id: string;
  proxyChainId: string;
  timestamp: Date;
  ipLeak: boolean;
  dnsLeak: boolean;
  webrtcLeak: boolean;
  detectedIP: string;
  expectedIP?: string;
  dnsServers: string[];
}
