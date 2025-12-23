// Auto Login Popup Script

let currentTab = null;
let currentDomain = '';
let settings = { autoLoginEnabled: true, delay: 500, typingSpeed: 30, autoSubmit: true };

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentTab();
  await loadSettings();
  await loadCredentials();
  setupEventListeners();
});

// Load current tab info
async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname.replace('www.', '');
      document.getElementById('siteName').textContent = currentDomain;
      
      if (tab.favIconUrl) {
        document.getElementById('siteFavicon').src = tab.favIconUrl;
      }
      
      // Check if we have saved credentials for this domain
      chrome.runtime.sendMessage({ action: 'getCredentialForDomain', domain: currentDomain }, (response) => {
        if (response?.credential) {
          document.getElementById('username').value = response.credential.username;
          document.getElementById('password').value = response.credential.password;
          document.getElementById('autoSubmit').checked = response.credential.autoSubmit !== false;
        }
      });
    }
  } catch (error) {
    document.getElementById('siteName').textContent = 'غير متاح';
  }
}

// Load settings
async function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    settings = response?.settings || settings;
    
    // Update UI
    const toggle = document.getElementById('mainToggle');
    if (settings.autoLoginEnabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
    
    document.getElementById('delayInput').value = settings.delay || 500;
    document.getElementById('typingSpeedInput').value = settings.typingSpeed || 30;
    document.getElementById('autoSubmitSetting').checked = settings.autoSubmit !== false;
  });
}

