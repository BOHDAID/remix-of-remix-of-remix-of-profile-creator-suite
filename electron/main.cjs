const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
// Store running browser processes by profile ID
const runningProfiles = new Map();

// Create fingerprint injection extension
function createFingerprintScript(fingerprint, userDataDir) {
  try {
    const extensionDir = path.join(userDataDir, 'fingerprint-extension');
    
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }
    
    // manifest.json
    const manifest = {
      manifest_version: 3,
      name: "Fingerprint Spoof",
      version: "1.0",
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start",
        all_frames: true
      }]
    };
    
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // content.js - inject fingerprint spoofing
    const contentScript = `
(function() {
  const fp = ${JSON.stringify(fingerprint)};
  
  // ========== Navigator Properties ==========
  const navigatorProps = {
    hardwareConcurrency: { value: fp.cpuCores || fp.hardwareConcurrency },
    deviceMemory: { value: fp.deviceMemory },
    platform: { value: fp.platform },
    language: { value: fp.language },
    languages: { value: Object.freeze(fp.languages || [fp.language]) },
    maxTouchPoints: { value: 0 },
    vendor: { value: 'Google Inc.' },
    appVersion: { value: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  };
  
  for (const [key, descriptor] of Object.entries(navigatorProps)) {
    try {
      Object.defineProperty(navigator, key, { ...descriptor, configurable: true });
    } catch (e) {}
  }
  
  // ========== Screen Properties ==========
  const screenProps = {
    width: { value: fp.screenWidth },
    height: { value: fp.screenHeight },
    availWidth: { value: fp.screenWidth },
    availHeight: { value: fp.screenHeight - 40 },
    colorDepth: { value: fp.colorDepth || 24 },
    pixelDepth: { value: fp.colorDepth || 24 }
  };
  
  for (const [key, descriptor] of Object.entries(screenProps)) {
    try {
      Object.defineProperty(screen, key, { ...descriptor, configurable: true });
    } catch (e) {}
  }
  
  // ========== Window Properties ==========
  try {
    Object.defineProperty(window, 'devicePixelRatio', { value: fp.pixelRatio || 1, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: fp.screenWidth - 200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: fp.screenHeight - 150, configurable: true });
    Object.defineProperty(window, 'outerWidth', { value: fp.screenWidth, configurable: true });
    Object.defineProperty(window, 'outerHeight', { value: fp.screenHeight, configurable: true });
  } catch (e) {}
  
  // ========== WebGL Spoofing ==========
  const getParameterProxyHandler = {
    apply: function(target, thisArg, args) {
      const param = args[0];
      if (param === 37445) return fp.webglVendor || fp.gpuVendor;
      if (param === 37446) return fp.webglRenderer || fp.gpu;
      return target.apply(thisArg, args);
    }
  };
  
  const hookWebGL = (proto) => {
    if (proto && proto.getParameter) {
      proto.getParameter = new Proxy(proto.getParameter, getParameterProxyHandler);
    }
  };
  
  hookWebGL(WebGLRenderingContext.prototype);
  if (typeof WebGL2RenderingContext !== 'undefined') {
    hookWebGL(WebGL2RenderingContext.prototype);
  }
  
  // ========== Canvas Fingerprint Spoofing ==========
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  const noise = () => Math.floor(Math.random() * 10) - 5;
  
  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise()));
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, args);
  };
  
  // ========== Audio Context Fingerprint Spoofing ==========
  if (window.AudioContext || window.webkitAudioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const originalCreateAnalyser = AudioContextClass.prototype.createAnalyser;
    const originalCreateOscillator = AudioContextClass.prototype.createOscillator;
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
      originalGetFloatFrequencyData.call(this, array);
      for (let i = 0; i < array.length; i++) {
        array[i] += Math.random() * 0.0001;
      }
    };
  }
  
  // ========== WebRTC IP Leak Prevention ==========
  if (window.RTCPeerConnection) {
    const origRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function(...args) {
      const config = args[0] || {};
      config.iceServers = [];
      args[0] = config;
      const pc = new origRTCPeerConnection(...args);
      return pc;
    };
    window.RTCPeerConnection.prototype = origRTCPeerConnection.prototype;
  }
  
  // ========== Battery API Spoofing ==========
  if (navigator.getBattery) {
    navigator.getBattery = () => Promise.resolve({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1.0,
      addEventListener: () => {},
      removeEventListener: () => {}
    });
  }
  
  // ========== Media Devices Spoofing ==========
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
      { deviceId: 'default', kind: 'audioinput', label: '', groupId: 'default' },
      { deviceId: 'default', kind: 'videoinput', label: '', groupId: 'default' },
      { deviceId: 'default', kind: 'audiooutput', label: '', groupId: 'default' }
    ]);
  }
  
  // ========== Timezone Spoofing ==========
  if (fp.timezone) {
    const originalDateTimeFormat = Intl.DateTimeFormat;
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    
    Intl.DateTimeFormat = function(locales, options) {
      options = options || {};
      options.timeZone = fp.timezone;
      return new originalDateTimeFormat(locales, options);
    };
    Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;
    
    Intl.DateTimeFormat.prototype.resolvedOptions = function() {
      const result = originalResolvedOptions.call(this);
      result.timeZone = fp.timezone;
      return result;
    };
    
    // Override Date methods for timezone
    const tzOffset = (() => {
      const tzMap = {
        'America/New_York': -5, 'America/Los_Angeles': -8, 'America/Chicago': -6,
        'Europe/London': 0, 'Europe/Paris': 1, 'Europe/Berlin': 1, 'Europe/Moscow': 3,
        'Asia/Dubai': 4, 'Asia/Riyadh': 3, 'Asia/Tokyo': 9, 'Asia/Shanghai': 8,
        'Asia/Singapore': 8, 'Australia/Sydney': 11
      };
      return (tzMap[fp.timezone] || 0) * 60;
    })();
    
    const origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function() {
      return -tzOffset;
    };
  }
  
  // ========== Font Fingerprint Protection ==========
  const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  CanvasRenderingContext2D.prototype.measureText = function(text) {
    const result = originalMeasureText.call(this, text);
    return {
      ...result,
      width: result.width + Math.random() * 0.001
    };
  };
  
  console.log('[Fingerprint] Advanced spoofing applied:', fp.gpu, fp.cpu, fp.timezone);
})();
`;
    
    fs.writeFileSync(path.join(extensionDir, 'content.js'), contentScript);
    
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

  // Add extensions
  if (extensions && extensions.length > 0) {
    const extensionPaths = extensions.filter(ext => fs.existsSync(ext)).join(',');
    if (extensionPaths) {
      args.push(`--load-extension=${extensionPaths}`);
    }
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
      // The script will be loaded as an extension
      args.push(`--load-extension=${fingerprintScript}${extensions && extensions.length > 0 ? ',' + extensions.filter(ext => fs.existsSync(ext)).join(',') : ''}`);
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

// ========== Window Management for Running Profiles ==========

// Get running profile IDs
ipcMain.handle('get-running-profiles', () => {
  return Array.from(runningProfiles.keys());
});

// Tile profile windows in grid, horizontal, or vertical layout
ipcMain.handle('tile-profile-windows', async (event, layout) => {
  const { screen } = require('electron');
  const { exec } = require('child_process');
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

    // PowerShell script to move and resize windows
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

while ($hwnd -ne [IntPtr]::Zero) {
    $processId = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
    if ($pids -contains $processId) {
        $windows += @{ hwnd = $hwnd; pid = $processId }
    }
    $hwnd = [Win32]::FindWindowEx($null, $hwnd, "Chrome_WidgetWin_1", $null)
}

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

    return new Promise((resolve) => {
      exec(`powershell -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, (error, stdout, stderr) => {
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

// Minimize all profile windows (using taskkill alternative - minimize main window for demo)
ipcMain.handle('minimize-all-profiles', async () => {
  // For Chrome windows, we need platform-specific solutions
  // On Windows, we can use PowerShell to minimize windows
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      // PowerShell command to minimize all Chrome windows
      const cmd = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }'; Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { [Win32]::ShowWindow($_.MainWindowHandle, 6) }"`;
      
      exec(cmd, (error) => {
        if (error) {
          console.log('Minimize error:', error);
        }
        resolve();
      });
    });
  }
  return Promise.resolve();
});

// Restore all profile windows
ipcMain.handle('restore-all-profiles', async () => {
  if (process.platform === 'win32') {
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      // PowerShell command to restore all Chrome windows
      const cmd = `powershell -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow); }'; Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { [Win32]::ShowWindow($_.MainWindowHandle, 9) }"`;
      
      exec(cmd, (error) => {
        if (error) {
          console.log('Restore error:', error);
        }
        resolve();
      });
    });
  }
  return Promise.resolve();
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
