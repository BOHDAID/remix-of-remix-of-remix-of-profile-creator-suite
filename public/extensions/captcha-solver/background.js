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
      handleCaptchaDetected(message.data, sender.tab);
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
      sendResponse({ success: true });
      break;
      
    case 'GET_LEARNING_DATA':
      sendResponse(solverState.learningData);
      break;
  }
  
  return true;
});

function handleCaptchaDetected(data, tab) {
  console.log('CAPTCHA detected:', data.type, 'on tab:', tab.id);
  
  // Notify popup if open
  chrome.runtime.sendMessage({
    type: 'CAPTCHA_FOUND',
    data: {
      tabId: tab.id,
      url: tab.url,
      captchaType: data.type
    }
  }).catch(() => {});
  
  // If auto-solve is enabled, trigger solving
  if (solverState.autoSolve && solverState.enabled) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'START_SOLVING',
      data: data
    }).catch(() => {});
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
  const total = Object.values(solverState.learningData).reduce((sum, d) => sum + d.success + d.failed, 0);
  const success = Object.values(solverState.learningData).reduce((sum, d) => sum + d.success, 0);
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
