// Popup Script for Session Capture Extension

const SUPABASE_URL = 'https://yygquhqavbandcqkzzcn.supabase.co';
let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentTab();
  await loadSessions();
  loadSavedPairingCode();
});

// Load saved pairing code
function loadSavedPairingCode() {
  chrome.storage.local.get(['pairingCode'], (result) => {
    if (result.pairingCode) {
      document.getElementById('pairingCode').value = result.pairingCode;
    }
  });
}

// Save pairing code
function savePairingCode(code) {
  chrome.storage.local.set({ pairingCode: code });
}

// Load current tab info
async function loadCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    if (tab) {
      const url = new URL(tab.url);
      document.getElementById('siteName').textContent = url.hostname;
      
      if (tab.favIconUrl) {
        document.getElementById('siteFavicon').src = tab.favIconUrl;
      } else {
        document.getElementById('siteFavicon').src = 'icons/icon48.png';
      }
    }
  } catch (error) {
    document.getElementById('siteName').textContent = 'غير متاح';
  }
}

// Load saved sessions
async function loadSessions() {
  chrome.runtime.sendMessage({ action: 'getSessions' }, (response) => {
    const sessions = response?.sessions || [];
    
    document.getElementById('sessionsCount').textContent = sessions.length;
    
    const listContainer = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <p>لا توجد جلسات محفوظة</p>
          <p style="font-size: 11px; margin-top: 4px;">اضغط على الزر أعلاه لالتقاط الجلسة</p>
        </div>
      `;
      return;
    }
    
    listContainer.innerHTML = sessions.slice(0, 10).map(session => `
      <div class="session-item" data-id="${session.id}">
        <div class="session-icon">
          ${session.favicon ? `<img src="${session.favicon}" width="20" height="20" style="border-radius: 4px;">` : '🌐'}
        </div>
        <div class="session-details">
          <div class="session-domain">${session.siteName || session.domain}</div>
          <div class="session-meta">
            <span>🍪 ${session.cookies?.length || 0}</span>
            <span>🔑 ${session.tokens?.length || 0}</span>
            <span class="badge ${session.loginState === 'logged_in' ? 'badge-success' : 'badge-warning'}">
              ${session.loginState === 'logged_in' ? 'مسجل دخول' : 'غير معروف'}
            </span>
          </div>
        </div>
        <div class="session-actions">
          <button class="action-btn copy" onclick="copySession('${session.id}')" title="نسخ">📋</button>
          <button class="action-btn delete" onclick="deleteSession('${session.id}')" title="حذف">🗑️</button>
        </div>
      </div>
    `).join('');
  });
}

// Capture current session
document.getElementById('captureBtn').addEventListener('click', async () => {
  if (!currentTab) {
    showToast('لا يمكن الوصول للصفحة الحالية', 'error');
    return;
  }
  
  const btn = document.getElementById('captureBtn');
  const btnText = document.getElementById('captureBtnText');
  
  btn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span> جاري الالتقاط...';
  
  try {
    chrome.runtime.sendMessage(
      { action: 'captureSession', tabId: currentTab.id },
      (response) => {
        if (response?.success) {
          const session = response.session;
          
          // Update stats
          document.getElementById('cookiesCount').textContent = session.cookies?.length || 0;
          document.getElementById('tokensCount').textContent = session.tokens?.length || 0;
          
          btn.classList.add('success');
          btnText.textContent = '✅ تم الالتقاط بنجاح!';
          
          showToast(`تم التقاط ${session.cookies?.length || 0} كوكيز و ${session.tokens?.length || 0} توكنات`, 'success');
          
          // Reload sessions list
          loadSessions();
          
          // Reset button after 2 seconds
          setTimeout(() => {
            btn.classList.remove('success');
            btn.disabled = false;
            btnText.textContent = 'التقاط الجلسة الحالية';
          }, 2000);
        } else {
          throw new Error(response?.error || 'فشل الالتقاط');
        }
      }
    );
  } catch (error) {
    btn.disabled = false;
    btnText.textContent = 'التقاط الجلسة الحالية';
    showToast(error.message, 'error');
  }
});

// Send sessions via pairing code
document.getElementById('sendBtn').addEventListener('click', async () => {
  const codeInput = document.getElementById('pairingCode');
  const code = codeInput.value.trim().toUpperCase();
  const sendBtn = document.getElementById('sendBtn');
  const statusEl = document.getElementById('pairingStatus');
  
  if (!code || code.length < 4) {
    statusEl.textContent = 'أدخل كود ربط صالح (4 أحرف على الأقل)';
    statusEl.className = 'pairing-status error';
    return;
  }
  
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="spinner"></span>';
  statusEl.textContent = 'جاري التحقق من الكود...';
  statusEl.className = 'pairing-status info';
  
  try {
    // First verify the code
    const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/sync-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', pairingCode: code })
    });
    
    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      throw new Error(verifyData.error || 'كود غير صالح');
    }
    
    // Save the valid code
    savePairingCode(code);
    
    // Get sessions
    const sessionsData = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSessions' }, resolve);
    });
    
    const sessions = sessionsData?.sessions || [];
    
    if (sessions.length === 0) {
      statusEl.textContent = 'لا توجد جلسات لإرسالها - التقط جلسة أولاً';
      statusEl.className = 'pairing-status error';
      sendBtn.disabled = false;
      sendBtn.textContent = 'إرسال';
      return;
    }
    
    statusEl.textContent = `جاري إرسال ${sessions.length} جلسة...`;
    
    // Push sessions
    const pushRes = await fetch(`${SUPABASE_URL}/functions/v1/sync-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push', pairingCode: code, sessions })
    });
    
    const pushData = await pushRes.json();
    
    if (!pushData.success) {
      throw new Error(pushData.error || 'فشل الإرسال');
    }
    
    statusEl.textContent = `✅ تم إرسال ${pushData.count} جلسة بنجاح!`;
    statusEl.className = 'pairing-status success';
    showToast(`تم إرسال ${pushData.count} جلسة إلى التطبيق`, 'success');
    
  } catch (error) {
    console.error('[Popup] Send error:', error);
    statusEl.textContent = error.message || 'حدث خطأ';
    statusEl.className = 'pairing-status error';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'إرسال';
  }
});

// Copy session to clipboard
window.copySession = async function(sessionId) {
  chrome.runtime.sendMessage({ action: 'exportSession', sessionId }, (response) => {
    if (response?.session) {
      const text = JSON.stringify(response.session, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        showToast('تم نسخ الجلسة للحافظة', 'success');
      });
    }
  });
};

// Delete session
window.deleteSession = function(sessionId) {
  chrome.storage.local.get(['sessions'], (result) => {
    let sessions = result.sessions || [];
    sessions = sessions.filter(s => s.id !== sessionId);
    chrome.storage.local.set({ sessions }, () => {
      loadSessions();
      showToast('تم حذف الجلسة', 'success');
    });
  });
};

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}