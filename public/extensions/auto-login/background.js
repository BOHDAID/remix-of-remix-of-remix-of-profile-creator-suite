// Auto Login Background Service Worker

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCredentials') {
    chrome.storage.local.get(['credentials'], (result) => {
      sendResponse({ credentials: result.credentials || [] });
    });
    return true;
  }
  
  if (request.action === 'saveCredential') {
    chrome.storage.local.get(['credentials'], (result) => {
      const credentials = result.credentials || [];
      
      // Check if credential exists for this domain
      const existingIndex = credentials.findIndex(c => c.domain === request.credential.domain);
      
      if (existingIndex >= 0) {
        // Update existing
        credentials[existingIndex] = {
          ...credentials[existingIndex],
          ...request.credential,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new
        credentials.push({
          ...request.credential,
          id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      chrome.storage.local.set({ credentials }, () => {
        sendResponse({ success: true, credentials });
      });
    });
    return true;
  }
  
  if (request.action === 'deleteCredential') {
    chrome.storage.local.get(['credentials'], (result) => {
      let credentials = result.credentials || [];
      credentials = credentials.filter(c => c.id !== request.credentialId);
      chrome.storage.local.set({ credentials }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'getCredentialForDomain') {
    chrome.storage.local.get(['credentials'], (result) => {
      const credentials = result.credentials || [];
      const credential = credentials.find(c => 
        request.domain.includes(c.domain) || c.domain.includes(request.domain)
      );
      sendResponse({ credential });
    });
    return true;
  }
  
  if (request.action === 'toggleAutoLogin') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || { autoLoginEnabled: true };
      settings.autoLoginEnabled = !settings.autoLoginEnabled;
      chrome.storage.local.set({ settings }, () => {
        sendResponse({ success: true, enabled: settings.autoLoginEnabled });
      });
    });
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || { autoLoginEnabled: true, delay: 500 } });
    });
    return true;
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = { ...result.settings, ...request.settings };
      chrome.storage.local.set({ settings }, () => {
        sendResponse({ success: true, settings });
      });
    });
    return true;
  }
});