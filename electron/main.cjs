const { app, BrowserWindow, ipcMain, dialog, shell, screen, session, desktopCapturer } = require('electron');
const path = require('path');
const { spawn, exec: execRaw } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Wrapper for exec with increased maxBuffer to prevent "stderr maxBuffer length exceeded" errors
const exec = (command, callback) => {
  return execRaw(command, { maxBuffer: 50 * 1024 * 1024 }, callback);
};

let mainWindow;
// Store running browser processes by profile ID
const runningProfiles = new Map();
// Store captured sessions
const capturedSessions = new Map();

// Create fingerprint injection extension - ADVANCED UNDETECTABLE VERSION
function createFingerprintScript(fingerprint, userDataDir) {
  try {
    const extensionDir = path.join(userDataDir, 'fingerprint-extension');
    
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    
    // manifest.json - Using Manifest V3 with MAIN world for proper injection
    const manifest = {
      manifest_version: 3,
      name: "System Helper",
      version: "1.0",
      permissions: [],
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["inject.js"],
        run_at: "document_start",
        all_frames: true,
        world: "MAIN"
      }]
    };
    
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Extract browser version from UserAgent for consistency
    const extractChromeVersion = (ua) => {
      if (!ua) return '131';
      const match = ua.match(/Chrome\/([0-9]+)/);
      return match ? match[1] : '131';
    };
    
    const chromeVersion = extractChromeVersion(fingerprint.userAgent);
    
    // Generate consistent Client Hints based on UserAgent
    const generateClientHints = (ua, platform) => {
      const version = extractChromeVersion(ua);
      return {
        brands: [
          { brand: 'Google Chrome', version },
          { brand: 'Chromium', version },
          { brand: 'Not_A Brand', version: '24' }
        ],
        platform: platform?.includes('Mac') ? 'macOS' : platform?.includes('Linux') ? 'Linux' : 'Windows',
        platformVersion: platform?.includes('Mac') ? '14.0.0' : platform?.includes('Linux') ? '6.5.0' : '15.0.0'
      };
    };
    
    const clientHints = generateClientHints(fingerprint.userAgent, fingerprint.platform);
    
    // Merge client hints into fingerprint
    const enhancedFingerprint = {
      ...fingerprint,
      chromeVersion,
      clientHintsBrands: clientHints.brands,
      clientHintsPlatform: clientHints.platform,
      platformVersion: clientHints.platformVersion
    };
    
    // inject.js - ADVANCED UNDETECTABLE SPOOFING
    const injectScript = `
(function() {
  'use strict';
  
  // ========== ANTI-DETECTION: Protect Native Functions ==========
  const _Object = Object;
  const _Reflect = typeof Reflect !== 'undefined' ? Reflect : null;
  const _Error = Error;
  
  // Store native function references before any modifications
  const nativeToString = Function.prototype.toString;
  const nativeDefineProperty = Object.defineProperty;
  const nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  
  // Create a map to track our modified functions
  const modifiedFunctions = new WeakMap();
  const nativeFunctionStrings = new Map();
  
  // Helper to make our spoofed functions look native
  function makeNative(fn, nativeName) {
    const nativeCode = 'function ' + nativeName + '() { [native code] }';
    nativeFunctionStrings.set(fn, nativeCode);
    modifiedFunctions.set(fn, true);
    return fn;
  }
  
  // Override Function.prototype.toString to hide our modifications
  Function.prototype.toString = function() {
    if (nativeFunctionStrings.has(this)) {
      return nativeFunctionStrings.get(this);
    }
    return nativeToString.call(this);
  };
  makeNative(Function.prototype.toString, 'toString');
  
  const fp = ${JSON.stringify(enhancedFingerprint)};
  
  // ========== SAFE PROPERTY OVERRIDE ==========
  function safeDefineProperty(obj, prop, descriptor) {
    try {
      // Store original descriptor
      const original = nativeGetOwnPropertyDescriptor.call(_Object, obj, prop);
      
      // Create a getter that looks native
      if (descriptor.get) {
        const getter = descriptor.get;
        makeNative(getter, 'get ' + prop);
      }
      
      nativeDefineProperty.call(_Object, obj, prop, {
        ...descriptor,
        configurable: true,
        enumerable: original ? original.enumerable : true
      });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // ========== NAVIGATOR OVERRIDE (NATIVE-LOOKING) ==========
  const navigatorProps = {
    hardwareConcurrency: fp.cpuCores || fp.hardwareConcurrency || 8,
    deviceMemory: fp.deviceMemory || 8,
    platform: fp.platform || 'Win32',
    language: fp.language || 'en-US',
    languages: _Object.freeze(fp.languages || [fp.language || 'en-US']),
    maxTouchPoints: fp.maxTouchPoints || 0,
    vendor: fp.vendor || 'Google Inc.',
    userAgent: fp.userAgent || navigator.userAgent
  };
  
  for (const [key, value] of _Object.entries(navigatorProps)) {
    safeDefineProperty(Navigator.prototype, key, {
      get: function() { return value; }
    });
  }
  
  // ========== WEBDRIVER HIDING - CRITICAL FOR BOT DETECTION ==========
  // Multiple layers of protection
  safeDefineProperty(Navigator.prototype, 'webdriver', {
    get: function() { return false; }
  });
  
  safeDefineProperty(navigator, 'webdriver', {
    get: function() { return undefined; }
  });
  
  // Remove all automation traces
  const automationProps = [
    'webdriver', '__webdriver_evaluate', '__selenium_evaluate', 
    '__webdriver_script_function', '__webdriver_script_func', '__webdriver_script_fn',
    '__fxdriver_evaluate', '__driver_unwrapped', '__webdriver_unwrapped',
    '__driver_evaluate', '__selenium_unwrapped', '__fxdriver_unwrapped',
    '_Selenium_IDE_Recorder', '_selenium', 'calledSelenium',
    '$cdc_asdjflasutopfhvcZLmcfl_', 'cdc_adoQpoasnfa76pfcZLmcfl_Array',
    'cdc_adoQpoasnfa76pfcZLmcfl_Promise', 'cdc_adoQpoasnfa76pfcZLmcfl_Symbol',
    '__nightmare', '__phantomas', '_phantom', 'phantom', 'callPhantom',
    'domAutomation', 'domAutomationController'
  ];
  
  for (const prop of automationProps) {
    try {
      delete window[prop];
      safeDefineProperty(window, prop, { get: () => undefined, set: () => {} });
    } catch (e) {}
  }
  
  // ========== CHROME RUNTIME SPOOFING ==========
  if (!window.chrome) {
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      connect: function() {},
      sendMessage: function() {}
    };
    makeNative(window.chrome.runtime.connect, 'connect');
    makeNative(window.chrome.runtime.sendMessage, 'sendMessage');
  }
  
  // ========== PLUGINS & MIME TYPES ==========
  const pluginData = [
    { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
    { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
  ];
  
  const mimeTypes = [
    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
    { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' }
  ];
  
  // ========== SCREEN PROPERTIES ==========
  const screenWidth = fp.screenWidth || 1920;
  const screenHeight = fp.screenHeight || 1080;
  const colorDepth = fp.colorDepth || 24;
  const pixelRatio = fp.pixelRatio || 1;
  
  const screenProps = {
    width: screenWidth,
    height: screenHeight,
    availWidth: screenWidth,
    availHeight: screenHeight - 40,
    colorDepth: colorDepth,
    pixelDepth: colorDepth
  };
  
  for (const [key, value] of _Object.entries(screenProps)) {
    safeDefineProperty(Screen.prototype, key, { get: () => value });
  }
  
  // ========== WINDOW PROPERTIES ==========
  const windowInnerWidth = screenWidth - 10;
  const windowInnerHeight = screenHeight - 80;
  
  safeDefineProperty(window, 'devicePixelRatio', { get: () => pixelRatio });
  safeDefineProperty(window, 'innerWidth', { get: () => windowInnerWidth });
  safeDefineProperty(window, 'innerHeight', { get: () => windowInnerHeight });
  safeDefineProperty(window, 'outerWidth', { get: () => screenWidth });
  safeDefineProperty(window, 'outerHeight', { get: () => screenHeight });
  
  // ========== WEBGL SPOOFING - UNDETECTABLE ==========
  const webglVendor = fp.webglVendor || fp.gpuVendor || 'Google Inc. (NVIDIA)';
  const webglRenderer = fp.webglRenderer || fp.gpu || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
  
  // Store originals
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
  
  // Override getParameter - CRITICAL
  WebGLRenderingContext.prototype.getParameter = function(param) {
    // UNMASKED_VENDOR_WEBGL
    if (param === 37445) return webglVendor;
    // UNMASKED_RENDERER_WEBGL  
    if (param === 37446) return webglRenderer;
    // RENDERER
    if (param === 0x1F01) return webglRenderer;
    // VENDOR
    if (param === 0x1F00) return webglVendor;
    return originalGetParameter.call(this, param);
  };
  makeNative(WebGLRenderingContext.prototype.getParameter, 'getParameter');
  
  // WebGL2 support
  if (typeof WebGL2RenderingContext !== 'undefined') {
    const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return webglVendor;
      if (param === 37446) return webglRenderer;
      if (param === 0x1F01) return webglRenderer;
      if (param === 0x1F00) return webglVendor;
      return originalGetParameter2.call(this, param);
    };
    makeNative(WebGL2RenderingContext.prototype.getParameter, 'getParameter');
  }
  
  // ========== CANVAS FINGERPRINT - SUBTLE NOISE ==========
  // Use a seeded random for consistent but unique noise per session
  const canvasSeed = (fp.canvasSeed || Math.random()) * 10000;
  let canvasRng = canvasSeed;
  
  function seededRandom() {
    canvasRng = (canvasRng * 9301 + 49297) % 233280;
    return canvasRng / 233280;
  }
  
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  
  // Noise level - very subtle (1-3 for undetectable)
  const noiseLevel = Math.min(fp.canvasNoise || 2, 5);
  
  function addSubtleNoise(value) {
    if (seededRandom() > 0.1) return value; // Only modify 10% of pixels
    const noise = Math.floor((seededRandom() - 0.5) * noiseLevel);
    return Math.max(0, Math.min(255, value + noise));
  }
  
  CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
    const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
    const data = imageData.data;
    
    // Apply very subtle noise - undetectable by most tests
    for (let i = 0; i < data.length; i += 4) {
      data[i] = addSubtleNoise(data[i]);     // R
      data[i+1] = addSubtleNoise(data[i+1]); // G  
      data[i+2] = addSubtleNoise(data[i+2]); // B
      // Alpha unchanged
    }
    return imageData;
  };
  makeNative(CanvasRenderingContext2D.prototype.getImageData, 'getImageData');
  
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    return originalToDataURL.apply(this, args);
  };
  makeNative(HTMLCanvasElement.prototype.toDataURL, 'toDataURL');
  
  // ========== AUDIO FINGERPRINT - SUBTLE MODIFICATION ==========
  if (typeof AudioBuffer !== 'undefined') {
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    const audioSeed = (fp.audioSeed || Math.random()) * 1000;
    let audioRng = audioSeed;
    
    function audioSeededRandom() {
      audioRng = (audioRng * 9301 + 49297) % 233280;
      return audioRng / 233280;
    }
    
    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = originalGetChannelData.call(this, channel);
      // Very subtle noise - only on specific samples
      const noiseAmount = 0.00001;
      for (let i = 0; i < data.length; i += 500) { // Sparse modification
        if (audioSeededRandom() > 0.5) {
          data[i] += (audioSeededRandom() - 0.5) * noiseAmount;
        }
      }
      return data;
    };
    makeNative(AudioBuffer.prototype.getChannelData, 'getChannelData');
  }
  
  if (typeof AnalyserNode !== 'undefined') {
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
      originalGetFloatFrequencyData.call(this, array);
    };
    makeNative(AnalyserNode.prototype.getFloatFrequencyData, 'getFloatFrequencyData');
  }
  
  // ========== WEBRTC PROTECTION ==========
  if (typeof RTCPeerConnection !== 'undefined') {
    const OrigRTCPeerConnection = RTCPeerConnection;
    
    window.RTCPeerConnection = function(config, constraints) {
      config = config || {};
      config.iceServers = config.iceServers || [];
      const pc = new OrigRTCPeerConnection(config, constraints);
      
      // Block IP leakage through ICE candidates
      const origAddIceCandidate = pc.addIceCandidate.bind(pc);
      pc.addIceCandidate = function(candidate) {
        if (candidate && candidate.candidate) {
          // Filter out srflx and relay candidates that reveal real IP
          if (candidate.candidate.includes('srflx') || candidate.candidate.includes('relay')) {
            return Promise.resolve();
          }
        }
        return origAddIceCandidate(candidate);
      };
      
      return pc;
    };
    window.RTCPeerConnection.prototype = OrigRTCPeerConnection.prototype;
    makeNative(window.RTCPeerConnection, 'RTCPeerConnection');
  }
  
  // ========== CLIENT HINTS - CONSISTENT WITH USERAGENT ==========
  const brands = fp.clientHintsBrands || [
    { brand: 'Google Chrome', version: fp.chromeVersion || '131' },
    { brand: 'Chromium', version: fp.chromeVersion || '131' },
    { brand: 'Not_A Brand', version: '24' }
  ];
  
  const fakeUserAgentData = {
    brands: brands,
    mobile: false,
    platform: fp.clientHintsPlatform || 'Windows',
    getHighEntropyValues: async function(hints) {
      const result = {
        brands: brands,
        mobile: false,
        platform: fp.clientHintsPlatform || 'Windows'
      };
      if (hints.includes('platformVersion')) result.platformVersion = fp.platformVersion || '15.0.0';
      if (hints.includes('architecture')) result.architecture = 'x86';
      if (hints.includes('bitness')) result.bitness = '64';
      if (hints.includes('model')) result.model = '';
      if (hints.includes('uaFullVersion')) result.uaFullVersion = fp.chromeVersion + '.0.0.0';
      if (hints.includes('fullVersionList')) result.fullVersionList = brands.map(b => ({...b, version: b.version + '.0.0.0'}));
      return result;
    },
    toJSON: function() { return { brands, mobile: false, platform: fp.clientHintsPlatform || 'Windows' }; }
  };
  
  makeNative(fakeUserAgentData.getHighEntropyValues, 'getHighEntropyValues');
  makeNative(fakeUserAgentData.toJSON, 'toJSON');
  
  safeDefineProperty(navigator, 'userAgentData', { get: () => fakeUserAgentData });
  
  // ========== TIMEZONE SPOOFING ==========
  if (fp.timezone) {
    const tzMap = {
      'America/New_York': -300, 'America/Los_Angeles': -480, 'America/Chicago': -360,
      'America/Denver': -420, 'America/Phoenix': -420,
      'Europe/London': 0, 'Europe/Paris': 60, 'Europe/Berlin': 60, 'Europe/Moscow': 180,
      'Asia/Dubai': 240, 'Asia/Riyadh': 180, 'Asia/Tokyo': 540, 'Asia/Shanghai': 480,
      'Asia/Singapore': 480, 'Asia/Seoul': 540, 'Asia/Kolkata': 330,
      'Australia/Sydney': 660, 'Australia/Melbourne': 660,
      'Pacific/Auckland': 780
    };
    
    const targetOffset = tzMap[fp.timezone] !== undefined ? -tzMap[fp.timezone] : new Date().getTimezoneOffset();
    
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function() { return targetOffset; };
    makeNative(Date.prototype.getTimezoneOffset, 'getTimezoneOffset');
    
    // Intl.DateTimeFormat override
    const OrigDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(locales, options) {
      options = options || {};
      if (!options.timeZone) options.timeZone = fp.timezone;
      return new OrigDateTimeFormat(locales, options);
    };
    Intl.DateTimeFormat.prototype = OrigDateTimeFormat.prototype;
    Intl.DateTimeFormat.supportedLocalesOf = OrigDateTimeFormat.supportedLocalesOf;
    makeNative(Intl.DateTimeFormat, 'DateTimeFormat');
  }
  
  // ========== BATTERY API ==========
  if (navigator.getBattery) {
    const fakeBattery = {
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return true; },
      onchargingchange: null,
      onchargingtimechange: null,
      ondischargingtimechange: null,
      onlevelchange: null
    };
    navigator.getBattery = function() { return Promise.resolve(fakeBattery); };
    makeNative(navigator.getBattery, 'getBattery');
  }
  
  // ========== MEDIA DEVICES ==========
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const fakeDevices = [
      { deviceId: 'default', kind: 'audioinput', label: '', groupId: 'default', toJSON: function() { return this; } },
      { deviceId: 'default', kind: 'videoinput', label: '', groupId: 'default', toJSON: function() { return this; } },
      { deviceId: 'default', kind: 'audiooutput', label: '', groupId: 'default', toJSON: function() { return this; } }
    ];
    navigator.mediaDevices.enumerateDevices = function() { return Promise.resolve(fakeDevices); };
    makeNative(navigator.mediaDevices.enumerateDevices, 'enumerateDevices');
  }
  
  // ========== PERMISSIONS API ==========
  if (navigator.permissions && navigator.permissions.query) {
    const originalQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = function(desc) {
      if (desc.name === 'notifications') {
        return Promise.resolve({ state: 'prompt', onchange: null });
      }
      return originalQuery(desc);
    };
    makeNative(navigator.permissions.query, 'query');
  }
  
  // ========== PERFORMANCE TIMING - MINIMAL NOISE ==========
  const originalNow = Performance.prototype.now;
  const perfOffset = seededRandom() * 0.0001;
  Performance.prototype.now = function() {
    return originalNow.call(this) + perfOffset;
  };
  makeNative(Performance.prototype.now, 'now');
  
  // ========== FONT FINGERPRINT PROTECTION ==========
  const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  CanvasRenderingContext2D.prototype.measureText = function(text) {
    const result = originalMeasureText.call(this, text);
    return result; // Return unmodified to avoid detection
  };
  makeNative(CanvasRenderingContext2D.prototype.measureText, 'measureText');
  
})();
`;
    
    fs.writeFileSync(path.join(extensionDir, 'inject.js'), injectScript);
    
    return extensionDir;
  } catch (error) {
    console.error('Error creating fingerprint extension:', error);
    return null;
  }
}

