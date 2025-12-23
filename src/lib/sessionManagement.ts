/**
 * Authentication & Session Management System
 * نظام إدارة الجلسات والتوثيق
 */

export interface SavedSession {
  id: string;
  profileId: string;
  site: string;
  domain: string;
  credentials?: EncryptedCredentials;
  cookies: SessionCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  tokens: SessionToken[];
  lastUsed: Date;
  expiresAt: Date | null;
  status: 'active' | 'expired' | 'needs_refresh';
}

export interface EncryptedCredentials {
  username: string;
  encryptedPassword: string; // Base64 encoded encrypted password
  email?: string;
  phone?: string;
}

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface SessionToken {
  type: 'access' | 'refresh' | 'csrf' | 'jwt' | 'oauth';
  value: string;
  expiresAt: Date | null;
  refreshable: boolean;
}

export interface LoginPage {
  url: string;
  domain: string;
  fields: LoginField[];
  submitButton: ElementSelector;
  captcha?: CaptchaInfo;
  twoFactor?: TwoFactorInfo;
}

export interface LoginField {
  type: 'username' | 'email' | 'password' | 'phone' | 'otp' | 'remember';
  selector: ElementSelector;
  required: boolean;
  validation?: string;
}

export interface ElementSelector {
  // Multiple strategies for finding elements
  id?: string;
  name?: string;
  className?: string;
  xpath?: string;
  css?: string;
  text?: string;
  ariaLabel?: string;
}

export interface CaptchaInfo {
  type: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'image' | 'text' | 'unknown';
  siteKey?: string;
  selector?: ElementSelector;
}

export interface TwoFactorInfo {
  type: 'sms' | 'email' | 'authenticator' | 'backup_codes';
  inputSelector: ElementSelector;
}

// Known login page patterns
const LOGIN_PATTERNS = {
  'google.com': {
    emailField: { id: 'identifierId', type: 'email' as const },
    passwordField: { name: 'password', type: 'password' as const },
    nextButton: { id: 'identifierNext' },
    passwordButton: { id: 'passwordNext' },
  },
  'facebook.com': {
    emailField: { id: 'email', type: 'email' as const },
    passwordField: { id: 'pass', type: 'password' as const },
    submitButton: { name: 'login' },
  },
  'twitter.com': {
    emailField: { name: 'text', type: 'username' as const },
    passwordField: { name: 'password', type: 'password' as const },
  },
  'instagram.com': {
    emailField: { name: 'username', type: 'username' as const },
    passwordField: { name: 'password', type: 'password' as const },
  },
  'linkedin.com': {
    emailField: { id: 'username', type: 'email' as const },
    passwordField: { id: 'password', type: 'password' as const },
  },
};

// Session Manager
export class SessionManager {
  private sessions: Map<string, SavedSession> = new Map();
  
  // Save a session after successful login
  saveSession(session: SavedSession): void {
    const key = `${session.profileId}-${session.domain}`;
    this.sessions.set(key, session);
  }
  
  // Get session for a profile and domain
  getSession(profileId: string, domain: string): SavedSession | null {
    const key = `${profileId}-${domain}`;
    const session = this.sessions.get(key);
    
    if (!session) return null;
    
    // Check if expired
    if (session.expiresAt && new Date() > session.expiresAt) {
      session.status = 'expired';
    }
    
    // Check cookies expiration
    const hasValidCookies = session.cookies.some(c => 
      !c.expires || new Date(c.expires) > new Date()
    );
    
    if (!hasValidCookies) {
      session.status = 'needs_refresh';
    }
    
    return session;
  }
  
  // Get all sessions for a profile
  getProfileSessions(profileId: string): SavedSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.profileId === profileId
    );
  }
  
  // Check if session is valid
  isSessionValid(session: SavedSession): boolean {
    if (session.status === 'expired') return false;
    
    // Check token expiration
    const hasValidToken = session.tokens.some(t => 
      !t.expiresAt || new Date(t.expiresAt) > new Date()
    );
    
    // Check cookie expiration
    const hasValidCookie = session.cookies.some(c => 
      !c.expires || new Date(c.expires) > new Date()
    );
    
    return hasValidToken || hasValidCookie;
  }
  
  // Remove expired sessions
  cleanupExpiredSessions(): number {
    let removed = 0;
    
    this.sessions.forEach((session, key) => {
      if (!this.isSessionValid(session)) {
        this.sessions.delete(key);
        removed++;
      }
    });
    
    return removed;
  }
}

