// AI Features Types

export interface AIFingerprintConfig {
  id: string;
  name: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios';
  deviceType: 'desktop' | 'mobile' | 'tablet';
  generated: boolean;
  createdAt: Date;
  confidence: number; // 0-100
}

export interface CaptchaSolverConfig {
  enabled: boolean;
  provider: 'internal' | '2captcha' | 'anticaptcha';
  autoSolve: boolean;
  maxRetries: number;
  timeout: number; // seconds
}

export interface BehavioralAIConfig {
  enabled: boolean;
  mouseMovement: 'natural' | 'aggressive' | 'slow';
  typingPattern: 'human' | 'fast' | 'random';
  scrollBehavior: 'smooth' | 'jumpy' | 'natural';
  clickDelay: number; // ms
  pauseBetweenActions: number; // ms
}

export interface BrowserDetectionResult {
  detected: boolean;
  detectionMethod: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  timestamp: Date;
}

export interface AIProxyOptimization {
  enabled: boolean;
  strategy: 'speed' | 'anonymity' | 'balanced';
  autoSwitch: boolean;
  healthCheckInterval: number; // seconds
}

export interface AISessionConfig {
  enabled: boolean;
  maxSessions: number;
  sessionLifetime: number; // minutes
  autoRotate: boolean;
  persistCookies: boolean;
}

export interface TrafficSimulatorConfig {
  enabled: boolean;
  pattern: 'casual' | 'business' | 'researcher' | 'shopper';
  sitesPerSession: number;
  timeOnPage: { min: number; max: number }; // seconds
  randomize: boolean;
}

export interface AIHubStats {
  fingerprintsGenerated: number;
  captchasSolved: number;
  detectionsAvoided: number;
  sessionsManaged: number;
  trafficSimulated: number;
}
