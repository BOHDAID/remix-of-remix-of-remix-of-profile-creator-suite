// Real Fingerprint Generator Utilities - 100% Realistic

// GPU/WebGL data - Extended with more realistic options
export const GPU_VENDORS = [
  'Google Inc. (NVIDIA)',
  'Google Inc. (AMD)',
  'Google Inc. (Intel)',
  'Intel Inc.',
  'NVIDIA Corporation',
  'AMD',
  'Apple Inc.',
  'ARM',
];

export const GPU_RENDERERS = {
  'NVIDIA': [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Ti SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  'AMD': [
    'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6950 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6800 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 5600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  'Intel': [
    'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Arc(TM) A380 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 730 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Iris(R) Plus Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  'Apple': [
    'Apple M3 Max',
    'Apple M3 Pro',
    'Apple M3',
    'Apple M2 Ultra',
    'Apple M2 Max',
    'Apple M2 Pro',
    'Apple M2',
    'Apple M1 Ultra',
    'Apple M1 Max',
    'Apple M1 Pro',
    'Apple M1',
  ]
};

// Screen resolutions - Extended with more common resolutions
export const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080, ratio: 1, name: 'FHD' },
  { width: 1920, height: 1080, ratio: 1.25, name: 'FHD 125%' },
  { width: 1920, height: 1080, ratio: 1.5, name: 'FHD 150%' },
  { width: 2560, height: 1440, ratio: 1, name: 'QHD' },
  { width: 2560, height: 1440, ratio: 1.25, name: 'QHD 125%' },
  { width: 3840, height: 2160, ratio: 1, name: '4K' },
  { width: 3840, height: 2160, ratio: 1.5, name: '4K 150%' },
  { width: 3840, height: 2160, ratio: 2, name: '4K 200%' },
  { width: 1366, height: 768, ratio: 1, name: 'HD Laptop' },
  { width: 1536, height: 864, ratio: 1.25, name: 'Laptop 125%' },
  { width: 1440, height: 900, ratio: 1, name: 'Laptop Wide' },
  { width: 1680, height: 1050, ratio: 1, name: 'WSXGA+' },
  { width: 1600, height: 900, ratio: 1, name: 'HD+' },
  { width: 2560, height: 1600, ratio: 1, name: 'WQXGA' },
  { width: 2880, height: 1800, ratio: 2, name: 'Retina 15' },
  { width: 3024, height: 1964, ratio: 2, name: 'MacBook Pro 14' },
  { width: 3456, height: 2234, ratio: 2, name: 'MacBook Pro 16' },
  { width: 2560, height: 1664, ratio: 2, name: 'MacBook Air M2' },
];

// Timezones by region - Extended
export const TIMEZONES = {
  'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu'],
  'UK': ['Europe/London'],
  'DE': ['Europe/Berlin'],
  'FR': ['Europe/Paris'],
  'ES': ['Europe/Madrid'],
  'IT': ['Europe/Rome'],
  'NL': ['Europe/Amsterdam'],
  'BE': ['Europe/Brussels'],
  'CH': ['Europe/Zurich'],
  'AT': ['Europe/Vienna'],
  'PL': ['Europe/Warsaw'],
  'JP': ['Asia/Tokyo'],
  'CN': ['Asia/Shanghai', 'Asia/Hong_Kong'],
  'KR': ['Asia/Seoul'],
  'TW': ['Asia/Taipei'],
  'SG': ['Asia/Singapore'],
  'AU': ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth'],
  'NZ': ['Pacific/Auckland'],
  'CA': ['America/Toronto', 'America/Vancouver', 'America/Montreal'],
  'MX': ['America/Mexico_City'],
  'BR': ['America/Sao_Paulo', 'America/Rio_Branco'],
  'AR': ['America/Buenos_Aires'],
  'IN': ['Asia/Kolkata'],
  'RU': ['Europe/Moscow', 'Asia/Vladivostok'],
  'TR': ['Europe/Istanbul'],
  'AE': ['Asia/Dubai'],
  'SA': ['Asia/Riyadh'],
  'EG': ['Africa/Cairo'],
  'ZA': ['Africa/Johannesburg'],
  'IL': ['Asia/Jerusalem'],
  'TH': ['Asia/Bangkok'],
  'VN': ['Asia/Ho_Chi_Minh'],
  'MY': ['Asia/Kuala_Lumpur'],
  'ID': ['Asia/Jakarta'],
  'PH': ['Asia/Manila'],
};

