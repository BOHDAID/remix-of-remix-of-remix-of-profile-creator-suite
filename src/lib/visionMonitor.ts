// AI Vision Monitor - Screen Monitoring System with AI Eyes
import { captchaSolver } from './captchaSolver';

export interface ScreenCapture {
  id: string;
  timestamp: Date;
  imageData: string; // base64
  width: number;
  height: number;
  source: 'screen' | 'window' | 'browser';
}

export interface DetectedElement {
  id: string;
  type: 'button' | 'input' | 'link' | 'image' | 'text' | 'captcha' | 'popup' | 'form' | 'unknown';
  label: string;
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  actionable: boolean;
  suggestedAction?: string;
}

export interface AIAnalysisResult {
  id: string;
  timestamp: Date;
  captureId: string;
  elements: DetectedElement[];
  pageType: 'login' | 'form' | 'content' | 'captcha' | 'error' | 'success' | 'unknown';
  summary: string;
  threats: string[];
  opportunities: string[];
  suggestedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    target?: DetectedElement;
  }[];
}

export interface VisionMonitorConfig {
  enabled: boolean;
  autoCapture: boolean;
  captureInterval: number; // ms
  analyzeOnCapture: boolean;
  highlightElements: boolean;
  autoAct: boolean;
  focusAreas: ('captcha' | 'forms' | 'buttons' | 'errors' | 'all')[];
  sensitivity: 'low' | 'medium' | 'high';
}

export interface MonitorSession {
  id: string;
  profileId: string;
  startTime: Date;
  endTime?: Date;
  captures: ScreenCapture[];
  analyses: AIAnalysisResult[];
  actionsPerformed: number;
  isActive: boolean;
}

export interface VisionMonitorStats {
  totalCaptures: number;
  totalAnalyses: number;
  elementsDetected: number;
  actionsPerformed: number;
  captchasSeen: number;
  formsDetected: number;
  averageConfidence: number;
  sessionTime: number; // minutes
}

// AI Vision Monitor Class
class AIVisionMonitor {
  private config: VisionMonitorConfig;
  private stats: VisionMonitorStats;
  private sessions: Map<string, MonitorSession>;
  private captureHistory: ScreenCapture[];
  private analysisHistory: AIAnalysisResult[];
  private listeners: Set<(event: VisionEvent) => void>;
  private captureInterval: number | null = null;

  constructor() {
    this.config = {
      enabled: false,
      autoCapture: true,
      captureInterval: 2000,
      analyzeOnCapture: true,
      highlightElements: true,
      autoAct: false,
      focusAreas: ['all'],
      sensitivity: 'medium',
    };

    this.stats = {
      totalCaptures: 0,
      totalAnalyses: 0,
      elementsDetected: 0,
      actionsPerformed: 0,
      captchasSeen: 0,
      formsDetected: 0,
      averageConfidence: 0,
      sessionTime: 0,
    };

    this.sessions = new Map();
    this.captureHistory = [];
    this.analysisHistory = [];
    this.listeners = new Set();

    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem('vision_monitor_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      
      const savedStats = localStorage.getItem('vision_monitor_stats');
      if (savedStats) {
        this.stats = { ...this.stats, ...JSON.parse(savedStats) };
      }
    } catch (e) {
      console.error('Failed to load vision monitor data:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('vision_monitor_config', JSON.stringify(this.config));
      localStorage.setItem('vision_monitor_stats', JSON.stringify(this.stats));
    } catch (e) {
      console.error('Failed to save vision monitor data:', e);
    }
  }

  // Start monitoring session for a profile
  startSession(profileId: string): MonitorSession {
    const session: MonitorSession = {
      id: `session_${Date.now()}`,
      profileId,
      startTime: new Date(),
      captures: [],
      analyses: [],
      actionsPerformed: 0,
      isActive: true,
    };

    this.sessions.set(profileId, session);
    
    if (this.config.autoCapture && this.config.enabled) {
      this.startAutoCapture(profileId);
    }

    this.emit({ type: 'session_started', session, profileId });
    return session;
  }

  stopSession(profileId: string) {
    const session = this.sessions.get(profileId);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      this.stats.sessionTime += (session.endTime.getTime() - session.startTime.getTime()) / 60000;
      this.emit({ type: 'session_stopped', session, profileId });
    }
    this.stopAutoCapture();
    this.sessions.delete(profileId);
    this.saveToStorage();
  }

