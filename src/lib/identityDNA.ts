/**
 * Living Identity DNA System
 * نظام الهوية الرقمية الحية لكل بروفايل
 */

import { FingerprintSettings } from '@/types';

// DNA Structure for each profile
export interface IdentityDNA {
  id: string;
  profileId: string;
  createdAt: Date;
  lastMutated: Date;
  generation: number; // How many times it has evolved
  
  // Core Identity Traits
  traits: DNATraits;
  
  // History of changes
  mutations: DNAMutation[];
  
  // Behavioral patterns linked to this identity
  behaviorPattern: BehaviorPattern;
  
  // Consistency score
  consistency: number; // 0-100
}

export interface DNATraits {
  // Hardware fingerprint
  hardware: {
    gpuVendor: string;
    gpuRenderer: string;
    cpuCores: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  
  // Screen characteristics
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: 'landscape' | 'portrait';
  };
  
  // Locale settings
  locale: {
    timezone: string;
    language: string;
    languages: string[];
    country: string;
  };
  
  // Browser characteristics
  browser: {
    userAgent: string;
    platform: string;
    vendor: string;
    doNotTrack: boolean;
    cookiesEnabled: boolean;
  };
  
  // WebGL fingerprint
  webgl: {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
  };
  
  // Audio fingerprint
  audio: {
    sampleRate: number;
    channelCount: number;
    noiseLevel: number;
  };
  
  // Canvas fingerprint seed
  canvas: {
    noiseSeed: number;
    colorVariation: number;
  };
}

export interface DNAMutation {
  id: string;
  timestamp: Date;
  field: string;
  oldValue: any;
  newValue: any;
  reason: MutationReason;
  gradual: boolean; // Whether this was a gradual change
}

export type MutationReason = 
  | 'natural_evolution'    // Regular gradual change
  | 'location_change'      // IP/location changed
  | 'browser_update'       // Browser version updated
  | 'user_requested'       // User manually changed
  | 'consistency_fix'      // Fixed inconsistency
  | 'risk_reduction';      // Changed to reduce risk

export interface BehaviorPattern {
  // Typing characteristics
  typingSpeed: {
    min: number;
    max: number;
    average: number;
  };
  
  // Mouse movement
  mouseSpeed: {
    min: number;
    max: number;
    acceleration: number;
  };
  
  // Activity patterns
  activity: {
    activeHours: number[]; // 0-23 hours of day
    sessionDuration: { min: number; max: number }; // minutes
    breakFrequency: number; // minutes between breaks
  };
  
  // Scroll behavior
  scrolling: {
    speed: 'slow' | 'medium' | 'fast';
    pattern: 'smooth' | 'stepped' | 'erratic';
  };
}

// DNA Generator
export function generateIdentityDNA(profileId: string, baseFingerprint?: FingerprintSettings): IdentityDNA {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    profileId,
    createdAt: now,
    lastMutated: now,
    generation: 1,
    traits: generateTraits(baseFingerprint),
    mutations: [],
    behaviorPattern: generateBehaviorPattern(),
    consistency: 100,
  };
}

