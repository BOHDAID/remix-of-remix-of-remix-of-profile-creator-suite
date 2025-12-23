// Session Capture Background Service Worker
// With sync to main app functionality via localStorage

// Store captured sessions
let capturedSessions = [];

// Sync interval (every 5 seconds for faster sync)
let syncInterval = null;

// Start sync when extension loads
chrome.runtime.onInstalled.addListener(() => {
  startAutoSync();
});

chrome.runtime.onStartup.addListener(() => {
  startAutoSync();
});

function startAutoSync() {
  // Clear existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Sync every 5 seconds
  syncInterval = setInterval(() => {
    syncSessionsToApp();
  }, 5000);
  
  // Initial sync
  syncSessionsToApp();
}

// Sync sessions to main app via multiple methods
async function syncSessionsToApp() {
  try {
    const { sessions = [] } = await chrome.storage.local.get(['sessions']);
    
    // Store in a format the main app can read
    const syncData = {
      lastSync: new Date().toISOString(),
      sessions: sessions,
      source: 'bhd-session-capture-extension'
    };
    
    // Method 1: Save to chrome.storage.local
    await chrome.storage.local.set({ 
      'bhd-synced-sessions': syncData 
    });
    
    // Method 2: Try to inject into page localStorage (for web app access)
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id && activeTab.url) {
        // Check if it's the BHD app
        const url = new URL(activeTab.url);
        if (url.hostname.includes('lovable') || url.hostname === 'localhost') {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: (data) => {
              try {
                localStorage.setItem('bhd-synced-sessions', JSON.stringify(data));
              } catch (e) {
                console.error('Failed to sync sessions to app:', e);
              }
            },
            args: [syncData]
          });
        }
      }
    } catch (e) {
      // Ignore errors for tabs we can't access
    }
    
    console.log('[Session Capture] Synced', sessions.length, 'sessions');
  } catch (error) {
    console.error('[Session Capture] Sync error:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureSession') {
    captureCurrentSession(request.tabId).then(session => {
      // Sync immediately after capture
      syncSessionsToApp();
      sendResponse({ success: true, session });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'getSessions') {
    chrome.storage.local.get(['sessions'], (result) => {
      sendResponse({ sessions: result.sessions || [] });
    });
    return true;
  }
  
  if (request.action === 'clearSessions') {
    chrome.storage.local.set({ sessions: [] }, () => {
      capturedSessions = [];
      syncSessionsToApp();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'exportSession') {
    chrome.storage.local.get(['sessions'], (result) => {
      const sessions = result.sessions || [];
      const session = sessions.find(s => s.id === request.sessionId);
      sendResponse({ session });
    });
    return true;
  }
  
  if (request.action === 'forceSync') {
    syncSessionsToApp().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'syncToPage') {
    syncToCurrentPage(request.tabId).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Sync sessions to current page's localStorage
async function syncToCurrentPage(tabId) {
  const { sessions = [] } = await chrome.storage.local.get(['sessions']);
  
  const syncData = {
    lastSync: new Date().toISOString(),
    sessions: sessions,
    source: 'bhd-session-capture-extension'
  };
  
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (data) => {
      localStorage.setItem('bhd-synced-sessions', JSON.stringify(data));
      console.log('[BHD Extension] Synced', data.sessions.length, 'sessions to app');
    },
    args: [syncData]
  });
}

// Capture session from current tab
async function captureCurrentSession(tabId) {
  try {
    // Get current tab info
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    
    // Get cookies for this domain
    const cookies = await chrome.cookies.getAll({ domain: url.hostname });
    
    // Also get cookies for the parent domain
    const domainParts = url.hostname.split('.');
    if (domainParts.length > 2) {
      const parentDomain = '.' + domainParts.slice(-2).join('.');
      const parentCookies = await chrome.cookies.getAll({ domain: parentDomain });
      cookies.push(...parentCookies.filter(pc => !cookies.find(c => c.name === pc.name)));
    }
    
    // Execute script to get localStorage and sessionStorage
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getStorageData
    });
    
    const storageData = result.result || { localStorage: {}, sessionStorage: {} };
    
    // Detect tokens
    const tokens = detectTokens(cookies, storageData);
    
    // Create session object
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      domain: url.hostname,
      siteName: url.hostname.replace('www.', '').split('.')[0],
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl,
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expirationDate,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite
      })),
      localStorage: storageData.localStorage,
      sessionStorage: storageData.sessionStorage,
      tokens,
      capturedAt: new Date().toISOString(),
      status: 'active',
      loginState: tokens.length > 0 ? 'logged_in' : 'unknown'
    };
    
    // Save to storage
    const { sessions = [] } = await chrome.storage.local.get(['sessions']);
    
    // Check if session for this domain already exists
    const existingIndex = sessions.findIndex(s => s.domain === session.domain);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.splice(100);
    }
    
    await chrome.storage.local.set({ sessions });
    capturedSessions = sessions;
    
    // Sync immediately
    await syncSessionsToApp();
    
    // Also try to sync directly to the page if it's the BHD app
    try {
      await syncToCurrentPage(tabId);
    } catch (e) {
      // Ignore if we can't sync to this page
    }
    
    return session;
  } catch (error) {
    console.error('Capture error:', error);
    throw error;
  }
}

