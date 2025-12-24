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
  generation: number;
  traits: DNATraits;
  mutations: DNAMutation[];
  behaviorPattern: BehaviorPattern;
  consistency: number;
}

export interface DNATraits {
  hardware: {
    gpuVendor: string;
    gpuRenderer: string;
    cpuCores: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: 'landscape' | 'portrait';
  };
  locale: {
    timezone: string;
    language: string;
    languages: string[];
    country: string;
  };
  browser: {
    userAgent: string;
    platform: string;
    vendor: string;
    doNotTrack: boolean;
    cookiesEnabled: boolean;
  };
  webgl: {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
  };
  audio: {
    sampleRate: number;
    channelCount: number;
    noiseLevel: number;
  };
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
  gradual: boolean;
}

export type MutationReason = 
  | 'natural_evolution'
  | 'location_change'
  | 'browser_update'
  | 'user_requested'
  | 'consistency_fix'
  | 'risk_reduction';

export interface BehaviorPattern {
  typingSpeed: {
    min: number;
    max: number;
    average: number;
  };
  mouseSpeed: {
    min: number;
    max: number;
    acceleration: number;
  };
  activity: {
    activeHours: number[];
    sessionDuration: { min: number; max: number };
    breakFrequency: number;
  };
  scrolling: {
    speed: 'slow' | 'medium' | 'fast';
    pattern: 'smooth' | 'stepped' | 'erratic';
  };
}

// Helper to generate unique IDs without crypto.randomUUID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// DNA Generator
export function generateIdentityDNA(profileId: string, baseFingerprint?: FingerprintSettings): IdentityDNA {
  const now = new Date();
  
  return {
    id: generateId(),
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
  ];
  
  const selectedScreen = screenOptions[Math.floor(Math.random() * screenOptions.length)];
  
  const localeOptions = [
    { tz: 'America/New_York', lang: 'en-US', country: 'US' },
    { tz: 'Asia/Riyadh', lang: 'ar-SA', country: 'SA' },
  ];
  
  const selectedLocale = localeOptions[Math.floor(Math.random() * localeOptions.length)];
  
  return {
    hardware: {
      gpuVendor: base?.gpuVendor || selectedGpu.vendor,
      gpuRenderer: base?.gpu || selectedGpu.renderer,
      cpuCores: base?.cpuCores || 8,
      deviceMemory: base?.deviceMemory || 16,
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
      userAgent: base?.userAgent || `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`,
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
      noiseLevel: 0.00001,
    },
    canvas: {
      noiseSeed: Math.floor(Math.random() * 1000000),
      colorVariation: 0.01,
    },
  };
}

function generateBehaviorPattern(): BehaviorPattern {
  return {
    typingSpeed: { min: 150, max: 350, average: 250 },
    mouseSpeed: { min: 200, max: 800, acceleration: 0.5 },
    activity: {
      activeHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      sessionDuration: { min: 15, max: 90 },
      breakFrequency: 30,
    },
    scrolling: {
      speed: 'medium',
      pattern: 'smooth',
    },
  };
}

export function mutateIdentityDNA(dna: IdentityDNA, reason: MutationReason, changes?: Partial<DNATraits>): IdentityDNA {
  const mutations: DNAMutation[] = [];
  const newTraits = { ...dna.traits };
  
  if (changes) {
    Object.entries(changes).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([field, value]) => {
          const path = `${category}.${field}`;
          const oldValue = (newTraits as any)[category]?.[field];
          if (oldValue !== value) {
            mutations.push({
              id: generateId(),
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
  }
  
  return {
    ...dna,
    traits: newTraits,
    lastMutated: new Date(),
    generation: dna.generation + 1,
    mutations: [...dna.mutations, ...mutations].slice(-100),
    consistency: 100,
  };
}

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
