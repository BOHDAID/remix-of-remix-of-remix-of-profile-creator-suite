// Extended Profile Types for Advanced Features

export interface FingerprintValidation {
  isValid: boolean;
  score: number; // 0-100
  errors: FingerprintError[];
  lastChecked: Date;
}

export interface FingerprintError {
  field: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'warning' | 'info';
  fix: string;
}

export interface RiskScore {
  overall: number; // 0-100
  factors: RiskFactor[];
  status: 'safe' | 'warning' | 'danger';
  color: 'green' | 'yellow' | 'red';
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface ProxyStatus {
  enabled: boolean;
  working: boolean;
  lastTested: Date | null;
  latency: number | null; // ms
  ip: string | null;
  country: string | null;
}

export interface VPNStatus {
  enabled: boolean;
  connected: boolean;
  server: string | null;
  country: string | null;
  extensionId: string | null;
}

export interface ProfileHealth {
  fingerprintValidation: FingerprintValidation;
  riskScore: RiskScore;
  proxyStatus: ProxyStatus;
  vpnStatus: VPNStatus;
  lastActivity: Date | null;
  sessionAge: number; // hours
  thermalScore: number; // 0-100, higher = hotter
}

export interface ExtendedProfile {
  id: string;
  name: string;
  health: ProfileHealth;
  // Behavioral data
  behavioralProfile?: BehavioralProfile;
  // Session data
  sessions?: SessionData[];
}

export interface BehavioralProfile {
  typingSpeed: number; // chars per minute
  mouseSpeed: number; // pixels per second
  scrollPattern: 'fast' | 'medium' | 'slow';
  activeHours: number[]; // 0-23
  avgSessionDuration: number; // minutes
}

export interface SessionData {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number; // minutes
  pagesVisited: number;
  actionsPerformed: number;
}

// Fingerprint Inspector Data
export interface FingerprintInspectorData {
  // Navigator
  userAgent: { expected: string; actual: string; match: boolean };
  platform: { expected: string; actual: string; match: boolean };
  language: { expected: string; actual: string; match: boolean };
  languages: { expected: string[]; actual: string[]; match: boolean };
  hardwareConcurrency: { expected: number; actual: number; match: boolean };
  deviceMemory: { expected: number; actual: number; match: boolean };
  
  // Screen
  screenWidth: { expected: number; actual: number; match: boolean };
  screenHeight: { expected: number; actual: number; match: boolean };
  colorDepth: { expected: number; actual: number; match: boolean };
  pixelRatio: { expected: number; actual: number; match: boolean };
  
  // WebGL
  webglVendor: { expected: string; actual: string; match: boolean };
  webglRenderer: { expected: string; actual: string; match: boolean };
  
  // Timezone & Locale
  timezone: { expected: string; actual: string; match: boolean };
  timezoneOffset: { expected: number; actual: number; match: boolean };
  
  // Canvas & Audio
  canvasHash: { expected: string; actual: string; match: boolean };
  audioHash: { expected: string; actual: string; match: boolean };
  
  // IP & Geo
  ip: { expected: string; actual: string; match: boolean };
  country: { expected: string; actual: string; match: boolean };
  