// Auto-updater configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Download progress: ${progress.percent.toFixed(1)}%`);
  mainWindow?.webContents.send('update-progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1117',
    title: 'Profile Manager Pro',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files using __dirname
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after app is ready (only in production)
  if (process.env.NODE_ENV !== 'development') {
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers

// Window controls
ipcMain.on('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow?.close();
});

// Select extension folder
ipcMain.handle('select-extension-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'اختر مجلد الملحق'
  });
  
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Select extension ZIP file
ipcMain.handle('select-extension-zip', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'ZIP Files', extensions: ['zip', 'crx'] }
    ],
    title: 'اختر ملف الملحق'
  });
  
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Select Chromium executable
ipcMain.handle('select-chromium-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Executable', extensions: ['exe'] }
    ],
    title: 'اختر ملف تشغيل Chromium'
  });
  
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Launch browser profile
ipcMain.handle('launch-profile', async (event, profileData) => {
  const { chromiumPath, proxy, extensions, userAgent, profileId, fingerprint } = profileData;
  
  if (!chromiumPath || !fs.existsSync(chromiumPath)) {
    return { success: false, error: 'مسار Chromium غير صحيح' };
  }

  // Check if profile is already running
  if (runningProfiles.has(profileId)) {
    return { success: false, error: 'البروفايل يعمل بالفعل' };
  }

  const userDataDir = path.join(app.getPath('userData'), 'profiles', profileId);
  
  // Create profile directory if it doesn't exist
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const args = [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    // ========== ANTI-BOT DETECTION FLAGS ==========
    '--disable-blink-features=AutomationControlled',  // CRITICAL: Hide automation
    '--disable-infobars',                             // Remove "Chrome is being controlled" bar
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--ignore-certificate-errors',
    // Disable various automation indicators
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-features=IsolateOrigins,site-per-process,TranslateUI',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
  ];

  // Add user agent
  if (userAgent) {
    args.push(`--user-agent=${userAgent}`);
  }

  // Add proxy settings
  if (proxy && proxy.host && proxy.port) {
    args.push(`--proxy-server=${proxy.type}://${proxy.host}:${proxy.port}`);
  }

  // Built-in extensions paths
  const builtInExtensions = [];
  
  // Helper function to add extension if exists
  function addBuiltInExtension(folderName) {
    // Try multiple possible paths for the extension
    const possiblePaths = [
      // Development paths
      path.join(__dirname, '..', 'public', 'extensions', folderName),
      path.join(process.cwd(), 'public', 'extensions', folderName),
      // Production paths
      path.join(process.resourcesPath || '', 'public', 'extensions', folderName),
      path.join(app.getAppPath(), 'public', 'extensions', folderName),
      path.join(app.getAppPath(), 'dist', 'extensions', folderName),
      // Packaged app paths
      path.join(process.resourcesPath || '', 'app', 'public', 'extensions', folderName),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'public', 'extensions', folderName),
    ];
    
    for (const extPath of possiblePaths) {
      if (fs.existsSync(extPath)) {
        // Verify manifest.json exists
        const manifestPath = path.join(extPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          console.log(`[Extensions] ✓ Found ${folderName} at: ${extPath}`);
          builtInExtensions.push(extPath);
          return;
        }
      }
    }
    
    console.warn(`[Extensions] ✗ Could not find ${folderName} in any path`);
    console.warn('[Extensions] Searched paths:', possiblePaths);
  }
  
  // Add all built-in extensions
  console.log('[Extensions] Loading built-in extensions...');
  addBuiltInExtension('auto-login');        // تسجيل الدخول التلقائي
  addBuiltInExtension('session-capture');   // التقاط الجلسات
  addBuiltInExtension('captcha-solver');    // حل CAPTCHA
  
  console.log(`[Extensions] Found ${builtInExtensions.length} built-in extensions`);
  
  // Collect all extension paths
  let allExtensionPaths = [...builtInExtensions];
  
  // Add user-specified extensions
  if (extensions && extensions.length > 0) {
    const validUserExtensions = extensions.filter(ext => {
      const exists = fs.existsSync(ext);
      if (exists) {
        console.log(`[Extensions] ✓ User extension: ${ext}`);
      } else {
        console.warn(`[Extensions] ✗ User extension not found: ${ext}`);
      }
      return exists;
    });
    allExtensionPaths = allExtensionPaths.concat(validUserExtensions);
  }

  // Apply fingerprint settings
  if (fingerprint) {
    // Screen size
    if (fingerprint.screenWidth && fingerprint.screenHeight) {
      args.push(`--window-size=${fingerprint.screenWidth},${fingerprint.screenHeight}`);
    }
    
    // Language
    if (fingerprint.language) {
      args.push(`--lang=${fingerprint.language}`);
    }
    
    // Timezone - requires TZ environment variable
    
    // Create fingerprint injection script
    const fingerprintScript = createFingerprintScript(fingerprint, userDataDir);
    if (fingerprintScript) {
      // Add fingerprint extension to the list
      allExtensionPaths.unshift(fingerprintScript);
      console.log(`[Extensions] ✓ Fingerprint extension created at: ${fingerprintScript}`);
    }
  }
  
  // Add all extensions to args
  if (allExtensionPaths.length > 0) {
    args.push(`--load-extension=${allExtensionPaths.join(',')}`);
    console.log(`[Extensions] Loading ${allExtensionPaths.length} total extensions`);
  } else {
    console.warn('[Extensions] No extensions to load!');
  }

  try {
    const browser = spawn(chromiumPath, args, {
      detached: false,
      stdio: 'ignore'
    });
    
    // Store the process
    runningProfiles.set(profileId, browser);
    
    // Handle process exit
    browser.on('exit', () => {
      runningProfiles.delete(profileId);
      mainWindow?.webContents.send('profile-closed', profileId);
    });
    
    browser.on('error', (err) => {
      console.error('Browser error:', err);
      runningProfiles.delete(profileId);
    });
    
    return { success: true, pid: browser.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Stop browser profile
ipcMain.handle('stop-profile', async (event, profileId) => {
  const browser = runningProfiles.get(profileId);
  
  if (!browser) {
    return { success: false, error: 'البروفايل غير موجود أو لا يعمل' };
  }
  
  try {
    // Kill the browser process
    browser.kill('SIGTERM');
    runningProfiles.delete(profileId);
    return { success: true };
  } catch (error) {
    // Force kill if SIGTERM fails
    try {
      browser.kill('SIGKILL');
      runningProfiles.delete(profileId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

// Get app paths
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    extensions: path.join(app.getPath('userData'), 'extensions'),
    profiles: path.join(app.getPath('userData'), 'profiles')
  };
});

// Open folder in explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  if (fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});

// Extract ZIP file
ipcMain.handle('extract-extension-zip', async (event, zipPath) => {
  const AdmZip = require('adm-zip');
  const extensionsDir = path.join(app.getPath('userData'), 'extensions');
  
  if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir, { recursive: true });
  }
  
  try {
    const zip = new AdmZip(zipPath);
    const extractName = path.basename(zipPath, path.extname(zipPath));
    const extractPath = path.join(extensionsDir, extractName);
    
    zip.extractAllTo(extractPath, true);
    
    return { success: true, path: extractPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ========== Extension Learning Data API (for CAPTCHA Solver sync) ==========

// Path to store synced extension learning data
const learningDataPath = path.join(app.getPath('userData'), 'captcha-learning-data.json');

// Load learning data from disk
function loadLearningData() {
  try {
    if (fs.existsSync(learningDataPath)) {
      const raw = fs.readFileSync(learningDataPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load learning data:', err);
  }
  return null;
}

// Save learning data to disk
function saveLearningData(data) {
  try {
    fs.writeFileSync(learningDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save learning data:', err);
    return false;
  }
}

ipcMain.handle('get-extension-learning-data', async () => {
  try {
    const data = loadLearningData();
    if (data) {
      return { success: true, data };
    }
    // Return default empty data
    return {
      success: true,
      data: {
        enabled: true,
        autoSolve: true,
        totalSolved: 0,
        successRate: 0,
        learningData: {},
        lastSync: null,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-extension-learning-data', async (event, data) => {
  try {
    data.lastSync = new Date().toISOString();
    const saved = saveLearningData(data);
    if (saved) {
      return { success: true };
    }
    return { success: false, error: 'Failed to save data' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Auto-updater IPC handlers
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ========== Real Proxy Testing ==========
ipcMain.handle('test-proxy-real', async (event, proxyConfig) => {
  const { type, host, port, username, password } = proxyConfig;
  const startTime = Date.now();
  
  try {
    // Use Node.js native modules for real proxy testing
    const net = require('net');
    const http = require('http');
    const https = require('https');
    const { SocksClient } = (() => {
      try {
        return require('socks');
      } catch {
        return { SocksClient: null };
      }
    })();
    
    // Build proxy URL
    let proxyUrl = '';
    if (username && password) {
      proxyUrl = `${type}://${username}:${password}@${host}:${port}`;
    } else {
      proxyUrl = `${type}://${host}:${port}`;
    }
    
    // Test IP lookup through proxy
    const testIpUrl = 'https://api.ipify.org?format=json';
    const geoUrl = 'https://ipapi.co/';
    
    let resultIp = '';
    let geoInfo = { country: '', city: '', isp: '' };
    
    // For HTTP/HTTPS proxy, use native http request with proxy
    if (type === 'http' || type === 'https') {
      const result = await new Promise((resolve, reject) => {
        const proxyReq = http.request({
          host: host,
          port: parseInt(port),
          method: 'CONNECT',
          path: 'api.ipify.org:443',
          headers: {
            'Host': 'api.ipify.org:443',
            ...(username && password ? {
              'Proxy-Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
            } : {})
          }
        });
        
        proxyReq.on('connect', (res, socket) => {
          if (res.statusCode === 200) {
            const tlsSocket = require('tls').connect({
              socket: socket,
              host: 'api.ipify.org',
              servername: 'api.ipify.org'
            }, () => {
              const req = https.request({
                hostname: 'api.ipify.org',
                path: '/?format=json',
                method: 'GET',
                socket: tlsSocket,
                agent: false,
                createConnection: () => tlsSocket
              }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                  try {
                    const json = JSON.parse(data);
                    resolve({ success: true, ip: json.ip });
                  } catch (e) {
                    resolve({ success: false, error: 'Invalid response' });
                  }
                });
              });
              
              req.on('error', (e) => resolve({ success: false, error: e.message }));
              req.end();
            });
            
            tlsSocket.on('error', (e) => resolve({ success: false, error: e.message }));
          } else {
            resolve({ success: false, error: 'Proxy connection failed: ' + res.statusCode });
          }
        });
        
        proxyReq.on('error', (e) => resolve({ success: false, error: e.message }));
        proxyReq.setTimeout(10000, () => {
          proxyReq.destroy();
          resolve({ success: false, error: 'Connection timeout' });
        });
        proxyReq.end();
      });
      
      if (result.success) {
        resultIp = result.ip;
      } else {
        return {
          success: false,
          latency: 0,
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }
    } else if ((type === 'socks4' || type === 'socks5') && SocksClient) {
      // SOCKS proxy testing
      try {
        const socksOptions = {
          proxy: {
            host: host,
            port: parseInt(port),
            type: type === 'socks5' ? 5 : 4,
            ...(username && password ? { userId: username, password: password } : {})
          },
          command: 'connect',
          destination: {
            host: 'api.ipify.org',
            port: 443
          },
          timeout: 10000
        };
        
        const { socket } = await SocksClient.createConnection(socksOptions);
        
        const tlsSocket = require('tls').connect({
          socket: socket,
          host: 'api.ipify.org',
          servername: 'api.ipify.org'
        });
        
        const result = await new Promise((resolve, reject) => {
          tlsSocket.on('secureConnect', () => {
            tlsSocket.write('GET /?format=json HTTP/1.1\\r\\nHost: api.ipify.org\\r\\nConnection: close\\r\\n\\r\\n');
          });
          
          let data = '';
          tlsSocket.on('data', chunk => data += chunk.toString());
          tlsSocket.on('end', () => {
            const bodyMatch = data.match(/\\r\\n\\r\\n(.*)$/s);
            if (bodyMatch) {
              try {
                const json = JSON.parse(bodyMatch[1].trim());
                resolve({ success: true, ip: json.ip });
              } catch (e) {
                resolve({ success: false, error: 'Invalid response' });
              }
            } else {
              resolve({ success: false, error: 'No response body' });
            }
          });
          
          tlsSocket.on('error', (e) => resolve({ success: false, error: e.message }));
          setTimeout(() => {
            tlsSocket.destroy();
            resolve({ success: false, error: 'Timeout' });
          }, 10000);
        });
        
        if (result.success) {
          resultIp = result.ip;
        } else {
          return {
            success: false,
            latency: 0,
            error: result.error,
            timestamp: new Date().toISOString()
          };
        }
      } catch (socksErr) {
        return {
          success: false,
          latency: 0,
          error: socksErr.message || 'SOCKS connection failed',
          timestamp: new Date().toISOString()
        };
      }
    } else {
      // Fallback - simple TCP connectivity test
      const result = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          socket.destroy();
          resolve({ success: true, error: null });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          resolve({ success: false, error: 'Connection timeout' });
        });
        
        socket.on('error', (err) => {
          resolve({ success: false, error: err.message });
        });
        
        socket.connect(parseInt(port), host);
      });
      
      if (!result.success) {
        return {
          success: false,
          latency: 0,
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    // Get geo info for the IP
    if (resultIp) {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${resultIp}/json/`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          geoInfo = {
            country: geoData.country_name || geoData.country || '',
            city: geoData.city || '',
            isp: geoData.org || geoData.isp || ''
          };
        }
      } catch {}
    }
    
    return {
      success: true,
      latency,
      ip: resultIp,
      country: geoInfo.country,
      city: geoInfo.city,
      isp: geoInfo.isp,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      latency: 0,
      error: error.message || 'Connection failed',
      timestamp: new Date().toISOString()
    };
  }
});

// ========== Window Management for Running Profiles ==========

// Get running profile IDs
ipcMain.handle('get-running-profiles', () => {
  return Array.from(runningProfiles.keys());
});

// Tile profile windows in grid, horizontal, or vertical layout
ipcMain.handle('tile-profile-windows', async (event, layout) => {
// tile-profile-windows uses the global exec with maxBuffer
  const { screen } = require('electron');
  const os = require('os');
  
  const displays = screen.getAllDisplays();
  const primaryDisplay = displays[0];
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: screenX, y: screenY } = primaryDisplay.workArea;
  const primaryDisplay = displays[0];
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const { x: screenX, y: screenY } = primaryDisplay.workArea;
  
  const profileIds = Array.from(runningProfiles.keys());
  const count = profileIds.length;
  
  if (count === 0) {
    return { success: false, error: 'لا توجد بروفايلات تعمل' };
  }

  if (process.platform !== 'win32') {
    return { success: false, error: 'هذه الميزة متاحة فقط على Windows' };
  }

  try {
    let cols, rows, winWidth, winHeight;
    
    if (layout === 'grid') {
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
      winWidth = Math.floor(screenWidth / cols);
      winHeight = Math.floor(screenHeight / rows);
    } else if (layout === 'horizontal') {
      cols = count;
      rows = 1;
      winWidth = Math.floor(screenWidth / count);
      winHeight = screenHeight;
    } else if (layout === 'vertical') {
      cols = 1;
      rows = count;
      winWidth = screenWidth;
      winHeight = Math.floor(screenHeight / count);
    }

    // Get PIDs of running profiles
    const pids = [];
    for (const [id, browser] of runningProfiles.entries()) {
      if (browser && browser.pid) {
        pids.push(browser.pid);
      }
    }

    if (pids.length === 0) {
      return { success: false, error: 'لا توجد نوافذ متاحة' };
    }

    // Create PowerShell script file to avoid here-string issues
    const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

$pids = @(${pids.join(',')})
$cols = ${cols}
$rows = ${rows}
$winWidth = ${winWidth}
$winHeight = ${winHeight}
$screenX = ${screenX}
$screenY = ${screenY}

$windows = @()
$null = [IntPtr]::Zero
$hwnd = [Win32]::FindWindowEx($null, [IntPtr]::Zero, "Chrome_WidgetWin_1", $null)

# Get all main Chrome windows belonging to our profile PIDs
while ($hwnd -ne [IntPtr]::Zero) {
    $processId = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
    
    # Check if this window belongs to one of our profile processes
    foreach ($targetPid in $pids) {
        if ($processId -eq $targetPid) {
            $windows += @{ hwnd = $hwnd; pid = $processId }
            break
        }
    }
    $hwnd = [Win32]::FindWindowEx($null, $hwnd, "Chrome_WidgetWin_1", $null)
}

# Remove duplicate windows (keep first per PID - main window)
$seenPids = @{}
$uniqueWindows = @()
foreach ($win in $windows) {
    if (-not $seenPids.ContainsKey($win.pid)) {
        $seenPids[$win.pid] = $true
        $uniqueWindows += $win
    }
}
$windows = $uniqueWindows

$i = 0
foreach ($win in $windows) {
    $col = $i % $cols
    $row = [Math]::Floor($i / $cols)
    $x = $screenX + ($col * $winWidth)
    $y = $screenY + ($row * $winHeight)
    
    [Win32]::ShowWindow($win.hwnd, 9) | Out-Null
    [Win32]::MoveWindow($win.hwnd, $x, $y, $winWidth, $winHeight, $true) | Out-Null
    $i++
}
`;

    // Write script to temp file
    const tempScriptPath = path.join(os.tmpdir(), 'tile-windows.ps1');
    fs.writeFileSync(tempScriptPath, psScript, 'utf8');

    return new Promise((resolve) => {
      exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error, stdout, stderr) => {
        // Clean up temp file
        try { fs.unlinkSync(tempScriptPath); } catch (e) {}
        
        if (error) {
          console.log('Tile error:', error);
          console.log('stderr:', stderr);
          resolve({ success: false, error: error.message });
        } else {
          resolve({ 
            success: true, 
            message: layout === 'grid' ? 'تم ترتيب النوافذ بشكل شبكي' : 
                     layout === 'horizontal' ? 'تم ترتيب النوافذ أفقياً' : 'تم ترتيب النوافذ عمودياً'
          });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Minimize only BHD profile windows (not all Chrome windows)
ipcMain.handle('minimize-all-profiles', async () => {
  if (process.platform !== 'win32') {
    return { success: false, error: 'هذه الميزة متاحة فقط على Windows' };
  }

  // Uses global exec with maxBuffer
  const os = require('os');

  // Get PIDs of only our running profiles
  const pids = [];
  for (const [id, browser] of runningProfiles.entries()) {
    if (browser && browser.pid) {
      pids.push(browser.pid);
    }
  }

  if (pids.length === 0) {
    return { success: false, error: 'لا توجد بروفايلات تعمل' };
  }

  const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

$pids = @(${pids.join(',')})
$null = [IntPtr]::Zero
$hwnd = [Win32]::FindWindowEx($null, [IntPtr]::Zero, "Chrome_WidgetWin_1", $null)

# Find windows matching our profile PIDs
$seenPids = @{}
while ($hwnd -ne [IntPtr]::Zero) {
    $processId = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
    
    foreach ($targetPid in $pids) {
        if ($processId -eq $targetPid -and -not $seenPids.ContainsKey($processId)) {
            $seenPids[$processId] = $true
            [Win32]::ShowWindow($hwnd, 6) | Out-Null
            break
        }
    }
    $hwnd = [Win32]::FindWindowEx($null, $hwnd, "Chrome_WidgetWin_1", $null)
}
`;

  const tempScriptPath = path.join(os.tmpdir(), 'minimize-bhd-windows.ps1');
  fs.writeFileSync(tempScriptPath, psScript, 'utf8');

  return new Promise((resolve) => {
    exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error) => {
      try { fs.unlinkSync(tempScriptPath); } catch (e) {}
      if (error) {
        console.log('Minimize error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Restore only BHD profile windows
ipcMain.handle('restore-all-profiles', async () => {
  if (process.platform !== 'win32') {
    return { success: false, error: 'هذه الميزة متاحة فقط على Windows' };
  }

  // Uses global exec with maxBuffer
  const os = require('os');

  // Get PIDs of only our running profiles
  const pids = [];
  for (const [id, browser] of runningProfiles.entries()) {
    if (browser && browser.pid) {
      pids.push(browser.pid);
    }
  }

  if (pids.length === 0) {
    return { success: false, error: 'لا توجد بروفايلات تعمل' };
  }

  const psScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

$pids = @(${pids.join(',')})
$null = [IntPtr]::Zero
$hwnd = [Win32]::FindWindowEx($null, [IntPtr]::Zero, "Chrome_WidgetWin_1", $null)

# Find windows matching our profile PIDs
$seenPids = @{}
while ($hwnd -ne [IntPtr]::Zero) {
    $processId = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
    
    foreach ($targetPid in $pids) {
        if ($processId -eq $targetPid -and -not $seenPids.ContainsKey($processId)) {
            $seenPids[$processId] = $true
            [Win32]::ShowWindow($hwnd, 9) | Out-Null
            break
        }
    }
    $hwnd = [Win32]::FindWindowEx($null, $hwnd, "Chrome_WidgetWin_1", $null)
}
`;

  const tempScriptPath = path.join(os.tmpdir(), 'restore-bhd-windows.ps1');
  fs.writeFileSync(tempScriptPath, psScript, 'utf8');

  return new Promise((resolve) => {
    exec(`powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`, (error) => {
      try { fs.unlinkSync(tempScriptPath); } catch (e) {}
      if (error) {
        console.log('Restore error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// Focus a specific profile window
ipcMain.handle('focus-profile', async (event, profileId) => {
  const browser = runningProfiles.get(profileId);
  if (!browser) {
    return;
  }
  
  // Uses global exec with maxBuffer
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      // Try to bring the window to front using PID
      const cmd = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); }'; $proc = Get-Process -Id ${browser.pid} -ErrorAction SilentlyContinue; if ($proc) { [Win32]::SetForegroundWindow($proc.MainWindowHandle) }"`;
      
      exec(cmd, (error) => {
        if (error) {
          console.log('Focus error:', error);
        }
        resolve();
      });
    });
  }
  return Promise.resolve();
});

// ========== Real Session Capture System ==========

// Capture session from running profile
ipcMain.handle('capture-profile-session', async (event, { profileId, url }) => {
  try {
    const userDataDir = path.join(app.getPath('userData'), 'profiles', profileId);
    const cookiesPath = path.join(userDataDir, 'Default', 'Cookies');
    const localStoragePath = path.join(userDataDir, 'Default', 'Local Storage', 'leveldb');
    
    // Read cookies from Chrome's cookie database (SQLite)
    let cookies = [];
    let localStorage = {};
    
    // Try to read cookies file
    if (fs.existsSync(cookiesPath)) {
      try {
        // For now, we'll get cookies from the session partition
        const profileSession = session.fromPartition(`persist:profile-${profileId}`);
        cookies = await profileSession.cookies.get({});
      } catch (e) {
        console.log('Could not read cookies from session:', e);
      }
    }
    
    // Parse domain from URL
    let domain = 'unknown';
    let siteName = 'Unknown Site';
    try {
      const urlObj = new URL(url || 'https://example.com');
      domain = urlObj.hostname;
      siteName = domain.replace('www.', '').split('.')[0];
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch (e) {}
    
    const sessionData = {
      id: `session-${profileId}-${Date.now()}`,
      profileId,
      domain,
      siteName,
      url: url || '',
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expirationDate,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite
      })),
      localStorage: localStorage,
      sessionStorage: {},
      tokens: [],
      capturedAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Detect tokens from cookies
    const tokenPatterns = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'bearer', 'api_key', 'sid'];
    sessionData.tokens = cookies
      .filter(c => tokenPatterns.some(p => c.name.toLowerCase().includes(p)))
      .map(c => ({
        type: c.name.toLowerCase().includes('jwt') ? 'jwt' : 
              c.name.toLowerCase().includes('bearer') ? 'bearer' : 
              c.name.toLowerCase().includes('session') ? 'session' : 'auth',
        name: c.name,
        value: c.value,
        maskedValue: c.value.substring(0, 8) + '...' + c.value.substring(c.value.length - 4),
        source: 'cookie'
      }));
    
    // Store the session
    capturedSessions.set(sessionData.id, sessionData);
    
    // Save to file for persistence
    const sessionsFile = path.join(app.getPath('userData'), 'captured-sessions.json');
    let allSessions = [];
    if (fs.existsSync(sessionsFile)) {
      try {
        allSessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
      } catch (e) {}
    }
    allSessions.push(sessionData);
    fs.writeFileSync(sessionsFile, JSON.stringify(allSessions, null, 2));
    
    // Notify renderer
    mainWindow?.webContents.send('session-captured', sessionData);
    
    return { success: true, session: sessionData };
  } catch (error) {
    console.error('Error capturing session:', error);
    return { success: false, error: error.message };
  }
});

// Get all captured sessions
ipcMain.handle('get-captured-sessions', async () => {
  try {
    const sessionsFile = path.join(app.getPath('userData'), 'captured-sessions.json');
    if (fs.existsSync(sessionsFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
      return { success: true, sessions };
    }
    return { success: true, sessions: [] };
  } catch (error) {
    return { success: false, error: error.message, sessions: [] };
  }
});

// Delete a captured session
ipcMain.handle('delete-captured-session', async (event, sessionId) => {
  try {
    const sessionsFile = path.join(app.getPath('userData'), 'captured-sessions.json');
    if (fs.existsSync(sessionsFile)) {
      let sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
      sessions = sessions.filter(s => s.id !== sessionId);
      fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    }
    capturedSessions.delete(sessionId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete all captured sessions
ipcMain.handle('delete-all-sessions', async () => {
  try {
    const sessionsFile = path.join(app.getPath('userData'), 'captured-sessions.json');
    if (fs.existsSync(sessionsFile)) {
      fs.writeFileSync(sessionsFile, '[]');
    }
    capturedSessions.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Capture cookies from a specific URL in running profile
ipcMain.handle('capture-url-cookies', async (event, { profileId, url }) => {
  try {
    const profileSession = session.fromPartition(`persist:profile-${profileId}`);
    const urlObj = new URL(url);
    
    // Get cookies for this specific URL
    const cookies = await profileSession.cookies.get({ url });
    
    return { 
      success: true, 
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expirationDate,
        secure: c.secure,
        httpOnly: c.httpOnly
      }))
    };
  } catch (error) {
    return { success: false, error: error.message, cookies: [] };
  }
});

// Import session (inject cookies into profile)
ipcMain.handle('inject-session', async (event, { profileId, sessionData }) => {
  try {
    const profileSession = session.fromPartition(`persist:profile-${profileId}`);
    
    // Inject cookies
    for (const cookie of sessionData.cookies || []) {
      try {
        await profileSession.cookies.set({
          url: `https://${cookie.domain.replace(/^\./, '')}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure !== false,
          httpOnly: cookie.httpOnly !== false,
          expirationDate: cookie.expires || (Date.now() / 1000 + 86400 * 30)
        });
      } catch (e) {
        console.log('Could not set cookie:', cookie.name, e);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ========== Screen Capture API for AI Vision ==========

// Capture full screen
ipcMain.handle('capture-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    if (sources.length === 0) {
      return { success: false, error: 'No screen sources found' };
    }
    
    const primaryScreen = sources[0];
    const thumbnail = primaryScreen.thumbnail.toDataURL();
    
    return {
      success: true,
      capture: {
        id: `screen_${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageData: thumbnail,
        width: primaryScreen.thumbnail.getSize().width,
        height: primaryScreen.thumbnail.getSize().height,
        source: 'screen',
        sourceId: primaryScreen.id,
        sourceName: primaryScreen.name
      }
    };
  } catch (error) {
    console.error('Screen capture error:', error);
    return { success: false, error: error.message };
  }
});

// Capture specific window
ipcMain.handle('capture-window', async (event, windowName) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    // Find window by name or get all windows
    let targetSource;
    if (windowName) {
      targetSource = sources.find(s => s.name.toLowerCase().includes(windowName.toLowerCase()));
    }
    
    if (!targetSource && sources.length > 0) {
      targetSource = sources[0];
    }
    
    if (!targetSource) {
      return { success: false, error: 'No window found' };
    }
    
    const thumbnail = targetSource.thumbnail.toDataURL();
    
    return {
      success: true,
      capture: {
        id: `window_${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageData: thumbnail,
        width: targetSource.thumbnail.getSize().width,
        height: targetSource.thumbnail.getSize().height,
        source: 'window',
        sourceId: targetSource.id,
        sourceName: targetSource.name
      }
    };
  } catch (error) {
    console.error('Window capture error:', error);
    return { success: false, error: error.message };
  }
});

// Get all available capture sources
ipcMain.handle('get-capture-sources', async () => {
  try {
    const [screens, windows] = await Promise.all([
      desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 320, height: 180 } }),
      desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 320, height: 180 } })
    ]);
    
    const sources = [
      ...screens.map(s => ({
        id: s.id,
        name: s.name,
        type: 'screen',
        thumbnail: s.thumbnail.toDataURL()
      })),
      ...windows.map(s => ({
        id: s.id,
        name: s.name,
        type: 'window',
        thumbnail: s.thumbnail.toDataURL()
      }))
    ];
    
    return { success: true, sources };
  } catch (error) {
    return { success: false, error: error.message, sources: [] };
  }
});

// Capture specific profile browser window
ipcMain.handle('capture-profile-window', async (event, profileId) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    
    // Find the chromium window for this profile
    const profileWindow = sources.find(s => 
      s.name.toLowerCase().includes('chromium') || 
      s.name.toLowerCase().includes('chrome') ||
      s.name.toLowerCase().includes('browser')
    );
    
    if (!profileWindow) {
      return { success: false, error: 'Profile window not found' };
    }
    
    const thumbnail = profileWindow.thumbnail.toDataURL();
    
    return {
      success: true,
      capture: {
        id: `profile_${profileId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageData: thumbnail,
        width: profileWindow.thumbnail.getSize().width,
        height: profileWindow.thumbnail.getSize().height,
        source: 'browser',
        sourceId: profileWindow.id,
        sourceName: profileWindow.name,
        profileId
      }
    };
  } catch (error) {
    console.error('Profile window capture error:', error);
    return { success: false, error: error.message };
  }
});

// Start continuous screen capture for AI Vision
let captureInterval = null;
ipcMain.handle('start-continuous-capture', async (event, options) => {
  const { interval = 2000, type = 'screen' } = options || {};
  
  if (captureInterval) {
    clearInterval(captureInterval);
  }
  
  captureInterval = setInterval(async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: [type === 'screen' ? 'screen' : 'window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });
      
      if (sources.length > 0) {
        const source = sources[0];
        const capture = {
          id: `auto_${Date.now()}`,
          timestamp: new Date().toISOString(),
          imageData: source.thumbnail.toDataURL(),
          width: source.thumbnail.getSize().width,
          height: source.thumbnail.getSize().height,
          source: type,
          sourceId: source.id,
          sourceName: source.name
        };
        
        mainWindow?.webContents.send('screen-captured', capture);
      }
    } catch (error) {
      console.error('Continuous capture error:', error);
    }
  }, interval);
  
  return { success: true, message: 'Continuous capture started' };
});

// Stop continuous screen capture
ipcMain.handle('stop-continuous-capture', async () => {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  return { success: true, message: 'Continuous capture stopped' };
});

// ========== Manual GitHub Update API ==========

const https = require('https');
const AdmZip = require('adm-zip');

// Helper function to make HTTPS requests
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'BHD-Browser-Updater',
        ...options.headers
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsRequest(res.headers.location, options).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (options.json) {
          try {
            resolve(JSON.parse(buffer.toString()));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          resolve(buffer);
        }
      });
    });
    
    req.on('error', reject);
  });
}

// Parse GitHub repo URL to get owner and repo name
function parseGitHubUrl(url) {
  // Support formats: https://github.com/owner/repo or owner/repo
  const match = url.match(/(?:github\.com\/)?([^\/]+)\/([^\/\s]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
}

// Verify GitHub repository and check for updates
ipcMain.handle('verify-github-repo', async (event, { repoUrl, accessToken }) => {
  try {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return { success: false, error: 'رابط المستودع غير صحيح' };
    }
    
    const { owner, repo } = parsed;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }
    
    const release = await httpsRequest(apiUrl, { json: true, headers });
    
    // Get current app version
    const currentVersion = app.getVersion();
    const latestVersion = release.tag_name.replace(/^v/, '');
    
    // Compare versions
    const hasUpdate = latestVersion !== currentVersion;
    
    return {
      success: true,
      repoName: `${owner}/${repo}`,
      latestVersion,
      currentVersion,
      hasUpdate
    };
  } catch (error) {
    console.error('GitHub verify error:', error);
    let errorMsg = 'فشل الاتصال بالمستودع';
    if (error.message.includes('404')) {
      errorMsg = 'المستودع غير موجود أو التوكن غير صحيح';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMsg = 'التوكن غير صحيح أو ليس لديك صلاحية';
    }
    return { success: false, error: errorMsg };
  }
});

// Update from GitHub repository
ipcMain.handle('update-from-github', async (event, { repoUrl, accessToken }) => {
  try {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return { success: false, error: 'رابط المستودع غير صحيح' };
    }
    
    const { owner, repo } = parsed;
    
    // Send progress updates
    const sendProgress = (stage, percent, message) => {
      mainWindow?.webContents.send('manual-update-progress', { stage, percent, message });
    };
    
    sendProgress('downloading', 0, 'جاري البحث عن التحديث...');
    
    // Get latest release
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }
    
    const release = await httpsRequest(apiUrl, { json: true, headers });
    
    // Find the source code zip asset
    let downloadUrl = release.zipball_url;
    
    sendProgress('downloading', 20, 'جاري تحميل الملفات...');
    
    // Download the zip file
    const zipBuffer = await httpsRequest(downloadUrl, { 
      headers: accessToken ? { 'Authorization': `token ${accessToken}` } : {}
    });
    
    sendProgress('extracting', 50, 'جاري فك الضغط...');
    
    // Save and extract zip
    const tempDir = path.join(app.getPath('temp'), 'bhd-update');
    const zipPath = path.join(tempDir, 'update.zip');
    
    // Clean temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    fs.writeFileSync(zipPath, zipBuffer);
    
    // Extract zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);
    
    sendProgress('installing', 70, 'جاري تثبيت التحديث...');
    
    // Find extracted folder (GitHub adds a prefix)
    const extractedFolders = fs.readdirSync(tempDir).filter(f => 
      fs.statSync(path.join(tempDir, f)).isDirectory()
    );
    
    if (extractedFolders.length === 0) {
      return { success: false, error: 'فشل في فك الضغط' };
    }
    
    const sourceDir = path.join(tempDir, extractedFolders[0]);
    const appDir = app.getAppPath();
    
    // Copy new files to app directory (only update specific folders)
    const foldersToUpdate = ['dist', 'electron'];
    const filesToUpdate = ['package.json'];
    
    for (const folder of foldersToUpdate) {
      const srcFolder = path.join(sourceDir, folder);
      const destFolder = path.join(appDir, folder);
      
      if (fs.existsSync(srcFolder)) {
        // Remove old folder
        if (fs.existsSync(destFolder)) {
          fs.rmSync(destFolder, { recursive: true, force: true });
        }
        // Copy new folder
        fs.cpSync(srcFolder, destFolder, { recursive: true });
      }
    }
    
    for (const file of filesToUpdate) {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(appDir, file);
      
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    
    sendProgress('restarting', 100, 'جاري إعادة تشغيل التطبيق...');
    
    // Clean up temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    // Restart app after short delay
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1500);
    
    return { success: true, message: 'تم التحديث بنجاح، جاري إعادة التشغيل...' };
  } catch (error) {
    console.error('GitHub update error:', error);
    return { success: false, error: `فشل التحديث: ${error.message}` };
  }
});
