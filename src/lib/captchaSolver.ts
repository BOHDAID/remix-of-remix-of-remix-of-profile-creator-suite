// AI CAPTCHA Solver - Smart Learning System with Real AI

import { supabase } from '@/integrations/supabase/client';

export interface CaptchaAttempt {
  id: string;
  type: 'recaptcha-v2' | 'recaptcha-v3' | 'hcaptcha' | 'text' | 'image' | 'audio';
  timestamp: Date;
  success: boolean;
  timeToSolve: number; // ms
  errorType?: string;
  corrections?: number;
  solution?: string;
}

export interface CaptchaSolverStats {
  totalAttempts: number;
  successfulSolves: number;
  failedSolves: number;
  averageTime: number;
  successRate: number;
  learningProgress: number; // 0-100
  lastSolveTime?: Date;
  typeStats: Record<string, { success: number; failed: number }>;
}

export interface CaptchaSolverConfig {
  enabled: boolean;
  autoSolve: boolean;
  maxRetries: number;
  retryDelay: number; // ms
  learnFromErrors: boolean;
  confidenceThreshold: number; // 0-100
  supportedTypes: string[];
}

export interface SolverSession {
  profileId: string;
  isActive: boolean;
  startTime: Date;
  captchasSolved: number;
  currentCaptcha?: {
    type: string;
    detectedAt: Date;
    status: 'detecting' | 'solving' | 'verifying' | 'success' | 'failed';
  };
}

// Learning patterns storage
interface LearningPattern {
  pattern: string;
  successRate: number;
  attempts: number;
  lastUsed: Date;
}

// AI Solver Response
interface AISolverResponse {
  success: boolean;
  solution?: string;
  confidence?: number;
  error?: string;
}

// AI Solver Class
class AICaptchaSolver {
  private config: CaptchaSolverConfig;
  private stats: CaptchaSolverStats;
  private sessions: Map<string, SolverSession>;
  private learningPatterns: Map<string, LearningPattern>;
  private listeners: Set<(event: SolverEvent) => void>;