// Function to get storage data (runs in page context)
function getStorageData() {
  const localStorage = {};
  const sessionStorage = {};
  
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      localStorage[key] = window.localStorage.getItem(key);
    }
  } catch (e) {}
  
  try {
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      sessionStorage[key] = window.sessionStorage.getItem(key);
    }
  } catch (e) {}
  
  return { localStorage, sessionStorage };
}

// Detect tokens from cookies and storage
function detectTokens(cookies, storageData) {
  const tokens = [];
  const tokenPatterns = [
    'token', 'auth', 'session', 'jwt', 'access', 'refresh', 
    'bearer', 'api_key', 'apikey', 'sid', 'csrf', 'xsrf'
  ];
  
  // Check cookies
  cookies.forEach(cookie => {
    const nameLower = cookie.name.toLowerCase();
    if (tokenPatterns.some(p => nameLower.includes(p))) {
      tokens.push({
        type: detectTokenType(cookie.name, cookie.value),
        name: cookie.name,
        value: cookie.value,
        maskedValue: maskValue(cookie.value),
        source: 'cookie',
        isValid: true
      });
    }
  });
  
  // Check localStorage
  Object.entries(storageData.localStorage || {}).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (tokenPatterns.some(p => keyLower.includes(p))) {
      tokens.push({
        type: detectTokenType(key, value),
        name: key,
        value: value,
        maskedValue: maskValue(value),
        source: 'localStorage',
        isValid: true
      });
    }
  });
  
  // Check sessionStorage
  Object.entries(storageData.sessionStorage || {}).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    if (tokenPatterns.some(p => keyLower.includes(p))) {
      tokens.push({
        type: detectTokenType(key, value),
        name: key,
        value: value,
        maskedValue: maskValue(value),
        source: 'sessionStorage',
        isValid: true
      });
    }
  });
  
  return tokens;
}

function detectTokenType(name, value) {
  const nameLower = name.toLowerCase();
  
  // Check if it's a JWT
  if (typeof value === 'string' && value.split('.').length === 3) {
    try {
      const parts = value.split('.');
      JSON.parse(atob(parts[0]));
      JSON.parse(atob(parts[1]));
      return 'jwt';
    } catch (e) {}
  }
  
  if (nameLower.includes('bearer')) return 'bearer';
  if (nameLower.includes('access')) return 'oauth_access';
  if (nameLower.includes('refresh')) return 'oauth_refresh';
  if (nameLower.includes('csrf') || nameLower.includes('xsrf')) return 'csrf';
  if (nameLower.includes('session') || nameLower.includes('sid')) return 'session_id';
  if (nameLower.includes('api')) return 'api_key';
  
  return 'auth_token';
}

function maskValue(value) {
  if (!value || value.length < 12) return '****';
  return value.substring(0, 6) + '...' + value.substring(value.length - 4);
}

// Listen for tab updates to auto-sync when BHD app is opened
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      if (url.hostname.includes('lovable') || url.hostname === 'localhost') {
        // BHD app detected, sync sessions
        await syncToCurrentPage(tabId);
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  }
});