// Languages by country - Extended
export const LANGUAGES = {
  'US': { primary: 'en-US', all: ['en-US', 'en'] },
  'UK': { primary: 'en-GB', all: ['en-GB', 'en'] },
  'DE': { primary: 'de-DE', all: ['de-DE', 'de', 'en'] },
  'FR': { primary: 'fr-FR', all: ['fr-FR', 'fr', 'en'] },
  'ES': { primary: 'es-ES', all: ['es-ES', 'es', 'en'] },
  'IT': { primary: 'it-IT', all: ['it-IT', 'it', 'en'] },
  'NL': { primary: 'nl-NL', all: ['nl-NL', 'nl', 'en'] },
  'PL': { primary: 'pl-PL', all: ['pl-PL', 'pl', 'en'] },
  'JP': { primary: 'ja-JP', all: ['ja-JP', 'ja', 'en'] },
  'CN': { primary: 'zh-CN', all: ['zh-CN', 'zh', 'en'] },
  'KR': { primary: 'ko-KR', all: ['ko-KR', 'ko', 'en'] },
  'TW': { primary: 'zh-TW', all: ['zh-TW', 'zh', 'en'] },
  'AU': { primary: 'en-AU', all: ['en-AU', 'en'] },
  'NZ': { primary: 'en-NZ', all: ['en-NZ', 'en'] },
  'CA': { primary: 'en-CA', all: ['en-CA', 'en', 'fr-CA'] },
  'MX': { primary: 'es-MX', all: ['es-MX', 'es', 'en'] },
  'BR': { primary: 'pt-BR', all: ['pt-BR', 'pt', 'en'] },
  'AR': { primary: 'es-AR', all: ['es-AR', 'es', 'en'] },
  'IN': { primary: 'en-IN', all: ['en-IN', 'hi', 'en'] },
  'RU': { primary: 'ru-RU', all: ['ru-RU', 'ru', 'en'] },
  'TR': { primary: 'tr-TR', all: ['tr-TR', 'tr', 'en'] },
  'AE': { primary: 'ar-AE', all: ['ar-AE', 'ar', 'en'] },
  'SA': { primary: 'ar-SA', all: ['ar-SA', 'ar', 'en'] },
  'EG': { primary: 'ar-EG', all: ['ar-EG', 'ar', 'en'] },
  'IL': { primary: 'he-IL', all: ['he-IL', 'he', 'en'] },
  'TH': { primary: 'th-TH', all: ['th-TH', 'th', 'en'] },
  'VN': { primary: 'vi-VN', all: ['vi-VN', 'vi', 'en'] },
  'ID': { primary: 'id-ID', all: ['id-ID', 'id', 'en'] },
  'PH': { primary: 'en-PH', all: ['en-PH', 'fil', 'en'] },
};

// User Agents - Extended with latest versions
export const USER_AGENTS = {
  'chrome-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  ],
  'chrome-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  ],
  'chrome-linux': [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  ],
  'firefox-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  ],
  'firefox-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:133.0) Gecko/20100101 Firefox/133.0',
  ],
  'firefox-linux': [
    'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
  ],
  'safari-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  ],
  'edge-win': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
  ],
  'edge-mac': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  ],
};

// CPU configurations - Extended with realistic combinations
export const CPU_CONFIGS = [
  { cores: 2, memory: 4, type: 'low-end' },
  { cores: 4, memory: 4, type: 'budget' },
  { cores: 4, memory: 8, type: 'budget' },
  { cores: 6, memory: 8, type: 'mid-range' },
  { cores: 6, memory: 16, type: 'mid-range' },
  { cores: 8, memory: 8, type: 'mid-range' },
  { cores: 8, memory: 16, type: 'gaming' },
  { cores: 8, memory: 32, type: 'gaming' },
  { cores: 10, memory: 16, type: 'workstation' },
  { cores: 10, memory: 32, type: 'workstation' },
  { cores: 12, memory: 16, type: 'workstation' },
  { cores: 12, memory: 32, type: 'workstation' },
  { cores: 12, memory: 64, type: 'high-end' },
  { cores: 16, memory: 32, type: 'high-end' },
  { cores: 16, memory: 64, type: 'high-end' },
  { cores: 16, memory: 128, type: 'server' },
  { cores: 24, memory: 64, type: 'server' },
  { cores: 32, memory: 128, type: 'server' },
];

