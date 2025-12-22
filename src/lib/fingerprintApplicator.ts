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
  battery: {
    enabled: boolean;
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  };
  fonts: {
    enabled: boolean;
    fonts: string[];
  };
  clientHints: {
    enabled: boolean;
    brands: { brand: string; version: string }[];
    mobile: boolean;
    platform: string;
    platformVersion: string;
    architecture: string;
    model: string;
  };
  mediaDevices: {
    enabled: boolean;
    devices: { kind: string; label: string; deviceId: string; groupId: string }[];
  };
  performance: {
    enabled: boolean;
    noise: number;
  };
  speech: {
    enabled: boolean;
    voices: { name: string; lang: string }[];
  };
  webrtc: {
    enabled: boolean;
    mode: 'disable' | 'spoof' | 'real';
    publicIP?: string;
    localIP?: string;
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

// Battery API spoofing
function spoofBattery(config: FingerprintConfig['battery']) {
  if (!config.enabled) return () => {};
  
  const fakeBattery = {
    charging: config.charging,
    chargingTime: config.charging ? config.chargingTime : Infinity,
    dischargingTime: config.charging ? Infinity : config.dischargingTime,
    level: config.level / 100,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    onchargingchange: null,
    onchargingtimechange: null,
    ondischargingtimechange: null,
    onlevelchange: null
  };
  
  // Override getBattery
  const originalGetBattery = (navigator as any).getBattery;
  (navigator as any).getBattery = function() {
    return Promise.resolve(fakeBattery);
  };
  
  return () => {
    if (originalGetBattery) {
      (navigator as any).getBattery = originalGetBattery;
    }
  };
}

// Font fingerprint spoofing
function spoofFonts(fonts: string[]) {
  // Create a fake font detection function
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  
  // Override document.fonts if available
  if ('fonts' in document) {
    const originalCheck = (document.fonts as any).check?.bind(document.fonts);
    (document.fonts as any).check = function(font: string) {
      // Extract font family name
      const fontFamily = font.replace(/^\d+px\s*/, '').replace(/["']/g, '');
      if (fonts.includes(fontFamily)) {
        return true;
      }
      if (originalCheck) {
        return originalCheck(font);
      }
      return false;
    };
  }
  
  return () => {
    // Cleanup is complex for fonts, usually not needed in single session
  };
}

// Client Hints spoofing
function spoofClientHints(config: FingerprintConfig['clientHints']) {
  if (!config.enabled) return () => {};
  
  try {
    // Spoof userAgentData
    const fakeUserAgentData = {
      brands: config.brands,
      mobile: config.mobile,
      platform: config.platform,
      getHighEntropyValues: async (hints: string[]) => {
        const result: Record<string, any> = {
          brands: config.brands,
          mobile: config.mobile,
          platform: config.platform,
        };
        
        if (hints.includes('platformVersion')) {
          result.platformVersion = config.platformVersion;
        }
        if (hints.includes('architecture')) {
          result.architecture = config.architecture;
        }
        if (hints.includes('model')) {
          result.model = config.model;
        }
        if (hints.includes('uaFullVersion')) {
          result.uaFullVersion = config.brands[0]?.version || '120.0.0.0';
        }
        
        return result;
      },
      toJSON: () => ({
        brands: config.brands,
        mobile: config.mobile,
        platform: config.platform
      })
    };
    
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => fakeUserAgentData,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not spoof client hints:', e);
  }
  
  return () => {};
}

// Media Devices spoofing
function spoofMediaDevices(config: FingerprintConfig['mediaDevices']) {
  if (!config.enabled) return () => {};
  
  const originalEnumerateDevices = navigator.mediaDevices?.enumerateDevices?.bind(navigator.mediaDevices);
  
  if (navigator.mediaDevices) {
    navigator.mediaDevices.enumerateDevices = async function() {
      return config.devices.map(device => ({
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind as MediaDeviceKind,
        label: device.label,
        toJSON: () => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label
        })
      }));
    };
  }
  
  return () => {
    if (originalEnumerateDevices && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices = originalEnumerateDevices;
    }
  };
}

// Performance API spoofing - add noise to timing
function spoofPerformance(noise: number) {
  if (noise <= 0) return () => {};
  
  const originalNow = Performance.prototype.now;
  let offset = (Math.random() - 0.5) * noise;
  
  Performance.prototype.now = function() {
    const realTime = originalNow.call(this);
    // Add small random noise to timing
    return realTime + offset + (Math.random() - 0.5) * (noise / 10);
  };
  
  // Also spoof Date.now for consistency
  const originalDateNow = Date.now;
  Date.now = function() {
    return originalDateNow() + Math.floor(offset);
  };
  
  return () => {
    Performance.prototype.now = originalNow;
    Date.now = originalDateNow;
  };
}

// Speech Synthesis spoofing
function spoofSpeechSynthesis(config: FingerprintConfig['speech']) {
  if (!config.enabled) return () => {};
  
  if ('speechSynthesis' in window) {
    const fakeVoices = config.voices.map((voice, index) => ({
      default: index === 0,
      lang: voice.lang,
      localService: true,
      name: voice.name,
      voiceURI: voice.name
    }));
    
    const originalGetVoices = speechSynthesis.getVoices?.bind(speechSynthesis);
    
    speechSynthesis.getVoices = function() {
      return fakeVoices as SpeechSynthesisVoice[];
    };
    
    return () => {
      if (originalGetVoices) {
        speechSynthesis.getVoices = originalGetVoices;
      }
    };
  }
  
  return () => {};
}

// WebRTC spoofing / disabling
function spoofWebRTC(config: FingerprintConfig['webrtc']) {
  if (!config.enabled) return () => {};
  
  const originalRTCPeerConnection = window.RTCPeerConnection;
  const originalWebkitRTCPeerConnection = (window as any).webkitRTCPeerConnection;
  
  if (config.mode === 'disable') {
    // Completely disable WebRTC
    (window as any).RTCPeerConnection = undefined;
    (window as any).webkitRTCPeerConnection = undefined;
    (window as any).RTCDataChannel = undefined;
    (window as any).RTCSessionDescription = undefined;
    
    // Also disable getUserMedia
    if (navigator.mediaDevices) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia?.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async function() {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    }
  } else if (config.mode === 'spoof' && originalRTCPeerConnection) {
    // Spoof WebRTC to return fake IPs
    class FakeRTCPeerConnection extends originalRTCPeerConnection {
      constructor(configuration?: RTCConfiguration) {
        super(configuration);
        
        // Override onicecandidate
        const originalAddEventListener = this.addEventListener.bind(this);
        this.addEventListener = function(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
          if (type === 'icecandidate') {
            const wrappedListener = function(event: RTCPeerConnectionIceEvent) {
              if (event.candidate && event.candidate.candidate) {
                // Replace real IPs with spoofed ones
                const spoofedCandidate = event.candidate.candidate
                  .replace(/(\d{1,3}\.){3}\d{1,3}/g, config.publicIP || '192.168.1.1');
                
                const fakeEvent = {
                  ...event,
                  candidate: {
                    ...event.candidate,
                    candidate: spoofedCandidate
                  }
                };
                (listener as any)(fakeEvent);
              } else {
                (listener as any)(event);
              }
            };
            return originalAddEventListener(type, wrappedListener as EventListener, options);
          }
          return originalAddEventListener(type, listener, options);
        };
      }
    }
    
    (window as any).RTCPeerConnection = FakeRTCPeerConnection;
    if (originalWebkitRTCPeerConnection) {
      (window as any).webkitRTCPeerConnection = FakeRTCPeerConnection;
    }
  }
  
  return () => {
    if (originalRTCPeerConnection) {
      window.RTCPeerConnection = originalRTCPeerConnection;
    }
    if (originalWebkitRTCPeerConnection) {
      (window as any).webkitRTCPeerConnection = originalWebkitRTCPeerConnection;
    }
  };
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
  
  // Battery
  if (config.battery?.enabled) {
    const cleanup = spoofBattery(config.battery);
    cleanupFunctions.push(cleanup);
  }
  
  // Fonts
  if (config.fonts?.enabled) {
    const cleanup = spoofFonts(config.fonts.fonts);
    cleanupFunctions.push(cleanup);
  }
  
  // Client Hints
  if (config.clientHints?.enabled) {
    const cleanup = spoofClientHints(config.clientHints);
    cleanupFunctions.push(cleanup);
  }
  
  // Media Devices
  if (config.mediaDevices?.enabled) {
    const cleanup = spoofMediaDevices(config.mediaDevices);
    cleanupFunctions.push(cleanup);
  }
  
  // Performance
  if (config.performance?.enabled) {
    const cleanup = spoofPerformance(config.performance.noise);
    cleanupFunctions.push(cleanup);
  }
  
  // Speech Synthesis
  if (config.speech?.enabled) {
    const cleanup = spoofSpeechSynthesis(config.speech);
    cleanupFunctions.push(cleanup);
  }
  
  // WebRTC
  if (config.webrtc?.enabled) {
    const cleanup = spoofWebRTC(config.webrtc);
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
  let batteryInfo = null;
  let fonts: string[] = [];
  let clientHints = null;
  let mediaDevices: any[] = [];
  let voices: any[] = [];
  let webrtcIPs: string[] = [];
  
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
  
  // Battery info
  try {
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInfo = {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      });
    }
  } catch {}
  
  // Client Hints
  try {
    if ((navigator as any).userAgentData) {
      clientHints = {
        brands: (navigator as any).userAgentData.brands,
        mobile: (navigator as any).userAgentData.mobile,
        platform: (navigator as any).userAgentData.platform
      };
    }
  } catch {}
  
  // Media Devices
  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        mediaDevices = devices.map(d => ({
          kind: d.kind,
          label: d.label,
          deviceId: d.deviceId.slice(0, 10)
        }));
      });
    }
  } catch {}
  
  // Speech Voices
  try {
    if ('speechSynthesis' in window) {
      voices = speechSynthesis.getVoices().map(v => ({
        name: v.name,
        lang: v.lang
      }));
    }
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
    
    // Battery
    battery: batteryInfo,
    
    // Client Hints
    clientHints,
    
    // Media Devices
    mediaDevices,
    
    // Speech Voices
    voices,
    
    // WebRTC
    webrtcEnabled: !!window.RTCPeerConnection,
    
    // Plugins
    pluginsCount: navigator.plugins.length,
    
    // WebDriver
    webdriver: (navigator as any).webdriver
  };
}

