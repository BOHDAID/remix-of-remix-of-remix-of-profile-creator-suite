// Universal Session Capture System - Captures sessions from ANY website
// Supports millions of websites automatically without predefined lists

export interface UniversalSession {
  id: string;
  profileId: string;
  domain: string;
  subdomain: string;
  fullUrl: string;
  siteName: string;
  siteIcon?: string;
  cookies: SessionCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  tokens: DetectedToken[];
  headers: Record<string, string>;
  capturedAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  status: 'active' | 'expired' | 'revoked' | 'unknown';
  loginState: 'logged_in' | 'logged_out' | 'unknown';
  autoRefresh: boolean;
  metadata: SessionMetadata;
}

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  maxAge?: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | '';
  priority?: 'Low' | 'Medium' | 'High';
  size: number;
}

export interface DetectedToken {
  id: string;
  type: TokenType;
  name: string;
  value: string;
  maskedValue: string;
  expiresAt?: Date;
  source: 'cookie' | 'localStorage' | 'sessionStorage' | 'header' | 'indexedDB';
  isValid: boolean;
  decodedPayload?: Record<string, any>;
}

export type TokenType = 
  | 'jwt' 
  | 'bearer' 
  | 'oauth_access' 
  | 'oauth_refresh' 
  | 'session_id' 
  | 'csrf' 
  | 'api_key'
  | 'auth_token'
  | 'custom';

export interface SessionMetadata {
  userAgent: string;
  ip?: string;
  country?: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  timezone: string;
  language: string;
}

export interface LoginCredential {
  id: string;
  profileId: string;
  domain: string;
  siteName: string;
  siteIcon?: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  encryptedPassword: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'totp' | 'sms' | 'email' | 'push' | 'hardware_key';
  twoFactorSecret?: string;
  recoveryEmail?: string;
  recoveryPhone?: string;
  securityQuestions?: { question: string; answer: string }[];
  savedAt: Date;
  lastUsed?: Date;
  autoLogin: boolean;
  loginUrl: string;
  loginMethod: 'form' | 'oauth' | 'sso' | 'api';
  selectors: LoginSelectors;
  customData: Record<string, any>;
}

export interface LoginSelectors {
  usernameField: string[];
  passwordField: string[];
  submitButton: string[];
  rememberMe?: string[];
  twoFactorField?: string[];
  captchaContainer?: string[];
  errorMessage?: string[];
  successIndicator?: string[];
}

// Universal patterns for detecting auth elements
const UNIVERSAL_AUTH_PATTERNS = {
  // Username/Email field patterns
  usernamePatterns: [
    'input[type="email"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="login"]',
    'input[type="text"][id*="email"]',
    'input[type="text"][id*="user"]',
    'input[type="text"][id*="login"]',
    'input[autocomplete="email"]',
    'input[autocomplete="username"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="phone" i]',
    'input[type="tel"]',
    'input[name*="identifier"]',
    'input[name*="account"]',
  ],
  
  // Password field patterns
  passwordPatterns: [
    'input[type="password"]',
    'input[name*="pass"]',
    'input[name*="pwd"]',
    'input[id*="pass"]',
    'input[id*="pwd"]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
  ],
  
  // Submit button patterns
  submitPatterns: [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[name*="login"]',
    'button[name*="signin"]',
    'button[id*="login"]',
    'button[id*="signin"]',
    'button[class*="login"]',
    'button[class*="signin"]',
    'a[class*="login"]',
    'div[role="button"][class*="login"]',
    'div[role="button"][class*="submit"]',
  ],
  
  // 2FA patterns
  twoFactorPatterns: [
    'input[name*="otp"]',
    'input[name*="code"]',
    'input[name*="2fa"]',
    'input[name*="totp"]',
    'input[name*="mfa"]',
    'input[type="tel"][maxlength="6"]',
    'input[autocomplete="one-time-code"]',
  ],
  
  // Session cookie name patterns (regex)
  sessionCookiePatterns: [
    /^sess/i,
    /session/i,
    /^sid$/i,
    /^ssid$/i,
    /^jsession/i,
    /^phpsess/i,
    /^asp\.net_session/i,
    /auth/i,
    /token/i,
    /^_ga$/,
    /^_gid$/,
    /^user/i,
    /^login/i,
    /^account/i,
    /remember/i,
    /^csrf/i,
    /^xsrf/i,
  ],
  
  // Token patterns in storage
  tokenKeyPatterns: [
    /token/i,
    /auth/i,
    /session/i,
    /user/i,
    /login/i,
    /credential/i,
    /access/i,
    /refresh/i,
    /jwt/i,
    /bearer/i,
    /api[_-]?key/i,
    /secret/i,
  ],
  
  // JWT pattern
  jwtPattern: /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
};

