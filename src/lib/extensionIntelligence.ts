/**
 * Extension Intelligence System
 * نظام تحليل الإضافات والتحكم بـ VPN
 */

export interface ExtensionAnalysis {
  id: string;
  name: string;
  type: ExtensionType;
  capabilities: ExtensionCapability[];
  vpnInfo?: VPNExtensionInfo;
  isAnalyzed: boolean;
  manifest?: ExtensionManifest;
  riskLevel: 'safe' | 'moderate' | 'risky';
}

export type ExtensionType = 
  | 'vpn'
  | 'proxy'
  | 'ad_blocker'
  | 'privacy'
  | 'automation'
  | 'utility'
  | 'unknown';

export type ExtensionCapability = 
  | 'network_control'
  | 'tab_control'
  | 'storage_access'
  | 'all_urls'
  | 'webRequest'
  | 'cookies'
  | 'history'
  | 'downloads';

export interface VPNExtensionInfo {
  hasConnect: boolean;
  hasDisconnect: boolean;
  hasServerList: boolean;
  servers?: VPNServer[];
  currentServer?: string;
  isConnected: boolean;
  controlMethod: 'popup' | 'background' | 'api' | 'unknown';
}

export interface VPNServer {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  city?: string;
  load?: number; // 0-100
  ping?: number; // ms
}

export interface ExtensionManifest {
  manifest_version: number;
  name: string;
  version: string;
  description?: string;
  permissions?: string[];
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  content_scripts?: {
    matches: string[];
    js?: string[];
  }[];
  action?: {
    default_popup?: string;
    default_icon?: string | { [key: string]: string };
  };
}

// VPN Extension Detection Patterns
const VPN_PATTERNS = [
  'vpn', 'proxy', 'tunnel', 'connect', 'server', 'encrypt',
  'anonymize', 'ip hide', 'location', 'unblock'
];

const KNOWN_VPN_EXTENSIONS = [
  { pattern: 'nordvpn', name: 'NordVPN', controlMethod: 'popup' as const },
  { pattern: 'expressvpn', name: 'ExpressVPN', controlMethod: 'popup' as const },
  { pattern: 'surfshark', name: 'Surfshark', controlMethod: 'popup' as const },
  { pattern: 'protonvpn', name: 'ProtonVPN', controlMethod: 'popup' as const },
  { pattern: 'windscribe', name: 'Windscribe', controlMethod: 'popup' as const },
  { pattern: 'tunnelbear', name: 'TunnelBear', controlMethod: 'popup' as const },
  { pattern: 'zenmate', name: 'ZenMate', controlMethod: 'popup' as const },
  { pattern: 'hotspotshield', name: 'Hotspot Shield', controlMethod: 'popup' as const },
  { pattern: 'hoxx', name: 'Hoxx VPN', controlMethod: 'popup' as const },
  { pattern: 'browsec', name: 'Browsec', controlMethod: 'popup' as const },
  { pattern: 'touch vpn', name: 'Touch VPN', controlMethod: 'popup' as const },
];

// Analyze extension from manifest
export function analyzeExtension(manifest: ExtensionManifest, path: string): ExtensionAnalysis {
  const name = manifest.name.toLowerCase();
  const permissions = manifest.permissions || [];
  
  // Detect capabilities
  const capabilities: ExtensionCapability[] = [];
  if (permissions.includes('webRequest') || permissions.includes('webRequestBlocking')) {
    capabilities.push('network_control');
  }
  if (permissions.includes('tabs')) {
    capabilities.push('tab_control');
  }
  if (permissions.includes('storage')) {
    capabilities.push('storage_access');
  }
  if (permissions.includes('<all_urls>') || permissions.some(p => p.includes('*'))) {
    capabilities.push('all_urls');
  }
  if (permissions.includes('cookies')) {
    capabilities.push('cookies');
  }
  if (permissions.includes('history')) {
    capabilities.push('history');
  }
  
  // Detect type
  let type: ExtensionType = 'unknown';
  let vpnInfo: VPNExtensionInfo | undefined;
  
  // Check for VPN
  const isVPN = VPN_PATTERNS.some(p => name.includes(p)) || 
                KNOWN_VPN_EXTENSIONS.some(v => name.includes(v.pattern));
  
  if (isVPN) {
    type = 'vpn';
    const knownVPN = KNOWN_VPN_EXTENSIONS.find(v => name.includes(v.pattern));
    
    vpnInfo = {
      hasConnect: true,
      hasDisconnect: true,
      hasServerList: true,
      servers: generateMockServers(),
      isConnected: false,
      controlMethod: knownVPN?.controlMethod || 'unknown',
    };
  } else if (name.includes('proxy')) {
    type = 'proxy';
  } else if (name.includes('adblock') || name.includes('ublock') || name.includes('ad blocker')) {
    type = 'ad_blocker';
  } else if (name.includes('privacy') || name.includes('tracker') || name.includes('fingerprint')) {
    type = 'privacy';
  } else if (name.includes('automate') || name.includes('bot') || name.includes('script')) {
    type = 'automation';
  }
  
  // Calculate risk level
  let riskLevel: 'safe' | 'moderate' | 'risky' = 'safe';
  if (capabilities.includes('all_urls') && capabilities.includes('network_control')) {
    riskLevel = 'moderate';
  }
  if (type === 'automation' || capabilities.includes('history')) {
    riskLevel = 'risky';
  }
  
  return {
    id: crypto.randomUUID(),
    name: manifest.name,
    type,
    capabilities,
    vpnInfo,
    isAnalyzed: true,
    manifest,
    riskLevel,
  };
}

