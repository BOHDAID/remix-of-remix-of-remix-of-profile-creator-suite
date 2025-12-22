// Real Fingerprint Application Library
// This applies fingerprint spoofing in the current browser context

export interface FingerprintConfig {
  canvas: {
    enabled: boolean;
    noise: number;
  };
  webgl: {
    enabled: boolean;
    vendor: string;
    renderer: string;
  };
  navigator: {
    enabled: boolean;
    platform: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
    languages: string[];
  };
  screen: {
    enabled: boolean;
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: {
    enabled: boolean;
    offset: number;
    name: string;
  };
  audio: {
    enabled: boolean;
    noise: number;
  };
}

// Store original values
const originalValues = {
  navigatorPlatform: navigator.platform,
  hardwareConcurrency: navigator.hardwareConcurrency,
  deviceMemory: (navigator as any).deviceMemory,
  maxTouchPoints: navigator.maxTouchPoints,
  languages: navigator.languages,
  screenWidth: screen.width,
  screenHeight: screen.height,
  colorDepth: screen.colorDepth,
  timezoneOffset: new Date().getTimezoneOffset()
};

// Canvas fingerprint spoofing
function spoofCanvas(noise: number) {
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: any) {
    const context = this.getContext('2d');
    if (context && noise > 0) {
      const imageData = context.getImageData(0, 0, this.width, this.height);
      const data = imageData.data;
      
      // Add noise to canvas data
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < noise / 100) {
          data[i] = Math.min(255, Math.max(0, data[i] + Math.floor(Math.random() * 3) - 1));     // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + Math.floor(Math.random() * 3) - 1)); // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + Math.floor(Math.random() * 3) - 1)); // B
        }
      }
      
      context.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.call(this, type, quality);
  };
  
  return () => {
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
  };
}

// WebGL fingerprint spoofing
function spoofWebGL(vendor: string, renderer: string) {
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  
  WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
    const UNMASKED_VENDOR_WEBGL = 37445;
    const UNMASKED_RENDERER_WEBGL = 37446;
    
    if (parameter === UNMASKED_VENDOR_WEBGL) {
      return vendor;
    }
    if (parameter === UNMASKED_RENDERER_WEBGL) {
      return renderer;
    }
    return originalGetParameter.call(this, parameter);
  };
  
  // Also spoof WebGL2
  if (window.WebGL2RenderingContext) {
    const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
    
    WebGL2RenderingContext.prototype.getParameter = function(parameter: number) {
      const UNMASKED_VENDOR_WEBGL = 37445;
      const UNMASKED_RENDERER_WEBGL = 37446;
      
      if (parameter === UNMASKED_VENDOR_WEBGL) {
        return vendor;
      }
      if (parameter === UNMASKED_RENDERER_WEBGL) {
        return renderer;
      }
      return originalGetParameter2.call(this, parameter);
    };
  }
  
  return () => {
    WebGLRenderingContext.prototype.getParameter = originalGetParameter;
  };
}

// Navigator spoofing using property descriptors
function spoofNavigator(config: FingerprintConfig['navigator']) {
  const spoofedProps: PropertyDescriptorMap = {};
  
  if (config.platform) {
    spoofedProps.platform = {
      get: () => config.platform,
      configurable: true
    };
  }
  
  if (config.hardwareConcurrency) {
    spoofedProps.hardwareConcurrency = {
      get: () => config.hardwareConcurrency,
      configurable: true
    };
  }
  
  if (config.deviceMemory) {
    spoofedProps.deviceMemory = {
      get: () => config.deviceMemory,
      configurable: true
    };
  }
  
  if (config.maxTouchPoints !== undefined) {
    spoofedProps.maxTouchPoints = {
      get: () => config.maxTouchPoints,
      configurable: true
    };
  }
  
  if (config.languages) {
    spoofedProps.languages = {
      get: () => Object.freeze([...config.languages]),
      configurable: true
    };
    spoofedProps.language = {
      get: () => config.languages[0],
      configurable: true
    };
  }
  
  try {
    Object.defineProperties(navigator, spoofedProps);
  } catch (e) {
    console.warn('Could not spoof navigator properties:', e);
  }
}

// Screen spoofing
function spoofScreen(width: number, height: number, colorDepth: number) {
  const spoofedProps: PropertyDescriptorMap = {
    width: { get: () => width, configurable: true },
    height: { get: () => height, configurable: true },
    availWidth: { get: () => width, configurable: true },
    availHeight: { get: () => height - 40, configurable: true },
    colorDepth: { get: () => colorDepth, configurable: true },
    pixelDepth: { get: () => colorDepth, configurable: true }
  };
  
  try {
    Object.defineProperties(screen, spoofedProps);
  } catch (e) {
    console.warn('Could not spoof screen properties:', e);
  }
}