// Load credentials list
async function loadCredentials() {
  chrome.runtime.sendMessage({ action: 'getCredentials' }, (response) => {
    const credentials = response?.credentials || [];
    const listContainer = document.getElementById('credentialsList');
    
    if (credentials.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 48px; margin-bottom: 12px;">🔑</div>
          <p>لا توجد بيانات محفوظة</p>
          <p style="font-size: 11px; margin-top: 4px;">احفظ بيانات الدخول لتسجيل دخول تلقائي</p>
        </div>
      `;
      return;
    }
    
    listContainer.innerHTML = credentials.map(cred => `
      <div class="credential-item" data-id="${cred.id}">
        <div class="credential-icon">🌐</div>
        <div class="credential-details">
          <div class="credential-domain">${cred.domain}</div>
          <div class="credential-username">${cred.username}</div>
        </div>
        <div class="credential-actions">
          <button class="action-btn" onclick="loginWithCredential('${cred.id}')" title="تسجيل الدخول">⚡</button>
          <button class="action-btn" onclick="editCredential('${cred.id}')" title="تعديل">✏️</button>
          <button class="action-btn delete" onclick="deleteCredential('${cred.id}')" title="حذف">🗑️</button>
        </div>
      </div>
    `).join('');
  });
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
  
  // Main toggle
  document.getElementById('mainToggle').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleAutoLogin' }, (response) => {
      const toggle = document.getElementById('mainToggle');
      if (response?.enabled) {
        toggle.classList.add('active');
        showToast('تم تفعيل تسجيل الدخول التلقائي', 'success');
      } else {
        toggle.classList.remove('active');
        showToast('تم تعطيل تسجيل الدخول التلقائي', 'success');
      }
    });
  });
  
  // Save credential
  document.getElementById('saveBtn').addEventListener('click', saveCredential);
  
  // Login now
  document.getElementById('loginNowBtn').addEventListener('click', loginNow);
  
  // Save settings
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  
  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', clearAll);
}

// Save credential
function saveCredential() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const autoSubmit = document.getElementById('autoSubmit').checked;
  
  if (!username || !password) {
    showToast('يرجى إدخال البريد وكلمة المرور', 'error');
    return;
  }
  
  const credential = {
    domain: currentDomain,
    username,
    password,
    autoSubmit,
    url: currentTab?.url
  };
  
  chrome.runtime.sendMessage({ action: 'saveCredential', credential }, (response) => {
    if (response?.success) {
      showToast('تم حفظ بيانات الدخول بنجاح', 'success');
      loadCredentials();
    } else {
      showToast('فشل حفظ البيانات', 'error');
    }
  });
}

// Login now (inject and login immediately)
function loginNow() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showToast('يرجى إدخال البريد وكلمة المرور', 'error');
    return;
  }
  
  // Inject login script
  chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: performLogin,
    args: [username, password, settings]
  }).then(() => {
    showToast('جاري تسجيل الدخول...', 'success');
  }).catch(error => {
    showToast('فشل تسجيل الدخول: ' + error.message, 'error');
  });
}

// Function to perform login (injected into page)
function performLogin(username, password, settings) {
  const usernameSelectors = [
    'input[type="email"]',
    'input[type="text"][name*="email" i]',
    'input[type="text"][name*="user" i]',
    'input[type="text"][name*="login" i]',
    'input[type="text"][id*="email" i]',
    'input[type="text"][id*="user" i]',
    'input[autocomplete="email"]',
    'input[autocomplete="username"]',
    'input[type="tel"]',
  ];
  
  const passwordSelectors = [
    'input[type="password"]',
  ];
  
  function findElement(selectors) {
    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el) return el;
      } catch (e) {}
    }
    return null;
  }
  
  async function typeText(element, text) {
    element.focus();
    element.value = '';
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, settings.typingSpeed || 30));
    }
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  async function run() {
    const usernameField = findElement(usernameSelectors);
    const passwordField = findElement(passwordSelectors);
    
    if (usernameField) await typeText(usernameField, username);
    await new Promise(r => setTimeout(r, 200));
    if (passwordField) await typeText(passwordField, password);
    
    if (settings.autoSubmit !== false) {
      await new Promise(r => setTimeout(r, 500));
      const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      } else {
        const form = (usernameField || passwordField)?.closest('form');
        if (form) form.submit();
      }
    }
  }
  
  run();
}

// Login with saved credential
window.loginWithCredential = function(credentialId) {
  chrome.runtime.sendMessage({ action: 'getCredentials' }, (response) => {
    const credential = response?.credentials?.find(c => c.id === credentialId);
    if (credential) {
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: performLogin,
        args: [credential.username, credential.password, settings]
      }).then(() => {
        showToast('جاري تسجيل الدخول...', 'success');
      });
    }
  });
};

// Edit credential
window.editCredential = function(credentialId) {
  chrome.runtime.sendMessage({ action: 'getCredentials' }, (response) => {
    const credential = response?.credentials?.find(c => c.id === credentialId);
    if (credential) {
      document.getElementById('username').value = credential.username;
      document.getElementById('password').value = credential.password;
      document.getElementById('autoSubmit').checked = credential.autoSubmit !== false;
      document.getElementById('siteName').textContent = credential.domain;
      currentDomain = credential.domain;
      
      // Switch to add tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.tab[data-tab="add"]').classList.add('active');
      document.getElementById('tab-add').classList.add('active');
    }
  });
};

// Delete credential
window.deleteCredential = function(credentialId) {
  if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
    chrome.runtime.sendMessage({ action: 'deleteCredential', credentialId }, (response) => {
      if (response?.success) {
        showToast('تم حذف البيانات', 'success');
        loadCredentials();
      }
    });
  }
};

// Save settings
function saveSettings() {
  const newSettings = {
    autoLoginEnabled: document.getElementById('mainToggle').classList.contains('active'),
    delay: parseInt(document.getElementById('delayInput').value) || 500,
    typingSpeed: parseInt(document.getElementById('typingSpeedInput').value) || 30,
    autoSubmit: document.getElementById('autoSubmitSetting').checked
  };
  
  chrome.runtime.sendMessage({ action: 'updateSettings', settings: newSettings }, (response) => {
    if (response?.success) {
      settings = response.settings;
      showToast('تم حفظ الإعدادات', 'success');
    }
  });
}

// Clear all data
function clearAll() {
  if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
    chrome.storage.local.set({ credentials: [] }, () => {
      loadCredentials();
      showToast('تم حذف جميع البيانات', 'success');
    });
  }
}

// Show toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}