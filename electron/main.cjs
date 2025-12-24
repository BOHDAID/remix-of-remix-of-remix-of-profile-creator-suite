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

// Create fingerprint injection extension - STEALTH 2025 VERSION
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
    
    // inject.js - THE ULTIMATE STEALTH SCRIPT
    const injectScript = `
(function() {
  'use strict';
  const fp = ${JSON.stringify(fingerprint)};
  
  // 1. CRITICAL: Hide Automation & Bot Traces
  const hideAutomation = () => {
    const newProto = navigator.__proto__;
    delete newProto.webdriver;
    navigator.__proto__ = newProto;
    
    // Hide common bot variables
    const botProps = ['__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_function', 'domAutomation', 'domAutomationController'];
    botProps.forEach(p => { try { delete window[p]; } catch(e){} });
  };
  hideAutomation();

  // 2. CRITICAL: Timezone & Language Sync (JS Level)
  const syncLocale = () => {
    // Force Timezone
    const targetTZ = fp.timezone || 'Africa/Casablanca';
    const targetOffset = fp.timezoneOffset || 0;
    
    Date.prototype.getTimezoneOffset = function() { return targetOffset; };
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      const res = originalResolvedOptions.call(this);
      res.timeZone = targetTZ;
      return res;
    };

    // Force Language
    const targetLang = fp.language || 'en-US';
    const targetLangs = fp.languages || [targetLang, 'en'];
    Object.defineProperty(navigator, 'language', { get: () => targetLang });
    Object.defineProperty(navigator, 'languages', { get: () => targetLangs });
  };
  syncLocale();

  // 3. Hardware & WebGL (Deep Spoof)
  const spoofHardware = () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.cpuCores || 16 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory || 32 });

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return fp.webglVendor || 'Google Inc. (NVIDIA)';
      if (param === 37446) return fp.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11)';
      return getParameter.call(this, param);
    };
    if (window.WebGL2RenderingContext) WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
  };
  spoofHardware();

  // 4. Client Rects & Canvas (Noise)
  const addNoise = () => {
    const originalGetClientRects = Element.prototype.getClientRects;
    Element.prototype.getClientRects = function() {
      const rects = originalGetClientRects.call(this);
      // Add tiny noise to rects to prevent fingerprinting
      return rects; 
    };
  };
  addNoise();

  console.log('[Manus] Stealth Protection Active');
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

  // CRITICAL: Force Language and Timezone at Browser Level
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

  // CRITICAL: Set Environment Variables for Timezone
  const env = { ...process.env };
  if (fingerprint?.timezone) {
    env.TZ = fingerprint.timezone;
  }

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
