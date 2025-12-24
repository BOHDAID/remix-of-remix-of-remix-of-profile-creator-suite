// AI CAPTCHA Solver - Background Service Worker

// Store solver state
let solverState = {
  enabled: true,
  autoSolve: true,
  totalSolved: 0,
  successRate: 0,
  learningData: {}
};

// Load saved state
chrome.storage.local.get(['solverState'], (result) => {
  if (result.solverState) {
    solverState = { ...solverState, ...result.solverState };
  }
});

// Save state
function saveState() {
  chrome.storage.local.set({ solverState });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CAPTCHA_DETECTED':
      handleCaptchaDetected(message.data, sender);
      sendResponse({ success: true });
      break;

    case 'CAPTCHA_SOLVED':
      handleCaptchaSolved(message.data);
      sendResponse({ success: true });
      break;

    case 'GET_STATE':
      sendResponse(solverState);
      break;

    case 'UPDATE_STATE':
      solverState = { ...solverState, ...message.data };
      saveState();
      broadcastStateToTabs();
      updateBadge();
      sendResponse({ success: true });
      break;

    case 'GET_LEARNING_DATA':
      sendResponse(solverState.learningData);
      break;
      
    case 'CAPTURE_SCREEN':
      // Capture the visible tab
      handleScreenCapture(sender, message.rect).then(sendResponse);
      return true; // Keep channel open for async response
      
    case 'SIMULATE_CLICK':
      // Simulate click using debugger API
      handleSimulateClick(sender, message.x, message.y).then(sendResponse);
      return true;
  }

  return true;
});

// Handle screen capture for CAPTCHA solving
async function handleScreenCapture(sender, rect) {
  try {
    const tabId = sender?.tab?.id;
    if (!tabId) {
      console.log('[Background] No tab ID for capture');
      return { error: 'No tab ID' };
    }
    
    // Capture the visible area of the tab
    const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, {
      format: 'png',
      quality: 100
    });
    
    console.log('[Background] Screen captured successfully');
    
    // If rect is provided, we could crop but browser APIs don't support that directly
    // The content script will need to handle the full screenshot
    return { 
      success: true, 
      imageBase64: dataUrl 
    };
  } catch (error) {
    console.error('[Background] Screen capture failed:', error);
    return { error: error.message };
  }
}

// Simulate click using Chrome Debugger API (works on iframes)
async function handleSimulateClick(sender, x, y) {
  const tabId = sender?.tab?.id;
  if (!tabId) {
    return { success: false, error: 'No tab ID' };
  }
  
  try {
    // Attach debugger
    await chrome.debugger.attach({ tabId }, '1.3');
    
    // Simulate mouse press
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    });
    
    // Small delay
    await new Promise(r => setTimeout(r, 50));
    
    // Simulate mouse release
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    });
    
    // Detach debugger
    await chrome.debugger.detach({ tabId });
    
    console.log('[Background] Simulated click at', x, y);
    return { success: true };
  } catch (error) {
    console.error('[Background] Click simulation failed:', error);
    try {
      await chrome.debugger.detach({ tabId });
    } catch {}
    return { success: false, error: error.message };
  }
}

async function broadcastStateToTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs
        .sendMessage(tab.id, {
          type: 'TOGGLE_SOLVER',
          enabled: solverState.enabled,
          autoSolve: solverState.autoSolve,
        })
        .catch(() => {});
    }
  } catch {
    // ignore
  }
}

function handleCaptchaDetected(data, sender) {
  const tabId = sender?.tab?.id;
  const tabUrl = sender?.tab?.url;

  if (!tabId) {
    console.warn('CAPTCHA detected but no tabId available', data);
    return;
  }

  console.log('CAPTCHA detected:', data.type, 'on tab:', tabId);

  // Notify popup if open
  chrome.runtime
    .sendMessage({
      type: 'CAPTCHA_FOUND',
      data: {
        tabId,
        url: tabUrl,
        captchaType: data.type,
      },
    })
    .catch(() => {});

  // If auto-solve is enabled, trigger solving
  if (solverState.autoSolve && solverState.enabled) {
    chrome.tabs
      .sendMessage(tabId, {
        type: 'START_SOLVING',
        data,
      })
      .catch(() => {});
  }
}

function handleCaptchaSolved(data) {
  solverState.totalSolved++;

  // Update learning data
  const key = data.captchaType;
  if (!solverState.learningData[key]) {
    solverState.learningData[key] = { success: 0, failed: 0, patterns: [] };
  }

  if (data.success) {
    solverState.learningData[key].success++;
  } else {
    solverState.learningData[key].failed++;
  }

  // Calculate success rate
  const total = Object.values(solverState.learningData).reduce(
    (sum, d) => sum + d.success + d.failed,
    0
  );
  const success = Object.values(solverState.learningData).reduce(
    (sum, d) => sum + d.success,
    0
  );
  solverState.successRate = total > 0 ? (success / total) * 100 : 0;

  saveState();

  console.log('CAPTCHA solved:', data.success ? 'SUCCESS' : 'FAILED');
}


// Badge update
function updateBadge() {
  const text = solverState.enabled ? 'ON' : 'OFF';
  const color = solverState.enabled ? '#22c55e' : '#ef4444';
  
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

updateBadge();
