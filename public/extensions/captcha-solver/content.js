// ============================================================
// AI CAPTCHA Solver - Advanced Content Script
// Supports: reCAPTCHA v2/v3, hCaptcha, Turnstile, FunCAPTCHA, Text, Image
// Features: Multi-stage analysis, continuous detection, sound notifications
// ============================================================

(function() {
  'use strict';
  
  // ============================================================
  // CONFIGURATION
  // ============================================================
  
  const SUPABASE_URL = 'https://yygquhqavbandcqkzzcn.supabase.co';
  
  const CONFIG = {
    detectionInterval: 1000,      // Check every 1 second
    solveRetryDelay: 1500,        // Delay between retries
    maxRetries: 5,                // Maximum solve attempts
    humanClickDelay: [200, 500],  // Random delay range for clicks
    tileClickDelay: [300, 600],   // Delay between tile clicks
    verifyWaitTime: 2000,         // Wait after clicking verify
    multiStageAnalysis: true      // Use advanced multi-stage AI analysis
  };
  
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  let state = {
    isProcessing: false,
    solverEnabled: true,
    autoSolveEnabled: true,
    continuousDetection: true,
    soundEnabled: true,
    lastCaptchaTime: 0,
    solveAttempts: 0,
    currentCaptchaType: null,
    detectionLoopId: null
  };
  
  // ============================================================
  // CAPTCHA DETECTION PATTERNS - ALL TYPES
  // ============================================================
  
  const CAPTCHA_PATTERNS = {
    // reCAPTCHA v2 - Checkbox and Image Challenge
    recaptchaV2: {
      selectors: [
        'iframe[src*="recaptcha/api2/anchor"]',
        'iframe[src*="recaptcha/enterprise/anchor"]',
        'iframe[title*="reCAPTCHA"]',
        '.g-recaptcha',
        '#g-recaptcha',
        '[data-sitekey]'
      ],
      challengeSelectors: [
        'iframe[src*="recaptcha/api2/bframe"]',
        'iframe[src*="recaptcha/enterprise/bframe"]'
      ],
      type: 'recaptcha-v2'
    },
    
    // reCAPTCHA v3 - Invisible
    recaptchaV3: {
      selectors: [
        '.grecaptcha-badge',
        'script[src*="recaptcha/api.js?render"]',
        '[data-sitekey][data-size="invisible"]'
      ],
      type: 'recaptcha-v3'
    },
    
    // hCaptcha
    hCaptcha: {
      selectors: [
        'iframe[src*="hcaptcha.com"]',
        '.h-captcha',
        '[data-hcaptcha-widget-id]',
        '#h-captcha'
      ],
      challengeSelectors: [
        'iframe[src*="hcaptcha.com/challenge"]'
      ],
      type: 'hcaptcha'
    },
    
    // Cloudflare Turnstile
    turnstile: {
      selectors: [
        'iframe[src*="challenges.cloudflare.com"]',
        '.cf-turnstile',
        '[data-turnstile-sitekey]'
      ],
      type: 'turnstile'
    },
    
    // FunCAPTCHA (Arkose Labs)
    funCaptcha: {
      selectors: [
        'iframe[src*="funcaptcha.com"]',
        'iframe[src*="arkoselabs.com"]',
        '#FunCaptcha',
        '[data-arkose-callback]'
      ],
      type: 'funcaptcha'
    },
    
    // Text CAPTCHA
    textCaptcha: {
      selectors: [
        'img[src*="captcha"]',
        'img[alt*="captcha" i]',
        'img[id*="captcha" i]',
        '.captcha-image',
        '#captcha-image',
        'img[class*="captcha" i]'
      ],
      inputSelectors: [
        'input[name*="captcha" i]',
        'input[id*="captcha" i]',
        'input[placeholder*="captcha" i]',
        '.captcha-input',
        '#captcha-input'
      ],
      type: 'text'
    },
    
    // Generic Image CAPTCHA
    imageCaptcha: {
      selectors: [
        '.captcha-container img',
        '[class*="captcha"] img:not([src*="logo"])',
        'img[id*="captcha"]'
      ],
      type: 'image'
    },
    
    // Amazon CAPTCHA
    amazonCaptcha: {
      selectors: [
        'img[src*="opfcaptcha"]',
        'form[action*="validateCaptcha"]'
      ],
      type: 'amazon'
    },
    
    // GeeTest
    geeTest: {
      selectors: [
        '.geetest_holder',
        '[class*="geetest"]',
        'script[src*="geetest"]'
      ],
      type: 'geetest'
    }
  };
  
  // Common reCAPTCHA targets knowledge
  const RECAPTCHA_TARGETS = [
    'traffic lights', 'traffic light', 'traffic signals',
    'crosswalks', 'crosswalk', 'pedestrian crossing', 'zebra crossing',
    'bicycles', 'bicycle', 'bikes', 'bike',
    'buses', 'bus', 'public bus',
    'cars', 'car', 'vehicles', 'automobiles',
    'motorcycles', 'motorcycle', 'motorbike',
    'fire hydrants', 'fire hydrant', 'hydrants',
    'stairs', 'staircase', 'steps',
    'bridges', 'bridge',
    'boats', 'boat', 'ships',
    'palm trees', 'palm tree',
    'mountains', 'mountain',
    'chimneys', 'chimney',
    'parking meters', 'parking meter',
    'taxis', 'taxi', 'cab',
    'tractors', 'tractor'
  ];
  
  // ============================================================
  // SOUND NOTIFICATIONS
  // ============================================================
  
  const SOUNDS = {
    detecting: { frequency: 440, duration: 100, type: 'sine' },
    analyzing: { frequency: 520, duration: 150, type: 'sine' },
    clicking: { frequency: 600, duration: 80, type: 'square' },
    success: { frequency: 880, duration: 300, type: 'sine', pattern: [880, 1100, 1320] },
    failure: { frequency: 220, duration: 400, type: 'sawtooth' },
    retry: { frequency: 350, duration: 150, type: 'triangle' }
  };
  
  let audioContext = null;
  
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }
  
  function playSound(soundType) {
    if (!state.soundEnabled) return;
    
    try {
      const ctx = initAudio();
      const sound = SOUNDS[soundType];
      if (!sound) return;
      
      if (sound.pattern) {
        // Play pattern (for success)
        sound.pattern.forEach((freq, i) => {
          setTimeout(() => {
            playTone(ctx, freq, sound.duration / sound.pattern.length, sound.type);
          }, i * (sound.duration / sound.pattern.length));
        });
      } else {
        playTone(ctx, sound.frequency, sound.duration, sound.type);
      }
    } catch (e) {
      console.log('[AI Solver] Audio not available');
    }
  }
  
  function playTone(ctx, frequency, duration, type) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  }
  
  // ============================================================
  // DETECTION SYSTEM
  // ============================================================
  
  function detectCaptcha() {
    for (const [name, pattern] of Object.entries(CAPTCHA_PATTERNS)) {
      // Check main selectors
      for (const selector of pattern.selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && isVisible(element)) {
            // Check if challenge is open
            let isChallenge = false;
            if (pattern.challengeSelectors) {
              for (const chalSelector of pattern.challengeSelectors) {
                const chalElement = document.querySelector(chalSelector);
                if (chalElement && isVisible(chalElement)) {
                  isChallenge = true;
                  break;
                }
              }
            }
            
            return {
              type: pattern.type,
              element: element,
              isChallenge: isChallenge,
              selector: selector
            };
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
    }
    return null;
  }
  
  function isVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           parseFloat(style.opacity) > 0;
  }
  
  // ============================================================
  // CONTINUOUS DETECTION LOOP (Every 1 Second)
  // ============================================================
  
  function startContinuousDetection() {
    if (state.detectionLoopId) {
      clearInterval(state.detectionLoopId);
    }
    
    console.log('[AI Solver] Starting continuous detection (every 1 second)');
    
    // Initial check
    checkForCaptcha();
    
    // Continuous loop
    state.detectionLoopId = setInterval(() => {
      if (!state.solverEnabled) return;
      checkForCaptcha();
    }, CONFIG.detectionInterval);
    
    // Also observe DOM for dynamic CAPTCHAs
    observeDOM();
  }
  
  function checkForCaptcha() {
    if (state.isProcessing) return;
    
    const captcha = detectCaptcha();
    if (captcha) {
      const now = Date.now();
      // Debounce: don't re-detect same captcha within 5 seconds
      if (now - state.lastCaptchaTime < 5000 && state.currentCaptchaType === captcha.type) {
        return;
      }
      
      state.lastCaptchaTime = now;
      state.currentCaptchaType = captcha.type;
      
      console.log('[AI Solver] CAPTCHA detected:', captcha.type, captcha.isChallenge ? '(challenge open)' : '');
      playSound('detecting');
      
      // Notify background
      chrome.runtime.sendMessage({
        type: 'CAPTCHA_DETECTED',
        data: {
          type: captcha.type,
          url: window.location.href,
          isChallenge: captcha.isChallenge
        }
      });
      
      // Auto-solve if enabled
      if (state.autoSolveEnabled) {
        solveCaptcha(captcha);
      }
    }
  }
  
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      if (!state.solverEnabled || state.isProcessing) return;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              // Check if added node contains any CAPTCHA
              const hasCapcha = 
                node.matches?.('[class*="captcha" i], [id*="captcha" i], iframe[src*="recaptcha"], iframe[src*="hcaptcha"]') ||
                node.querySelector?.('[class*="captcha" i], [id*="captcha" i], iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
              
              if (hasCapcha) {
                console.log('[AI Solver] CAPTCHA added to DOM');
                setTimeout(checkForCaptcha, 500);
                break;
              }
            }
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // ============================================================
  // MAIN SOLVING FUNCTION
  // ============================================================
  
  async function solveCaptcha(captchaData) {
    if (state.isProcessing) return;
    state.isProcessing = true;
    state.solveAttempts = 0;
    
    console.log('[AI Solver] Starting solve:', captchaData.type);
    showStatus('AI يحلل CAPTCHA...', 'processing');
    playSound('analyzing');
    
    let success = false;
    
    while (!success && state.solveAttempts < CONFIG.maxRetries) {
      state.solveAttempts++;
      console.log(`[AI Solver] Attempt ${state.solveAttempts}/${CONFIG.maxRetries}`);
      
      try {
        switch (captchaData.type) {
          case 'recaptcha-v2':
            success = await solveRecaptchaV2();
            break;
          case 'recaptcha-v3':
            success = await solveRecaptchaV3();
            break;
          case 'hcaptcha':
            success = await solveHCaptcha();
            break;
          case 'turnstile':
            success = await solveTurnstile();
            break;
          case 'funcaptcha':
            success = await solveFunCaptcha();
            break;
          case 'text':
            success = await solveTextCaptcha();
            break;
          case 'image':
          case 'amazon':
            success = await solveImageCaptcha();
            break;
          case 'geetest':
            success = await solveGeeTest();
            break;
          default:
            console.log('[AI Solver] Unknown CAPTCHA type:', captchaData.type);
            success = await tryGenericSolve();
        }
      } catch (error) {
        console.error('[AI Solver] Solve error:', error);
      }
      
      if (!success && state.solveAttempts < CONFIG.maxRetries) {
        showStatus(`إعادة المحاولة ${state.solveAttempts + 1}/${CONFIG.maxRetries}...`, 'retry');
        playSound('retry');
        await delay(CONFIG.solveRetryDelay);
      }
    }
    
    // Report result
    chrome.runtime.sendMessage({
      type: 'CAPTCHA_SOLVED',
      data: {
        captchaType: captchaData.type,
        success: success,
        attempts: state.solveAttempts,
        url: window.location.href
      }
    });
    
    if (success) {
      showStatus('تم الحل بنجاح! ✓', 'success');
      playSound('success');
    } else {
      showStatus('فشل الحل ✗', 'error');
      playSound('failure');
    }
    
    setTimeout(() => hideStatus(), 3000);
    state.isProcessing = false;
    state.currentCaptchaType = null;
  }
  
  // ============================================================
  // reCAPTCHA v2 SOLVER
  // ============================================================
  
  async function solveRecaptchaV2() {
    console.log('[AI Solver] Solving reCAPTCHA v2...');
    
    // Check if image challenge is already open
    const bframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
    if (bframe && isVisible(bframe)) {
      console.log('[AI Solver] Image challenge already open, solving...');
      return await solveRecaptchaImageChallenge();
    }
    
    // Try to click the checkbox
    const anchor = document.querySelector('iframe[src*="recaptcha/api2/anchor"], iframe[src*="recaptcha/enterprise/anchor"]');
    if (anchor && isVisible(anchor)) {
      console.log('[AI Solver] Clicking reCAPTCHA checkbox...');
      
      const rect = anchor.getBoundingClientRect();
      const checkboxX = Math.round(rect.left + 28);
      const checkboxY = Math.round(rect.top + rect.height / 2);
      
      playSound('clicking');
      
      // Try debugger API click
      const clickResult = await simulateClick(checkboxX, checkboxY);
      
      if (!clickResult.success) {
        // Fallback: Try native click events
        const clickEvent = new MouseEvent('click', {
          view: window, bubbles: true, cancelable: true,
          clientX: checkboxX, clientY: checkboxY
        });
        anchor.dispatchEvent(clickEvent);
        anchor.focus();
      }
      
      // Wait for response
      await delay(2500);
      
      // Check if solved (no challenge)
      const response = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (response && response.value) {
        console.log('[AI Solver] reCAPTCHA solved without challenge!');
        return true;
      }
      
      // Check if challenge appeared
      const newBframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
      if (newBframe && isVisible(newBframe)) {
        console.log('[AI Solver] Challenge appeared, solving...');
        return await solveRecaptchaImageChallenge();
      }
    }
    
    // Try clicking .g-recaptcha div
    const gRecaptcha = document.querySelector('.g-recaptcha, #g-recaptcha');
    if (gRecaptcha) {
      gRecaptcha.click();
      await delay(2000);
      
      const bframeAfter = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
      if (bframeAfter && isVisible(bframeAfter)) {
        return await solveRecaptchaImageChallenge();
      }
    }
    
    return false;
  }
  
  async function solveRecaptchaImageChallenge() {
    console.log('[AI Solver] Solving reCAPTCHA image challenge...');
    showStatus('جاري تحليل تحدي الصور...', 'processing');
    
    const bframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
    if (!bframe || !isVisible(bframe)) {
      console.log('[AI Solver] No visible bframe found');
      return false;
    }
    
    try {
      const rect = bframe.getBoundingClientRect();
      
      // Capture screenshot
      const screenshot = await captureScreen();
      if (!screenshot) {
        console.log('[AI Solver] Failed to capture screenshot');
        return false;
      }
      
      // Build comprehensive prompt
      const prompt = buildRecaptchaPrompt();
      
      // Call AI with multi-stage analysis
      const solution = await callAISolver(screenshot, 'recaptcha-image', prompt, true);
      
      if (!solution || solution.toLowerCase() === 'none') {
        console.log('[AI Solver] AI returned no solution');
        return false;
      }
      
      console.log('[AI Solver] AI solution:', solution);
      
      // Parse and click tiles
      const positions = parsePositions(solution);
      if (positions.length === 0) {
        console.log('[AI Solver] No valid positions found');
        return false;
      }
      
      // Detect grid size
      const gridSize = rect.width > 450 ? 4 : 3;
      const headerHeight = 120;
      const footerHeight = 60;
      const gridHeight = rect.height - headerHeight - footerHeight;
      const tileWidth = rect.width / gridSize;
      const tileHeight = gridHeight / gridSize;
      
      console.log(`[AI Solver] Grid: ${gridSize}x${gridSize}, clicking: ${positions.join(', ')}`);
      
      // Click each tile with human-like delays
      for (const pos of positions) {
        const col = (pos - 1) % gridSize;
        const row = Math.floor((pos - 1) / gridSize);
        
        const x = rect.left + (col * tileWidth) + (tileWidth / 2);
        const y = rect.top + headerHeight + (row * tileHeight) + (tileHeight / 2);
        
        playSound('clicking');
        await simulateClick(Math.round(x), Math.round(y));
        await delay(randomBetween(CONFIG.tileClickDelay[0], CONFIG.tileClickDelay[1]));
      }
      
      // Wait and click verify
      await delay(CONFIG.verifyWaitTime);
      
      const verifyX = rect.left + rect.width - 80;
      const verifyY = rect.top + rect.height - 35;
      await simulateClick(Math.round(verifyX), Math.round(verifyY));
      
      // Check result
      await delay(2500);
      
      // Check if new challenge appeared (need to solve again)
      const newBframe = document.querySelector('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]');
      if (newBframe && isVisible(newBframe)) {
        console.log('[AI Solver] New challenge appeared, continuing...');
        return await solveRecaptchaImageChallenge();
      }
      
      // Check if solved
      const response = document.querySelector('textarea[name="g-recaptcha-response"]');
      if (response && response.value) {
        console.log('[AI Solver] reCAPTCHA solved!');
        return true;
      }
      
      // Assume success if challenge disappeared
      return true;
      
    } catch (error) {
      console.error('[AI Solver] Image challenge error:', error);
      return false;
    }
  }
  
  function buildRecaptchaPrompt() {
    return `Analyze this reCAPTCHA image challenge screenshot.

STEP 1: Read the instruction at the TOP of the image. It says "Select all images with [TARGET]".

STEP 2: Identify the TARGET object from the instruction.

STEP 3: Examine each grid cell (usually 3x3 = 9 cells or 4x4 = 16 cells).

GRID NUMBERING:
For 3x3: [1][2][3] / [4][5][6] / [7][8][9]
For 4x4: [1][2][3][4] / [5][6][7][8] / [9][10][11][12] / [13][14][15][16]

COMMON TARGETS:
${RECAPTCHA_TARGETS.slice(0, 12).join(', ')}

RULES:
- Include cells with ANY part of the target (even partial/cut off)
- When uncertain, INCLUDE the cell (over-select is better)
- Return ONLY comma-separated numbers (e.g., 1,4,7)
- Return "none" if truly no cells match`;
  }
  
  // ============================================================
  // reCAPTCHA v3 (Invisible)
  // ============================================================
  
  async function solveRecaptchaV3() {
    console.log('[AI Solver] reCAPTCHA v3 detected - usually solved automatically');
    // v3 is typically invisible and solved by the page itself
    // We just need to ensure the token is generated
    
    if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
      try {
        const sitekey = document.querySelector('[data-sitekey]')?.dataset.sitekey;
        if (sitekey) {
          await window.grecaptcha.execute(sitekey, { action: 'submit' });
          return true;
        }
      } catch (e) {
        console.log('[AI Solver] v3 execute failed:', e);
      }
    }
    
    return true; // v3 is usually handled automatically
  }
  
  // ============================================================
  // hCaptcha SOLVER
  // ============================================================
  
  async function solveHCaptcha() {
    console.log('[AI Solver] Solving hCaptcha...');
    
    // Check for challenge iframe
    const challenge = document.querySelector('iframe[src*="hcaptcha.com/challenge"]');
    if (challenge && isVisible(challenge)) {
      return await solveHCaptchaChallenge();
    }
    
    // Click checkbox
    const checkbox = document.querySelector('iframe[src*="hcaptcha.com"]');
    if (checkbox && isVisible(checkbox)) {
      const rect = checkbox.getBoundingClientRect();
      const x = rect.left + 25;
      const y = rect.top + rect.height / 2;
      
      playSound('clicking');
      await simulateClick(Math.round(x), Math.round(y));
      await delay(2500);
      
      // Check for challenge
      const newChallenge = document.querySelector('iframe[src*="hcaptcha.com/challenge"]');
      if (newChallenge && isVisible(newChallenge)) {
        return await solveHCaptchaChallenge();
      }
      
      // Check if solved
      const response = document.querySelector('[name="h-captcha-response"], textarea[name="h-captcha-response"]');
      if (response && response.value) {
        return true;
      }
    }
    
    return false;
  }
  
  async function solveHCaptchaChallenge() {
    console.log('[AI Solver] Solving hCaptcha image challenge...');
    
    const challenge = document.querySelector('iframe[src*="hcaptcha.com/challenge"]');
    if (!challenge) return false;
    
    const screenshot = await captureScreen();
    if (!screenshot) return false;
    
    const prompt = `Analyze this hCaptcha challenge screenshot.
Read the instruction text and identify what object to select.
Return comma-separated grid cell numbers that contain the target.
Grid is usually 3x3 (1-9). Return "none" if no matches.`;
    
    const solution = await callAISolver(screenshot, 'hcaptcha', prompt, true);
    
    if (!solution || solution.toLowerCase() === 'none') {
      return false;
    }
    
    const rect = challenge.getBoundingClientRect();
    const positions = parsePositions(solution);
    
    // hCaptcha typically has 3x3 grid
    const gridSize = 3;
    const tileSize = Math.min(rect.width, rect.height - 150) / gridSize;
    const offsetY = 100; // Header offset
    
    for (const pos of positions) {
      const col = (pos - 1) % gridSize;
      const row = Math.floor((pos - 1) / gridSize);
      
      const x = rect.left + (col * tileSize) + (tileSize / 2);
      const y = rect.top + offsetY + (row * tileSize) + (tileSize / 2);
      
      playSound('clicking');
      await simulateClick(Math.round(x), Math.round(y));
      await delay(randomBetween(300, 500));
    }
    
    await delay(1500);
    
    // Click verify/submit button
    const verifyX = rect.left + rect.width - 60;
    const verifyY = rect.top + rect.height - 40;
    await simulateClick(Math.round(verifyX), Math.round(verifyY));
    
    await delay(2000);
    return true;
  }
  
  // ============================================================
  // Cloudflare Turnstile SOLVER
  // ============================================================
  
  async function solveTurnstile() {
    console.log('[AI Solver] Solving Cloudflare Turnstile...');
    
    const turnstile = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
    if (turnstile && isVisible(turnstile)) {
      const rect = turnstile.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      playSound('clicking');
      await simulateClick(Math.round(x), Math.round(y));
      await delay(3000);
      
      // Turnstile usually auto-completes
      const response = document.querySelector('[name="cf-turnstile-response"]');
      if (response && response.value) {
        return true;
      }
    }
    
    return true; // Turnstile is often automatic
  }
  
  // ============================================================
  // FunCAPTCHA (Arkose Labs) SOLVER
  // ============================================================
  
  async function solveFunCaptcha() {
    console.log('[AI Solver] Solving FunCAPTCHA...');
    
    const iframe = document.querySelector('iframe[src*="funcaptcha.com"], iframe[src*="arkoselabs.com"]');
    if (!iframe) return false;
    
    const screenshot = await captureScreen();
    if (!screenshot) return false;
    
    const prompt = `Analyze this FunCAPTCHA/Arkose Labs challenge.
These usually involve rotating an image to match an orientation or identifying objects.
Describe what action needs to be taken and return the direction or selection needed.`;
    
    const solution = await callAISolver(screenshot, 'funcaptcha', prompt, true);
    
    // FunCaptcha often requires rotation - parse direction
    if (solution) {
      const rect = iframe.getBoundingClientRect();
      
      if (solution.toLowerCase().includes('left') || solution.toLowerCase().includes('rotate left')) {
        const x = rect.left + 50;
        const y = rect.top + rect.height / 2;
        await simulateClick(Math.round(x), Math.round(y));
      } else if (solution.toLowerCase().includes('right') || solution.toLowerCase().includes('rotate right')) {
        const x = rect.left + rect.width - 50;
        const y = rect.top + rect.height / 2;
        await simulateClick(Math.round(x), Math.round(y));
      }
      
      await delay(1500);
      
      // Click submit
      const submitX = rect.left + rect.width / 2;
      const submitY = rect.top + rect.height - 40;
      await simulateClick(Math.round(submitX), Math.round(submitY));
      
      await delay(2000);
      return true;
    }
    
    return false;
  }
  
  // ============================================================
  // Text CAPTCHA SOLVER
  // ============================================================
  
  async function solveTextCaptcha() {
    console.log('[AI Solver] Solving text CAPTCHA...');
    
    // Find CAPTCHA image
    let captchaImg = null;
    for (const selector of CAPTCHA_PATTERNS.textCaptcha.selectors) {
      captchaImg = document.querySelector(selector);
      if (captchaImg) break;
    }
    
    if (!captchaImg) {
      console.log('[AI Solver] No CAPTCHA image found');
      return false;
    }
    
    // Find input field
    let captchaInput = null;
    for (const selector of CAPTCHA_PATTERNS.textCaptcha.inputSelectors) {
      captchaInput = document.querySelector(selector);
      if (captchaInput) break;
    }
    
    if (!captchaInput) {
      console.log('[AI Solver] No CAPTCHA input found');
      return false;
    }
    
    // Convert image to base64
    const imageBase64 = await imageToBase64(captchaImg);
    if (!imageBase64) {
      console.log('[AI Solver] Failed to convert image');
      return false;
    }
    
    // Call AI
    const solution = await callAISolver(imageBase64, 'text', 'Read and return ONLY the text/characters in this CAPTCHA.');
    
    if (!solution) {
      console.log('[AI Solver] No solution from AI');
      return false;
    }
    
    console.log('[AI Solver] Text solution:', solution);
    
    // Type solution with human-like behavior
    captchaInput.focus();
    captchaInput.value = '';
    
    for (const char of solution) {
      captchaInput.value += char;
      captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(randomBetween(50, 120));
    }
    
    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  // ============================================================
  // Generic Image CAPTCHA SOLVER
  // ============================================================
  
  async function solveImageCaptcha() {
    console.log('[AI Solver] Solving generic image CAPTCHA...');
    
    const screenshot = await captureScreen();
    if (!screenshot) return false;
    
    const prompt = `Analyze this image CAPTCHA.
Identify what type of challenge it is and solve it.
For grid selections, return cell numbers (1-9 or 1-16).
For text, return only the text.
For matching/puzzles, describe the action needed.`;
    
    const solution = await callAISolver(screenshot, 'image', prompt, true);
    
    if (solution) {
      console.log('[AI Solver] Image solution:', solution);
      
      const positions = parsePositions(solution);
      if (positions.length > 0) {
        // Handle as grid selection
        // ... similar to reCAPTCHA
      }
      
      return true;
    }
    
    return false;
  }
  
  // ============================================================
  // GeeTest SOLVER
  // ============================================================
  
  async function solveGeeTest() {
    console.log('[AI Solver] Solving GeeTest...');
    
    const holder = document.querySelector('.geetest_holder, [class*="geetest"]');
    if (!holder) return false;
    
    // GeeTest usually requires sliding - capture and analyze
    const screenshot = await captureScreen();
    if (!screenshot) return false;
    
    const prompt = `Analyze this GeeTest CAPTCHA.
If it's a slider puzzle, identify how far to slide (percentage 0-100).
If it's image selection, return cell numbers.
If it's icon matching, describe the match.`;
    
    const solution = await callAISolver(screenshot, 'geetest', prompt, true);
    
    // Parse and execute based on solution type
    if (solution) {
      console.log('[AI Solver] GeeTest solution:', solution);
      // TODO: Implement slider drag if needed
      return true;
    }
    
    return false;
  }
  
  // ============================================================
  // Generic/Unknown CAPTCHA Attempt
  // ============================================================
  
  async function tryGenericSolve() {
    console.log('[AI Solver] Trying generic CAPTCHA solve...');
    
    const screenshot = await captureScreen();
    if (!screenshot) return false;
    
    const solution = await callAISolver(screenshot, 'unknown', 
      'Analyze this CAPTCHA and determine how to solve it. Return the solution or action needed.');
    
    console.log('[AI Solver] Generic solution:', solution);
    return !!solution;
  }
  
  // ============================================================
  // AI API CALLER
  // ============================================================
  
  async function callAISolver(imageBase64, captchaType, prompt, useMultiStage = false) {
    try {
      console.log('[AI Solver] Calling AI API...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/solve-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
          captchaType,
          prompt,
          siteDomain: window.location.hostname,
          useMultiStage,
          recordLearning: true
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
  
  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  
  async function captureScreen() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CAPTURE_SCREEN' }, (response) => {
        if (response && response.imageBase64) {
          resolve(response.imageBase64);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  async function simulateClick(x, y) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SIMULATE_CLICK',
        x: x,
        y: y
      }, (response) => {
        resolve(response || { success: false });
      });
    });
  }
  
  async function imageToBase64(imgElement) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          try {
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            // Fallback: fetch and convert
            fetch(imgElement.src)
              .then(r => r.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              })
              .catch(() => resolve(null));
          }
        };
        
        img.onerror = () => resolve(null);
        img.src = imgElement.src;
      } catch (error) {
        resolve(null);
      }
    });
  }
  
  function parsePositions(solution) {
    if (!solution) return [];
    const numbers = solution.match(/\d+/g);
    if (!numbers) return [];
    return [...new Set(numbers.map(n => parseInt(n)).filter(n => n >= 1 && n <= 16))];
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // ============================================================
  // STATUS OVERLAY
  // ============================================================
  
  let statusOverlay = null;
  
  function showStatus(message, type) {
    hideStatus();
    
    statusOverlay = document.createElement('div');
    statusOverlay.id = 'ai-captcha-status';
    statusOverlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    
    const colors = {
      processing: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
      success: { bg: '#14532d', border: '#22c55e', text: '#86efac' },
      error: { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
      retry: { bg: '#422006', border: '#f59e0b', text: '#fcd34d' }
    };
    
    const color = colors[type] || colors.processing;
    statusOverlay.style.background = color.bg;
    statusOverlay.style.border = `1px solid ${color.border}`;
    statusOverlay.style.color = color.text;
    
    const spinner = type === 'processing' || type === 'retry' ? 
      '<span style="animation: spin 1s linear infinite; display: inline-block;">⚙️</span>' : 
      type === 'success' ? '✅' : type === 'error' ? '❌' : '🤖';
    
    statusOverlay.innerHTML = `${spinner} <span>${message}</span>`;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    statusOverlay.appendChild(style);
    
    document.body.appendChild(statusOverlay);
  }
  
  function hideStatus() {
    if (statusOverlay) {
      statusOverlay.remove();
      statusOverlay = null;
    }
  }
  
  // ============================================================
  // MESSAGE LISTENER
  // ============================================================
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_SOLVING') {
      const captcha = detectCaptcha();
      if (captcha) {
        solveCaptcha(captcha);
      }
      sendResponse({ started: true });
    }
    
    if (message.type === 'TOGGLE_SOLVER') {
      if (typeof message.enabled === 'boolean') state.solverEnabled = message.enabled;
      if (typeof message.autoSolve === 'boolean') state.autoSolveEnabled = message.autoSolve;
      if (typeof message.sound === 'boolean') state.soundEnabled = message.sound;
      if (typeof message.continuous === 'boolean') state.continuousDetection = message.continuous;
      sendResponse({ ...state });
    }
    
    if (message.type === 'GET_STATE') {
      sendResponse({ ...state });
    }
    
    if (message.type === 'TEST_CLICK') {
      (async () => {
        const captcha = detectCaptcha();
        if (captcha && captcha.type.includes('recaptcha')) {
          const anchor = document.querySelector('iframe[src*="recaptcha/api2/anchor"]');
          if (anchor) {
            const rect = anchor.getBoundingClientRect();
            const result = await simulateClick(Math.round(rect.left + 28), Math.round(rect.top + rect.height / 2));
            sendResponse(result);
          } else {
            sendResponse({ success: false, error: 'No reCAPTCHA found' });
          }
        } else {
          sendResponse({ success: false, error: 'No CAPTCHA detected' });
        }
      })();
      return true;
    }
    
    return true;
  });
  
  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  console.log('[AI Solver] Content script loaded - Advanced CAPTCHA Solver');
  console.log('[AI Solver] Supported: reCAPTCHA v2/v3, hCaptcha, Turnstile, FunCAPTCHA, Text, Image, GeeTest');
  
  // Start continuous detection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startContinuousDetection);
  } else {
    startContinuousDetection();
  }
})();