function generateTraits(base?: FingerprintSettings): DNATraits {
  const gpuOptions = [
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)' },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11)' },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11)' },
  ];
  
  const selectedGpu = gpuOptions[Math.floor(Math.random() * gpuOptions.length)];
  
  const screenOptions = [
    { width: 1920, height: 1080, ratio: 1 },
    { width: 2560, height: 1440, ratio: 1.25 },
    { width: 1920, height: 1080, ratio: 1.25 },
    { width: 1366, height: 768, ratio: 1 },
  ];
  
  const selectedScreen = screenOptions[Math.floor(Math.random() * screenOptions.length)];
  
  const localeOptions = [
    { tz: 'America/New_York', lang: 'en-US', country: 'US' },
    { tz: 'Europe/London', lang: 'en-GB', country: 'UK' },
    { tz: 'Europe/Berlin', lang: 'de-DE', country: 'DE' },
    { tz: 'Europe/Paris', lang: 'fr-FR', country: 'FR' },
  ];
  
  const selectedLocale = localeOptions[Math.floor(Math.random() * localeOptions.length)];
  
  return {
    hardware: {
      gpuVendor: base?.gpuVendor || selectedGpu.vendor,
      gpuRenderer: base?.gpu || selectedGpu.renderer,
      cpuCores: base?.cpuCores || [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)],
      deviceMemory: base?.deviceMemory || [4, 8, 16, 32][Math.floor(Math.random() * 4)],
      maxTouchPoints: 0,
    },
    screen: {
      width: base?.screenWidth || selectedScreen.width,
      height: base?.screenHeight || selectedScreen.height,
      colorDepth: base?.colorDepth || 24,
      pixelRatio: base?.pixelRatio || selectedScreen.ratio,
      orientation: 'landscape',
    },
    locale: {
      timezone: base?.timezone || selectedLocale.tz,
      language: base?.language || selectedLocale.lang,
      languages: base?.languages || [selectedLocale.lang, 'en'],
      country: selectedLocale.country,
    },
    browser: {
      userAgent: base?.userAgent || `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
      platform: base?.platform || 'Win32',
      vendor: 'Google Inc.',
      doNotTrack: false,
      cookiesEnabled: true,
    },
    webgl: {
      vendor: base?.webglVendor || selectedGpu.vendor,
      renderer: base?.webglRenderer || selectedGpu.renderer,
      version: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
      shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    },
    audio: {
      sampleRate: 44100,
      channelCount: 2,
      noiseLevel: 0.00001 + Math.random() * 0.00001,
    },
    canvas: {
      noiseSeed: Math.floor(Math.random() * 1000000),
      colorVariation: Math.random() * 0.01,
    },
  };
}

function generateBehaviorPattern(): BehaviorPattern {
  return {
    typingSpeed: {
      min: 150 + Math.random() * 100,
      max: 350 + Math.random() * 150,
      average: 250 + Math.random() * 100,
    },
    mouseSpeed: {
      min: 200 + Math.random() * 100,
      max: 800 + Math.random() * 400,
      acceleration: 0.5 + Math.random() * 0.5,
    },
    activity: {
      activeHours: generateActiveHours(),
      sessionDuration: { min: 15 + Math.random() * 30, max: 90 + Math.random() * 60 },
      breakFrequency: 20 + Math.random() * 40,
    },
    scrolling: {
      speed: ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)] as any,
      pattern: ['smooth', 'stepped'][Math.floor(Math.random() * 2)] as any,
    },
  };
}

function generateActiveHours(): number[] {
  // Generate realistic active hours (e.g., 9AM-11PM with gaps)
  const baseHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const activeHours: number[] = [];
  
  for (const hour of baseHours) {
    if (Math.random() > 0.2) { // 80% chance to be active
      activeHours.push(hour);
    }
  }
  
  return activeHours;
}

// DNA Mutation Functions
export function mutateIdentityDNA(
  dna: IdentityDNA, 
  reason: MutationReason,
  changes?: Partial<DNATraits>
): IdentityDNA {
  const mutations: DNAMutation[] = [];
  const newTraits = { ...dna.traits };
  
  if (changes) {
    // Apply specific changes
    Object.entries(changes).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([field, value]) => {
          const path = `${category}.${field}`;
          const oldValue = (newTraits as any)[category]?.[field];
          
          if (oldValue !== value) {
            mutations.push({
              id: crypto.randomUUID(),
              timestamp: new Date(),
              field: path,
              oldValue,
              newValue: value,
              reason,
              gradual: reason === 'natural_evolution',
            });
            
            (newTraits as any)[category][field] = value;
          }
        });
      }
    });
  } else if (reason === 'natural_evolution') {
    // Apply gradual natural changes
    applyNaturalEvolution(newTraits, mutations);
  }
  
  return {
    ...dna,
    traits: newTraits,
    lastMutated: new Date(),
    generation: dna.generation + 1,
    mutations: [...dna.mutations, ...mutations].slice(-100), // Keep last 100 mutations
    consistency: calculateConsistency(newTraits),
  };
}

function applyNaturalEvolution(traits: DNATraits, mutations: DNAMutation[]): void {
  // Small random variations that don't break consistency
  
  // Slight canvas noise variation
  const newCanvasNoise = traits.canvas.noiseSeed + (Math.random() - 0.5) * 100;
  if (Math.abs(newCanvasNoise - traits.canvas.noiseSeed) > 10) {
    mutations.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      field: 'canvas.noiseSeed',
      oldValue: traits.canvas.noiseSeed,
      newValue: Math.floor(newCanvasNoise),
      reason: 'natural_evolution',
      gradual: true,
    });
    traits.canvas.noiseSeed = Math.floor(newCanvasNoise);
  }
  
  // Slight audio noise variation
  const newAudioNoise = traits.audio.noiseLevel * (0.95 + Math.random() * 0.1);
  mutations.push({
    id: crypto.randomUUID(),
    timestamp: new Date(),
    field: 'audio.noiseLevel',
    oldValue: traits.audio.noiseLevel,
    newValue: newAudioNoise,
    reason: 'natural_evolution',
    gradual: true,
  });
  traits.audio.noiseLevel = newAudioNoise;
}

function calculateConsistency(traits: DNATraits): number {
  let score = 100;
  
  // Check User Agent vs Platform consistency
  if (traits.browser.userAgent.includes('Windows') && traits.browser.platform !== 'Win32') {
    score -= 30;
  }
  if (traits.browser.userAgent.includes('Mac') && traits.browser.platform !== 'MacIntel') {
    score -= 30;
  }
  
  // Check GPU vendor consistency
  if (!traits.webgl.renderer.includes(traits.hardware.gpuVendor.split('(')[1]?.split(')')[0] || '')) {
    score -= 20;
  }
  
  // Check memory/cores ratio
  if (traits.hardware.deviceMemory < traits.hardware.cpuCores / 4) {
    score -= 15;
  }
  
  // Check screen ratio validity
  const ratio = traits.screen.width / traits.screen.height;
  if (ratio < 1 || ratio > 3) {
    score -= 10;
  }
  
  return Math.max(0, score);
}

// Convert DNA to FingerprintSettings for use with Chromium
export function dnaToFingerprint(dna: IdentityDNA): FingerprintSettings {
  return {
    gpu: dna.traits.hardware.gpuRenderer,
    gpuVendor: dna.traits.hardware.gpuVendor,
    cpu: 'Intel Core i9',
    cpuCores: dna.traits.hardware.cpuCores,
    deviceMemory: dna.traits.hardware.deviceMemory,
    screenWidth: dna.traits.screen.width,
    screenHeight: dna.traits.screen.height,
    colorDepth: dna.traits.screen.colorDepth,
    pixelRatio: dna.traits.screen.pixelRatio,
    timezone: dna.traits.locale.timezone,
    language: dna.traits.locale.language,
    languages: dna.traits.locale.languages,
    platform: dna.traits.browser.platform,
    hardwareConcurrency: dna.traits.hardware.cpuCores,
    webglVendor: dna.traits.webgl.vendor,
    webglRenderer: dna.traits.webgl.renderer,
    randomize: false,
    userAgent: dna.traits.browser.userAgent
  };
}