// Touch support configurations
export const TOUCH_CONFIGS = {
  desktop: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
  touchscreen: { maxTouchPoints: 10, touchEvent: true, touchStart: true },
  hybrid: { maxTouchPoints: 10, touchEvent: true, touchStart: true },
};

// Audio context fingerprint variations
export const AUDIO_CONTEXTS = [
  { sampleRate: 44100, channelCount: 2, state: 'suspended' },
  { sampleRate: 48000, channelCount: 2, state: 'suspended' },
  { sampleRate: 96000, channelCount: 2, state: 'suspended' },
];

// WebRTC configurations
export const WEBRTC_CONFIGS = {
  enabled: { enabled: true, localIP: null },
  disabled: { enabled: false, localIP: null },
  spoofed: { enabled: true, localIP: '192.168.1.' + Math.floor(Math.random() * 254 + 1) },
};

// Font lists by OS
export const FONTS_BY_OS = {
  windows: [
    'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS',
    'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Georgia', 'Impact',
    'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
    'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Tahoma', 'Times New Roman',
    'Trebuchet MS', 'Verdana', 'Webdings', 'Wingdings'
  ],
  macos: [
    'American Typewriter', 'Andale Mono', 'Arial', 'Arial Black', 'Arial Narrow',
    'Avenir', 'Avenir Next', 'Baskerville', 'Big Caslon', 'Brush Script MT',
    'Chalkboard', 'Chalkboard SE', 'Cochin', 'Comic Sans MS', 'Copperplate',
    'Courier New', 'Futura', 'Geneva', 'Georgia', 'Gill Sans', 'Helvetica',
    'Helvetica Neue', 'Hoefler Text', 'Impact', 'Lucida Grande', 'Menlo',
    'Monaco', 'Optima', 'Palatino', 'Papyrus', 'SF Pro', 'SF Pro Display',
    'SF Pro Text', 'Times New Roman', 'Trebuchet MS', 'Verdana'
  ],
  linux: [
    'Arial', 'Cantarell', 'Comic Sans MS', 'Courier New', 'DejaVu Sans',
    'DejaVu Sans Mono', 'DejaVu Serif', 'Droid Sans', 'Droid Sans Mono',
    'Droid Serif', 'FreeMono', 'FreeSans', 'FreeSerif', 'Georgia',
    'Liberation Mono', 'Liberation Sans', 'Liberation Serif', 'Noto Sans',
    'Noto Serif', 'Roboto', 'Times New Roman', 'Ubuntu', 'Ubuntu Mono', 'Verdana'
  ]
};

