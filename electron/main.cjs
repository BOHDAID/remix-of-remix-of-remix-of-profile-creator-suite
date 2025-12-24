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

// Create fingerprint injection extension - THE UNSTOPPABLE 2025 EDITION
function createFingerprintScript(fingerprint, userDataDir) {
  try {
    const extensionDir = path.join(userDataDir, 'fingerprint-extension');
    if (!fs.existsSync(extensionDir)) fs.mkdirSync(extensionDir, { recursive: true });
    
    const manifest = {
      manifest_version: 3,
      name: "System Kernel",
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
    
    // inject.js - THE ATOMIC STEALTH SCRIPT
    const injectScript = `
(function() {
  'use strict';
  const fp = ${JSON.stringify(fingerprint)};
  
  // --- 1. ATOMIC BOT EVASION ---
  // Completely wipe webdriver from the universe
  const hideWebDriver = () => {
    const proto = Navigator.prototype;
    const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'webdriver');
    if (originalDescriptor) {
      Object.defineProperty(proto, 'webdriver', {
        get: () => undefined,
        enumerable: true,
        configurable: true
      });
    }
  };
  hideWebDriver();

  // --- 2. PERFECT WEBGL SPOOFING ---
  const spoofWebGL = () => {
    const vendor = fp.webglVendor || 'Google Inc. (NVIDIA)';
    const renderer = fp.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11)';

    const proxyHandler = {
      apply: function(target, thisArg, argumentsList) {
        const param = argumentsList[0];
        if (param === 37445) return vendor;
        if (param === 37446) return renderer;
        if (param === 7936) return vendor;
        if (param === 7937) return renderer;
        return target.apply(thisArg, argumentsList);
      }
    };

    if (window.WebGLRenderingContext) {
      WebGLRenderingContext.prototype.getParameter = new Proxy(WebGLRenderingContext.prototype.getParameter, proxyHandler);
    }
    if (window.WebGL2RenderingContext) {
      WebGL2RenderingContext.prototype.getParameter = new Proxy(WebGL2RenderingContext.prototype.getParameter, proxyHandler);
    }
  };
  spoofWebGL();

  // --- 3. HARDWARE & MEMORY SYNC ---
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.cpuCores || 16 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory || 32 });

  // --- 4. LOCALE & TIMEZONE SYNC ---
  const targetTZ = fp.timezone || 'UTC';
  const targetOffset = fp.timezoneOffset || 0;
  Date.prototype.getTimezoneOffset = function() { return targetOffset; };
  
  const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  Intl.DateTimeFormat.prototype.resolvedOptions = function() {
    const res = originalResolvedOptions.call(this);
    Object.defineProperty(res, 'timeZone', { get: () => targetTZ });
    return res;
  };

  // --- 5. HIDE ELECTRON TRACES ---
  delete window.electron;
  delete window.ipcRenderer;

  console.log('%c [System] Kernel Protection Active ', 'background: #222; color: #bada55');
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
