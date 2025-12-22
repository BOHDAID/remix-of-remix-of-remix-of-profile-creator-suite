// Advanced Security Types

export interface SelfDestructConfig {
  enabled: boolean;
  profileId: string;
  triggerType: 'time' | 'launches' | 'date';
  triggerValue: number | string; // hours/launches count or ISO date
  deleteData: boolean;
  deleteCookies: boolean;
  deleteHistory: boolean;
  notifyBefore: boolean;
  notifyMinutes: number;
}

export interface PanicButtonConfig {
  enabled: boolean;
  hotkey: string;
  actions: PanicAction[];
  confirmRequired: boolean;
  sound: boolean;
}

export type PanicAction = 
  | 'close_all_profiles'
  | 'delete_all_profiles'
  | 'clear_history'
  | 'clear_cookies'
  | 'wipe_extensions'
  | 'factory_reset'
  | 'lock_app'
  | 'shutdown_pc';

export interface AntiForensicsConfig {
  enabled: boolean;
  secureDelete: boolean; // Overwrite files before deletion
  clearMemory: boolean;
  disableSwap: boolean;
  encryptTemp: boolean;
  shredderPasses: number; // Number of overwrite passes (1-35)
}

export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'both';
  fallbackPassword: boolean;
  requireOnLaunch: boolean;
  requireOnSensitive: boolean; // Require for sensitive operations
}

export interface SecureNote {
  id: string;
  profileId: string;
  title: string;
  content: string; // Encrypted
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'panic_triggered' | 'self_destruct' | 'intrusion_detected' | 'biometric_fail';
  description: string;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}
