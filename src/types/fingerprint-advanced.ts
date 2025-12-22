// Advanced Fingerprint Types

export interface CanvasFingerprintConfig {
  enabled: boolean;
  noise: number; // 0-100
  mode: 'randomize' | 'spoof' | 'block';
  persistPerProfile: boolean;
}

export interface WebGLFingerprintConfig {
  enabled: boolean;
  vendor: string;
  renderer: string;
  mode: 'spoof' | 'noise' | 'block';
  unmaskedVendor: string;
  unmaskedRenderer: string;
}

export interface TimezoneConfig {
  enabled: boolean;
  timezone: string;
  autoDetect: boolean; // Match proxy location
  offset: number;
  locale: string;
}

export interface HardwareIDConfig {
  enabled: boolean;
  deviceId: string;
  machineId: string;
  biosSerial: string;
  diskSerial: string;
  macAddress: string;
  randomize: boolean;
}

export interface FontFingerprintConfig {
  enabled: boolean;
  mode: 'whitelist' | 'randomize' | 'spoof';
  fonts: string[];
  excludeFonts: string[];
}

export interface BatteryAPIConfig {
  enabled: boolean;
  level: number; // 0-100
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  randomize: boolean;
}

export interface MediaDevicesConfig {
  enabled: boolean;
  audioInputs: number;
  audioOutputs: number;
  videoInputs: number;
  deviceLabels: string[];
  randomize: boolean;
}

export interface ClientHintsConfig {
  enabled: boolean;
  brands: { brand: string; version: string }[];
  mobile: boolean;
  platform: string;
  platformVersion: string;
  architecture: string;
  bitness: string;
  model: string;
}

export interface SpeechSynthesisConfig {
  enabled: boolean;
  voices: SpeechVoice[];
  defaultVoice: string;
  randomize: boolean;
}

export interface SpeechVoice {
  name: string;
  lang: string;
  localService: boolean;
}

export interface NavigatorConfig {
  enabled: boolean;
  userAgent: string;
  platform: string;
  vendor: string;
  language: string;
  languages: string[];
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
  doNotTrack: '1' | '0' | null;
  cookieEnabled: boolean;
  webdriver: boolean;
  pdfViewerEnabled: boolean;
}

export interface PerformanceAPIConfig {
  enabled: boolean;
  timing: boolean;
  navigation: boolean;
  resource: boolean;
  paint: boolean;
  memory: boolean;
  addNoise: boolean;
  noiseLevel: number;
}

export interface AutomationBypassConfig {
  enabled: boolean;
  hideWebdriver: boolean;
  hideAutomation: boolean;
  hideHeadless: boolean;
  spoofPlugins: boolean;
  spoofMimeTypes: boolean;
  passPermissions: boolean;
  humanizeEvents: boolean;
}

export interface AdvancedFingerprintProfile {
  id: string;
  name: string;
  canvas: CanvasFingerprintConfig;
  webgl: WebGLFingerprintConfig;
  timezone: TimezoneConfig;
  hardwareId: HardwareIDConfig;
  fonts: FontFingerprintConfig;
  battery: BatteryAPIConfig;
  mediaDevices: MediaDevicesConfig;
  clientHints: ClientHintsConfig;
  speechSynthesis: SpeechSynthesisConfig;
  navigator: NavigatorConfig;
  performance: PerformanceAPIConfig;
  automationBypass: AutomationBypassConfig;
  createdAt: Date;
  updatedAt: Date;
}
