/**
 * Thermal Control & Self-Healing System
 * نظام التحكم بالحرارة والإصلاح التلقائي
 */

export interface ThermalState {
  profileId: string;
  temperature: number; // 0-100
  status: 'cold' | 'warm' | 'hot' | 'critical';
  lastActivity: Date | null;
  activityScore: number; // Actions per minute
  cooldownUntil: Date | null;
  warnings: ThermalWarning[];
}

export interface ThermalWarning {
  type: 'high_activity' | 'burst_detected' | 'no_breaks' | 'suspicious_pattern';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

export interface ActivityEvent {
  type: 'page_load' | 'click' | 'scroll' | 'form_submit' | 'navigation' | 'api_call';
  timestamp: Date;
  profileId: string;
  metadata?: Record<string, any>;
}

export interface SelfHealingEvent {
  id: string;
  profileId: string;
  timestamp: Date;
  issue: SelfHealingIssue;
  action: SelfHealingAction;
  result: 'success' | 'failed' | 'pending';
  details: string;
}

export type SelfHealingIssue = 
  | 'extension_crashed'
  | 'vpn_disconnected'
  | 'session_expired'
  | 'proxy_failed'
  | 'captcha_detected'
  | 'rate_limited'
  | 'fingerprint_mismatch'
  | 'browser_frozen';

export type SelfHealingAction = 
  | 'restart_extension'
  | 'reconnect_vpn'
  | 'refresh_session'
  | 'switch_proxy'
  | 'pause_activity'
  | 'notify_user'
  | 'fix_fingerprint'
  | 'restart_browser';

// Thermal Manager
export class ThermalManager {
  private states: Map<string, ThermalState> = new Map();
  private activityLog: ActivityEvent[] = [];
  private readonly MAX_ACTIVITY_LOG = 1000;
  
  constructor() {
    // Start cooling cycle
    setInterval(() => this.coolDown(), 60000); // Every minute
  }
  
  getState(profileId: string): ThermalState {
    if (!this.states.has(profileId)) {
      this.states.set(profileId, this.createInitialState(profileId));
    }
    return this.states.get(profileId)!;
  }
  
  private createInitialState(profileId: string): ThermalState {
    return {
      profileId,
      temperature: 0,
      status: 'cold',
      lastActivity: null,
      activityScore: 0,
      cooldownUntil: null,
      warnings: [],
    };
  }
  
  recordActivity(event: ActivityEvent): void {
    this.activityLog.push(event);
    
    // Keep log size manageable
    if (this.activityLog.length > this.MAX_ACTIVITY_LOG) {
      this.activityLog = this.activityLog.slice(-this.MAX_ACTIVITY_LOG / 2);
    }
    
    // Update thermal state
    const state = this.getState(event.profileId);
    state.lastActivity = event.timestamp;
    
    // Calculate heat increase based on event type
    const heatMap: Record<ActivityEvent['type'], number> = {
      'page_load': 3,
      'click': 1,
      'scroll': 0.5,
      'form_submit': 5,
      'navigation': 2,
      'api_call': 4,
    };
    
    state.temperature = Math.min(100, state.temperature + heatMap[event.type]);
    
    // Calculate activity score (actions per minute)
    const recentActivity = this.activityLog.filter(
      e => e.profileId === event.profileId && 
           new Date().getTime() - e.timestamp.getTime() < 60000
    );
    state.activityScore = recentActivity.length;
    
    // Update status
    state.status = this.calculateStatus(state.temperature);
    
    // Check for warnings
    this.checkForWarnings(state);
    
    this.states.set(event.profileId, state);
  }
  
  private calculateStatus(temperature: number): ThermalState['status'] {
    if (temperature < 25) return 'cold';
    if (temperature < 50) return 'warm';
    if (temperature < 75) return 'hot';
    return 'critical';
  }
  
  private checkForWarnings(state: ThermalState): void {
    const now = new Date();
    
    // Check for burst activity
    if (state.activityScore > 30) {
      const existingWarning = state.warnings.find(
        w => w.type === 'burst_detected' && 
             now.getTime() - w.timestamp.getTime() < 300000
      );
      
      if (!existingWarning) {
        state.warnings.push({
          type: 'burst_detected',
          message: 'تم رصد نشاط مكثف - خطر الكشف',
          timestamp: now,
          severity: 'warning',
        });
      }
    }
    
    // Check for no breaks
    if (state.lastActivity) {
      const continuousActivity = this.activityLog.filter(
        e => e.profileId === state.profileId &&
             now.getTime() - e.timestamp.getTime() < 1800000 // 30 minutes
      );
      
      if (continuousActivity.length > 100) {
        state.warnings.push({
          type: 'no_breaks',
          message: 'نشاط مستمر بدون فترات راحة',
          timestamp: now,
          severity: 'info',
        });
      }
    }
    
    // Keep only recent warnings (last hour)
    state.warnings = state.warnings.filter(
      w => now.getTime() - w.timestamp.getTime() < 3600000
    );
  }
  
