// Real Fingerprint Generator Utilities

// GPU/WebGL data
export const GPU_VENDORS = [
  'Google Inc. (NVIDIA)',
  'Google Inc. (AMD)',
  'Google Inc. (Intel)',
  'Intel Inc.',
  'NVIDIA Corporation',
  'AMD'
];

export const GPU_RENDERERS = {
  'NVIDIA': [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  'AMD': [
    'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  'Intel': [
    'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 730 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ]
};

// Screen resolutions
export const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080, ratio: 1 },
  { width: 2560, height: 1440, ratio: 1 },
  { width: 3840, height: 2160, ratio: 1 },
  { width: 1920, height: 1080, ratio: 1.25 },
  { width: 1920, height: 1080, ratio: 1.5 },
  { width: 1366, height: 768, ratio: 1 },
  { width: 1536, height: 864, ratio: 1.25 },
  { width: 1440, height: 900, ratio: 1 },
  { width: 2560, height: 1600, ratio: 1 },
];

// Timezones by region
export const TIMEZONES = {
  'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'],
  'UK': ['Europe/London'],
  'DE': ['Europe/Berlin'],
  'FR': ['Europe/Paris'],
  'JP': ['Asia/Tokyo'],
  'CN': ['Asia/Shanghai'],
  'AU': ['Australia/Sydney', 'Australia/Melbourne'],
  'CA': ['America/Toronto', 'America/Vancouver'],
  'BR': ['America/Sao_Paulo'],
  'IN': ['Asia/Kolkata'],
  'AE': ['Asia/Dubai'],
  'SA': ['Asia/Riyadh'],
  'EG': ['Africa/Cairo'],
};

// Languages by country
export const LANGUAGES = {
  'US': { primary: 'en-US', all: ['en-US', 'en'] },
  'UK': { primary: 'en-GB', all: ['en-GB', 'en'] },
  'DE': { primary: 'de-DE', all: ['de-DE', 'de', 'en'] },
  'FR': { primary: 'fr-FR', all: ['fr-FR', 'fr', 'en'] },
  'JP': { primary: 'ja-JP', all: ['ja-JP', 'ja', 'en'] },
  'CN': { primary: 'zh-CN', all: ['zh-CN', 'zh', 'en'] },
  'AU': { primary: 'en-AU', all: ['en-AU', 'en'] },
  'CA': { primary: 'en-CA', all: ['en-CA', 'en', 'fr'] },
  'BR': { primary: 'pt-BR', all: ['pt-BR', 'pt', 'en'] },
  'IN': { primary: 'en-IN', all: ['en-IN', 'hi', 'en'] },
  'AE': { primary: 'ar-AE', all: ['ar-AE', 'ar', 'en'] },
  'SA': { primary: 'ar-SA', all: ['ar-SA', 'ar', 'en'] },
  'EG': { primary: 'ar-EG', all: ['ar-EG', 'ar', 'en'] },
};

// User Agents
export const USER_AGENTS = {
  'chrome-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ],
  'chrome-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  ],
  'firefox-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  ],
  'firefox-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  ],
  'safari-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ],
  'edge-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ],
};

// CPU configurations
export const CPU_CONFIGS = [
  { cores: 4, memory: 4 },
  { cores: 4, memory: 8 },
  { cores: 6, memory: 8 },
  { cores: 6, memory: 16 },
  { cores: 8, memory: 8 },
  { cores: 8, memory: 16 },
  { cores: 8, memory: 32 },
  { cores: 12, memory: 16 },
  { cores: 12, memory: 32 },
  { cores: 16, memory: 32 },
  { cores: 16, memory: 64 },
];

export interface GeneratedFingerprint {
  // Hardware
  gpu: string;
  gpuVendor: string;
  webglVendor: string;
  webglRenderer: string;
  cpuCores: number;
  deviceMemory: number;
  
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
  userAgent: string;
  
  // Metadata
  os: string;
  browser: string;
  country: string;
  confidence: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRealisticFingerprint(options?: {
  os?: 'windows' | 'macos' | 'linux';
  browser?: 'chrome' | 'firefox' | 'safari' | 'edge';
  country?: string;
}): GeneratedFingerprint {
  const os = options?.os || pickRandom(['windows', 'macos'] as const);
  const browser = options?.browser || pickRandom(['chrome', 'firefox'] as const);
  const country = options?.country || pickRandom(['US', 'UK', 'DE', 'FR', 'CA']);
  
  // Select GPU based on realistic distribution
  const gpuBrand = pickRandom(['NVIDIA', 'AMD', 'Intel'] as const);
  const gpuVendor = gpuBrand === 'NVIDIA' ? 'Google Inc. (NVIDIA)' : 
                    gpuBrand === 'AMD' ? 'Google Inc. (AMD)' : 'Google Inc. (Intel)';
  const gpuRenderer = pickRandom(GPU_RENDERERS[gpuBrand]);
  
  // Screen resolution
  const screen = pickRandom(SCREEN_RESOLUTIONS);
  
  // CPU config
  const cpu = pickRandom(CPU_CONFIGS);
  
  // Timezone and language
  const timezones = TIMEZONES[country as keyof typeof TIMEZONES] || TIMEZONES['US'];
  const timezone = pickRandom(timezones);
  const langConfig = LANGUAGES[country as keyof typeof LANGUAGES] || LANGUAGES['US'];
  
  // User agent
  const uaKey = `${browser}-${os === 'windows' ? 'win' : 'mac'}` as keyof typeof USER_AGENTS;
  const userAgents = USER_AGENTS[uaKey] || USER_AGENTS['chrome-win'];
  const userAgent = pickRandom(userAgents);
  
  // Platform
  const platform = os === 'windows' ? 'Win32' : 
                   os === 'macos' ? 'MacIntel' : 'Linux x86_64';
  
  return {
    gpu: gpuRenderer.match(/NVIDIA|AMD|Intel/)?.[0] + ' Graphics' || 'Unknown GPU',
    gpuVendor,
    webglVendor: gpuVendor,
    webglRenderer: gpuRenderer,
    cpuCores: cpu.cores,
    deviceMemory: cpu.memory,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: 24,
    pixelRatio: screen.ratio,
    timezone,
    language: langConfig.primary,
    languages: langConfig.all,
    platform,
    userAgent,
    os,
    browser,
    country,
    confidence: 85 + Math.floor(Math.random() * 15) // 85-99%
  };
}

// Generate canvas noise seed for consistent fingerprint
export function generateCanvasNoiseSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

// Generate audio context noise
export function generateAudioNoise(): number {
  return 0.00001 + Math.random() * 0.00001;
}

// Generate WebGL noise parameters
export function generateWebGLNoise(): { shaderNoise: number; bufferNoise: number } {
  return {
    shaderNoise: Math.random() * 0.0001,
    bufferNoise: Math.random() * 0.0001
  };
}

// Validate fingerprint consistency
export function validateFingerprint(fp: GeneratedFingerprint): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check OS/Platform consistency
  if (fp.os === 'windows' && fp.platform !== 'Win32') {
    issues.push('Platform mismatch with OS');
  }
  
  // Check User Agent consistency
  if (fp.os === 'windows' && !fp.userAgent.includes('Windows')) {
    issues.push('User Agent does not match OS');
  }
  
  // Check screen resolution validity
  if (fp.screenWidth < 800 || fp.screenHeight < 600) {
    issues.push('Screen resolution too small');
  }
  
  // Check memory/cores ratio
  if (fp.deviceMemory < fp.cpuCores / 2) {
    issues.push('Memory too low for CPU cores');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
