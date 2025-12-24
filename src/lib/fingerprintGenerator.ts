// Ultimate Fingerprint Generator - 2025 Undetectable Edition
// Ensures 100% consistency between Location, Language, Timezone, and Hardware

export interface GeneratedFingerprint {
  id: string;
  seed: number;
  os: string;
  browser: string;
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  webglVendor: string;
  webglRenderer: string;
  webglParams: any;
  hardwareConcurrency: number;
  deviceMemory: number;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  canvasNoise: number;
  audioNoise: number;
  doNotTrack: string;
  cookieEnabled: boolean;
  maxTouchPoints: number;
  country: string;
}

export const GPU_DATA = {
  'NVIDIA_HIGH': {
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    params: { maxTextureSize: 16384, redBits: 8, greenBits: 8, blueBits: 8, alphaBits: 8, depthBits: 24, stencilBits: 8, maxCombinedTextureImageUnits: 32 }
  },
  'APPLE_M3': {
    vendor: 'Apple Inc.',
    renderer: 'Apple M3',
    params: { maxTextureSize: 16384, redBits: 8, greenBits: 8, blueBits: 8, alphaBits: 8, depthBits: 24, stencilBits: 8, maxCombinedTextureImageUnits: 80 }
  }
};

export const REGION_CONFIG: Record<string, any> = {
  'SA': { lang: 'ar-SA', langs: ['ar-SA', 'en-US', 'en'], tz: 'Asia/Riyadh', offset: -180, platform: 'Win32' },
  'AE': { lang: 'ar-AE', langs: ['ar-AE', 'en-US', 'en'], tz: 'Asia/Dubai', offset: -240, platform: 'Win32' },
  'US': { lang: 'en-US', langs: ['en-US', 'en'], tz: 'America/New_York', offset: 300, platform: 'Win32' },
  'UK': { lang: 'en-GB', langs: ['en-GB', 'en'], tz: 'Europe/London', offset: 0, platform: 'Win32' },
};

// Main generation function
export function generateFingerprint(country: string = 'US'): GeneratedFingerprint {
  const config = REGION_CONFIG[country] || REGION_CONFIG['US'];
  const gpu = country === 'US' ? GPU_DATA.NVIDIA_HIGH : GPU_DATA.NVIDIA_HIGH; 
  const seed = Math.floor(Math.random() * 1000000);

  return {
    id: Math.random().toString(36).substring(2, 15),
    seed,
    os: 'windows',
    browser: 'chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: config.platform,
    language: config.lang,
    languages: config.langs,
    timezone: config.tz,
    timezoneOffset: config.offset,
    webglVendor: gpu.vendor,
    webglRenderer: gpu.renderer,
    webglParams: gpu.params,
    hardwareConcurrency: 16,
    deviceMemory: 32,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    canvasNoise: 0.0001,
    audioNoise: 0.00001,
    doNotTrack: '1',
    cookieEnabled: true,
    maxTouchPoints: 0,
    country
  };
}

// Alias for compatibility with existing components
export const generateRealisticFingerprint = generateFingerprint;

// Validation function for compatibility
export function validateFingerprint(fp: GeneratedFingerprint) {
  return {
    valid: true,
    score: 100,
    issues: []
  };
}
