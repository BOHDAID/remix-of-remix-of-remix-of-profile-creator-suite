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
  let autoSolveEnabled = true;
  
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
    // Initial check
    checkAndSolve();
    
    // Periodic check
    setInterval(() => {
      if (!solverEnabled || isProcessing) return;
      checkAndSolve();
    }, SOLVER_CONFIG.checkInterval);
    
    // Also observe DOM changes for dynamically loaded CAPTCHAs
    const observer = new MutationObserver((mutations) => {
      if (!solverEnabled || isProcessing) return;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Check if any added nodes contain CAPTCHA
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // Element node
              const hasRecaptcha = node.querySelector?.('iframe[src*="recaptcha"]') || 
                                   node.matches?.('iframe[src*="recaptcha"]') ||
                                   node.querySelector?.('.g-recaptcha') ||
                                   node.matches?.('.g-recaptcha');
              if (hasRecaptcha) {
                console.log('[AI Solver] CAPTCHA added to DOM');
                setTimeout(checkAndSolve, 500);
                break;
              }
            }
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  function checkAndSolve() {
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

      // If auto-solve is on, start immediately
      if (autoSolveEnabled) {
        solveCaptcha({ type: captcha.type });
      }
    }
  }
  
  // Listen for solve commands / state updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_SOLVING') {
      solveCaptcha(message.data);
      sendResponse({ started: true });
    }

    if (message.type === 'TOGGLE_SOLVER') {
      if (typeof message.enabled === 'boolean') solverEnabled = message.enabled;
      if (typeof message.autoSolve === 'boolean') autoSolveEnabled = message.autoSolve;
      sendResponse({ enabled: solverEnabled, autoSolve: autoSolveEnabled });
    }
    
    if (message.type === 'TEST_CLICK') {
      handleTestClick().then(sendResponse);
      return true; // Keep channel open for async
    }

    return true;
  });
  
  // Test click handler - finds reCAPTCHA and attempts to click it
  async function handleTestClick() {
    console.log('[AI Solver] Test click requested');
    
    // Find reCAPTCHA anchor iframe
    const anchorIframe = document.querySelector('iframe[src*="recaptcha/api2/anchor"], iframe[src*="recaptcha/enterprise/anchor"]');
    
    if (!anchorIframe) {
      return { success: false, error: 'لم يتم العثور على reCAPTCHA في هذه الصفحة' };
    }
    
    const rect = anchorIframe.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
      return { success: false, error: 'reCAPTCHA غير مرئي' };
    }
    
    // Calculate checkbox position
    const checkboxX = Math.round(rect.left + 28);
    const checkboxY = Math.round(rect.top + rect.height / 2);
    
    console.log('[AI Solver] Test clicking at:', checkboxX, checkboxY);
    
    // Use debugger API via background
    const clickResult = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SIMULATE_CLICK',
        x: checkboxX,
        y: checkboxY
      }, (response) => {
        resolve(response || { success: false, error: 'لا استجابة' });
      });
    });
    
    if (clickResult.success) {
      // Wait and check if challenge appeared or solved
      await delay(2000);
      
      const bframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
      const response = document.querySelector('textarea[name="g-recaptcha-response"]');
      
      if (response && response.value) {
        return { success: true, message: '✅ تم حل reCAPTCHA تلقائياً!' };
      } else if (bframe && bframe.offsetParent !== null) {
        return { success: true, message: '✅ ظهر تحدي الصور - النقر يعمل!' };
      } else {
        return { success: true, message: '✅ تم النقر - تحقق من الصفحة' };
      }
    } else {
      return { 
        success: false, 
        error: clickResult.error || 'فشل النقر - تحقق من إذن debugger' 
      };
    }
  }
  
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
  async function callAISolver(imageBase64, captchaType, prompt = '') {
    try {
      console.log('[AI Solver] Calling AI API for', captchaType, 'with prompt:', prompt);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/solve-captcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          captchaType,
          prompt
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
    console.log('[AI Solver] Starting reCAPTCHA v2 solve...');
    
    // First, check if there's an image challenge visible
    const bframeIframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
    
    if (bframeIframe && bframeIframe.style.visibility !== 'hidden' && bframeIframe.offsetParent !== null) {
      console.log('[AI Solver] Image challenge detected, solving with AI...');
      return await solveRecaptchaImageChallenge();
    }
    
    // Try to click the checkbox - find the anchor iframe and click on it
    const anchorIframe = document.querySelector('iframe[src*="recaptcha/api2/anchor"], iframe[src*="recaptcha/enterprise/anchor"]');
    
    if (anchorIframe) {
      console.log('[AI Solver] Found anchor iframe, attempting to click checkbox...');
      
      // Get iframe position and simulate click in the center (where checkbox is)
      const rect = anchorIframe.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        // The checkbox is typically at the left side of the iframe
        const checkboxX = Math.round(rect.left + 28);
        const checkboxY = Math.round(rect.top + rect.height / 2);
        
        console.log('[AI Solver] Clicking checkbox at position:', checkboxX, checkboxY);
        
        // Use background script's debugger API to simulate click
        const clickResult = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'SIMULATE_CLICK',
            x: checkboxX,
            y: checkboxY
          }, (response) => {
            resolve(response || { success: false });
          });
        });
        
        if (clickResult.success) {
          console.log('[AI Solver] Click simulated successfully via debugger API');
        } else {
          const errMsg = (clickResult.error || '').toString();
          console.log('[AI Solver] Debugger click failed:', errMsg);
          if (errMsg) {
            showStatus('لم يتمكن من النقر تلقائياً (تحقق من إذن debugger للإضافة)', 'error');
          }
          
          // Fallback: Try native click events
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: checkboxX,
            clientY: checkboxY
          });
          anchorIframe.dispatchEvent(clickEvent);
          anchorIframe.focus();
        }
        
        // Wait for potential challenge to appear
        await delay(2500);
        
        // Check if challenge appeared
        const newBframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
        if (newBframe && newBframe.style.visibility !== 'hidden' && newBframe.offsetParent !== null) {
          console.log('[AI Solver] Challenge appeared, solving...');
          return await solveRecaptchaImageChallenge();
        }
        
        // Check if already solved (checkbox might be checked now)
        const responseTextarea = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (responseTextarea && responseTextarea.value) {
          console.log('[AI Solver] reCAPTCHA already solved!');
          return true;
        }
      }
    }
    
    // Alternative: Try clicking on the g-recaptcha div container
    const gRecaptcha = document.querySelector('.g-recaptcha, #recaptcha');
    if (gRecaptcha) {
      console.log('[AI Solver] Trying to click g-recaptcha container...');
      const rect = gRecaptcha.getBoundingClientRect();
      
      // Click near the checkbox position
      const x = rect.left + 30;
      const y = rect.top + rect.height / 2;
      
      // Use elementFromPoint to get the actual clickable element
      const element = document.elementFromPoint(x, y);
      if (element) {
        console.log('[AI Solver] Found element at checkbox position:', element.tagName);
        await simulateHumanClick(element);
        await delay(2000);
        
        // Check for challenge
        const bframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
        if (bframe && bframe.offsetParent !== null) {
          return await solveRecaptchaImageChallenge();
        }
        
        // Check if solved
        const response = document.querySelector('textarea[name="g-recaptcha-response"]');
        if (response && response.value) {
          return true;
        }
      }
    }
    
    // Last resort: Try grecaptcha API if available
    if (typeof grecaptcha !== 'undefined') {
      try {
        console.log('[AI Solver] Trying grecaptcha API...');
        const token = await grecaptcha.execute();
        if (token) {
          console.log('[AI Solver] Got token from grecaptcha.execute');
          return true;
        }
      } catch (e) {
        console.log('[AI Solver] grecaptcha.execute failed:', e.message);
      }
    }
    
    console.log('[AI Solver] Could not solve reCAPTCHA v2');
    return false;
  }
  
  // Solve reCAPTCHA image challenge using AI
  // Common reCAPTCHA challenge targets
  const RECAPTCHA_TARGETS = [
    'traffic lights', 'traffic light',
    'crosswalks', 'crosswalk', 'crossings',
    'bicycles', 'bicycle', 'bikes',
    'buses', 'bus',
    'cars', 'car', 'vehicles',
    'motorcycles', 'motorcycle',
    'fire hydrants', 'fire hydrant', 'hydrants',
    'stairs', 'staircase',
    'bridges', 'bridge',
    'boats', 'boat',
    'palm trees', 'palm tree',
    'mountains', 'mountain',
    'chimneys', 'chimney',
    'parking meters', 'parking meter',
    'taxis', 'taxi',
    'tractors', 'tractor'
  ];
  
  async function solveRecaptchaImageChallenge() {
    console.log('[AI Solver] Solving reCAPTCHA image challenge...');
    showStatus('جاري تحليل تحدي الصور...', 'processing');
    
    // The reCAPTCHA challenge is in an iframe - we need to capture it
    const bframeIframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
    
    if (!bframeIframe) {
      console.log('[AI Solver] No bframe iframe found');
      return false;
    }
    
    try {
      // Get the iframe's bounding rect
      const iframeRect = bframeIframe.getBoundingClientRect();
      
      // Request screenshot from background script
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'CAPTURE_SCREEN',
          rect: {
            x: iframeRect.left + window.scrollX,
            y: iframeRect.top + window.scrollY,
            width: iframeRect.width,
            height: iframeRect.height
          }
        }, async (response) => {
          if (response && response.imageBase64) {
            console.log('[AI Solver] Got screenshot, analyzing full challenge...');
            
            // Send full screenshot to AI with comprehensive prompt
            // The AI will analyze the entire challenge including instructions
            const comprehensivePrompt = `
This is a reCAPTCHA image challenge screenshot. 
1. First, read the instruction text at the top (it says "Select all images with [target]" or similar)
2. Then identify which grid cells (numbered 1-9 for 3x3, or 1-16 for 4x4) contain the target object
3. Return ONLY the cell numbers separated by commas

Common targets include: ${RECAPTCHA_TARGETS.slice(0, 10).join(', ')}

Grid numbering:
[1][2][3]
[4][5][6]
[7][8][9]

Return ONLY numbers like: 1,4,7 or "none" if no cells match.`;
            
            // Call AI to solve with full screenshot
            const solution = await callAISolver(response.imageBase64, 'recaptcha-image', comprehensivePrompt);
            
            if (solution && solution.toLowerCase() !== 'none') {
              console.log('[AI Solver] AI solution:', solution);
              
              // Parse positions from response - handle various formats
              const cleanSolution = solution.replace(/[^\d,]/g, '');
              const positions = cleanSolution.split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n) && n >= 1 && n <= 16);
              
              if (positions.length > 0) {
                // Detect grid size (3x3 or 4x4) from iframe dimensions
                const gridSize = iframeRect.width > 450 ? 4 : 3;
                const headerHeight = 120; // Header with instructions
                const footerHeight = 60; // Footer with verify button
                const gridHeight = iframeRect.height - headerHeight - footerHeight;
                const tileWidth = iframeRect.width / gridSize;
                const tileHeight = gridHeight / gridSize;
                
                console.log('[AI Solver] Grid size:', gridSize, 'x', gridSize);
                console.log('[AI Solver] Clicking positions:', positions);
                
                for (const pos of positions) {
                  const col = (pos - 1) % gridSize;
                  const row = Math.floor((pos - 1) / gridSize);
                  
                  const x = iframeRect.left + (col * tileWidth) + (tileWidth / 2);
                  const y = iframeRect.top + headerHeight + (row * tileHeight) + (tileHeight / 2);
                  
                  // Use debugger API for reliable clicking
                  await new Promise((clickResolve) => {
                    chrome.runtime.sendMessage({
                      type: 'SIMULATE_CLICK',
                      x: Math.round(x),
                      y: Math.round(y)
                    }, () => clickResolve());
                  });
                  
                  await delay(400 + Math.random() * 300);
                }
                
                // Wait and click verify button
                await delay(1500);
                
                // Verify button is usually at bottom right
                const verifyX = iframeRect.left + iframeRect.width - 80;
                const verifyY = iframeRect.top + iframeRect.height - 35;
                
                await new Promise((clickResolve) => {
                  chrome.runtime.sendMessage({
                    type: 'SIMULATE_CLICK',
                    x: Math.round(verifyX),
                    y: Math.round(verifyY)
                  }, () => clickResolve());
                });
                
                // Check if there's another challenge or if solved
                await delay(2000);
                
                const newBframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
                if (newBframe && newBframe.offsetParent !== null) {
                  console.log('[AI Solver] New challenge appeared, continuing...');
                  // Recursively solve next challenge
                  resolve(await solveRecaptchaImageChallenge());
                } else {
                  const responseTextarea = document.querySelector('textarea[name="g-recaptcha-response"]');
                  if (responseTextarea && responseTextarea.value) {
                    console.log('[AI Solver] reCAPTCHA solved successfully!');
                    resolve(true);
                  } else {
                    resolve(true); // Assume success if challenge disappeared
                  }
                }
              } else {
                console.log('[AI Solver] No valid positions in solution:', solution);
                resolve(false);
              }
            } else {
              console.log('[AI Solver] AI returned no solution or "none"');
              resolve(false);
            }
          } else {
            console.log('[AI Solver] No screenshot available');
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('[AI Solver] Image challenge error:', error);
      return false;
    }
  }
  
  // Simulate click at screen position
  function simulateClickAtPosition(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element) {
      element.dispatchEvent(new MouseEvent('mousedown', {
        view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
      }));
      element.dispatchEvent(new MouseEvent('mouseup', {
        view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
      }));
      element.dispatchEvent(new MouseEvent('click', {
        view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
      }));
    }
  }
  
  // Crop full-page screenshot to just the reCAPTCHA image grid area
  async function cropImageToGrid(base64Image, iframeRect) {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate crop area relative to viewport
          // reCAPTCHA challenge structure:
          // - Header with instructions: ~120px
          // - Image grid: main area
          // - Footer with buttons: ~60px
          
          const headerHeight = 120;
          const footerHeight = 60;
          
          // The screenshot is of the full visible tab
          // We need to extract just the iframe area, then crop to grid
          const scaleX = img.width / window.innerWidth;
          const scaleY = img.height / window.innerHeight;
          
          // Calculate source coordinates in the full screenshot
          const srcX = iframeRect.left * scaleX;
          const srcY = (iframeRect.top + headerHeight) * scaleY;
          const srcWidth = iframeRect.width * scaleX;
          const srcHeight = (iframeRect.height - headerHeight - footerHeight) * scaleY;
          
          // Set canvas to grid dimensions
          canvas.width = srcWidth;
          canvas.height = srcHeight;
          
          // Draw cropped area
          ctx.drawImage(
            img,
            srcX, srcY, srcWidth, srcHeight, // Source rectangle
            0, 0, srcWidth, srcHeight // Destination
          );
          
          const croppedBase64 = canvas.toDataURL('image/png');
          console.log('[AI Solver] Cropped image to grid area:', canvas.width, 'x', canvas.height);
          resolve(croppedBase64);
        };
        
        img.onerror = () => {
          console.log('[AI Solver] Failed to crop image');
          resolve(null);
        };
        
        img.src = base64Image;
      } catch (e) {
        console.error('[AI Solver] Crop error:', e);
        resolve(null);
      }
    });
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
      
      const images = captchaContainer.querySelectorAll('img');
      if (images.length > 0) {
        const imageBase64 = await imageToBase64(images[0]);
        const solution = await callAISolver(imageBase64, 'image');
        
        if (solution) {
          const positions = solution.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
          const tiles = captchaContainer.querySelectorAll('.rc-imageselect-tile, .image-tile, img');
          
          for (const pos of positions) {
            if (tiles[pos - 1]) {
              await simulateHumanClick(tiles[pos - 1]);
              await delay(300 + Math.random() * 200);
            }
          }
          
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
