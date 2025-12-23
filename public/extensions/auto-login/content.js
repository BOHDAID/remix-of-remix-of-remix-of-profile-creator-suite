// Auto Login Content Script - Runs on every page

(function() {
  'use strict';
  
  // Username/Email field patterns
  const usernameSelectors = [
    'input[type="email"]',
    'input[type="text"][name*="email" i]',
    'input[type="text"][name*="user" i]',
    'input[type="text"][name*="login" i]',
    'input[type="text"][id*="email" i]',
    'input[type="text"][id*="user" i]',
    'input[type="text"][id*="login" i]',
    'input[autocomplete="email"]',
    'input[autocomplete="username"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="بريد" i]',
    'input[placeholder*="إيميل" i]',
    'input[placeholder*="اسم المستخدم" i]',
    'input[type="tel"]',
    'input[name*="identifier" i]',
    'input[name*="account" i]',
  ];
  
  // Password field patterns
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="pass" i]',
    'input[name*="pwd" i]',
    'input[id*="pass" i]',
    'input[id*="pwd" i]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
    'input[placeholder*="password" i]',
    'input[placeholder*="كلمة" i]',
    'input[placeholder*="السر" i]',
  ];
  
  // Submit button patterns
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[name*="login" i]',
    'button[name*="signin" i]',
    'button[id*="login" i]',
    'button[id*="signin" i]',
    'button[class*="login" i]',
    'button[class*="signin" i]',
    'button[class*="submit" i]',
    'button:contains("تسجيل")',
    'button:contains("دخول")',
    'button:contains("Login")',
    'button:contains("Sign in")',
    'div[role="button"][class*="login" i]',
    'div[role="button"][class*="submit" i]',
  ];
  
  let autoLoginAttempted = false;
  
  // Find element by multiple selectors
  function findElement(selectors) {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && isVisible(element)) {
          return element;
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }
    return null;
  }
  
  // Check if element is visible
  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
  }
  
  // Simulate human-like typing
  async function typeText(element, text, delay = 50) {
    element.focus();
    element.value = '';
    
    // Trigger focus event
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      await sleep(delay + Math.random() * 30);
    }
    
    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  
  // Sleep function
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get current domain
  function getDomain() {
    return window.location.hostname.replace('www.', '');
  }
  
  // Check if this looks like a login page
  function isLoginPage() {
    const url = window.location.href.toLowerCase();
    const loginPatterns = ['/login', '/signin', '/auth', '/account', '/log-in', '/sign-in', '/logon'];
    
    if (loginPatterns.some(p => url.includes(p))) return true;
    
    // Check for password field
    const passwordField = findElement(passwordSelectors);
    if (passwordField) return true;
    
    return false;
  }
  
  // Perform auto login
  async function performAutoLogin(credential, settings) {
    if (autoLoginAttempted) return;
    autoLoginAttempted = true;
    
    console.log('[BHD Auto Login] Starting auto login for:', credential.domain);
    
    // Wait for page to fully load
    await sleep(settings.delay || 500);
    
    // Find username field
    const usernameField = findElement(usernameSelectors);
    if (!usernameField) {
      console.log('[BHD Auto Login] Username field not found');
      return;
    }
    
    // Find password field
    const passwordField = findElement(passwordSelectors);
    if (!passwordField) {
      console.log('[BHD Auto Login] Password field not found');
      return;
    }
    
    console.log('[BHD Auto Login] Found login fields, filling...');
    
    // Type username
    await typeText(usernameField, credential.username, settings.typingSpeed || 30);
    await sleep(200);
    
    // Type password
    await typeText(passwordField, credential.password, settings.typingSpeed || 30);
    await sleep(300);
    
    // Auto submit if enabled
    if (settings.autoSubmit !== false) {
      const submitButton = findElement(submitSelectors);
      
      // Also try to find button by text content
      if (!submitButton) {
        const allButtons = document.querySelectorAll('button, input[type="submit"]');
        for (const btn of allButtons) {
          const text = (btn.textContent || btn.value || '').toLowerCase();
          if (text.includes('login') || text.includes('sign in') || text.includes('تسجيل') || text.includes('دخول')) {
            if (isVisible(btn)) {
              await sleep(500);
              btn.click();
              console.log('[BHD Auto Login] Clicked submit button');
              return;
            }
          }
        }
      }
      
      if (submitButton) {
        await sleep(500);
        submitButton.click();
        console.log('[BHD Auto Login] Clicked submit button');
      } else {
        // Try submitting the form
        const form = usernameField.closest('form') || passwordField.closest('form');
        if (form) {
          await sleep(500);
          form.submit();
          console.log('[BHD Auto Login] Submitted form');
        }
      }
    }
  }
  
  // Initialize
  async function init() {
    // Wait a bit for page to settle
    await sleep(300);
    
    // Check if this is a login page
    if (!isLoginPage()) {
      console.log('[BHD Auto Login] Not a login page');
      return;
    }
    
    // Get settings
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      const settings = response?.settings || { autoLoginEnabled: true, delay: 500 };
      
      if (!settings.autoLoginEnabled) {
        console.log('[BHD Auto Login] Auto login is disabled');
        return;
      }
      
      // Get credential for this domain
      const domain = getDomain();
      chrome.runtime.sendMessage({ action: 'getCredentialForDomain', domain }, (response) => {
        if (response?.credential) {
          console.log('[BHD Auto Login] Found credential for domain:', domain);
          performAutoLogin(response.credential, settings);
        } else {
          console.log('[BHD Auto Login] No credential found for:', domain);
        }
      });
    });
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run after a delay in case of dynamic content
  setTimeout(init, 2000);
})();