// Plugin lists by browser
export const PLUGINS_BY_BROWSER = {
  chrome: [
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
  ],
  firefox: [
    { name: 'PDF.js', filename: 'pdf.js', description: 'Portable Document Format' },
  ],
  safari: [
    { name: 'WebKit built-in PDF', filename: 'webkit-pdf', description: 'Portable Document Format' },
  ],
  edge: [
    { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
  ]
};

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
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  
  // Locale
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string[];
  
  // Platform
  platform: string;
  userAgent: string;
  vendor: string;
  
  // Features
  doNotTrack: string | null;
  cookieEnabled: boolean;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  
  // Canvas noise
  canvasNoise: number;
  
  // Audio
  audioNoise: number;
  audioSampleRate: number;
  
  // WebGL
  webglNoise: { shaderNoise: number; bufferNoise: number };
  
  // Fonts
  fonts: string[];
  
  // Plugins
  plugins: { name: string; filename: string; description: string }[];
  
  // Metadata
  os: string;
  browser: string;
  browserVersion: string;
  country: string;
  confidence: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function generateRealisticFingerprint(options?: {
  os?: 'windows' | 'macos' | 'linux';
  browser?: 'chrome' | 'firefox' | 'safari' | 'edge';
  country?: string;
  deviceType?: 'desktop' | 'laptop' | 'workstation';
}): GeneratedFingerprint {
  // Weighted random selection for realistic distribution
  const osOptions: ('windows' | 'macos' | 'linux')[] = ['windows', 'macos', 'linux'];
  const osWeights = [70, 25, 5]; // Windows is most common
  const os = options?.os || pickWeighted(osOptions, osWeights);
  
  const browserOptions: ('chrome' | 'firefox' | 'safari' | 'edge')[] = ['chrome', 'firefox', 'safari', 'edge'];
  const browserWeights = os === 'macos' 
    ? [50, 10, 35, 5] // Safari more common on Mac
    : [75, 15, 0, 10]; // Safari only on Mac
  const nonSafariBrowsers: ('chrome' | 'firefox' | 'edge')[] = ['chrome', 'firefox', 'edge'];
  const browser = options?.browser || (os === 'macos' 
    ? pickWeighted(browserOptions, browserWeights)
    : pickWeighted(nonSafariBrowsers, [75, 15, 10]));
  
  const countries = Object.keys(TIMEZONES);
  const countryWeights = countries.map(c => 
    ['US', 'UK', 'DE', 'FR', 'CA'].includes(c) ? 15 : 3
  );
  const country = options?.country || pickWeighted(countries, countryWeights);
  
  // Select GPU based on OS
  const gpuBrand = os === 'macos' 
    ? pickWeighted(['Apple', 'Intel', 'AMD'] as const, [60, 30, 10])
    : pickWeighted(['NVIDIA', 'AMD', 'Intel'] as const, [50, 25, 25]);
  
  const gpuVendor = gpuBrand === 'Apple' ? 'Apple Inc.' :
                    gpuBrand === 'NVIDIA' ? 'Google Inc. (NVIDIA)' : 
                    gpuBrand === 'AMD' ? 'Google Inc. (AMD)' : 'Google Inc. (Intel)';
  const gpuRenderer = pickRandom(GPU_RENDERERS[gpuBrand as keyof typeof GPU_RENDERERS] || GPU_RENDERERS['Intel']);
  
  // Screen resolution based on device type
  const deviceType = options?.deviceType || pickWeighted(['desktop', 'laptop', 'workstation'] as const, [40, 50, 10]);
  const screenOptions = deviceType === 'laptop' 
    ? SCREEN_RESOLUTIONS.filter(s => s.width <= 2560)
    : SCREEN_RESOLUTIONS;
  const screen = pickRandom(screenOptions);
  
  // CPU config based on device type
  const cpuOptions = deviceType === 'workstation'
    ? CPU_CONFIGS.filter(c => c.cores >= 8)
    : deviceType === 'laptop'
    ? CPU_CONFIGS.filter(c => c.cores <= 12 && c.memory <= 32)
    : CPU_CONFIGS.filter(c => c.cores >= 4);
  const cpu = pickRandom(cpuOptions);
  
  // Timezone and language
  const timezones = TIMEZONES[country as keyof typeof TIMEZONES] || TIMEZONES['US'];
  const timezone = pickRandom(timezones);
  const langConfig = LANGUAGES[country as keyof typeof LANGUAGES] || LANGUAGES['US'];
  
  // User agent with browser version
  const osKey = os === 'windows' ? 'win' : os === 'macos' ? 'mac' : 'linux';
  const uaKey = `${browser}-${osKey}` as keyof typeof USER_AGENTS;
  const userAgents = USER_AGENTS[uaKey] || USER_AGENTS['chrome-win'];
  const userAgent = pickRandom(userAgents);
  
  // Extract browser version from user agent
  const versionMatch = userAgent.match(/Chrome\/(\d+)|Firefox\/(\d+)|Version\/(\d+\.\d+)|Edg\/(\d+)/);
  const browserVersion = versionMatch ? (versionMatch[1] || versionMatch[2] || versionMatch[3] || versionMatch[4]) : '120';
  
  // Platform
  const platform = os === 'windows' ? 'Win32' : 
                   os === 'macos' ? 'MacIntel' : 'Linux x86_64';
  
  // Vendor based on browser
  const vendor = browser === 'firefox' ? '' : 
                 browser === 'safari' ? 'Apple Computer, Inc.' : 'Google Inc.';
  
  // Calculate timezone offset
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const timezoneOffset = Math.round((now.getTime() - tzDate.getTime()) / 60000);
  
  // Touch support
  const touch = pickWeighted([TOUCH_CONFIGS.desktop, TOUCH_CONFIGS.touchscreen], [85, 15]);
  
  // Generate noise values
  const canvasNoise = Math.floor(Math.random() * 1000000);
  const audioContext = pickRandom(AUDIO_CONTEXTS);
  const audioNoise = 0.00001 + Math.random() * 0.00001;
  const webglNoise = {
    shaderNoise: Math.random() * 0.0001,
    bufferNoise: Math.random() * 0.0001
  };
  
  // Fonts based on OS
  const osKey2 = os === 'windows' ? 'windows' : os === 'macos' ? 'macos' : 'linux';
  const fonts = FONTS_BY_OS[osKey2];
  
  // Plugins based on browser
  const plugins = PLUGINS_BY_BROWSER[browser as keyof typeof PLUGINS_BY_BROWSER] || PLUGINS_BY_BROWSER.chrome;
  
  // Calculate available screen size (subtract taskbar)
  const taskbarHeight = os === 'windows' ? 40 : os === 'macos' ? 25 : 30;
  
  return {
    gpu: gpuRenderer.match(/NVIDIA|AMD|Intel|Apple/)?.[0] + ' Graphics' || 'Unknown GPU',
    gpuVendor,
    webglVendor: gpuVendor,
    webglRenderer: gpuRenderer,
    cpuCores: cpu.cores,
    deviceMemory: cpu.memory,
    screenWidth: screen.width,
    screenHeight: screen.height,
    availWidth: screen.width,
    availHeight: screen.height - taskbarHeight,
    colorDepth: 24,
    pixelRatio: screen.ratio,
    timezone,
    timezoneOffset,
    language: langConfig.primary,
    languages: langConfig.all,
    platform,
    userAgent,
    vendor,
    doNotTrack: pickRandom([null, '1', 'unspecified']),
    cookieEnabled: true,
    hardwareConcurrency: cpu.cores,
    maxTouchPoints: touch.maxTouchPoints,
    canvasNoise,
    audioNoise,
    audioSampleRate: audioContext.sampleRate,
    webglNoise,
    fonts,
    plugins,
    os,
    browser,
    browserVersion,
    country,
    confidence: 90 + Math.floor(Math.random() * 10) // 90-99%
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

// Validate fingerprint consistency - Enhanced
export function validateFingerprint(fp: GeneratedFingerprint): { valid: boolean; issues: string[]; score: number } {
  const issues: string[] = [];
  let score = 100;
  
  // Check OS/Platform consistency
  if (fp.os === 'windows' && fp.platform !== 'Win32') {
    issues.push('Platform mismatch with OS');
    score -= 20;
  }
  if (fp.os === 'macos' && fp.platform !== 'MacIntel') {
    issues.push('Platform mismatch with OS (macOS)');
    score -= 20;
  }
  if (fp.os === 'linux' && !fp.platform.includes('Linux')) {
    issues.push('Platform mismatch with OS (Linux)');
    score -= 20;
  }
  
  // Check User Agent consistency
  if (fp.os === 'windows' && !fp.userAgent.includes('Windows')) {
    issues.push('User Agent does not match OS');
    score -= 25;
  }
  if (fp.os === 'macos' && !fp.userAgent.includes('Mac')) {
    issues.push('User Agent does not match OS (macOS)');
    score -= 25;
  }
  
  // Check browser/vendor consistency
  if (fp.browser === 'chrome' && fp.vendor !== 'Google Inc.') {
    issues.push('Vendor mismatch for Chrome');
    score -= 15;
  }
  if (fp.browser === 'safari' && fp.vendor !== 'Apple Computer, Inc.') {
    issues.push('Vendor mismatch for Safari');
    score -= 15;
  }
  if (fp.browser === 'firefox' && fp.vendor !== '') {
    issues.push('Firefox should have empty vendor');
    score -= 10;
  }
  
  // Check screen resolution validity
  if (fp.screenWidth < 800 || fp.screenHeight < 600) {
    issues.push('Screen resolution too small');
    score -= 15;
  }
  
  // Check memory/cores ratio
  if (fp.deviceMemory < fp.cpuCores / 4) {
    issues.push('Memory too low for CPU cores');
    score -= 10;
  }
  
  // Check Safari only on macOS
  if (fp.browser === 'safari' && fp.os !== 'macos') {
    issues.push('Safari only available on macOS');
    score -= 30;
  }
  
  // Check WebGL renderer matches GPU vendor
  if (fp.webglVendor.includes('NVIDIA') && !fp.webglRenderer.includes('NVIDIA')) {
    issues.push('WebGL renderer mismatch with vendor');
    score -= 15;
  }
  
  // Check language matches timezone region
  const tzRegion = fp.timezone.split('/')[0];
  if (tzRegion === 'America' && !['en-US', 'en-CA', 'es-MX', 'pt-BR', 'es-AR'].some(l => fp.language.includes(l.split('-')[0]))) {
    // Minor issue, don't heavily penalize
    score -= 5;
  }
  
  return {
    valid: issues.length === 0 && score >= 70,
    issues,
    score: Math.max(0, score)
  };
}
