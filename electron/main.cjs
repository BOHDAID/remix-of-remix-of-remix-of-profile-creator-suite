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

// Create fingerprint injection extension - STABLE 2025
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
    
    // inject.js - CLEANED
    const injectScript = `
(function() {
  'use strict';
  const fp = ${JSON.stringify(fingerprint)};
  
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  } catch(e) {}

  try {
    if (window.RTCPeerConnection) {
      window.RTCPeerConnection.prototype.createOffer = function() { return Promise.resolve(); };
    }
  } catch(e) {}

  try {
    const vendor = fp.webglVendor || 'Google Inc. (NVIDIA)';
    const renderer = fp.webglRenderer || 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11)';
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return vendor;
      if (param === 37446) return renderer;
      return originalGetParameter.call(this, param);
    };
  } catch(e) {}

  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.cpuCores || 16 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory || 32 });
    const targetTZ = fp.timezone || 'UTC';
    const targetOffset = fp.timezoneOffset || 0;
    Date.prototype.getTimezoneOffset = function() { return targetOffset; };
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      const res = originalResolvedOptions.call(this);
      Object.defineProperty(res, 'timeZone', { get: () => targetTZ });
      return res;
    };
  } catch(e) {}
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
    '--disable-webrtc'
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