// Timezone spoofing
function spoofTimezone(offset: number, name: string) {
  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
  
  Date.prototype.getTimezoneOffset = function() {
    return offset;
  };
  
  // Spoof Intl.DateTimeFormat
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  Intl.DateTimeFormat.prototype.resolvedOptions = function() {
    const result = originalResolvedOptions.call(this);
    result.timeZone = name;
    return result;
  };
  
  return () => {
    Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
  };
}

// Audio fingerprint noise
function spoofAudio(noise: number) {
  const originalGetChannelData = AudioBuffer.prototype.getChannelData;
  
  AudioBuffer.prototype.getChannelData = function(channel: number) {
    const data = originalGetChannelData.call(this, channel);
    if (noise > 0) {
      for (let i = 0; i < data.length; i++) {
        data[i] += (Math.random() * 2 - 1) * (noise / 10000);
      }
    }
    return data;
  };
  
  return () => {
    AudioBuffer.prototype.getChannelData = originalGetChannelData;
  };
}

// Hide WebDriver flag
function hideWebDriver() {
  try {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });
    
    // Remove automation flags
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    
    // Chrome detection
    if ((window as any).chrome) {
      (window as any).chrome.runtime = {};
    }
    
  } catch (e) {
    console.warn('Could not hide webdriver:', e);
  }
}

// Apply all fingerprint spoofing
export function applyFingerprint(config: FingerprintConfig): () => void {
  const cleanupFunctions: Array<() => void> = [];
  
  // Hide automation
  hideWebDriver();
  
  // Canvas
  if (config.canvas.enabled) {
    const cleanup = spoofCanvas(config.canvas.noise);
    cleanupFunctions.push(cleanup);
  }
  
  // WebGL
  if (config.webgl.enabled) {
    const cleanup = spoofWebGL(config.webgl.vendor, config.webgl.renderer);
    cleanupFunctions.push(cleanup);
  }
  
  // Navigator
  if (config.navigator.enabled) {
    spoofNavigator(config.navigator);
  }
  
  // Screen
  if (config.screen.enabled) {
    spoofScreen(config.screen.width, config.screen.height, config.screen.colorDepth);
  }
  
  // Timezone
  if (config.timezone.enabled) {
    const cleanup = spoofTimezone(config.timezone.offset, config.timezone.name);
    cleanupFunctions.push(cleanup);
  }
  
  // Audio
  if (config.audio.enabled) {
    const cleanup = spoofAudio(config.audio.noise);
    cleanupFunctions.push(cleanup);
  }
  
  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(fn => fn());
  };
}

// Get current fingerprint values
export function getCurrentFingerprint(): Record<string, any> {
  let canvasHash = '';
  let webglVendor = '';
  let webglRenderer = '';
  let audioHash = '';
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Hello, World!', 2, 15);
      canvasHash = canvas.toDataURL().slice(-50);
    }
  } catch {}
  
  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      }
    }
  } catch {}
  
  // Audio fingerprint
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gain = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    
    oscillator.connect(analyser);
    analyser.connect(gain);
    gain.connect(audioContext.destination);
    
    oscillator.start(0);
    
    const bins = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(bins);
    
    oscillator.stop();
    audioContext.close();
    
    audioHash = bins.slice(0, 10).join(',').slice(0, 50);
  } catch {}
  
  return {
    // Navigator
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: [...navigator.languages],
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    
    // Screen
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    
    // Timezone
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Canvas
    canvasHash,
    
    // WebGL
    webglVendor,
    webglRenderer,
    
    // Audio
    audioHash,
    
    // Plugins
    pluginsCount: navigator.plugins.length,
    
    // WebDriver
    webdriver: (navigator as any).webdriver
  };
}

// Compare fingerprints
export function compareFingerprints(fp1: Record<string, any>, fp2: Record<string, any>): {
  matches: string[];
  differences: { key: string; before: any; after: any }[];
} {
  const matches: string[] = [];
  const differences: { key: string; before: any; after: any }[] = [];
  
  const keys = new Set([...Object.keys(fp1), ...Object.keys(fp2)]);
  
  keys.forEach(key => {
    const v1 = JSON.stringify(fp1[key]);
    const v2 = JSON.stringify(fp2[key]);
    
    if (v1 === v2) {
      matches.push(key);
    } else {
      differences.push({ key, before: fp1[key], after: fp2[key] });
    }
  });
  
  return { matches, differences };
}