function generateMockServers(): VPNServer[] {
  return [
    { id: '1', name: 'US - New York', country: 'United States', countryCode: 'US', city: 'New York', load: 45, ping: 85 },
    { id: '2', name: 'US - Los Angeles', country: 'United States', countryCode: 'US', city: 'Los Angeles', load: 62, ping: 120 },
    { id: '3', name: 'UK - London', country: 'United Kingdom', countryCode: 'GB', city: 'London', load: 38, ping: 45 },
    { id: '4', name: 'Germany - Frankfurt', country: 'Germany', countryCode: 'DE', city: 'Frankfurt', load: 55, ping: 35 },
    { id: '5', name: 'Netherlands - Amsterdam', country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', load: 42, ping: 40 },
    { id: '6', name: 'Japan - Tokyo', country: 'Japan', countryCode: 'JP', city: 'Tokyo', load: 70, ping: 180 },
    { id: '7', name: 'Singapore', country: 'Singapore', countryCode: 'SG', load: 58, ping: 200 },
    { id: '8', name: 'Australia - Sydney', country: 'Australia', countryCode: 'AU', city: 'Sydney', load: 35, ping: 250 },
  ];
}

// VPN Control Interface
export interface VPNControlCommand {
  action: 'connect' | 'disconnect' | 'switch_server';
  serverId?: string;
}

export interface VPNControlResult {
  success: boolean;
  message: string;
  newState?: {
    isConnected: boolean;
    server?: VPNServer;
    ip?: string;
  };
}

// This would communicate with the extension via native messaging or injection
export async function controlVPN(
  extensionId: string, 
  command: VPNControlCommand
): Promise<VPNControlResult> {
  // In a real implementation, this would:
  // 1. Use chrome.runtime.sendMessage to communicate with the extension
  // 2. Or inject scripts into the extension's popup
  // 3. Or use Native Messaging
  
  // For now, return mock result
  console.log(`VPN Control: ${command.action} for extension ${extensionId}`);
  
  return {
    success: true,
    message: `VPN ${command.action} command sent`,
    newState: {
      isConnected: command.action === 'connect',
      server: command.serverId ? generateMockServers().find(s => s.id === command.serverId) : undefined,
    },
  };
}

// Get timezone and language for VPN server location
export function getLocaleForServer(server: VPNServer): { timezone: string; language: string } {
  const localeMap: { [key: string]: { timezone: string; language: string } } = {
    'US': { timezone: 'America/New_York', language: 'en-US' },
    'GB': { timezone: 'Europe/London', language: 'en-GB' },
    'DE': { timezone: 'Europe/Berlin', language: 'de-DE' },
    'FR': { timezone: 'Europe/Paris', language: 'fr-FR' },
    'NL': { timezone: 'Europe/Amsterdam', language: 'nl-NL' },
    'JP': { timezone: 'Asia/Tokyo', language: 'ja-JP' },
    'SG': { timezone: 'Asia/Singapore', language: 'en-SG' },
    'AU': { timezone: 'Australia/Sydney', language: 'en-AU' },
  };
  
  return localeMap[server.countryCode] || { timezone: 'UTC', language: 'en-US' };
}
