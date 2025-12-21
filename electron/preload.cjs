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
  
  // Utilities
  getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  extractExtensionZip: (zipPath) => ipcRenderer.invoke('extract-extension-zip', zipPath),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});