// Detect token type from value
function detectTokenType(key: string, value: string): TokenType {
  const keyLower = key.toLowerCase();
  
  // Check JWT pattern
  if (UNIVERSAL_AUTH_PATTERNS.jwtPattern.test(value)) {
    return 'jwt';
  }
  
  // Check key name patterns
  if (keyLower.includes('refresh')) return 'oauth_refresh';
  if (keyLower.includes('access') && keyLower.includes('token')) return 'oauth_access';
  if (keyLower.includes('csrf') || keyLower.includes('xsrf')) return 'csrf';
  if (keyLower.includes('api') && keyLower.includes('key')) return 'api_key';
  if (keyLower.includes('session')) return 'session_id';
  if (keyLower.includes('auth') || keyLower.includes('bearer')) return 'auth_token';
  if (keyLower.includes('token')) return 'bearer';
  
  return 'custom';
}

// Decode JWT token
function decodeJWT(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

// Mask sensitive value
function maskValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

// Extract domain parts
function extractDomainParts(url: string): { domain: string; subdomain: string; fullUrl: string } {
  try {
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');
    const domain = hostParts.slice(-2).join('.');
    const subdomain = hostParts.length > 2 ? hostParts.slice(0, -2).join('.') : '';
    return { domain, subdomain, fullUrl: url };
  } catch {
    return { domain: url, subdomain: '', fullUrl: url };
  }
}

// Generate site name from domain
function generateSiteName(domain: string): string {
  const cleaned = domain.replace(/^www\./, '').split('.')[0];
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Check if a cookie is likely a session cookie
function isSessionCookie(cookie: SessionCookie): boolean {
  const name = cookie.name.toLowerCase();
  return UNIVERSAL_AUTH_PATTERNS.sessionCookiePatterns.some(pattern => pattern.test(name));
}

// Check if a storage key is likely a token
function isTokenKey(key: string): boolean {
  return UNIVERSAL_AUTH_PATTERNS.tokenKeyPatterns.some(pattern => pattern.test(key));
}

// Main Universal Session Capture Service
class UniversalSessionCaptureService {
  private sessions: Map<string, UniversalSession> = new Map();
  private credentials: Map<string, LoginCredential> = new Map();
  private listeners: Set<(session: UniversalSession) => void> = new Set();
  private storageKey = 'bhd_universal_sessions';
  private credentialsKey = 'bhd_universal_credentials';

  constructor() {
    this.loadFromStorage();
    this.startAutoRefresh();
  }

  private loadFromStorage(): void {
    try {
      const sessionsData = localStorage.getItem(this.storageKey);
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData) as UniversalSession[];
        parsed.forEach(s => {
          s.capturedAt = new Date(s.capturedAt);
          if (s.expiresAt) s.expiresAt = new Date(s.expiresAt);
          if (s.lastUsed) s.lastUsed = new Date(s.lastUsed);
          this.sessions.set(s.id, s);
        });
      }

      const credsData = localStorage.getItem(this.credentialsKey);
      if (credsData) {
        const parsed = JSON.parse(credsData) as LoginCredential[];
        parsed.forEach(c => {
          c.savedAt = new Date(c.savedAt);
          if (c.lastUsed) c.lastUsed = new Date(c.lastUsed);
          this.credentials.set(c.id, c);
        });
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.sessions.values())));
      localStorage.setItem(this.credentialsKey, JSON.stringify(Array.from(this.credentials.values())));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  private startAutoRefresh(): void {
    // Check session validity every minute
    setInterval(() => {
      this.refreshAllSessionStatus();
    }, 60000);
  }

  // Capture session from ANY website
  captureSession(
    profileId: string, 
    url: string, 
    data: {
      cookies: SessionCookie[];
      localStorage: Record<string, string>;
      sessionStorage: Record<string, string>;
      headers?: Record<string, string>;
    },
    metadata?: Partial<SessionMetadata>
  ): UniversalSession {
    const { domain, subdomain, fullUrl } = extractDomainParts(url);
    
    // Detect all tokens
    const tokens = this.detectAllTokens(data);
    
    // Calculate expiry
    const expiresAt = this.calculateExpiry(tokens, data.cookies);
    
    // Detect login state
    const loginState = this.detectLoginState(tokens, data.cookies);
    
    const session: UniversalSession = {
      id: crypto.randomUUID(),
      profileId,
      domain,
      subdomain,
      fullUrl,
      siteName: generateSiteName(domain),
      cookies: data.cookies,
      localStorage: data.localStorage,
      sessionStorage: data.sessionStorage,
      tokens,
      headers: data.headers || {},
      capturedAt: new Date(),
      expiresAt,
      status: 'active',
      loginState,
      autoRefresh: true,
      metadata: {
        userAgent: metadata?.userAgent || navigator.userAgent,
        browser: metadata?.browser || this.detectBrowser(),
        os: metadata?.os || this.detectOS(),
        deviceType: metadata?.deviceType || 'desktop',
        screenResolution: metadata?.screenResolution || `${screen.width}x${screen.height}`,
        timezone: metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: metadata?.language || navigator.language,
        ...metadata
      }
    };

    // Check for existing session for same profile/domain
    const existingKey = this.findExistingSession(profileId, domain);
    if (existingKey) {
      session.id = existingKey;
    }

    this.sessions.set(session.id, session);
    this.saveToStorage();
    this.notifyListeners(session);

    return session;
  }

  private findExistingSession(profileId: string, domain: string): string | null {
    for (const [id, session] of this.sessions) {
      if (session.profileId === profileId && session.domain === domain) {
        return id;
      }
    }
    return null;
  }

  // Detect all tokens from captured data
  private detectAllTokens(data: {
    cookies: SessionCookie[];
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  }): DetectedToken[] {
    const tokens: DetectedToken[] = [];
    let tokenId = 0;

    // Check cookies
    for (const cookie of data.cookies) {
      if (isSessionCookie(cookie) || isTokenKey(cookie.name)) {
        const type = detectTokenType(cookie.name, cookie.value);
        const decoded = type === 'jwt' ? decodeJWT(cookie.value) : null;
        
        tokens.push({
          id: `token-${tokenId++}`,
          type,
          name: cookie.name,
          value: cookie.value,
          maskedValue: maskValue(cookie.value),
          expiresAt: cookie.expires,
          source: 'cookie',
          isValid: !cookie.expires || cookie.expires > new Date(),
          decodedPayload: decoded || undefined
        });
      }
    }

    // Check localStorage
    for (const [key, value] of Object.entries(data.localStorage)) {
      if (isTokenKey(key) || UNIVERSAL_AUTH_PATTERNS.jwtPattern.test(value)) {
        const type = detectTokenType(key, value);
        const decoded = type === 'jwt' ? decodeJWT(value) : null;
        
        let expiresAt: Date | undefined;
        if (decoded?.exp) {
          expiresAt = new Date(decoded.exp * 1000);
        }

        tokens.push({
          id: `token-${tokenId++}`,
          type,
          name: key,
          value,
          maskedValue: maskValue(value),
          expiresAt,
          source: 'localStorage',
          isValid: !expiresAt || expiresAt > new Date(),
          decodedPayload: decoded || undefined
        });
      }
    }

    // Check sessionStorage
    for (const [key, value] of Object.entries(data.sessionStorage)) {
      if (isTokenKey(key) || UNIVERSAL_AUTH_PATTERNS.jwtPattern.test(value)) {
        const type = detectTokenType(key, value);
        const decoded = type === 'jwt' ? decodeJWT(value) : null;
        
        let expiresAt: Date | undefined;
        if (decoded?.exp) {
          expiresAt = new Date(decoded.exp * 1000);
        }

        tokens.push({
          id: `token-${tokenId++}`,
          type,
          name: key,
          value,
          maskedValue: maskValue(value),
          expiresAt,
          source: 'sessionStorage',
          isValid: !expiresAt || expiresAt > new Date(),
          decodedPayload: decoded || undefined
        });
      }
    }

    return tokens;
  }

  private calculateExpiry(tokens: DetectedToken[], cookies: SessionCookie[]): Date | undefined {
    const expiryDates: Date[] = [];

    for (const token of tokens) {
      if (token.expiresAt && token.isValid) {
        expiryDates.push(token.expiresAt);
      }
    }

    for (const cookie of cookies) {
      if (cookie.expires && isSessionCookie(cookie)) {
        expiryDates.push(cookie.expires);
      }
    }

    if (expiryDates.length > 0) {
      // Return earliest expiry
      return new Date(Math.min(...expiryDates.map(d => d.getTime())));
    }

    // Default: 30 days
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private detectLoginState(tokens: DetectedToken[], cookies: SessionCookie[]): 'logged_in' | 'logged_out' | 'unknown' {
    // If we have valid auth tokens, likely logged in
    const hasValidAuthToken = tokens.some(t => 
      t.isValid && ['jwt', 'bearer', 'oauth_access', 'auth_token', 'session_id'].includes(t.type)
    );
    
    if (hasValidAuthToken) return 'logged_in';

    // Check for session cookies
    const hasSessionCookie = cookies.some(c => isSessionCookie(c));
    if (hasSessionCookie) return 'logged_in';

    return 'unknown';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // Save login credentials
  saveCredential(credential: Omit<LoginCredential, 'id' | 'savedAt' | 'encryptedPassword'> & { password: string }): LoginCredential {
    const saved: LoginCredential = {
      ...credential,
      id: crypto.randomUUID(),
      savedAt: new Date(),
      encryptedPassword: btoa(credential.password), // Basic encoding (in real app, use proper encryption)
    };

    // Check for existing
    const existingKey = Array.from(this.credentials.entries()).find(
      ([, c]) => c.profileId === credential.profileId && c.domain === credential.domain
    )?.[0];

    if (existingKey) {
      saved.id = existingKey;
    }

    this.credentials.set(saved.id, saved);
    this.saveToStorage();
    return saved;
  }

  // Get all sessions
  getAllSessions(): UniversalSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  }

  // Get sessions for a profile
  getProfileSessions(profileId: string): UniversalSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.profileId === profileId)
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  }

  // Get session by domain
  getSessionByDomain(profileId: string, domain: string): UniversalSession | undefined {
    return Array.from(this.sessions.values())
      .find(s => s.profileId === profileId && s.domain.includes(domain));
  }

  // Get all credentials
  getAllCredentials(): LoginCredential[] {
    return Array.from(this.credentials.values())
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  }

  // Get credentials for a profile
  getProfileCredentials(profileId: string): LoginCredential[] {
    return Array.from(this.credentials.values())
      .filter(c => c.profileId === profileId);
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // Delete credential
  deleteCredential(credentialId: string): boolean {
    const deleted = this.credentials.delete(credentialId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // Export session
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    return JSON.stringify(session, null, 2);
  }

  // Export all sessions for profile
  exportProfileSessions(profileId: string): string {
    const sessions = this.getProfileSessions(profileId);
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      profileId,
      sessionsCount: sessions.length,
      sessions
    }, null, 2);
  }

  // Import session
  importSession(jsonData: string): UniversalSession {
    const session = JSON.parse(jsonData) as UniversalSession;
    session.id = crypto.randomUUID();
    session.capturedAt = new Date(session.capturedAt);
    if (session.expiresAt) session.expiresAt = new Date(session.expiresAt);
    this.sessions.set(session.id, session);
    this.saveToStorage();
    return session;
  }

  // Refresh session status
  refreshAllSessionStatus(): void {
    let changed = false;
    
    this.sessions.forEach(session => {
      const newStatus = this.calculateSessionStatus(session);
      if (session.status !== newStatus) {
        session.status = newStatus;
        changed = true;
      }
    });

    if (changed) this.saveToStorage();
  }

  private calculateSessionStatus(session: UniversalSession): UniversalSession['status'] {
    if (session.status === 'revoked') return 'revoked';
    
    // Check if any tokens are expired
    const hasExpiredToken = session.tokens.some(t => t.expiresAt && t.expiresAt < new Date());
    if (hasExpiredToken) return 'expired';
    
    // Check session expiry
    if (session.expiresAt && session.expiresAt < new Date()) return 'expired';
    
    return 'active';
  }

  // Get statistics
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    totalCredentials: number;
    uniqueDomains: number;
    uniqueProfiles: number;
    tokensByType: Record<TokenType, number>;
  } {
    const sessions = Array.from(this.sessions.values());
    const credentials = Array.from(this.credentials.values());
    const domains = new Set([...sessions.map(s => s.domain), ...credentials.map(c => c.domain)]);
    const profiles = new Set([...sessions.map(s => s.profileId), ...credentials.map(c => c.profileId)]);
    
    const tokensByType: Record<TokenType, number> = {
      jwt: 0,
      bearer: 0,
      oauth_access: 0,
      oauth_refresh: 0,
      session_id: 0,
      csrf: 0,
      api_key: 0,
      auth_token: 0,
      custom: 0
    };

    sessions.forEach(s => {
      s.tokens.forEach(t => {
        tokensByType[t.type]++;
      });
    });

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      expiredSessions: sessions.filter(s => s.status === 'expired').length,
      totalCredentials: credentials.length,
      uniqueDomains: domains.size,
      uniqueProfiles: profiles.size,
      tokensByType
    };
  }

  // Subscribe to session updates
  onSessionUpdate(callback: (session: UniversalSession) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(session: UniversalSession): void {
    this.listeners.forEach(cb => cb(session));
  }

  // Generate auto-login script for Electron
  generateAutoLoginScript(credential: LoginCredential): string {
    return `
      (async function autoLogin() {
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        const findEl = (selectors) => {
          for (const sel of selectors) {
            try {
              const el = document.querySelector(sel);
              if (el) return el;
            } catch {}
          }
          return null;
        };
        
        const typeText = async (el, text) => {
          el.focus();
          el.value = '';
          for (const char of text) {
            el.value += char;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            await wait(50 + Math.random() * 50);
          }
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        
        await wait(1000);
        
        // Find username field
        const usernameSelectors = ${JSON.stringify(credential.selectors.usernameField)};
        const usernameField = findEl(usernameSelectors);
        if (usernameField) {
          await typeText(usernameField, ${JSON.stringify(credential.username)});
        }
        
        await wait(500);
        
        // Find password field
        const passwordSelectors = ${JSON.stringify(credential.selectors.passwordField)};
        const passwordField = findEl(passwordSelectors);
        if (passwordField) {
          await typeText(passwordField, ${JSON.stringify(credential.password)});
        }
        
        await wait(500);
        
        // Click submit
        const submitSelectors = ${JSON.stringify(credential.selectors.submitButton)};
        const submitBtn = findEl(submitSelectors);
        if (submitBtn) {
          submitBtn.click();
        }
        
        return { success: true };
      })();
    `;
  }

  // Generate session injection script
  generateSessionInjectionScript(session: UniversalSession): string {
    return `
      (async function injectSession() {
        // Inject localStorage
        const localStorage = ${JSON.stringify(session.localStorage)};
        for (const [key, value] of Object.entries(localStorage)) {
          window.localStorage.setItem(key, value);
        }
        
        // Inject sessionStorage
        const sessionStorage = ${JSON.stringify(session.sessionStorage)};
        for (const [key, value] of Object.entries(sessionStorage)) {
          window.sessionStorage.setItem(key, value);
        }
        
        // Cookies will be injected via Electron's session API
        return { 
          success: true, 
          localStorageCount: Object.keys(localStorage).length,
          sessionStorageCount: Object.keys(sessionStorage).length
        };
      })();
    `;
  }

  // Detect login page on any website
  detectLoginPage(html: string, url: string): {
    isLoginPage: boolean;
    selectors: LoginSelectors;
    confidence: number;
  } {
    let confidence = 0;
    const selectors: LoginSelectors = {
      usernameField: [],
      passwordField: [],
      submitButton: [],
    };

    // Check URL patterns
    const loginUrlPatterns = ['/login', '/signin', '/auth', '/account', '/log-in', '/sign-in'];
    if (loginUrlPatterns.some(p => url.toLowerCase().includes(p))) {
      confidence += 30;
    }

    // Count form elements (simple check)
    const hasPasswordField = html.includes('type="password"') || html.includes("type='password'");
    if (hasPasswordField) confidence += 40;

    const hasEmailField = html.includes('type="email"') || html.includes("type='email'");
    if (hasEmailField) confidence += 20;

    const hasSubmitButton = html.includes('type="submit"') || html.includes("type='submit'");
    if (hasSubmitButton) confidence += 10;

    // Build selectors based on patterns
    selectors.usernameField = UNIVERSAL_AUTH_PATTERNS.usernamePatterns;
    selectors.passwordField = UNIVERSAL_AUTH_PATTERNS.passwordPatterns;
    selectors.submitButton = UNIVERSAL_AUTH_PATTERNS.submitPatterns;
    selectors.twoFactorField = UNIVERSAL_AUTH_PATTERNS.twoFactorPatterns;

    return {
      isLoginPage: confidence >= 50,
      selectors,
      confidence
    };
  }
}

