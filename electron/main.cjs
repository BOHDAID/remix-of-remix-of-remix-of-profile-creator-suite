const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const { spawn, exec: execRaw } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Wrapper for exec with increased maxBuffer
const exec = (command, callback) => {
  return execRaw(command, { maxBuffer: 50 * 1024 * 1024 }, callback);
};

let mainWindow;
const runningProfiles = new Map();

// Create fingerprint injection extension - ULTIMATE STEALTH 2025
function createFingerprintScript(fingerprint, userDataDir) {
  try {
    const extensionDir = path.join(userDataDir, 'fingerprint-extension');
    if (!fs.existsSync(extensionDir)) fs.mkdirSync(extensionDir, { recursive: true });
    
    const manifest = {
      manifest_version: 3,
      name: "System Core",
      version: "1.0",
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["inject.js"],
        run_at: "document_start",
        all_frames: true,
        world: "MAIN"
      }]
    };
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // inject.js - THE MOST ADVANCED STEALTH SCRIPT (2025)
    const injectScript = `
(function() {
  'use strict';
  const fp = ${JSON.stringify(fingerprint)};
  const seed = fp.seed || Math.floor(Math.random() * 1000000);
  
  // Helper for consistent noise
  const pseudoRandom = (s) => {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // 1. Hide Automation (Deep)
  const hideAutomation = () => {
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;
    
    // Hide common bot variables
    const botProps = ['__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', 'domAutomation', 'domAutomationController', '_phantom', 'callPhantom'];
    botProps.forEach(p => { try { delete window[p]; } catch(e){} });

    // Spoof chrome runtime
    if (!window.chrome) window.chrome = { runtime: {} };
  };
  hideAutomation();

  // 2. WebGL Deep Spoofing (Extensions & Params)
  const spoofWebGL = () => {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return fp.webglVendor || 'Google Inc. (NVIDIA)';
      if (param === 37446) return fp.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11)';
      return getParameter.call(this, param);
    };
    if (window.WebGL2RenderingContext) WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
  };
  spoofWebGL();

  // 3. Client Rects & Fonts (Noise)
  const spoofRects = () => {
    const originalGetClientRects = Element.prototype.getClientRects;
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    
    Element.prototype.getClientRects = function() {
      const rects = originalGetClientRects.call(this);
      const noise = (pseudoRandom(seed) - 0.5) * 0.0001;
      for (let i = 0; i < rects.length; i++) {
        rects[i].x += noise;
        rects[i].y += noise;
      }
      return rects;
    };

    Element.prototype.getBoundingClientRect = function() {
      const rect = originalGetBoundingClientRect.call(this);
      const noise = (pseudoRandom(seed) - 0.5) * 0.0001;
      return {
        ...rect,
        x: rect.x + noise,
        y: rect.y + noise,
        left: rect.left + noise,
        top: rect.top + noise
      };
    };
  };
  spoofRects();

  // 4. Audio Context (Noise)
  const spoofAudio = () => {
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function() {
      const data = originalGetChannelData.apply(this, arguments);
      const noise = (pseudoRandom(seed) - 0.5) * 0.0000001;
      for (let i = 0; i < data.length; i++) {
        data[i] += noise;
      }
      return data;
    };
  };
  spoofAudio();

  // 5. Timezone & Language (Deep Sync)
  const syncLocale = () => {
    const targetTZ = fp.timezone || 'UTC';
    const targetOffset = fp.timezoneOffset || 0;
    
    Date.prototype.getTimezoneOffset = function() { return targetOffset; };
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      const res = originalResolvedOptions.call(this);
      res.timeZone = targetTZ;
      return res;
    };

    Object.defineProperty(navigator, 'language', { get: () => fp.language || 'en-US' });
    Object.defineProperty(navigator, 'languages', { get: () => fp.languages || ['en-US', 'en'] });
  };
  syncLocale();

  console.log('[Manus] Ultimate Stealth Active');
})();
    `;
    fs.writeFileSync(path.join(extensionDir, 'inject.js'), injectScript);
    return extensionDir;
  } catch (e) { return null; }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, frame: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') }
  });
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('close-window', () => mainWindow?.close());

ipcMain.handle('launch-profile', async (event, profileData) => {
  const { chromiumPath, proxy, userAgent, profileId, fingerprint } = profileData;
  const userDataDir = path.join(app.getPath('userData'), 'profiles', profileId);
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

  const args = [
    `--user-data-dir=${userDataDir}`,
    '--disable-blink-features=AutomationControlled',
    '--no-first-run',
    '--no-default-browser-check',
    '--ignore-certificate-errors',
    `--lang=${fingerprint?.language || 'en-US'}`,
    `--accept-lang=${fingerprint?.language || 'en-US'}`,
    '--disable-features=IsolateOrigins,site-per-process'
  ];

  if (userAgent) args.push(`--user-agent=${userAgent}`);
  if (proxy) args.push(`--proxy-server=${proxy.type}://${proxy.host}:${proxy.port}`);
  
  const extDir = createFingerprintScript(fingerprint, userDataDir);
  if (extDir) args.push(`--load-extension=${extDir}`);

  const env = { ...process.env };
  if (fingerprint?.timezone) env.TZ = fingerprint.timezone;

  const browser = spawn(chromiumPath, args, { detached: false, stdio: 'ignore', env });
  runningProfiles.set(profileId, browser);
  browser.on('exit', () => {
    runningProfiles.delete(profileId);
    mainWindow?.webContents.send('profile-closed', profileId);
  });
  return { success: true, pid: browser.pid };
});

ipcMain.handle('stop-profile', async (event, profileId) => {
  const browser = runningProfiles.get(profileId);
  if (browser) browser.kill();
  return { success: true };
});

ipcMain.handle('get-app-paths', () => ({
  userData: app.getPath('userData'),
  extensions: path.join(app.getPath('userData'), 'extensions'),
  profiles: path.join(app.getPath('userData'), 'profiles')
}));
