// Advanced Proxy Types

export interface ProxyRotationConfig {
  enabled: boolean;
  strategy: 'round-robin' | 'random' | 'performance' | 'ai-optimized';
  interval: number; // seconds, 0 = per request
  stickySession: boolean;
  sessionDuration: number; // minutes
}

export interface GeoConsistencyCheck {
  id: string;
  proxyId: string;
  expectedCountry: string;
  actualCountry: string;
  expectedCity?: string;
  actualCity?: string;
  timezoneMatch: boolean;
  languageMatch: boolean;
  consistent: boolean;
  checkedAt: Date;
}

export interface MultiHopChain {
  id: string;
  name: string;
  hops: ProxyHop[];
  enabled: boolean;
  latency: number; // ms
  lastTested: Date;
}

export interface ProxyHop {
  order: number;
  proxyId: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
  country: string;
}

export interface ResidentialProxyPool {
  id: string;
  name: string;
  provider: string;
  apiKey?: string;
  countries: string[];
  totalProxies: number;
  activeProxies: number;
  bandwidth: {
    used: number;
    limit: number;
    resetDate: Date;
  };
}

export interface DNSConfig {
  protocol: 'standard' | 'doh' | 'dot'; // DNS over HTTPS / TLS
  servers: string[];
  customResolvers: DNSResolver[];
  blockAds: boolean;
  blockTrackers: boolean;
}

export interface DNSResolver {
  name: string;
  address: string;
  protocol: 'doh' | 'dot';
}

export interface ProxyHealthStatus {
  proxyId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number;
  uptime: number; // percentage
  lastCheck: Date;
  consecutiveFailures: number;
  bandwidthUsed: number; // bytes
  requestsHandled: number;
}

export interface ProxyWarmupConfig {
  enabled: boolean;
  sites: string[];
  requestCount: number;
  interval: number; // ms between requests
  userAgent: string;
}

export interface ISPFingerprint {
  isp: string;
  asn: string;
  org: string;
  carrier?: string; // For mobile
  connectionType: 'residential' | 'datacenter' | 'mobile' | 'business';
}

export interface MobileCarrierConfig {
  enabled: boolean;
  carrier: string;
  country: string;
  networkType: '3G' | '4G' | '5G' | 'LTE';
  signalStrength: number; // 0-100
}
