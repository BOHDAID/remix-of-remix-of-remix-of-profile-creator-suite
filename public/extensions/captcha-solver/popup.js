// AI CAPTCHA Solver - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const mainToggle = document.getElementById('mainToggle');
  const totalSolved = document.getElementById('totalSolved');
  const successRate = document.getElementById('successRate');
  const learningProgress = document.getElementById('learningProgress');
  const learningPercent = document.getElementById('learningPercent');
  const statusIndicator = document.getElementById('statusIndicator');
  
  // Get current state from background
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  
  // Update UI
  updateUI(state);
  
  // Toggle handler
  mainToggle.addEventListener('click', async () => {
    const newEnabled = !mainToggle.classList.contains('active');
    
    if (newEnabled) {
      mainToggle.classList.add('active');
      statusIndicator.classList.remove('inactive');
      statusIndicator.querySelector('span').textContent = 'جاهز للعمل - يراقب الصفحات';
    } else {
      mainToggle.classList.remove('active');
      statusIndicator.classList.add('inactive');
      statusIndicator.querySelector('span').textContent = 'متوقف';
    }
    
    await chrome.runtime.sendMessage({
      type: 'UPDATE_STATE',
      data: { enabled: newEnabled }
    });
  });
  
  // Listen for updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CAPTCHA_FOUND') {
      statusIndicator.querySelector('span').textContent = `تم اكتشاف CAPTCHA: ${message.data.captchaType}`;
    }
  });
  
  function updateUI(state) {
    // Toggle state
    if (state.enabled) {
      mainToggle.classList.add('active');
      statusIndicator.classList.remove('inactive');
    } else {
      mainToggle.classList.remove('active');
      statusIndicator.classList.add('inactive');
      statusIndicator.querySelector('span').textContent = 'متوقف';
    }
    
    // Stats
    totalSolved.textContent = state.totalSolved || 0;
    successRate.textContent = (state.successRate || 0).toFixed(0) + '%';
    
    // Learning progress (based on total solved and success rate)
    const progress = Math.min(100, (state.totalSolved || 0) * 2 + (state.successRate || 0) * 0.5);
    learningProgress.style.width = progress + '%';
    learningPercent.textContent = progress.toFixed(0) + '%';
  }
});
