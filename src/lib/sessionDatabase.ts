// Session Database Service - Stores sessions in Supabase
import { supabase } from '@/integrations/supabase/client';
import { UniversalSession, LoginCredential } from './universalSessionCapture';

export interface DbSession {
  id: string;
  profile_id: string;
  domain: string;
  site_name: string;
  full_url?: string;
  cookies: any[];
  local_storage: Record<string, string>;
  session_storage: Record<string, string>;
  tokens: any[];
  headers: Record<string, string>;
  status: string;
  login_state: string;
  metadata: Record<string, any>;
  captured_at: string;
  expires_at?: string;
  last_used?: string;
}

export interface DbCredential {
  id: string;
  profile_id: string;
  domain: string;
  site_name: string;
  username?: string;
  email?: string;
  encrypted_password?: string;
  login_url?: string;
  auto_login: boolean;
  two_factor_enabled: boolean;
  selectors: Record<string, any>;
  custom_data: Record<string, any>;
  last_used?: string;
}

class SessionDatabaseService {
  // Save session to database
  async saveSession(session: UniversalSession): Promise<boolean> {
    try {
      const dbSession: Partial<DbSession> = {
        id: session.id,
        profile_id: session.profileId,
        domain: session.domain,
        site_name: session.siteName,
        full_url: session.fullUrl,
        cookies: session.cookies,
        local_storage: session.localStorage,
        session_storage: session.sessionStorage,
        tokens: session.tokens,
        headers: session.headers,
        status: session.status,
        login_state: session.loginState,
        metadata: session.metadata as any,
        captured_at: session.capturedAt.toISOString(),
        expires_at: session.expiresAt?.toISOString(),
        last_used: session.lastUsed?.toISOString()
      };

      const { error } = await supabase
        .from('saved_sessions')
        .upsert([dbSession] as any, { 
          onConflict: 'profile_id,domain',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('[SessionDB] Failed to save session:', error);
        return false;
      }

      console.log('[SessionDB] Session saved:', session.domain);
      return true;
    } catch (error) {
      console.error('[SessionDB] Error saving session:', error);
      return false;
    }
  }

  // Load all sessions from database
  async loadSessions(): Promise<UniversalSession[]> {
    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .select('*')
        .order('captured_at', { ascending: false });

      if (error) {
        console.error('[SessionDB] Failed to load sessions:', error);
        return [];
      }

      return (data || []).map(this.dbToUniversalSession);
    } catch (error) {
      console.error('[SessionDB] Error loading sessions:', error);
      return [];
    }
  }