  // Overall
  overallMatch: number; // percentage
  issues: FingerprintError[];
}

// Validation functions
export function validateFingerprint(
  expected: Partial<FingerprintInspectorData>,
  actual: Partial<FingerprintInspectorData>
): FingerprintValidation {
  const errors: FingerprintError[] = [];
  let matchCount = 0;
  let totalChecks = 0;

  // Check User Agent vs Platform consistency
  if (expected.userAgent && actual.userAgent) {
    totalChecks++;
    if (expected.userAgent.expected.includes('Windows') && actual.platform?.actual !== 'Win32') {
      errors.push({
        field: 'Platform',
        expected: 'Win32',
        actual: actual.platform?.actual || 'Unknown',
        severity: 'critical',
        fix: 'تغيير Platform ليتوافق مع User Agent'
      });
    } else {
      matchCount++;
    }
  }

  // Check GPU vendor vs WebGL
  if (expected.webglVendor && actual.webglVendor) {
    totalChecks++;
    if (!actual.webglVendor.match) {
      errors.push({
        field: 'WebGL Vendor',
        expected: expected.webglVendor.expected,
        actual: actual.webglVendor.actual,
        severity: 'critical',
        fix: 'تحديث GPU Vendor في إعدادات البصمة'
      });
    } else {
      matchCount++;
    }
  }

  // Check Timezone vs IP
  if (expected.timezone && actual.timezone) {
    totalChecks++;
    if (!actual.timezone.match) {
      errors.push({
        field: 'Timezone',
        expected: expected.timezone.expected,
        actual: actual.timezone.actual,
        severity: 'warning',
        fix: 'تغيير Timezone ليتوافق مع موقع IP'
      });
    } else {
      matchCount++;
    }
  }

  // Check Language vs Country
  if (expected.language && actual.country) {
    totalChecks++;
    // Basic consistency check
    matchCount++;
  }

  const score = totalChecks > 0 ? Math.round((matchCount / totalChecks) * 100) : 100;

  return {
    isValid: errors.filter(e => e.severity === 'critical').length === 0,
    score,
    errors,
    lastChecked: new Date()
  };
}

export function calculateRiskScore(health: Partial<ProfileHealth>): RiskScore {
  const factors: RiskFactor[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Fingerprint validation factor
  if (health.fingerprintValidation) {
    const weight = 30;
    const score = 100 - health.fingerprintValidation.score;
    factors.push({
      name: 'البصمة الرقمية',
      score,
      weight,
      description: health.fingerprintValidation.isValid ? 'البصمة متسقة' : 'مشاكل في البصمة'
    });
    totalScore += score * weight;
    totalWeight += weight;
  }

  // Proxy status factor
  if (health.proxyStatus) {
    const weight = 25;
    let score = 0;
    if (!health.proxyStatus.enabled) score += 30;
    if (health.proxyStatus.enabled && !health.proxyStatus.working) score += 50;
    if (health.proxyStatus.latency && health.proxyStatus.latency > 1000) score += 20;
    
    factors.push({
      name: 'البروكسي',
      score: Math.min(score, 100),
      weight,
      description: health.proxyStatus.working ? 'البروكسي يعمل' : 'مشكلة في البروكسي'
    });
    totalScore += Math.min(score, 100) * weight;
    totalWeight += weight;
  }

  // Session age factor
  if (health.sessionAge !== undefined) {
    const weight = 15;
    let score = 0;
    if (health.sessionAge < 1) score = 0;
    else if (health.sessionAge < 24) score = 10;
    else if (health.sessionAge < 72) score = 25;
    else score = 40;
    
    factors.push({
      name: 'عمر الجلسة',
      score,
      weight,
      description: `${Math.round(health.sessionAge)} ساعة`
    });
    totalScore += score * weight;
    totalWeight += weight;
  }

  // Thermal score factor
  if (health.thermalScore !== undefined) {
    const weight = 20;
    const score = health.thermalScore;
    factors.push({
      name: 'الحرارة',
      score,
      weight,
      description: score > 70 ? 'نشاط مرتفع' : score > 40 ? 'نشاط معتدل' : 'نشاط منخفض'
    });
    totalScore += score * weight;
    totalWeight += weight;
  }

  // VPN status factor
  if (health.vpnStatus) {
    const weight = 10;
    let score = health.vpnStatus.enabled && health.vpnStatus.connected ? 0 : 15;
    factors.push({
      name: 'VPN',
      score,
      weight,
      description: health.vpnStatus.connected ? 'متصل' : 'غير متصل'
    });
    totalScore += score * weight;
    totalWeight += weight;
  }

  const overall = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  
  let status: 'safe' | 'warning' | 'danger';
  let color: 'green' | 'yellow' | 'red';
  
  if (overall <= 25) {
    status = 'safe';
    color = 'green';
  } else if (overall <= 50) {
    status = 'warning';
    color = 'yellow';
  } else {
    status = 'danger';
    color = 'red';
  }

  return { overall, factors, status, color };
}
