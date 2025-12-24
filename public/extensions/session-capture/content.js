// BHD Session Capture - Content Script
(function() {
  'use strict';

  // Session data storage
  let sessionData = {
    cookies: [],
    localStorage: {},
    sessionStorage: {},
    url: window.location.href,
    domain: window.location.hostname,
    capturedAt: null
  };

  // Capture localStorage
  function captureLocalStorage() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
    } catch (e) {
      console.error('[Session Capture] localStorage error:', e);
    }
    return data;
  }

  // Capture sessionStorage
  function captureSessionStorage() {
    const data = {};
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data[key] = sessionStorage.getItem(key);
      }
    } catch (e) {
      console.error('[Session Capture] sessionStorage error:', e);
    }
    return data;
  }

  // Capture all session data
  function captureSession() {
    sessionData = {
      localStorage: captureLocalStorage(),
      sessionStorage: captureSessionStorage(),
      url: window.location.href,
      domain: window.location.hostname,
      capturedAt: new Date().toISOString()
    };

    // Request cookies from background script
    chrome.runtime.sendMessage({ 
      type: 'CAPTURE_COOKIES',
      domain: window.location.hostname
    }, (response) => {
      if (response && response.cookies) {
        sessionData.cookies = response.cookies;
      }
      
      // Send complete session data to background
      chrome.runtime.sendMessage({
        type: 'SESSION_CAPTURED',
        data: sessionData
      });
    });

    return sessionData;
  }

  // Inject session data into page
  function injectSession(data) {
    try {
      // Restore localStorage
      if (data.localStorage) {
        for (const [key, value] of Object.entries(data.localStorage)) {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('[Session Capture] Failed to restore localStorage key:', key);
          }
        }
      }

      // Restore sessionStorage
      if (data.sessionStorage) {
        for (const [key, value] of Object.entries(data.sessionStorage)) {
          try {
            sessionStorage.setItem(key, value);
          } catch (e) {
            console.warn('[Session Capture] Failed to restore sessionStorage key:', key);
          }
        }
      }

      console.log('[Session Capture] Session data injected successfully');
      return true;
    } catch (error) {
      console.error('[Session Capture] Injection failed:', error);
      return false;
    }
  }

  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'CAPTURE_SESSION':
        const captured = captureSession();
        sendResponse({ success: true, data: captured });
        break;

      case 'INJECT_SESSION':
        const injected = injectSession(message.data);
        sendResponse({ success: injected });
        break;

      case 'GET_CURRENT_URL':
        sendResponse({ url: window.location.href, domain: window.location.hostname });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    return true; // Keep channel open for async response
  });

  // Auto-capture on page load if enabled
  chrome.storage.local.get(['autoCapture'], (result) => {
    if (result.autoCapture) {
      // Wait for page to fully load
      if (document.readyState === 'complete') {
        captureSession();
      } else {
        window.addEventListener('load', () => {
          setTimeout(captureSession, 1000);
        });
      }
    }
  });

  console.log('[Session Capture] Content script loaded for:', window.location.hostname);
})();