  // Load sessions for a specific profile
  async loadProfileSessions(profileId: string): Promise<UniversalSession[]> {
    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .select('*')
        .eq('profile_id', profileId)
        .order('captured_at', { ascending: false });

      if (error) {
        console.error('[SessionDB] Failed to load profile sessions:', error);
        return [];
      }

      return (data || []).map(this.dbToUniversalSession);
    } catch (error) {
      console.error('[SessionDB] Error loading profile sessions:', error);
      return [];
    }
  }

  // Delete session from database
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('[SessionDB] Failed to delete session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SessionDB] Error deleting session:', error);
      return false;
    }
  }

  // Save credential to database
  async saveCredential(credential: LoginCredential): Promise<boolean> {
    try {
      const dbCredential: Partial<DbCredential> = {
        id: credential.id,
        profile_id: credential.profileId,
        domain: credential.domain,
        site_name: credential.siteName,
        username: credential.username,
        email: credential.email,
        encrypted_password: credential.encryptedPassword,
        login_url: credential.loginUrl,
        auto_login: credential.autoLogin,
        two_factor_enabled: credential.twoFactorEnabled,
        selectors: credential.selectors as any,
        custom_data: credential.customData,
        last_used: credential.lastUsed?.toISOString()
      };

      const { error } = await supabase
        .from('saved_credentials')
        .upsert([dbCredential] as any, {
          onConflict: 'profile_id,domain',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('[SessionDB] Failed to save credential:', error);
        return false;
      }

      console.log('[SessionDB] Credential saved:', credential.domain);
      return true;
    } catch (error) {
      console.error('[SessionDB] Error saving credential:', error);
      return false;
    }
  }

  // Load all credentials from database
  async loadCredentials(): Promise<LoginCredential[]> {
    try {
      const { data, error } = await supabase
        .from('saved_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[SessionDB] Failed to load credentials:', error);
        return [];
      }

      return (data || []).map(this.dbToLoginCredential);
    } catch (error) {
      console.error('[SessionDB] Error loading credentials:', error);
      return [];
    }
  }

  // Delete credential from database
  async deleteCredential(credentialId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) {
        console.error('[SessionDB] Failed to delete credential:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SessionDB] Error deleting credential:', error);
      return false;
    }
  }

  // Convert database record to UniversalSession
  private dbToUniversalSession(db: any): UniversalSession {
    return {
      id: db.id,
      profileId: db.profile_id,
      domain: db.domain,
      subdomain: '',
      fullUrl: db.full_url || `https://${db.domain}`,
      siteName: db.site_name,
      cookies: db.cookies || [],
      localStorage: db.local_storage || {},
      sessionStorage: db.session_storage || {},
      tokens: db.tokens || [],
      headers: db.headers || {},
      capturedAt: new Date(db.captured_at),
      expiresAt: db.expires_at ? new Date(db.expires_at) : undefined,
      lastUsed: db.last_used ? new Date(db.last_used) : undefined,
      status: db.status || 'active',
      loginState: db.login_state || 'unknown',
      autoRefresh: true,
      metadata: db.metadata || {
        userAgent: navigator.userAgent,
        browser: 'Chromium',
        os: 'Windows',
        deviceType: 'desktop',
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
    };
  }

  // Convert database record to LoginCredential
  private dbToLoginCredential(db: any): LoginCredential {
    return {
      id: db.id,
      profileId: db.profile_id,
      domain: db.domain,
      siteName: db.site_name,
      username: db.username || '',
      email: db.email,
      password: '', // Never stored in plain text
      encryptedPassword: db.encrypted_password || '',
      loginUrl: db.login_url || `https://${db.domain}/login`,
      autoLogin: db.auto_login,
      twoFactorEnabled: db.two_factor_enabled,
      selectors: db.selectors || {
        usernameField: [],
        passwordField: [],
        submitButton: []
      },
      customData: db.custom_data || {},
      savedAt: new Date(db.created_at),
      lastUsed: db.last_used ? new Date(db.last_used) : undefined,
      loginMethod: 'form'
    };
  }

  // Sync local sessions to database
  async syncFromLocalStorage(): Promise<{ sessions: number; credentials: number }> {
    let sessionCount = 0;
    let credentialCount = 0;

    try {
      // Sync sessions
      const localSessions = localStorage.getItem('bhd_universal_sessions');
      if (localSessions) {
        const sessions = JSON.parse(localSessions) as UniversalSession[];
        for (const session of sessions) {
          session.capturedAt = new Date(session.capturedAt);
          if (session.expiresAt) session.expiresAt = new Date(session.expiresAt);
          if (session.lastUsed) session.lastUsed = new Date(session.lastUsed);
          
          if (await this.saveSession(session)) {
            sessionCount++;
          }
        }
      }

      // Sync credentials
      const localCreds = localStorage.getItem('bhd_universal_credentials');
      if (localCreds) {
        const credentials = JSON.parse(localCreds) as LoginCredential[];
        for (const cred of credentials) {
          cred.savedAt = new Date(cred.savedAt);
          if (cred.lastUsed) cred.lastUsed = new Date(cred.lastUsed);
          
          if (await this.saveCredential(cred)) {
            credentialCount++;
          }
        }
      }

      console.log(`[SessionDB] Synced ${sessionCount} sessions and ${credentialCount} credentials`);
    } catch (error) {
      console.error('[SessionDB] Error syncing from localStorage:', error);
    }

    return { sessions: sessionCount, credentials: credentialCount };
  }
}

export const sessionDatabase = new SessionDatabaseService();
