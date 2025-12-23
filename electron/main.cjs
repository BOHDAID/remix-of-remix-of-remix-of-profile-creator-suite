const { app, BrowserWindow, ipcMain, dialog, shell, screen, session, desktopCapturer } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
// Store running browser processes by profile ID
const runningProfiles = new Map();
// Store captured sessions
const capturedSessions = new Map();

// Create fingerprint injection extension
function createFingerprintScript(fingerprint, userDataDir) {
  try {
    const extensionDir = path.join(userDataDir, 'fingerprint-extension');
    
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    
    // manifest.json - Using Manifest V3 with MAIN world for proper injection
    const manifest = {
      manifest_version: 3,
      name: "Fingerprint Spoof",
      version: "1.0",
      permissions: [],
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["inject.js"],
        run_at: "document_start",
        all_frames: true,
        world: "MAIN"  // CRITICAL: Run in MAIN world to modify page's JS objects
      }]
    };
    
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // inject.js - Runs in MAIN world so it can modify the actual page's objects
    const injectScript = `
(function() {
  'use strict';
  
  const fp = ${JSON.stringify(fingerprint)};
  
  // ========== Store Original Values ==========
  const originalNavigator = {};
  const originalScreen = {};
  
  // ========== Navigator Properties Override ==========
  const navigatorOverrides = {
    hardwareConcurrency: fp.cpuCores || fp.hardwareConcurrency || 8,
    deviceMemory: fp.deviceMemory || 8,
    platform: fp.platform || 'Win32',
    language: fp.language || 'en-US',
    languages: Object.freeze(fp.languages || [fp.language || 'en-US']),
    maxTouchPoints: fp.maxTouchPoints || 0,
    vendor: fp.vendor || 'Google Inc.',
    appVersion: fp.appVersion || '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    userAgent: fp.userAgent || navigator.userAgent
  };
  
  for (const [key, value] of Object.entries(navigatorOverrides)) {
    try {
      Object.defineProperty(Navigator.prototype, key, {
        get: function() { return value; },
        configurable: true
      });
    } catch (e) {
      console.warn('[FP] Failed to override navigator.' + key);
    }
  }
  
  // Also override navigator object directly
  for (const [key, value] of Object.entries(navigatorOverrides)) {
    try {
      Object.defineProperty(navigator, key, {
        get: function() { return value; },
        configurable: true
      });
    } catch (e) {}
  }
  
  // ========== Screen Properties Override ==========
  const screenOverrides = {
    width: fp.screenWidth || 1920,
    height: fp.screenHeight || 1080,
    availWidth: fp.screenWidth || 1920,
    availHeight: (fp.screenHeight || 1080) - 40,
    colorDepth: fp.colorDepth || 24,
    pixelDepth: fp.colorDepth || 24
  };
  
  for (const [key, value] of Object.entries(screenOverrides)) {
    try {
      Object.defineProperty(Screen.prototype, key, {
        get: function() { return value; },
        configurable: true
      });
    } catch (e) {}
  }
  
  // ========== Window Properties ==========
  try {
    Object.defineProperty(window, 'devicePixelRatio', { 
      get: () => fp.pixelRatio || 1, 
      configurable: true 
    });
    Object.defineProperty(window, 'innerWidth', { 
      get: () => (fp.screenWidth || 1920) - 200, 
      configurable: true 
    });
    Object.defineProperty(window, 'innerHeight', { 
      get: () => (fp.screenHeight || 1080) - 150, 
      configurable: true 
    });
    Object.defineProperty(window, 'outerWidth', { 
      get: () => fp.screenWidth || 1920, 
      configurable: true 
    });
    Object.defineProperty(window, 'outerHeight', { 
      get: () => fp.screenHeight || 1080, 
      configurable: true 
    });
  } catch (e) {}
  
  // ========== WebGL Spoofing - CRITICAL ==========
  const webglVendor = fp.webglVendor || fp.gpuVendor || 'Google Inc. (NVIDIA)';
  const webglRenderer = fp.webglRenderer || fp.gpu || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
  
  // Hook WebGLRenderingContext.getParameter
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    // UNMASKED_VENDOR_WEBGL
    if (param === 37445) {
      return webglVendor;
    }
    // UNMASKED_RENDERER_WEBGL
    if (param === 37446) {
      return webglRenderer;
    }
    return originalGetParameter.call(this, param);
  };
  
  // Hook WebGL2 as well
  if (typeof WebGL2RenderingContext !== 'undefined') {
    const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) {
        return webglVendor;
      }
      if (param === 37446) {
        return webglRenderer;
      }
      return originalGetParameter2.call(this, param);
    };
  }
  
  // Hook getExtension to return our spoofed debug info
  const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
  WebGLRenderingContext.prototype.getExtension = function(name) {
    const ext = originalGetExtension.call(this, name);
    if (name === 'WEBGL_debug_renderer_info' && ext) {
      return ext;
    }
    return ext;
  };
  
  // ========== Canvas Fingerprint Spoofing ==========
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  
  const canvasNoise = fp.canvasNoise || 5;
  const addNoise = () => Math.floor(Math.random() * canvasNoise * 2) - canvasNoise;
  
  CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
    const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
    // Add subtle noise to image data
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + addNoise())); // R
      imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + addNoise())); // G
      imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + addNoise())); // B
    }
    return imageData;
  };
  
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    // Force a read to trigger the noise
    const ctx = this.getContext('2d');
    if (ctx && this.width > 0 && this.height > 0) {
      try {
        const imgData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
        for (let i = 0; i < imgData.data.length; i += 4) {
          imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + addNoise()));
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {}
    }
    return originalToDataURL.apply(this, args);
  };
  
  // ========== Audio Context Fingerprint Spoofing ==========
  if (window.AudioContext || window.webkitAudioContext) {
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
      originalGetFloatFrequencyData.call(this, array);
      const audioNoise = fp.audioNoise || 0.0001;
      for (let i = 0; i < array.length; i++) {
        array[i] += (Math.random() * 2 - 1) * audioNoise;
      }
    };
    
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = originalGetChannelData.call(this, channel);
      const audioNoise = fp.audioNoise || 0.0001;
      for (let i = 0; i < data.length; i += 100) {
        data[i] += (Math.random() * 2 - 1) * audioNoise;
      }
      return data;
    };
  }
  
  // ========== WebRTC IP Leak Prevention ==========
  if (window.RTCPeerConnection) {
    const OrigRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(config, constraints) {
      config = config || {};
      // Clear ice servers to prevent IP leak
      config.iceServers = [];
      const pc = new OrigRTCPeerConnection(config, constraints);
      
      // Override createOffer and createAnswer to filter candidates
      const origCreateOffer = pc.createOffer.bind(pc);
      pc.createOffer = function(options) {
        return origCreateOffer(options).then(offer => {
          offer.sdp = offer.sdp.replace(/a=candidate:.*\\r\\n/g, '');
          return offer;
        });
      };
      
      return pc;
    };
    window.RTCPeerConnection.prototype = OrigRTCPeerConnection.prototype;
  }
  
  // Also block webkitRTCPeerConnection
  if (window.webkitRTCPeerConnection) {
    window.webkitRTCPeerConnection = window.RTCPeerConnection;
  }
  
  // ========== Battery API Spoofing ==========
  if (navigator.getBattery) {
    const fakeBattery = {
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    };
    navigator.getBattery = () => Promise.resolve(fakeBattery);
  }
  
  // ========== Media Devices Spoofing ==========
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const fakeDevices = [
      { deviceId: 'default', kind: 'audioinput', label: '', groupId: 'default' },
      { deviceId: 'communications', kind: 'audioinput', label: '', groupId: 'communications' },
      { deviceId: 'default', kind: 'videoinput', label: '', groupId: 'default' },
      { deviceId: 'default', kind: 'audiooutput', label: '', groupId: 'default' }
    ];
    navigator.mediaDevices.enumerateDevices = () => Promise.resolve(fakeDevices);
  }
  
  // ========== Timezone Spoofing ==========
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
    Date.prototype.getTimezoneOffset = function() {
      return targetOffset;
    };
    
    // Override Intl.DateTimeFormat
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(locales, options) {
      options = options || {};
      if (!options.timeZone) {
        options.timeZone = fp.timezone;
      }
      return new OriginalDateTimeFormat(locales, options);
    };
    Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
    Intl.DateTimeFormat.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
    
    const originalResolvedOptions = OriginalDateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      const result = originalResolvedOptions.call(this);
      if (!result.timeZone || result.timeZone === Intl.DateTimeFormat().resolvedOptions().timeZone) {
        result.timeZone = fp.timezone;
      }
      return result;
    };
  }
  
  // ========== Client Hints API Spoofing ==========
  if (navigator.userAgentData) {
    const brands = fp.clientHintsBrands || [
      { brand: 'Google Chrome', version: '131' },
      { brand: 'Chromium', version: '131' },
      { brand: 'Not_A Brand', version: '24' }
    ];
    
    const fakeUserAgentData = {
      brands: brands,
      mobile: false,
      platform: fp.clientHintsPlatform || 'Windows',
      getHighEntropyValues: async (hints) => {
        const result = {
          brands: brands,
          mobile: false,
          platform: fp.clientHintsPlatform || 'Windows'
        };
        if (hints.includes('platformVersion')) result.platformVersion = fp.platformVersion || '10.0.0';
        if (hints.includes('architecture')) result.architecture = 'x86';
        if (hints.includes('model')) result.model = '';
        if (hints.includes('uaFullVersion')) result.uaFullVersion = '131.0.0.0';
        if (hints.includes('fullVersionList')) result.fullVersionList = brands;
        return result;
      },
      toJSON: () => ({ brands, mobile: false, platform: fp.clientHintsPlatform || 'Windows' })
    };
    
    try {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => fakeUserAgentData,
        configurable: true
      });
    } catch (e) {}
  }
  
  // ========== Font Fingerprint Protection ==========
  const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  CanvasRenderingContext2D.prototype.measureText = function(text) {
    const result = originalMeasureText.call(this, text);
    const noise = (Math.random() - 0.5) * 0.002;
    return new Proxy(result, {
      get: function(target, prop) {
        if (prop === 'width') {
          return target.width + noise;
        }
        return target[prop];
      }
    });
  };
  
  // ========== Hide Webdriver Flag ==========
  try {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });
  } catch (e) {}
  
  // Delete automation indicators
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  delete window.__webdriver_evaluate;
  delete window.__selenium_evaluate;
  delete window.__webdriver_script_function;
  delete window.__webdriver_script_func;
  delete window.__webdriver_script_fn;
  delete window.__fxdriver_evaluate;
  delete window.__driver_unwrapped;
  delete window.__webdriver_unwrapped;
  delete window.__driver_evaluate;
  delete window.__selenium_unwrapped;
  delete window.__fxdriver_unwrapped;
  
  // ========== Performance API Noise ==========
  const originalPerformanceNow = Performance.prototype.now;
  const perfOffset = Math.random() * 0.001;
  Performance.prototype.now = function() {
    return originalPerformanceNow.call(this) + perfOffset + Math.random() * 0.0001;
  };
  
  console.log('[Fingerprint] ✓ Spoofing applied:', {
    webgl: webglRenderer.substring(0, 50) + '...',
    screen: screenOverrides.width + 'x' + screenOverrides.height,
    platform: navigatorOverrides.platform,
    timezone: fp.timezone || 'default'
  });
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
    const devPath = path.join(__dirname, '..', 'public', 'extensions', folderName);
    const prodPath = path.join(process.resourcesPath || '', 'public', 'extensions', folderName);
    
    if (fs.existsSync(devPath)) {
      builtInExtensions.push(devPath);
    } else if (fs.existsSync(prodPath)) {
      builtInExtensions.push(prodPath);
    }
  }
  
  // Add all built-in extensions
  addBuiltInExtension('auto-login');        // تسجيل الدخول التلقائي
  addBuiltInExtension('session-capture');   // التقاط الجلسات
  addBuiltInExtension('captcha-solver');    // حل CAPTCHA
  
  // Collect all extension paths
  let allExtensionPaths = [...builtInExtensions];
  
  // Add user-specified extensions
  if (extensions && extensions.length > 0) {
    const validUserExtensions = extensions.filter(ext => fs.existsSync(ext));
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
    }
  }
  
  // Add all extensions to args
  if (allExtensionPaths.length > 0) {
    args.push(`--load-extension=${allExtensionPaths.join(',')}`);
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

// ========== Window Management for Running Profiles ==========

// Get running profile IDs
ipcMain.handle('get-running-profiles', () => {
  return Array.from(runningProfiles.keys());
});

// Tile profile windows in grid, horizontal, or vertical layout
ipcMain.handle('tile-profile-windows', async (event, layout) => {
  const { screen } = require('electron');
  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  const displays = screen.getAllDisplays();
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

  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');
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

  const { exec } = require('child_process');
  const fs = require('fs');
  const path = require('path');
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
  
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    
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
