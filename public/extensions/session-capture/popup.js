// Popup Script for Session Capture Extension

let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentTab();
  await loadSessions();
});

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