  private startAutoCapture(profileId: string) {
    if (this.captureInterval) return;
    
    this.captureInterval = window.setInterval(() => {
      this.captureScreen(profileId);
    }, this.config.captureInterval);
  }

  private stopAutoCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  // Capture current screen/window
  async captureScreen(profileId: string): Promise<ScreenCapture | null> {
    const session = this.sessions.get(profileId);
    if (!session || !session.isActive) return null;

    try {
      // Simulate screen capture (in real Electron app, this would use desktopCapturer)
      const capture: ScreenCapture = {
        id: `capture_${Date.now()}`,
        timestamp: new Date(),
        imageData: await this.getScreenshot(),
        width: window.innerWidth,
        height: window.innerHeight,
        source: 'browser',
      };

      session.captures.push(capture);
      this.captureHistory.push(capture);
      this.stats.totalCaptures++;

      // Keep only last 50 captures in history
      if (this.captureHistory.length > 50) {
        this.captureHistory.shift();
      }

      this.emit({ type: 'capture', capture, profileId });

      // Auto analyze if enabled
      if (this.config.analyzeOnCapture) {
        await this.analyzeCapture(profileId, capture);
      }

      this.saveToStorage();
      return capture;
    } catch (error) {
      console.error('Screen capture failed:', error);
      return null;
    }
  }

  private async getScreenshot(): Promise<string> {
    // In real implementation, this would use Electron's desktopCapturer
    // For now, return a placeholder
    return 'data:image/png;base64,PLACEHOLDER';
  }

