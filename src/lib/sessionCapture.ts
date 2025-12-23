// Session Capture System - Captures cookies, tokens, and credentials automatically

export interface CapturedSession {
  id: string;
  profileId: string;
  domain: string;
  url: string;
  cookies: CapturedCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  tokens: CapturedToken[];
  capturedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

export interface CapturedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface CapturedToken {
  type: 'bearer' | 'jwt' | 'oauth' | 'session' | 'csrf' | 'refresh';
  name: string;
  value: string;
  expiresAt?: Date;
  source: 'cookie' | 'localStorage' | 'sessionStorage' | 'header';
}

export interface SavedCredential {
  id: string;
  profileId: string;
  domain: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  capturedAt: Date;
  lastUsed?: Date;
  autoLogin: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod?: '2fa_app' | 'sms' | 'email';
  loginUrl: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
}

// Known login selectors for popular sites
export const LOGIN_SELECTORS: Record<string, {
  username: string[];
  password: string[];
  submit: string[];
  twoFactor?: string[];
}> = {
  'facebook.com': {
    username: ['#email', 'input[name="email"]'],
    password: ['#pass', 'input[name="pass"]'],
    submit: ['button[name="login"]', 'button[type="submit"]'],
  },
  'twitter.com': {
    username: ['input[name="text"]', 'input[autocomplete="username"]'],
    password: ['input[name="password"]', 'input[type="password"]'],
    submit: ['div[role="button"][data-testid="LoginForm_Login_Button"]'],
  },
  'x.com': {
    username: ['input[name="text"]', 'input[autocomplete="username"]'],
    password: ['input[name="password"]', 'input[type="password"]'],
    submit: ['div[role="button"][data-testid="LoginForm_Login_Button"]'],
  },
  'instagram.com': {
    username: ['input[name="username"]'],
    password: ['input[name="password"]'],
    submit: ['button[type="submit"]'],
  },
  'google.com': {
    username: ['input[type="email"]', '#identifierId'],
    password: ['input[type="password"]', 'input[name="Passwd"]'],
    submit: ['#identifierNext', '#passwordNext', 'button[type="submit"]'],
    twoFactor: ['input[name="totpPin"]', 'input[type="tel"]'],
  },
  'gmail.com': {
    username: ['input[type="email"]', '#identifierId'],
    password: ['input[type="password"]', 'input[name="Passwd"]'],
    submit: ['#identifierNext', '#passwordNext'],
  },
  'linkedin.com': {
    username: ['#username', 'input[name="session_key"]'],
    password: ['#password', 'input[name="session_password"]'],
    submit: ['button[type="submit"]'],
  },
  'telegram.org': {
    username: ['input[name="phone"]', 'input[type="tel"]'],
    password: ['input[name="password"]'],
    submit: ['button[type="submit"]'],
    twoFactor: ['input[name="code"]'],
  },
  'discord.com': {
    username: ['input[name="email"]'],
    password: ['input[name="password"]'],
    submit: ['button[type="submit"]'],
    twoFactor: ['input[placeholder*="code"]'],
  },
  'github.com': {
    username: ['input[name="login"]', '#login_field'],
    password: ['input[name="password"]', '#password'],
    submit: ['input[type="submit"]', 'button[type="submit"]'],
    twoFactor: ['input[name="otp"]'],
  },
  'amazon.com': {
    username: ['input[name="email"]', '#ap_email'],
    password: ['input[name="password"]', '#ap_password'],
    submit: ['#signInSubmit', 'input[type="submit"]'],
  },
  'netflix.com': {
    username: ['input[name="userLoginId"]'],
    password: ['input[name="password"]'],
    submit: ['button[type="submit"]'],
  },
  'tiktok.com': {
    username: ['input[name="username"]', 'input[placeholder*="phone"]'],
    password: ['input[type="password"]'],
    submit: ['button[type="submit"]'],
  },
  'reddit.com': {
    username: ['input[name="username"]'],
    password: ['input[name="password"]'],
    submit: ['button[type="submit"]'],
  },
  'twitch.tv': {
    username: ['input[id="login-username"]'],
    password: ['input[id="password-input"]'],
    submit: ['button[data-a-target="passport-login-button"]'],
  },
  'paypal.com': {
    username: ['input[name="login_email"]', '#email'],
    password: ['input[name="login_password"]', '#password'],
    submit: ['button[type="submit"]', '#btnLogin'],
  },
  'ebay.com': {
    username: ['input[name="userid"]'],
    password: ['input[name="pass"]'],
    submit: ['button[type="submit"]'],
  },
  'spotify.com': {
    username: ['input[id="login-username"]'],
    password: ['input[id="login-password"]'],
    submit: ['button[id="login-button"]'],
  },
};

// Token patterns for detection
const TOKEN_PATTERNS = {
  jwt: /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
  bearer: /^Bearer\s+[\w-]+\.[\w-]+\.[\w-]+$/i,
  oauth: /^[a-zA-Z0-9_-]{20,}$/,
};

// Session cookie names by site
const SESSION_COOKIES: Record<string, string[]> = {
  'facebook.com': ['c_user', 'xs', 'datr', 'sb'],
  'twitter.com': ['auth_token', 'ct0', 'twid'],
  'x.com': ['auth_token', 'ct0', 'twid'],
  'instagram.com': ['sessionid', 'csrftoken', 'ds_user_id'],
  'google.com': ['SID', 'SSID', 'HSID', 'APISID', 'SAPISID'],
  'youtube.com': ['SID', 'SSID', 'LOGIN_INFO'],
  'linkedin.com': ['li_at', 'JSESSIONID'],
  'telegram.org': ['stel_ssid', 'stel_token'],
  'discord.com': ['token', '__dcfduid', '__sdcfduid'],
  'github.com': ['_gh_sess', 'user_session', 'logged_in'],
  'amazon.com': ['session-id', 'session-token', 'ubid-main'],
  'netflix.com': ['NetflixId', 'SecureNetflixId'],
  'tiktok.com': ['sessionid', 'sid_tt', 'uid_tt'],
  'reddit.com': ['reddit_session', 'token_v2'],
  'twitch.tv': ['auth-token', 'login', 'twilight-user'],
  'paypal.com': ['login_email', 'LANG', 'cookie_check'],
};

class SessionCaptureService {
  private capturedSessions: Map<string, CapturedSession> = new Map();
  private savedCredentials: Map<string, SavedCredential> = new Map();
  private listeners: ((session: CapturedSession) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const sessionsData = localStorage.getItem('bhd_captured_sessions');
      const credentialsData = localStorage.getItem('bhd_saved_credentials');
      
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as CapturedSession[];
        sessions.forEach(s => {
          s.capturedAt = new Date(s.capturedAt);
          if (s.expiresAt) s.expiresAt = new Date(s.expiresAt);
          this.capturedSessions.set(s.id, s);
        });
      }
      
