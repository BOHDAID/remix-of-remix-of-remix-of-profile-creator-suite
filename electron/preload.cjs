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
  
  // Platform info
  platform: process.platform,
  isElectron: true
});