  // Analyze captured screen with AI
  async analyzeCapture(profileId: string, capture: ScreenCapture): Promise<AIAnalysisResult | null> {
    const session = this.sessions.get(profileId);
    if (!session) return null;

    try {
      // Simulate AI analysis (in real app, this would call AI vision model)
      const elements = this.detectElements();
      const pageType = this.detectPageType(elements);
      
      const analysis: AIAnalysisResult = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date(),
        captureId: capture.id,
        elements,
        pageType,
        summary: this.generateSummary(elements, pageType),
        threats: this.detectThreats(elements),
        opportunities: this.detectOpportunities(elements, pageType),
        suggestedActions: this.suggestActions(elements, pageType),
      };

      session.analyses.push(analysis);
      this.analysisHistory.push(analysis);
      this.stats.totalAnalyses++;
      this.stats.elementsDetected += elements.length;

      // Update specific stats
      if (pageType === 'captcha') this.stats.captchasSeen++;
      if (pageType === 'form' || pageType === 'login') this.stats.formsDetected++;

      // Update average confidence
      const avgConf = elements.reduce((sum, e) => sum + e.confidence, 0) / (elements.length || 1);
      this.stats.averageConfidence = (this.stats.averageConfidence + avgConf) / 2;

      this.emit({ type: 'analysis', analysis, profileId });

      // Auto act if enabled
      if (this.config.autoAct && analysis.suggestedActions.length > 0) {
        const highPriority = analysis.suggestedActions.filter(a => a.priority === 'high');
        if (highPriority.length > 0) {
          await this.executeAction(profileId, highPriority[0]);
        }
      }

      this.saveToStorage();
      return analysis;
    } catch (error) {
      console.error('Analysis failed:', error);
      return null;
    }
  }

  private detectElements(): DetectedElement[] {
    // Simulate element detection
    const elements: DetectedElement[] = [];
    
    // Look for common elements on the page
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    const links = document.querySelectorAll('a');
    const forms = document.querySelectorAll('form');
    
    buttons.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      elements.push({
        id: `btn_${i}`,
        type: 'button',
        label: btn.textContent || 'Button',
        confidence: 0.9 + Math.random() * 0.1,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        actionable: true,
        suggestedAction: 'click',
      });
    });

    inputs.forEach((input, i) => {
      const rect = input.getBoundingClientRect();
      elements.push({
        id: `input_${i}`,
        type: 'input',
        label: input.placeholder || input.name || 'Input',
        confidence: 0.85 + Math.random() * 0.15,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        actionable: true,
        suggestedAction: 'fill',
      });
    });

    // Check for CAPTCHA
    const captchaElements = document.querySelectorAll('[class*=\\\"captcha\\\"], iframe[src*=\\\"recaptcha\\\"], iframe[src*=\\\"hcaptcha\\\"]');
    captchaElements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      elements.push({
        id: `captcha_${i}`,
        type: 'captcha',
        label: 'CAPTCHA Detected',
        confidence: 0.95,
        bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        actionable: true,
        suggestedAction: 'solve',
      });
    });

    return elements;
  }

  private detectPageType(elements: DetectedElement[]): AIAnalysisResult['pageType'] {
    const hasCaptcha = elements.some(e => e.type === 'captcha');
    const hasForm = elements.some(e => e.type === 'input');
    const hasLoginIndicators = document.body.innerHTML.toLowerCase().includes('login') || 
                                document.body.innerHTML.toLowerCase().includes('password');
    
    if (hasCaptcha) return 'captcha';
    if (hasLoginIndicators && hasForm) return 'login';
    if (hasForm) return 'form';
    return 'content';
  }

  private generateSummary(elements: DetectedElement[], pageType: AIAnalysisResult['pageType']): string {
    const summaries: Record<string, string> = {
      captcha: `صفحة تحتوي على CAPTCHA - تم اكتشاف ${elements.filter(e => e.type === 'captcha').length} تحدي`,
      login: `صفحة تسجيل دخول - ${elements.filter(e => e.type === 'input').length} حقول إدخال`,
      form: `نموذج يحتوي على ${elements.filter(e => e.type === 'input').length} حقول و ${elements.filter(e => e.type === 'button').length} أزرار`,
      content: `صفحة محتوى عادية - ${elements.length} عنصر مكتشف`,
      error: 'صفحة خطأ - قد تحتاج إلى إعادة تحميل',
      success: 'تمت العملية بنجاح',
      unknown: `صفحة غير محددة - ${elements.length} عنصر`,
    };
    return summaries[pageType] || summaries.unknown;
  }

  private detectThreats(elements: DetectedElement[]): string[] {
    const threats: string[] = [];
    
    if (elements.some(e => e.type === 'captcha')) {
      threats.push('تم اكتشاف CAPTCHA - قد يتم حظر الوصول');
    }
    
    if (document.body.innerHTML.toLowerCase().includes('blocked') || 
        document.body.innerHTML.toLowerCase().includes('banned')) {
      threats.push('قد يكون الحساب محظوراً');
    }
    
    return threats;
  }

  private detectOpportunities(elements: DetectedElement[], pageType: AIAnalysisResult['pageType']): string[] {
    const opportunities: string[] = [];
    
    if (pageType === 'login') {
      opportunities.push('يمكن ملء بيانات تسجيل الدخول تلقائياً');
    }
    
    if (pageType === 'form') {
      opportunities.push('يمكن ملء النموذج تلقائياً');
    }
    
    const submitBtn = elements.find(e => e.type === 'button' && e.label.toLowerCase().includes('submit'));
    if (submitBtn) {
      opportunities.push('زر إرسال جاهز للضغط');
    }
    
    return opportunities;
  }

  private suggestActions(elements: DetectedElement[], pageType: AIAnalysisResult['pageType']): AIAnalysisResult['suggestedActions'] {
    const actions: AIAnalysisResult['suggestedActions'] = [];
    
    // High priority: CAPTCHA
    const captcha = elements.find(e => e.type === 'captcha');
    if (captcha) {
      actions.push({
        action: 'حل CAPTCHA تلقائياً',
        priority: 'high',
        target: captcha,
      });
    }
    
    // Medium priority: Forms
    const inputs = elements.filter(e => e.type === 'input');
    if (inputs.length > 0) {
      actions.push({
        action: 'ملء الحقول تلقائياً',
        priority: 'medium',
      });
    }
    
    // Low priority: Buttons
    const buttons = elements.filter(e => e.type === 'button');
    if (buttons.length > 0) {
      actions.push({
        action: 'الضغط على الزر الرئيسي',
        priority: 'low',
        target: buttons[0],
      });
    }
    
    return actions;
  }

  async executeAction(profileId: string, action: AIAnalysisResult['suggestedActions'][0]): Promise<boolean> {
    const session = this.sessions.get(profileId);
    if (!session) return false;

    try {
      this.emit({ type: 'action_started', action, profileId });
      
      // Check if this is a CAPTCHA solving action
      if (action.target?.type === 'captcha') {
        return await this.triggerCaptchaSolver(profileId, action.target);
      }
      
      // Simulate other action execution
      await new Promise(r => setTimeout(r, 500));
      
      session.actionsPerformed++;
      this.stats.actionsPerformed++;
      
      this.emit({ type: 'action_completed', action, profileId, success: true });
      this.saveToStorage();
      return true;
    } catch (error) {
      this.emit({ type: 'action_completed', action, profileId, success: false });
      return false;
    }
  }

  // Trigger CAPTCHA Solver when detected
  private async triggerCaptchaSolver(profileId: string, captchaElement: DetectedElement): Promise<boolean> {
    const session = this.sessions.get(profileId);
    if (!session) return false;

    try {
      // Start CAPTCHA solver session if not active
      let solverSession = captchaSolver.getSession(profileId);
      if (!solverSession) {
        solverSession = captchaSolver.startSession(profileId);
      }

      // Enable solver if disabled
      if (!captchaSolver.isEnabled()) {
        captchaSolver.setEnabled(true);
      }

      // Detect CAPTCHA type
      const captchaType = await captchaSolver.detectCaptcha(profileId);
      
      if (captchaType) {
        // Solve CAPTCHA
        const solved = await captchaSolver.solveCaptcha(profileId, captchaType);
        
        session.actionsPerformed++;
        this.stats.actionsPerformed++;
        
        this.emit({ 
          type: 'action_completed', 
          action: { action: 'حل CAPTCHA تلقائياً', priority: 'high', target: captchaElement },
          profileId, 
          success: solved 
        });

        // Emit special CAPTCHA solved event
        this.emit({
          type: 'captcha_solved',
          profileId,
          captchaType,
          success: solved,
        } as VisionEvent);
        
        this.saveToStorage();
        return solved;
      }
      
      return false;
    } catch (error) {
      console.error('CAPTCHA solver error:', error);
      this.emit({ 
        type: 'action_completed', 
        action: { action: 'حل CAPTCHA تلقائياً', priority: 'high', target: captchaElement },
        profileId, 
        success: false 
      });
      return false;
    }
  }

  // Event system
  private emit(event: VisionEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  subscribe(listener: (event: VisionEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Getters & Setters
  getConfig() { return { ...this.config }; }
  getStats() { return { ...this.stats }; }
  getSession(profileId: string) { return this.sessions.get(profileId); }
  getAllSessions() { return Array.from(this.sessions.values()); }
  getCaptureHistory() { return [...this.captureHistory]; }
  getAnalysisHistory() { return [...this.analysisHistory]; }

  updateConfig(updates: Partial<VisionMonitorConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.emit({ type: 'config_updated', config: this.config });
  }

  isEnabled() { return this.config.enabled; }
  
  setEnabled(enabled: boolean) {
    this.updateConfig({ enabled });
    if (!enabled) {
      this.stopAutoCapture();
    }
  }

  resetStats() {
    this.stats = {
      totalCaptures: 0,
      totalAnalyses: 0,
      elementsDetected: 0,
      actionsPerformed: 0,
      captchasSeen: 0,
      formsDetected: 0,
      averageConfidence: 0,
      sessionTime: 0,
    };
    this.captureHistory = [];
    this.analysisHistory = [];
    this.saveToStorage();
    this.emit({ type: 'stats_reset' });
  }
}

// Event types
export type VisionEvent = 
  | { type: 'session_started'; session: MonitorSession; profileId: string }
  | { type: 'session_stopped'; session: MonitorSession; profileId: string }
  | { type: 'capture'; capture: ScreenCapture; profileId: string }
  | { type: 'analysis'; analysis: AIAnalysisResult; profileId: string }
  | { type: 'action_started'; action: AIAnalysisResult['suggestedActions'][0]; profileId: string }
  | { type: 'action_completed'; action: AIAnalysisResult['suggestedActions'][0]; profileId: string; success: boolean }
  | { type: 'config_updated'; config: VisionMonitorConfig }
  | { type: 'stats_reset' }
  | { type: 'captcha_solved'; profileId: string; captchaType: string; success: boolean };

// Singleton instance
export const visionMonitor = new AIVisionMonitor();

// Hook for React components
export function useVisionMonitor() {
  return visionMonitor;
}
