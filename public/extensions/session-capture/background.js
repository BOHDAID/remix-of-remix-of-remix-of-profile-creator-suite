// Session Capture Background Service Worker

// Store captured sessions
let capturedSessions = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureSession') {
    captureCurrentSession(request.tabId).then(session => {
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
});

// Capture session from current tab
async function captureCurrentSession(tabId) {
  try {
    // Get current tab info
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    
    // Get cookies for this domain
    const cookies = await chrome.cookies.getAll({ domain: url.hostname });
    
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
    sessions.unshift(session);
    
    // Keep only last 100 sessions
    if (sessions.length > 100) {
      sessions.splice(100);
    }
    
    await chrome.storage.local.set({ sessions });
    capturedSessions = sessions;
    
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
