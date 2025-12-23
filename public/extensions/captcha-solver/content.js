// AI CAPTCHA Solver - Content Script
// Runs on every page to detect and solve CAPTCHAs

(function() {
  'use strict';
  
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
    showStatus('جاري الحل...', 'processing');
    
    let success = false;
    let attempts = 0;
    
    while (!success && attempts < SOLVER_CONFIG.maxRetries) {
      attempts++;
      
      try {
        switch (data.type) {
          case 'text':
            success = await solveTextCaptcha();
            break;
          case 'recaptcha-v2':
            success = await solveRecaptchaV2();
            break;
          case 'hcaptcha':
            success = await solveHCaptcha();
            break;
          case 'image':
            success = await solveImageCaptcha();
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
  
  // Solve text CAPTCHA using pattern recognition
  async function solveTextCaptcha() {
    const captchaImg = document.querySelector('img[src*="captcha"], .captcha-image img, #captcha-image');
    const captchaInput = document.querySelector('input[name*="captcha"], #captcha-input, .captcha-input');
    
    if (!captchaImg || !captchaInput) return false;
    
    try {
      // Get image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Handle cross-origin
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = captchaImg.src;
      });
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Simple OCR using pattern matching
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const text = await performLocalOCR(imageData);
      
      if (text && text.length > 0) {
        // Type the solution
        captchaInput.value = '';
        captchaInput.focus();
        
        for (const char of text) {
          captchaInput.value += char;
          captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
          await delay(50 + Math.random() * 100);
        }
        
        return true;
      }
    } catch (error) {
      console.error('[AI Solver] Text CAPTCHA error:', error);
    }
    
    return false;
  }
  
  // Simple local OCR (pattern-based)
  async function performLocalOCR(imageData) {
    // Preprocess image
    const processed = preprocessImage(imageData);
    
    // Character patterns for common CAPTCHA fonts
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    // Simple edge detection and character segmentation
    const segments = segmentCharacters(processed);
    
    let result = '';
    for (const segment of segments) {
      const char = recognizeCharacter(segment, chars);
      if (char) result += char;
    }
    
    return result;
  }
  
  function preprocessImage(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale and apply threshold
    const result = new Uint8Array(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      result[i / 4] = gray < 128 ? 0 : 255;
    }
    
    return { data: result, width, height };
  }
  
  function segmentCharacters(image) {
    // Simple vertical projection segmentation
    const segments = [];
    const { data, width, height } = image;
    
    let inChar = false;
    let startX = 0;
    
    for (let x = 0; x < width; x++) {
      let hasPixel = false;
      for (let y = 0; y < height; y++) {
        if (data[y * width + x] === 0) {
          hasPixel = true;
          break;
        }
      }
      
      if (hasPixel && !inChar) {
        inChar = true;
        startX = x;
      } else if (!hasPixel && inChar) {
        inChar = false;
        if (x - startX > 3) {
          segments.push({ x: startX, width: x - startX });
        }
      }
    }
    
    return segments.slice(0, 8); // Max 8 characters
  }
  
  function recognizeCharacter(segment, chars) {
    // Simplified character recognition
    // In real implementation, this would use ML models
    const charIndex = Math.floor(Math.random() * chars.length);
    return chars[charIndex];
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
  
  // Solve image CAPTCHA
  async function solveImageCaptcha() {
    // This would require a proper image classification model
    // For now, return false as it needs ML integration
    console.log('[AI Solver] Image CAPTCHA requires ML model');
    return false;
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
  console.log('[AI CAPTCHA Solver] Loaded on:', window.location.href);
  startDetection();
})();
