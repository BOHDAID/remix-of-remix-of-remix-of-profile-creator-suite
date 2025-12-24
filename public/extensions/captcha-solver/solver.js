// AI CAPTCHA Solver - Main Solver Logic
(function() {
  'use strict';

  // Solver configuration
  const SOLVER_CONFIG = {
    maxAttempts: 3,
    timeout: 30000,
    retryDelay: 1000
  };

  // CAPTCHA types detection patterns
  const CAPTCHA_PATTERNS = {
    recaptcha: {
      selectors: ['.g-recaptcha', '#recaptcha', '[data-sitekey]', '.recaptcha-checkbox'],
      framePatterns: ['recaptcha', 'google.com/recaptcha']
    },
    hcaptcha: {
      selectors: ['.h-captcha', '[data-hcaptcha-sitekey]'],
      framePatterns: ['hcaptcha.com']
    },
    turnstile: {
      selectors: ['.cf-turnstile', '[data-turnstile-sitekey]'],
      framePatterns: ['challenges.cloudflare.com']
    },
    funcaptcha: {
      selectors: ['#FunCaptcha', '.funcaptcha'],
      framePatterns: ['funcaptcha.com', 'arkoselabs.com']
    },
    textCaptcha: {
      selectors: ['img[src*="captcha"]', '.captcha-image', '#captcha-img'],
      framePatterns: []
    }
  };

  // Detect CAPTCHA type on page
  function detectCaptcha() {
    for (const [type, patterns] of Object.entries(CAPTCHA_PATTERNS)) {
      // Check selectors
      for (const selector of patterns.selectors) {
        if (document.querySelector(selector)) {
          return { type, element: document.querySelector(selector) };
        }
      }
      
      // Check iframes
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        const src = iframe.src || '';
        for (const pattern of patterns.framePatterns) {
          if (src.includes(pattern)) {
            return { type, element: iframe };
          }
        }
      }
    }
    
    return null;
  }

  // Extract CAPTCHA image as base64
  async function extractCaptchaImage(element) {
    try {
      // For image CAPTCHAs
      if (element.tagName === 'IMG') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = element.naturalWidth || element.width;
        canvas.height = element.naturalHeight || element.height;
        ctx.drawImage(element, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      }
      
      // For CAPTCHA containers, try to find image inside
      const img = element.querySelector('img');
      if (img) {
        return await extractCaptchaImage(img);
      }
      
      // For iframes, we cannot extract directly (cross-origin)
      return null;
    } catch (error) {
      console.error('[Solver] Failed to extract CAPTCHA image:', error);
      return null;
    }
  }

  // Submit solution to CAPTCHA
  function submitSolution(type, solution, element) {
    try {
      switch (type) {
        case 'textCaptcha':
          // Find nearby input field
          const input = document.querySelector('input[name*="captcha"], input[id*="captcha"], input[placeholder*="captcha"]');
          if (input) {
            input.value = solution;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          break;
          
        case 'recaptcha':
        case 'hcaptcha':
        case 'turnstile':
          // These require token injection, not direct input
          // The background script handles these via API
          console.log('[Solver] Token-based CAPTCHA - handled by background');
          return true;
      }
    } catch (error) {
      console.error('[Solver] Failed to submit solution:', error);
    }
    return false;
  }

  // Main solver function
  async function solveCaptcha() {
    const detected = detectCaptcha();
    
    if (!detected) {
      console.log('[Solver] No CAPTCHA detected');
      return { success: false, error: 'No CAPTCHA found' };
    }
    
    console.log('[Solver] Detected CAPTCHA type:', detected.type);
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'CAPTCHA_DETECTED',
      captchaType: detected.type,
      url: window.location.href
    });
    
    // For text/image CAPTCHAs, extract and solve
    if (detected.type === 'textCaptcha') {
      const imageBase64 = await extractCaptchaImage(detected.element);
      
      if (imageBase64) {
        // Send to background for AI solving
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'SOLVE_CAPTCHA',
            imageBase64,
            captchaType: detected.type
          }, (response) => {
            if (response && response.success) {
              const submitted = submitSolution(detected.type, response.solution, detected.element);
              resolve({ success: submitted, solution: response.solution });
            } else {
              resolve({ success: false, error: response?.error || 'Solving failed' });
            }
          });
        });
      }
    }
    
    return { success: false, error: 'Cannot extract CAPTCHA' };
  }

  // Expose to window for content script access
  window.__BHD_CAPTCHA_SOLVER__ = {
    detect: detectCaptcha,
    solve: solveCaptcha,
    extractImage: extractCaptchaImage,
    config: SOLVER_CONFIG
  };

  console.log('[Solver] BHD CAPTCHA Solver loaded');
})();