  private coolDown(): void {
    const now = new Date();
    
    this.states.forEach((state, profileId) => {
      // Cool down inactive profiles
      if (state.lastActivity) {
        const idleTime = now.getTime() - state.lastActivity.getTime();
        
        // Cool 1 degree per 30 seconds of inactivity
        const cooling = Math.floor(idleTime / 30000);
        state.temperature = Math.max(0, state.temperature - cooling);
        state.status = this.calculateStatus(state.temperature);
      }
      
      // Clear cooldown if expired
      if (state.cooldownUntil && now > state.cooldownUntil) {
        state.cooldownUntil = null;
      }
      
      this.states.set(profileId, state);
    });
  }
  
  enforceCooldown(profileId: string, minutes: number): void {
    const state = this.getState(profileId);
    state.cooldownUntil = new Date(Date.now() + minutes * 60000);
    state.warnings.push({
      type: 'high_activity',
      message: `تم فرض فترة تبريد ${minutes} دقيقة`,
      timestamp: new Date(),
      severity: 'critical',
    });
    this.states.set(profileId, state);
  }
  
  isCoolingDown(profileId: string): boolean {
    const state = this.getState(profileId);
    return state.cooldownUntil !== null && new Date() < state.cooldownUntil;
  }
  
  getRecommendedBreakTime(profileId: string): number {
    const state = this.getState(profileId);
    
    if (state.status === 'critical') return 30; // 30 minutes
    if (state.status === 'hot') return 15;
    if (state.status === 'warm') return 5;
    return 0;
  }
}

// Self-Healing Manager
export class SelfHealingManager {
  private events: SelfHealingEvent[] = [];
  private readonly issueHandlers: Map<SelfHealingIssue, SelfHealingAction[]> = new Map([
    ['extension_crashed', ['restart_extension', 'notify_user']],
    ['vpn_disconnected', ['reconnect_vpn', 'pause_activity']],
    ['session_expired', ['refresh_session', 'notify_user']],
    ['proxy_failed', ['switch_proxy', 'notify_user']],
    ['captcha_detected', ['pause_activity', 'notify_user']],
    ['rate_limited', ['pause_activity', 'notify_user']],
    ['fingerprint_mismatch', ['fix_fingerprint', 'notify_user']],
    ['browser_frozen', ['restart_browser', 'notify_user']],
  ]);
  
  async handleIssue(
    profileId: string, 
    issue: SelfHealingIssue
  ): Promise<SelfHealingEvent> {
    const actions = this.issueHandlers.get(issue) || ['notify_user'];
    const primaryAction = actions[0];
    
    const event: SelfHealingEvent = {
      id: crypto.randomUUID(),
      profileId,
      timestamp: new Date(),
      issue,
      action: primaryAction,
      result: 'pending',
      details: `Attempting to handle: ${issue}`,
    };
    
    try {
      await this.executeAction(profileId, primaryAction);
      event.result = 'success';
      event.details = `Successfully handled: ${issue}`;
    } catch (error) {
      event.result = 'failed';
      event.details = `Failed to handle: ${issue} - ${error}`;
      
      // Try secondary action
      if (actions.length > 1) {
        try {
          await this.executeAction(profileId, actions[1]);
          event.details += ` | Secondary action succeeded: ${actions[1]}`;
        } catch {
          // Secondary also failed
        }
      }
    }
    
    this.events.push(event);
    return event;
  }
  
  private async executeAction(profileId: string, action: SelfHealingAction): Promise<void> {
    console.log(`Self-Healing: Executing ${action} for profile ${profileId}`);
    
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (action) {
      case 'restart_extension':
        // In real implementation: restart the extension
        break;
      case 'reconnect_vpn':
        // In real implementation: reconnect VPN
        break;
      case 'refresh_session':
        // In real implementation: refresh cookies/session
        break;
      case 'switch_proxy':
        // In real implementation: switch to backup proxy
        break;
      case 'pause_activity':
        // In real implementation: pause all automation
        break;
      case 'fix_fingerprint':
        // In real implementation: fix fingerprint inconsistencies
        break;
      case 'restart_browser':
        // In real implementation: restart browser process
        break;
      case 'notify_user':
        // Notification will be handled by UI
        break;
    }
  }
  
  getEventsForProfile(profileId: string): SelfHealingEvent[] {
    return this.events.filter(e => e.profileId === profileId);
  }
  
  getAllEvents(): SelfHealingEvent[] {
    return this.events;
  }
}

// Singleton instances
export const thermalManager = new ThermalManager();
export const selfHealingManager = new SelfHealingManager();
