const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // File dialogs
  selectExtensionFolder: () => ipcRenderer.invoke('select-extension-folder'),
  selectExtensionZip: () => ipcRenderer.invoke('select-extension-zip'),
  selectChromiumPath: () => ipcRenderer.invoke('select-chromium-path'),
  
  // Profile management
  launchProfile: (profileData) => ipcRenderer.invoke('launch-profile', profileData),
  stopProfile: (profileId) => ipcRenderer.invoke('stop-profile', profileId),
  onProfileClosed: (callback) => ipcRenderer.on('profile-closed', (_, profileId) => callback(profileId)),
  
  // Browser window management
  tileProfileWindows: (layout) => ipcRenderer.invoke('tile-profile-windows', layout),
  minimizeAllProfiles: () => ipcRenderer.invoke('minimize-all-profiles'),
  restoreAllProfiles: () => ipcRenderer.invoke('restore-all-profiles'),
  focusProfile: (profileId) => ipcRenderer.invoke('focus-profile', profileId),
  getRunningProfiles: () => ipcRenderer.invoke('get-running-profiles'),
  
  // Utilities
  getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  extractExtensionZip: (zipPath) => ipcRenderer.invoke('extract-extension-zip', zipPath),
  
  // Auto-updater
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_, progress) => callback(progress)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // ========== Session Capture API ==========
  captureProfileSession: (profileId, url) => ipcRenderer.invoke('capture-profile-session', { profileId, url }),
  getCapturedSessions: () => ipcRenderer.invoke('get-captured-sessions'),
  deleteCapturedSession: (sessionId) => ipcRenderer.invoke('delete-captured-session', sessionId),
  deleteAllSessions: () => ipcRenderer.invoke('delete-all-sessions'),
  captureUrlCookies: (profileId, url) => ipcRenderer.invoke('capture-url-cookies', { profileId, url }),
  injectSession: (profileId, sessionData) => ipcRenderer.invoke('inject-session', { profileId, sessionData }),
  onSessionCaptured: (callback) => ipcRenderer.on('session-captured', (_, session) => callback(session)),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});