      if (credentialsData) {
        const credentials = JSON.parse(credentialsData) as SavedCredential[];
        credentials.forEach(c => {
          c.capturedAt = new Date(c.capturedAt);
          if (c.lastUsed) c.lastUsed = new Date(c.lastUsed);
          this.savedCredentials.set(c.id, c);
        });
      }
    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('bhd_captured_sessions', JSON.stringify(Array.from(this.capturedSessions.values())));
      localStorage.setItem('bhd_saved_credentials', JSON.stringify(Array.from(this.savedCredentials.values())));
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
    }
  }

  // Capture session from a logged-in page
  captureSession(profileId: string, url: string, data: {
    cookies: CapturedCookie[];
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  }): CapturedSession {
    const domain = new URL(url).hostname.replace('www.', '');
    const tokens = this.extractTokens(data);
    
    const session: CapturedSession = {
      id: crypto.randomUUID(),
      profileId,
      domain,
      url,
      cookies: data.cookies,
      localStorage: data.localStorage,
      sessionStorage: data.sessionStorage,
      tokens,
      capturedAt: new Date(),
      expiresAt: this.calculateExpiry(tokens, data.cookies),
      status: 'active',
    };

    this.capturedSessions.set(session.id, session);
    this.saveToStorage();
    this.notifyListeners(session);
    
    return session;
  }

  // Extract tokens from captured data
  private extractTokens(data: {
    cookies: CapturedCookie[];
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  }): CapturedToken[] {
    const tokens: CapturedToken[] = [];
    
    // Check localStorage for tokens
    for (const [key, value] of Object.entries(data.localStorage)) {
      if (this.isToken(key, value)) {
        tokens.push({
          type: this.detectTokenType(value),
          name: key,
          value,
          source: 'localStorage',
        });
      }
    }
    
    // Check sessionStorage for tokens
    for (const [key, value] of Object.entries(data.sessionStorage)) {
      if (this.isToken(key, value)) {
        tokens.push({
          type: this.detectTokenType(value),
          name: key,
          value,
          source: 'sessionStorage',
        });
      }
    }
    
    // Check cookies for session tokens
    for (const cookie of data.cookies) {
      if (this.isSessionCookie(cookie.name, cookie.domain)) {
        tokens.push({
          type: 'session',
          name: cookie.name,
          value: cookie.value,
          expiresAt: cookie.expires,
          source: 'cookie',
        });
      }
    }
    
    return tokens;
  }

  private isToken(key: string, value: string): boolean {
    const tokenKeywords = ['token', 'auth', 'session', 'jwt', 'access', 'refresh', 'bearer', 'api_key', 'credential'];
    const keyLower = key.toLowerCase();
    
    if (tokenKeywords.some(kw => keyLower.includes(kw))) {
      return true;
    }
    
    // Check if value looks like a token
    if (TOKEN_PATTERNS.jwt.test(value) || value.length > 20) {
      return true;
    }
    
    return false;
  }

  private detectTokenType(value: string): CapturedToken['type'] {
    if (TOKEN_PATTERNS.jwt.test(value)) return 'jwt';
    if (value.toLowerCase().includes('refresh')) return 'refresh';
    return 'bearer';
  }

  private isSessionCookie(name: string, domain: string): boolean {
    const cleanDomain = domain.replace(/^\./, '');
    for (const [site, cookies] of Object.entries(SESSION_COOKIES)) {
      if (cleanDomain.includes(site) && cookies.includes(name)) {
        return true;
      }
    }
    return false;
  }

  private calculateExpiry(tokens: CapturedToken[], cookies: CapturedCookie[]): Date | undefined {
    const expiryDates: Date[] = [];
    
    // Get token expiry
    for (const token of tokens) {
      if (token.expiresAt) {
        expiryDates.push(token.expiresAt);
      }
      // Try to decode JWT expiry
      if (token.type === 'jwt' && TOKEN_PATTERNS.jwt.test(token.value)) {
        try {
          const payload = JSON.parse(atob(token.value.split('.')[1]));
          if (payload.exp) {
            expiryDates.push(new Date(payload.exp * 1000));
          }
        } catch {}
      }
    }
    
    // Get cookie expiry
    for (const cookie of cookies) {
      if (cookie.expires) {
        expiryDates.push(cookie.expires);
      }
    }
    
    // Return earliest expiry
    if (expiryDates.length > 0) {
      return new Date(Math.min(...expiryDates.map(d => d.getTime())));
    }
    
    // Default 30 days expiry
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // Save login credentials
  saveCredential(credential: Omit<SavedCredential, 'id' | 'capturedAt'>): SavedCredential {
    const saved: SavedCredential = {
      ...credential,
      id: crypto.randomUUID(),
      capturedAt: new Date(),
    };
    
    // Check for existing credential for same domain/profile
    const existingKey = Array.from(this.savedCredentials.entries()).find(
      ([, c]) => c.profileId === credential.profileId && c.domain === credential.domain
    )?.[0];
    
    if (existingKey) {
      this.savedCredentials.set(existingKey, { ...saved, id: existingKey });
    } else {
      this.savedCredentials.set(saved.id, saved);
    }
    
    this.saveToStorage();
    return saved;
  }

  // Get sessions for a profile
  getProfileSessions(profileId: string): CapturedSession[] {
    return Array.from(this.capturedSessions.values())
      .filter(s => s.profileId === profileId)
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  }

  // Get all sessions
  getAllSessions(): CapturedSession[] {
    return Array.from(this.capturedSessions.values())
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  }

  // Get session by domain
  getSessionByDomain(profileId: string, domain: string): CapturedSession | undefined {
    return Array.from(this.capturedSessions.values())
      .find(s => s.profileId === profileId && s.domain.includes(domain) && s.status === 'active');
  }

  // Get credentials for a profile
  getProfileCredentials(profileId: string): SavedCredential[] {
    return Array.from(this.savedCredentials.values())
      .filter(c => c.profileId === profileId);
  }

  // Get all credentials
  getAllCredentials(): SavedCredential[] {
    return Array.from(this.savedCredentials.values());
  }

  // Get credential by domain
  getCredentialByDomain(profileId: string, domain: string): SavedCredential | undefined {
    return Array.from(this.savedCredentials.values())
      .find(c => c.profileId === profileId && c.domain.includes(domain));
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    const deleted = this.capturedSessions.delete(sessionId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // Delete credential
  deleteCredential(credentialId: string): boolean {
    const deleted = this.savedCredentials.delete(credentialId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // Export session as JSON
  exportSession(sessionId: string): string {
    const session = this.capturedSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    return JSON.stringify(session, null, 2);
  }

  // Export all sessions for a profile
  exportProfileSessions(profileId: string): string {
    const sessions = this.getProfileSessions(profileId);
    return JSON.stringify(sessions, null, 2);
  }

  // Import session from JSON
  importSession(jsonData: string): CapturedSession {
    const session = JSON.parse(jsonData) as CapturedSession;
    session.id = crypto.randomUUID();
    session.capturedAt = new Date(session.capturedAt);
    if (session.expiresAt) session.expiresAt = new Date(session.expiresAt);
    this.capturedSessions.set(session.id, session);
    this.saveToStorage();
    return session;
  }

  // Get login selectors for a domain
  getLoginSelectors(domain: string): typeof LOGIN_SELECTORS[string] | null {
    const cleanDomain = domain.replace('www.', '');
    for (const [site, selectors] of Object.entries(LOGIN_SELECTORS)) {
      if (cleanDomain.includes(site)) {
        return selectors;
      }
    }
    return null;
  }

  // Subscribe to new session captures
  onSessionCaptured(callback: (session: CapturedSession) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(session: CapturedSession) {
    this.listeners.forEach(l => l(session));
  }

  // Check if session is valid
  isSessionValid(sessionId: string): boolean {
    const session = this.capturedSessions.get(sessionId);
    if (!session) return false;
    if (session.status !== 'active') return false;
    if (session.expiresAt && session.expiresAt < new Date()) {
      session.status = 'expired';
      this.saveToStorage();
      return false;
    }
    return true;
  }

  // Refresh session validity check
  refreshSessionStatus() {
    let changed = false;
    this.capturedSessions.forEach(session => {
      if (session.status === 'active' && session.expiresAt && session.expiresAt < new Date()) {
        session.status = 'expired';
        changed = true;
      }
    });
    if (changed) this.saveToStorage();
  }

  // Get session statistics
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    totalCredentials: number;
    uniqueDomains: number;
  } {
    const sessions = Array.from(this.capturedSessions.values());
    const credentials = Array.from(this.savedCredentials.values());
    const domains = new Set([...sessions.map(s => s.domain), ...credentials.map(c => c.domain)]);
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      expiredSessions: sessions.filter(s => s.status === 'expired').length,
      totalCredentials: credentials.length,
      uniqueDomains: domains.size,
    };
  }
}

// Singleton instance
export const sessionCaptureService = new SessionCaptureService();

// Auto-login script generator for Electron
export function generateAutoLoginScript(credential: SavedCredential): string {
  const selectors = LOGIN_SELECTORS[credential.domain] || {
    username: [credential.usernameSelector],
    password: [credential.passwordSelector],
    submit: [credential.submitSelector],
  };
  
  return `
    (async function autoLogin() {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      const findElement = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) return el;
        }
        return null;
      };
      
      // Wait for page to load
      await wait(1000);
      
      // Find and fill username
      const usernameField = findElement(${JSON.stringify(selectors.username)});
      if (usernameField) {
        usernameField.value = ${JSON.stringify(credential.username)};
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      await wait(500);
      
      // Find and fill password
      const passwordField = findElement(${JSON.stringify(selectors.password)});
      if (passwordField) {
        passwordField.value = ${JSON.stringify(credential.password)};
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      await wait(500);
      
      // Find and click submit
      const submitButton = findElement(${JSON.stringify(selectors.submit)});
      if (submitButton) {
        submitButton.click();
      }
      
      return { success: true };
    })();
  `;
}

// Cookie injection script for Electron
export function generateCookieInjectionScript(session: CapturedSession): string {
  return `
    (async function injectSession() {
      const cookies = ${JSON.stringify(session.cookies)};
      const localStorage = ${JSON.stringify(session.localStorage)};
      const sessionStorage = ${JSON.stringify(session.sessionStorage)};
      
      // Inject localStorage
      for (const [key, value] of Object.entries(localStorage)) {
        window.localStorage.setItem(key, value);
      }
      
      // Inject sessionStorage
      for (const [key, value] of Object.entries(sessionStorage)) {
        window.sessionStorage.setItem(key, value);
      }
      
      // Cookies are injected via Electron's session API
      return { success: true, cookiesCount: cookies.length };
    })();
  `;
}
