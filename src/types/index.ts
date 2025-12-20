export interface Profile {
  id: string;
  name: string;
  proxy: ProxySettings | null;
  extensions: string[];
  userAgent: string;
  status: 'stopped' | 'running';
  createdAt: Date;
  notes: string;
}

export interface ProxySettings {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
  username?: string;
  password?: string;
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
  theme: 'dark' | 'light';
  defaultUserAgent: string;
  chromiumPath: string;
  autoUpdate: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
}
