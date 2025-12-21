const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
// Store running browser processes by profile ID
const runningProfiles = new Map();

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
    backgroundColor: '#0a0f1a',
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
  const { chromiumPath, proxy, extensions, userAgent, profileId } = profileData;
  
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

  // Add extensions
  if (extensions && extensions.length > 0) {
    const extensionPaths = extensions.filter(ext => fs.existsSync(ext)).join(',');
    if (extensionPaths) {
      args.push(`--load-extension=${extensionPaths}`);
    }
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