// Singleton instance
export const universalSessionService = new UniversalSessionCaptureService();

// Helper to create mock sessions for testing
export function createMockSessions(profileId: string, count: number = 10): UniversalSession[] {
  const domains = [
    'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'github.com',
    'google.com', 'youtube.com', 'reddit.com', 'amazon.com', 'netflix.com',
    'spotify.com', 'discord.com', 'telegram.org', 'whatsapp.com', 'tiktok.com',
    'paypal.com', 'ebay.com', 'twitch.tv', 'microsoft.com', 'apple.com',
    'dropbox.com', 'notion.so', 'slack.com', 'zoom.us', 'trello.com'
  ];

  const sessions: UniversalSession[] = [];

  for (let i = 0; i < count; i++) {
    const domain = domains[i % domains.length];
    const session = universalSessionService.captureSession(
      profileId,
      `https://www.${domain}/`,
      {
        cookies: [
          {
            name: 'session_id',
            value: crypto.randomUUID(),
            domain: `.${domain}`,
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'Lax',
            size: 36
          },
          {
            name: 'auth_token',
            value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoke Math.floor(Date.now() / 1000) + 86400}}`,
            domain: `.${domain}`,
            path: '/',
            secure: true,
            httpOnly: false,
            sameSite: 'Lax',
            size: 150
          }
        ],
        localStorage: {
          'user_preferences': JSON.stringify({ theme: 'dark', language: 'ar' }),
          'auth_token': crypto.randomUUID(),
        },
        sessionStorage: {
          'temp_data': 'some_value'
        }
      }
    );
    sessions.push(session);
  }

  return sessions;
}