// Login Page Detector
export class LoginDetector {
  // Detect if current page is a login page
  detectLoginPage(url: string, html?: string): LoginPage | null {
    const domain = new URL(url).hostname.replace('www.', '');
    
    // Check known patterns first
    const knownPattern = Object.entries(LOGIN_PATTERNS).find(
      ([site]) => domain.includes(site)
    );
    
    if (knownPattern) {
      return this.buildLoginPageFromPattern(url, domain, knownPattern[1]);
    }
    
    // Try to detect from HTML if provided
    if (html) {
      return this.detectFromHTML(url, domain, html);
    }
    
    // Try to detect from URL patterns
    if (this.isLoginUrl(url)) {
      return {
        url,
        domain,
        fields: [
          { type: 'email', selector: { css: 'input[type="email"], input[name*="email"], input[name*="user"]' }, required: true },
          { type: 'password', selector: { css: 'input[type="password"]' }, required: true },
        ],
        submitButton: { css: 'button[type="submit"], input[type="submit"]' },
      };
    }
    
    return null;
  }
  
  private isLoginUrl(url: string): boolean {
    const loginIndicators = [
      '/login', '/signin', '/sign-in', '/auth', '/authenticate',
      '/account/login', '/user/login', '/session/new', '/logon'
    ];
    
    const urlLower = url.toLowerCase();
    return loginIndicators.some(ind => urlLower.includes(ind));
  }
  
  private buildLoginPageFromPattern(url: string, domain: string, pattern: any): LoginPage {
    const fields: LoginField[] = [];
    
    if (pattern.emailField) {
      fields.push({
        type: pattern.emailField.type,
        selector: pattern.emailField,
        required: true,
      });
    }
    
    if (pattern.passwordField) {
      fields.push({
        type: 'password',
        selector: pattern.passwordField,
        required: true,
      });
    }
    
    return {
      url,
      domain,
      fields,
      submitButton: pattern.submitButton || pattern.nextButton || { css: 'button[type="submit"]' },
    };
  }
  
  private detectFromHTML(url: string, domain: string, html: string): LoginPage | null {
    const fields: LoginField[] = [];
    
    // Simple regex-based detection
    const hasPasswordField = /<input[^>]*type=["']password["'][^>]*>/i.test(html);
    const hasEmailField = /<input[^>]*type=["']email["'][^>]*>/i.test(html) ||
                         /<input[^>]*name=["'][^"']*email[^"']*["'][^>]*>/i.test(html);
    const hasUsernameField = /<input[^>]*name=["'][^"']*user[^"']*["'][^>]*>/i.test(html);
    
    if (!hasPasswordField) return null;
    
    if (hasEmailField) {
      fields.push({
        type: 'email',
        selector: { css: 'input[type="email"], input[name*="email"]' },
        required: true,
      });
    } else if (hasUsernameField) {
      fields.push({
        type: 'username',
        selector: { css: 'input[name*="user"], input[name*="login"]' },
        required: true,
      });
    }
    
    fields.push({
      type: 'password',
      selector: { css: 'input[type="password"]' },
      required: true,
    });
    
    // Detect captcha
    let captcha: CaptchaInfo | undefined;
    if (html.includes('g-recaptcha') || html.includes('recaptcha')) {
      const siteKeyMatch = html.match(/data-sitekey=["']([^"']+)["']/);
      captcha = {
        type: 'recaptcha_v2',
        siteKey: siteKeyMatch?.[1],
        selector: { css: '.g-recaptcha, [data-sitekey]' },
      };
    } else if (html.includes('hcaptcha')) {
      captcha = {
        type: 'hcaptcha',
        selector: { css: '.h-captcha' },
      };
    }
    
    return {
      url,
      domain,
      fields,
      submitButton: { css: 'button[type="submit"], input[type="submit"], button:contains("login"), button:contains("sign in")' },
      captcha,
    };
  }
}

// Session Keeper - monitors and refreshes sessions
export class SessionKeeper {
  private manager: SessionManager;
  private checkInterval: number | null = null;
  
  constructor(manager: SessionManager) {
    this.manager = manager;
  }
  
  start(intervalMs: number = 60000): void {
    this.checkInterval = window.setInterval(() => {
      this.checkAllSessions();
    }, intervalMs);
  }
  
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  private checkAllSessions(): void {
    const allSessions = Array.from(this.manager['sessions'].values());
    
    allSessions.forEach(session => {
      if (session.status === 'needs_refresh') {
        this.attemptRefresh(session);
      }
    });
  }
  
  private async attemptRefresh(session: SavedSession): Promise<boolean> {
    console.log(`Attempting to refresh session for ${session.domain}`);
    
    // Check for refresh token
    const refreshToken = session.tokens.find(t => t.type === 'refresh');
    if (refreshToken && refreshToken.refreshable) {
      // In real implementation: call refresh endpoint
      return true;
    }
    
    // Check for cookies that can refresh
    const sessionCookies = session.cookies.filter(
      c => c.name.toLowerCase().includes('session') || 
           c.name.toLowerCase().includes('auth')
    );
    
    if (sessionCookies.length > 0) {
      // Session might still be valid server-side
      return true;
    }
    
    // Need re-authentication
    session.status = 'expired';
    return false;
  }
}

// Singleton instances
export const sessionManager = new SessionManager();
export const loginDetector = new LoginDetector();
export const sessionKeeper = new SessionKeeper(sessionManager);
