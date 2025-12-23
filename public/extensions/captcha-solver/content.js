// AI CAPTCHA Solver - Content Script
// Runs on every page to detect and solve CAPTCHAs using AI

(function() {
  'use strict';
  
  // Supabase Edge Function URL - Use the project's URL
  const SUPABASE_URL = 'https://yygquhqavbandcqkzzcn.supabase.co';
  
  const SOLVER_CONFIG = {
    checkInterval: 2000,
    maxRetries: 3,
    retryDelay: 1500
  };
  
  let isProcessing = false;
  let solverEnabled = true;
  
  // CAPTCHA Detection Patterns
  const CAPTCHA_PATTERNS = {
    recaptchaV2: {
      selectors: [
        'iframe[src*="recaptcha"]',
        'iframe[title*="reCAPTCHA"]',
        '.g-recaptcha',
        '#recaptcha'
      ],
      type: 'recaptcha-v2'
    },
    recaptchaV3: {
      selectors: [
        '.grecaptcha-badge',
        'script[src*="recaptcha/api.js?render"]'
      ],
      type: 'recaptcha-v3'
    },
    hCaptcha: {
      selectors: [
        'iframe[src*="hcaptcha"]',
        '.h-captcha',
        '[data-hcaptcha-widget-id]'
      ],
      type: 'hcaptcha'
    },
    textCaptcha: {
      selectors: [
        'img[src*="captcha"]',
        'img[alt*="captcha"]',
        'input[name*="captcha"]',
        '.captcha-image',
        '#captcha-image'
      ],
      type: 'text'
    },
    imageCaptcha: {
      selectors: [
        '.captcha-container img',
        '[class*="captcha"] img',
        'img[id*="captcha"]'
      ],
      type: 'image'
    }
  };
  
  // Detect CAPTCHA on page
  function detectCaptcha() {
    for (const [name, pattern] of Object.entries(CAPTCHA_PATTERNS)) {
      for (const selector of pattern.selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return {
            type: pattern.type,
            element: element,
            selector: selector
          };
        }
      }
    }
    return null;
  }
  
  // Main detection loop
  function startDetection() {
    setInterval(() => {
      if (!solverEnabled || isProcessing) return;
      
      const captcha = detectCaptcha();
      if (captcha) {
        console.log('[AI Solver] CAPTCHA detected:', captcha.type);
        
        // Notify background
        chrome.runtime.sendMessage({
          type: 'CAPTCHA_DETECTED',
          data: {
            type: captcha.type,
            url: window.location.href
          }
        });
      }
    }, SOLVER_CONFIG.checkInterval);
  }
  
  // Listen for solve commands
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_SOLVING') {
      solveCaptcha(message.data);
      sendResponse({ started: true });
    }
    
    if (message.type === 'TOGGLE_SOLVER') {
      solverEnabled = message.enabled;
      sendResponse({ enabled: solverEnabled });
    }
    
    return true;
  });
  
  // Main solving function
  async function solveCaptcha(data) {
    if (isProcessing) return;
    isProcessing = true;
    
    console.log('[AI Solver] Starting to solve:', data.type);
    showStatus('AI يحلل CAPTCHA...', 'processing');
    
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < SOLVER_CONFIG.maxRetries) {
      attempts++;
      
      try {
        switch (data.type) {
          case 'text':
            success = await solveTextCaptchaWithAI();
            break;
          case 'recaptcha-v2':
            success = await solveRecaptchaV2();
            break;
          case 'hcaptcha':
            success = await solveHCaptcha();
            break;
          case 'image':
            success = await solveImageCaptchaWithAI();
            break;
          default:
            console.log('[AI Solver] Unknown CAPTCHA type');
            break;
        }
      } catch (error) {
        console.error('[AI Solver] Error:', error);
      }
      
      if (!success && attempts < SOLVER_CONFIG.maxRetries) {
        showStatus(`إعادة المحاولة ${attempts + 1}...`, 'retry');
        await delay(SOLVER_CONFIG.retryDelay);
      }
    }
    
    // Report result
    chrome.runtime.sendMessage({
      type: 'CAPTCHA_SOLVED',
      data: {
        captchaType: data.type,
        success: success,
        attempts: attempts
      }
    });
    
    if (success) {
      showStatus('تم الحل بنجاح! ✓', 'success');
    } else {
      showStatus('فشل الحل ✗', 'error');
    }
    
    setTimeout(() => hideStatus(), 3000);
    isProcessing = false;
  }
  
  // Convert image to base64
  async function imageToBase64(imgElement) {
    return new Promise((resolve, reject) => {
      try {
        // Try canvas method first
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          try {
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
          } catch (e) {
            // Canvas tainted, try fetch
            fetchImageAsBase64(imgElement.src).then(resolve).catch(reject);
          }
        };
        
        img.onerror = () => {
          fetchImageAsBase64(imgElement.src).then(resolve).catch(reject);
        };
        
        img.src = imgElement.src;
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Fetch image as base64 (fallback)
  async function fetchImageAsBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  // Call AI solver API
  async function callAISolver(imageBase64, captchaType) {
    try {
      console.log('[AI Solver] Calling AI API for', captchaType);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/solve-captcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          captchaType
        })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('[AI Solver] API error:', response.status, error);
        
        if (response.status === 429) {
          showStatus('Rate limit - انتظر قليلاً', 'error');
        } else if (response.status === 402) {
          showStatus('رصيد AI منتهي', 'error');
        }
        
        return null;
      }
      
      const data = await response.json();
      console.log('[AI Solver] AI response:', data);
      
      if (data.success && data.solution) {
        return data.solution;
      }
      
      return null;
    } catch (error) {
      console.error('[AI Solver] API call failed:', error);
      return null;
    }
  }
  
  // Solve text CAPTCHA using AI
  async function solveTextCaptchaWithAI() {
    const captchaImg = document.querySelector('img[src*="captcha"], .captcha-image img, #captcha-image, img[alt*="captcha"]');
    const captchaInput = document.querySelector('input[name*="captcha"], #captcha-input, .captcha-input, input[placeholder*="captcha" i]');
    
    if (!captchaImg) {
      console.log('[AI Solver] No CAPTCHA image found');
      return false;
    }
    
    if (!captchaInput) {
      console.log('[AI Solver] No CAPTCHA input found');
      return false;
    }
    
    try {
      showStatus('جاري تحليل الصورة...', 'processing');
      
      // Get image as base64
      const imageBase64 = await imageToBase64(captchaImg);
      
      // Call AI solver
      const solution = await callAISolver(imageBase64, 'text');
      
      if (!solution) {
        console.log('[AI Solver] No solution from AI');
        return false;
      }
      
      console.log('[AI Solver] Got solution:', solution);
      
      // Type the solution with human-like behavior
      captchaInput.value = '';
      captchaInput.focus();
      
      for (const char of solution) {
        captchaInput.value += char;
        captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
        await delay(50 + Math.random() * 100);
      }
      
      captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('[AI Solver] Text CAPTCHA error:', error);
      return false;
    }
  }
  
  // Solve reCAPTCHA v2 by simulating human behavior
  async function solveRecaptchaV2() {
    const iframe = document.querySelector('iframe[src*="recaptcha"]');
    if (!iframe) return false;
    
    try {
      // Try to click the checkbox
      const checkbox = iframe.contentDocument?.querySelector('.recaptcha-checkbox');
      if (checkbox) {
        await simulateHumanClick(checkbox);
        await delay(1000);
        
        // Check if solved (no challenge appeared)
        const challenge = document.querySelector('iframe[src*="recaptcha/api2/bframe"]');
        if (!challenge) {
          return true;
        }
      }
    } catch (error) {
      // Cross-origin, try alternative approach
      console.log('[AI Solver] Cross-origin reCAPTCHA, using alternative method');
    }
    
    // Alternative: Execute reCAPTCHA callback if available
    if (typeof grecaptcha !== 'undefined') {
      try {
        const token = await grecaptcha.execute();
        if (token) return true;
      } catch (e) {}
    }
    
    return false;
  }
  
  // Solve hCaptcha
  async function solveHCaptcha() {
    const iframe = document.querySelector('iframe[src*="hcaptcha"]');
    if (!iframe) return false;
    
    try {
      const checkbox = iframe.contentDocument?.querySelector('#checkbox');
      if (checkbox) {
        await simulateHumanClick(checkbox);
        await delay(1000);
        return true;
      }
    } catch (error) {
      console.log('[AI Solver] hCaptcha requires image solving');
    }
    
    return false;
  }
  
  // Solve image CAPTCHA using AI
  async function solveImageCaptchaWithAI() {
    const captchaContainer = document.querySelector('.rc-imageselect, .image-captcha-container, [class*="captcha"] img');
    
    if (!captchaContainer) {
      console.log('[AI Solver] No image CAPTCHA found');
      return false;
    }
    
    try {
      showStatus('جاري تحليل الصور...', 'processing');
      
      // Capture the container as image
      const canvas = document.createElement('canvas');
      const rect = captchaContainer.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // For now, we'll try to get any images in the container
      const images = captchaContainer.querySelectorAll('img');
      if (images.length > 0) {
        const imageBase64 = await imageToBase64(images[0]);
        const solution = await callAISolver(imageBase64, 'image');
        
        if (solution) {
          // Parse positions and click
          const positions = solution.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
          const tiles = captchaContainer.querySelectorAll('.rc-imageselect-tile, .image-tile, img');
          
          for (const pos of positions) {
            if (tiles[pos - 1]) {
              await simulateHumanClick(tiles[pos - 1]);
              await delay(300 + Math.random() * 200);
            }
          }
          
          // Click verify button
          const verifyBtn = document.querySelector('.verify-button-holder button, #recaptcha-verify-button, button[type="submit"]');
          if (verifyBtn) {
            await delay(500);
            await simulateHumanClick(verifyBtn);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[AI Solver] Image CAPTCHA error:', error);
      return false;
    }
  }
  
  // Simulate human-like click
  async function simulateHumanClick(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);
    
    // Move mouse naturally
    element.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: x,
      clientY: y
    }));
    
    await delay(100 + Math.random() * 200);
    
    // Click
    element.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      clientX: x,
      clientY: y
    }));
    
    await delay(50 + Math.random() * 100);
    
    element.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true,
      clientX: x,
      clientY: y
    }));
    
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      clientX: x,
      clientY: y
    }));
  }
  
  // Status overlay
  function showStatus(message, type) {
    let overlay = document.getElementById('ai-solver-status');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ai-solver-status';
      overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      `;
      document.body.appendChild(overlay);
    }
    
    const colors = {
      processing: { bg: '#3b82f6', text: '#fff' },
      success: { bg: '#22c55e', text: '#fff' },
      error: { bg: '#ef4444', text: '#fff' },
      retry: { bg: '#f59e0b', text: '#fff' }
    };
    
    const color = colors[type] || colors.processing;
    overlay.style.backgroundColor = color.bg;
    overlay.style.color = color.text;
    overlay.innerHTML = `
      <span style="font-size: 18px;">${type === 'processing' ? '🤖' : type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄'}</span>
      <span>${message}</span>
    `;
    overlay.style.display = 'flex';
  }
  
  function hideStatus() {
    const overlay = document.getElementById('ai-solver-status');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
  
  // Utility
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Initialize
  console.log('[AI CAPTCHA Solver] Loaded with AI backend on:', window.location.href);
  startDetection();
})();