// Generate random fingerprint config
export function generateRandomFingerprint(): FingerprintConfig {
  const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
  const vendors = ['Google Inc.', 'Intel Inc.', 'NVIDIA Corporation', 'AMD'];
  const renderers = [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)',
    'ANGLE (Intel, Intel(R) UHD Graphics 630)',
    'ANGLE (AMD, AMD Radeon RX 6800 XT)',
    'Apple GPU'
  ];
  const timezones = [
    { offset: -480, name: 'America/Los_Angeles' },
    { offset: -300, name: 'America/New_York' },
    { offset: 0, name: 'Europe/London' },
    { offset: 60, name: 'Europe/Paris' },
    { offset: 180, name: 'Asia/Riyadh' }
  ];
  const resolutions = [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 }
  ];
  
  const randomTimezone = timezones[Math.floor(Math.random() * timezones.length)];
  const randomResolution = resolutions[Math.floor(Math.random() * resolutions.length)];
  
  return {
    canvas: {
      enabled: true,
      noise: Math.floor(Math.random() * 30) + 10
    },
    webgl: {
      enabled: true,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      renderer: renderers[Math.floor(Math.random() * renderers.length)]
    },
    navigator: {
      enabled: true,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      hardwareConcurrency: [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)],
      deviceMemory: [4, 8, 16, 32][Math.floor(Math.random() * 4)],
      maxTouchPoints: Math.random() > 0.7 ? 10 : 0,
      languages: ['en-US', 'en']
    },
    screen: {
      enabled: true,
      width: randomResolution.width,
      height: randomResolution.height,
      colorDepth: 24
    },
    timezone: {
      enabled: true,
      offset: randomTimezone.offset,
      name: randomTimezone.name
    },
    audio: {
      enabled: true,
      noise: Math.floor(Math.random() * 20) + 5
    },
    battery: {
      enabled: true,
      level: Math.floor(Math.random() * 60) + 40,
      charging: Math.random() > 0.5,
      chargingTime: Math.floor(Math.random() * 3600),
      dischargingTime: Math.floor(Math.random() * 14400) + 3600
    },
    fonts: {
      enabled: true,
      fonts: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New']
    },
    clientHints: {
      enabled: true,
      brands: [
        { brand: 'Google Chrome', version: '120' },
        { brand: 'Chromium', version: '120' },
        { brand: 'Not_A Brand', version: '24' }
      ],
      mobile: false,
      platform: 'Windows',
      platformVersion: '10.0.0',
      architecture: 'x86',
      model: ''
    },
    mediaDevices: {
      enabled: true,
      devices: [
        { kind: 'audioinput', label: 'Default - Microphone', deviceId: crypto.randomUUID(), groupId: crypto.randomUUID() },
        { kind: 'audiooutput', label: 'Default - Speakers', deviceId: crypto.randomUUID(), groupId: crypto.randomUUID() },
        { kind: 'videoinput', label: 'Integrated Webcam', deviceId: crypto.randomUUID(), groupId: crypto.randomUUID() }
      ]
    },
    performance: {
      enabled: true,
      noise: 5
    },
    speech: {
      enabled: true,
      voices: [
        { name: 'Microsoft David Desktop', lang: 'en-US' },
        { name: 'Microsoft Zira Desktop', lang: 'en-US' },
        { name: 'Google US English', lang: 'en-US' }
      ]
    },
    webrtc: {
      enabled: true,
      mode: 'spoof',
      publicIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      localIP: '192.168.1.1'
    }
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