  constructor() {
    this.config = {
      enabled: false,
      autoSolve: true,
      maxRetries: 3,
      retryDelay: 1000,
      learnFromErrors: true,
      confidenceThreshold: 85,
      supportedTypes: ['recaptcha-v2', 'recaptcha-v3', 'hcaptcha', 'text', 'image'],
    };

    this.stats = {
      totalAttempts: 0,
      successfulSolves: 0,
      failedSolves: 0,
      averageTime: 0,
      successRate: 0,
      learningProgress: 0,
      typeStats: {},
    };

    this.sessions = new Map();
    this.learningPatterns = new Map();
    this.listeners = new Set();

    // Load saved data
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedStats = localStorage.getItem('captcha_solver_stats');
      if (savedStats) {
        this.stats = JSON.parse(savedStats);
      }

      const savedPatterns = localStorage.getItem('captcha_solver_patterns');
      if (savedPatterns) {
        const patterns = JSON.parse(savedPatterns);
        this.learningPatterns = new Map(patterns);
      }

      const savedConfig = localStorage.getItem('captcha_solver_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (e) {
      console.error('Failed to load CAPTCHA solver data:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('captcha_solver_stats', JSON.stringify(this.stats));
      localStorage.setItem('captcha_solver_patterns', JSON.stringify([...this.learningPatterns]));
      localStorage.setItem('captcha_solver_config', JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save CAPTCHA solver data:', e);
    }
  }

  // Start monitoring a profile
  startSession(profileId: string): SolverSession {
    const session: SolverSession = {
      profileId,
      isActive: true,
      startTime: new Date(),
      captchasSolved: 0,
    };

    this.sessions.set(profileId, session);
    this.emit({ type: 'session_started', profileId, session });
    return session;
  }

  // Stop monitoring
  stopSession(profileId: string) {
    const session = this.sessions.get(profileId);
    if (session) {
      session.isActive = false;
      this.emit({ type: 'session_stopped', profileId, session });
    }
    this.sessions.delete(profileId);
  }

  // Detect CAPTCHA on page
  async detectCaptcha(profileId: string): Promise<string | null> {
    const session = this.sessions.get(profileId);
    if (!session || !session.isActive) return null;

    // Simulated detection logic - in real implementation this would be in the browser extension
    const types = ['recaptcha-v2', 'hcaptcha', 'text', 'image'];
    const detectedType = types[Math.floor(Math.random() * types.length)];
    
    session.currentCaptcha = {
      type: detectedType,
      detectedAt: new Date(),
      status: 'detecting',
    };

    this.emit({ type: 'captcha_detected', profileId, captchaType: detectedType });
    return detectedType;
  }

  // Call Real AI to solve CAPTCHA image
  async solveWithAI(imageBase64: string, captchaType: string): Promise<AISolverResponse> {
    try {
      console.log(`Calling AI solver for ${captchaType} CAPTCHA...`);
      
      const { data, error } = await supabase.functions.invoke('solve-captcha', {
        body: { 
          imageBase64,
          captchaType 
        }
      });

      if (error) {
        console.error('AI solver error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log('AI solved CAPTCHA:', data.solution);
        return { 
          success: true, 
          solution: data.solution,
          confidence: data.confidence || 0.85
        };
      }

      return { success: false, error: data?.error || 'Unknown error' };
    } catch (e) {
      console.error('Failed to call AI solver:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  // Main solve function with real AI
  async solveCaptcha(profileId: string, captchaType: string, imageBase64?: string): Promise<{ success: boolean; solution?: string }> {
    const session = this.sessions.get(profileId);
    if (!session || !this.config.enabled) {
      return { success: false };
    }

    let attempt = 0;
    let solved = false;
    let solution: string | undefined;
    const startTime = Date.now();

    while (attempt < this.config.maxRetries && !solved) {
      attempt++;
      
      session.currentCaptcha = {
        type: captchaType,
        detectedAt: new Date(),
        status: 'solving',
      };

      this.emit({ type: 'solving_started', profileId, attempt, captchaType });

      // If we have an image, use real AI to solve
      if (imageBase64) {
        const result = await this.solveWithAI(imageBase64, captchaType);
        solved = result.success;
        solution = result.solution;
        
        if (!solved) {
          console.log(`AI attempt ${attempt} failed:`, result.error);
        }
      } else {
        // Fallback to simulation for types that don't need image (reCAPTCHA v3, etc.)
        const baseSuccessRate = this.getLearnedSuccessRate(captchaType);
        const successChance = baseSuccessRate + (this.stats.learningProgress / 2);
        solved = Math.random() * 100 < successChance;
      }

      if (!solved && attempt < this.config.maxRetries) {
        this.learnFromAttempt(captchaType, false);
        await this.delay(this.config.retryDelay * attempt);
        this.emit({ type: 'retry', profileId, attempt, captchaType });
      }
    }

    const endTime = Date.now();
    const timeToSolve = endTime - startTime;

    // Update stats
    this.updateStats(captchaType, solved, timeToSolve);
    
    // Learn from result
    this.learnFromAttempt(captchaType, solved);

    if (solved) {
      session.captchasSolved++;
      session.currentCaptcha!.status = 'success';
      this.emit({ type: 'solved', profileId, captchaType, timeToSolve, attempts: attempt, solution });
    } else {
      session.currentCaptcha!.status = 'failed';
      this.emit({ type: 'failed', profileId, captchaType, attempts: attempt });
    }

    this.saveToStorage();
    return { success: solved, solution };
  }

  // Direct solve without session (for manual testing)
  async solveImage(imageBase64: string, captchaType: string = 'text'): Promise<{ success: boolean; solution?: string; error?: string }> {
    if (!this.config.enabled) {
      return { success: false, error: 'CAPTCHA solver is disabled' };
    }

    const startTime = Date.now();
    const result = await this.solveWithAI(imageBase64, captchaType);
    const endTime = Date.now();
    const timeToSolve = endTime - startTime;

    // Update stats
    this.updateStats(captchaType, result.success, timeToSolve);
    this.learnFromAttempt(captchaType, result.success);
    this.saveToStorage();

    // Emit events
    if (result.success) {
      this.emit({ type: 'solved', profileId: 'manual', captchaType, timeToSolve, attempts: 1, solution: result.solution });
    } else {
      this.emit({ type: 'failed', profileId: 'manual', captchaType, attempts: 1 });
    }

    return {
      success: result.success,
      solution: result.solution,
      error: result.error
    };
  }

  // Learning algorithm
  private learnFromAttempt(captchaType: string, success: boolean) {
    if (!this.config.learnFromErrors) return;

    const patternKey = `pattern_${captchaType}`;
    const existing = this.learningPatterns.get(patternKey);

    if (existing) {
      existing.attempts++;
      existing.successRate = (existing.successRate * (existing.attempts - 1) + (success ? 100 : 0)) / existing.attempts;
      existing.lastUsed = new Date();
    } else {
      this.learningPatterns.set(patternKey, {
        pattern: captchaType,
        successRate: success ? 100 : 0,
        attempts: 1,
        lastUsed: new Date(),
      });
    }

    // Update overall learning progress
    const allPatterns = Array.from(this.learningPatterns.values());
    const avgSuccess = allPatterns.reduce((sum, p) => sum + p.successRate, 0) / allPatterns.length;
    const avgAttempts = allPatterns.reduce((sum, p) => sum + p.attempts, 0) / allPatterns.length;
    
    // Learning progress increases with more attempts and higher success rates
    this.stats.learningProgress = Math.min(100, (avgSuccess * 0.7) + (Math.min(avgAttempts, 50) * 0.6));
  }

  private getLearnedSuccessRate(captchaType: string): number {
    const patternKey = `pattern_${captchaType}`;
    const pattern = this.learningPatterns.get(patternKey);
    
    if (pattern && pattern.attempts >= 5) {
      return pattern.successRate;
    }
    
    // Default base rates
    const baseRates: Record<string, number> = {
      'text': 95,
      'image': 85,
      'recaptcha-v2': 80,
      'recaptcha-v3': 75,
      'hcaptcha': 78,
      'audio': 70,
    };
    
    return baseRates[captchaType] || 70;
  }

  private updateStats(captchaType: string, success: boolean, timeToSolve: number) {
    this.stats.totalAttempts++;
    
    if (success) {
      this.stats.successfulSolves++;
      this.stats.lastSolveTime = new Date();
    } else {
      this.stats.failedSolves++;
    }

    this.stats.successRate = (this.stats.successfulSolves / this.stats.totalAttempts) * 100;
    this.stats.averageTime = ((this.stats.averageTime * (this.stats.totalAttempts - 1)) + timeToSolve) / this.stats.totalAttempts;

    // Type-specific stats
    if (!this.stats.typeStats[captchaType]) {
      this.stats.typeStats[captchaType] = { success: 0, failed: 0 };
    }
    
    if (success) {
      this.stats.typeStats[captchaType].success++;
    } else {
      this.stats.typeStats[captchaType].failed++;
    }
  }

  // Event system
  private emit(event: SolverEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: SolverEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters
  getConfig() { return { ...this.config }; }
  getStats() { return { ...this.stats }; }
  getSession(profileId: string) { return this.sessions.get(profileId); }
  getAllSessions() { return Array.from(this.sessions.values()); }
  
  // Setters
  updateConfig(updates: Partial<CaptchaSolverConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.emit({ type: 'config_updated', config: this.config });
  }

  // Reset learning
  resetLearning() {
    this.learningPatterns.clear();
    this.stats = {
      totalAttempts: 0,
      successfulSolves: 0,
      failedSolves: 0,
      averageTime: 0,
      successRate: 0,
      learningProgress: 0,
      typeStats: {},
    };
    this.saveToStorage();
    this.emit({ type: 'learning_reset' });
  }

  isEnabled() { return this.config.enabled; }
  setEnabled(enabled: boolean) { this.updateConfig({ enabled }); }
}

// Event types
export type SolverEvent = 
  | { type: 'session_started'; profileId: string; session: SolverSession }
  | { type: 'session_stopped'; profileId: string; session: SolverSession }
  | { type: 'captcha_detected'; profileId: string; captchaType: string }
  | { type: 'solving_started'; profileId: string; attempt: number; captchaType: string }
  | { type: 'retry'; profileId: string; attempt: number; captchaType: string }
  | { type: 'solved'; profileId: string; captchaType: string; timeToSolve: number; attempts: number; solution?: string }
  | { type: 'failed'; profileId: string; captchaType: string; attempts: number }
  | { type: 'config_updated'; config: CaptchaSolverConfig }
  | { type: 'learning_reset' };

// Singleton instance
export const captchaSolver = new AICaptchaSolver();

// Hook for React components
export function useCaptchaSolver() {
  return captchaSolver;
}
