/**
 * Behavioral Simulation System
 * نظام محاكاة السلوك البشري
 */

export interface BehavioralSimulation {
  profileId: string;
  isActive: boolean;
  currentPattern: BehaviorPattern;
  memory: BehavioralMemory;
  socialGraph: SocialGraph;
}

export interface BehaviorPattern {
  // Typing simulation
  typing: {
    wpm: number; // Words per minute
    errorRate: number; // 0-1
    correctionRate: number; // How often mistakes are corrected
    pauseBetweenWords: { min: number; max: number };
    burstTyping: boolean; // Type in bursts or steady
  };
  
  // Mouse movement simulation
  mouse: {
    speed: number; // pixels per second
    acceleration: number;
    jitter: number; // Random movement noise
    curvature: number; // How curved the paths are (0 = straight, 1 = very curved)
    overshoot: number; // How often to overshoot target
  };
  
  // Scrolling behavior
  scroll: {
    speed: number;
    pattern: 'smooth' | 'stepped' | 'variable';
    readingSpeed: number; // How fast they "read" content
    pauseOnContent: boolean;
  };
  
  // Click behavior
  click: {
    doubleClickSpeed: number;
    holdDuration: { min: number; max: number };
    missRate: number; // How often to slightly miss and correct
  };
}

export interface BehavioralMemory {
  // Short-term memory (current session)
  shortTerm: {
    visitedUrls: string[];
    recentActions: BehaviorAction[];
    sessionStart: Date;
    currentIntent: string | null;
  };
  
  // Long-term memory (persistent)
  longTerm: {
    favoritesSites: string[];
    loginHistory: LoginRecord[];
    browsingPatterns: BrowsingPattern[];
    totalSessions: number;
    averageSessionDuration: number;
  };
}

export interface BehaviorAction {
  type: 'click' | 'scroll' | 'type' | 'navigate' | 'wait' | 'read';
  timestamp: Date;
  target?: string;
  value?: string;
  duration?: number;
}

export interface LoginRecord {
  site: string;
  lastLogin: Date;
  loginCount: number;
  savedCredentials: boolean;
}

export interface BrowsingPattern {
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  typicalDuration: number;
  commonSites: string[];
}

export interface SocialGraph {
  // Simulates realistic browsing patterns between related sites
  nodes: SocialGraphNode[];
  edges: SocialGraphEdge[];
}

export interface SocialGraphNode {
  url: string;
  category: string;
  visitFrequency: number;
  avgTimeSpent: number;
}

export interface SocialGraphEdge {
  from: string;
  to: string;
  probability: number; // 0-1, likelihood of visiting 'to' after 'from'
}

// Behavioral Pattern Generator
export function generateBehaviorPattern(): BehaviorPattern {
  return {
    typing: {
      wpm: 40 + Math.random() * 60, // 40-100 WPM
      errorRate: 0.02 + Math.random() * 0.05, // 2-7% errors
      correctionRate: 0.7 + Math.random() * 0.25, // 70-95% corrections
      pauseBetweenWords: { min: 50, max: 200 + Math.random() * 200 },
      burstTyping: Math.random() > 0.5,
    },
    mouse: {
      speed: 300 + Math.random() * 500, // 300-800 px/s
      acceleration: 0.5 + Math.random() * 0.5,
      jitter: 1 + Math.random() * 3,
      curvature: 0.2 + Math.random() * 0.5,
      overshoot: 0.05 + Math.random() * 0.1,
    },
    scroll: {
      speed: 100 + Math.random() * 200,
      pattern: ['smooth', 'stepped', 'variable'][Math.floor(Math.random() * 3)] as any,
      readingSpeed: 200 + Math.random() * 100, // words per minute
      pauseOnContent: Math.random() > 0.3,
    },
    click: {
      doubleClickSpeed: 200 + Math.random() * 200,
      holdDuration: { min: 50, max: 150 + Math.random() * 100 },
      missRate: 0.02 + Math.random() * 0.05,
    },
  };
}

// Generate realistic social graph for browsing
export function generateSocialGraph(seed: string): SocialGraph {
  const categories = [
    { name: 'social', sites: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com'] },
    { name: 'email', sites: ['gmail.com', 'outlook.com', 'yahoo.com'] },
    { name: 'search', sites: ['google.com', 'bing.com', 'duckduckgo.com'] },
    { name: 'news', sites: ['cnn.com', 'bbc.com', 'reuters.com'] },
    { name: 'shopping', sites: ['amazon.com', 'ebay.com', 'aliexpress.com'] },
    { name: 'entertainment', sites: ['youtube.com', 'netflix.com', 'twitch.tv'] },
  ];
  
  const nodes: SocialGraphNode[] = [];
  const edges: SocialGraphEdge[] = [];
  
  // Generate nodes
  categories.forEach(cat => {
    cat.sites.forEach(site => {
      nodes.push({
        url: site,
        category: cat.name,
        visitFrequency: Math.random() * 10,
        avgTimeSpent: 60 + Math.random() * 300, // 1-6 minutes
      });
    });
  });
  
  // Generate edges (transitions between sites)
  nodes.forEach(from => {
    nodes.forEach(to => {
      if (from.url !== to.url) {
        // Higher probability for same category
        let prob = from.category === to.category ? 0.3 : 0.1;
        
        // Search engines lead to everything
        if (from.category === 'search') prob = 0.2;
        
        // Social leads to social
        if (from.category === 'social' && to.category === 'social') prob = 0.4;
        
        if (Math.random() < 0.3) { // Only add some edges
          edges.push({
            from: from.url,
            to: to.url,
            probability: prob * Math.random(),
          });
        }
      }
    });
  });
  
  return { nodes, edges };
}

// Simulate human-like typing
export async function simulateTyping(
  text: string,
  pattern: BehaviorPattern['typing'],
  onChar: (char: string) => void
): Promise<void> {
  const avgCharTime = 60000 / (pattern.wpm * 5); // Average time per character
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Random variation in typing speed
    const variation = 0.5 + Math.random();
    let delay = avgCharTime * variation;
    
    // Longer pause after punctuation
    if (['.', ',', '!', '?'].includes(char)) {
      delay *= 2;
    }
    
    // Longer pause between words
    if (char === ' ') {
      delay = pattern.pauseBetweenWords.min + 
              Math.random() * (pattern.pauseBetweenWords.max - pattern.pauseBetweenWords.min);
    }
    
    // Simulate typo and correction
    if (Math.random() < pattern.errorRate) {
      const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
      onChar(wrongChar);
      await sleep(delay / 2);
      
      if (Math.random() < pattern.correctionRate) {
        onChar('\b'); // Backspace
        await sleep(delay / 2);
        onChar(char);
      }
    } else {
      onChar(char);
    }
    
    await sleep(delay);
  }
}

// Simulate human-like mouse movement (Bezier curve)
export function generateMousePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  pattern: BehaviorPattern['mouse']
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const steps = Math.ceil(
    Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) / 10
  );
  
  // Generate control points for Bezier curve
  const cp1 = {
    x: from.x + (to.x - from.x) * 0.25 + (Math.random() - 0.5) * 100 * pattern.curvature,
    y: from.y + (to.y - from.y) * 0.25 + (Math.random() - 0.5) * 100 * pattern.curvature,
  };
  const cp2 = {
    x: from.x + (to.x - from.x) * 0.75 + (Math.random() - 0.5) * 100 * pattern.curvature,
    y: from.y + (to.y - from.y) * 0.75 + (Math.random() - 0.5) * 100 * pattern.curvature,
  };
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = bezierPoint(from, cp1, cp2, to, t);
    
    // Add jitter
    point.x += (Math.random() - 0.5) * pattern.jitter;
    point.y += (Math.random() - 0.5) * pattern.jitter;
    
    points.push(point);
  }
  
  // Overshoot simulation
  if (Math.random() < pattern.overshoot) {
    const overshootDistance = 5 + Math.random() * 15;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    points.push({
      x: to.x + (dx / length) * overshootDistance,
      y: to.y + (dy / length) * overshootDistance,
    });
    points.push(to); // Correct back
  }
  
  return points;
}

// Bezier curve calculation
function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Session continuation logic
export function shouldContinueSession(memory: BehavioralMemory): {
  continue: boolean;
  reason: string;
  suggestedAction?: string;
} {
  const now = new Date();
  const sessionDuration = now.getTime() - memory.shortTerm.sessionStart.getTime();
  const avgDuration = memory.longTerm.averageSessionDuration * 60000;
  
  // Check if session is too long
  if (sessionDuration > avgDuration * 1.5) {
    return {
      continue: false,
      reason: 'الجلسة أطول من المعتاد',
      suggestedAction: 'إنهاء الجلسة والراحة',
    };
  }
  
  // Check recent activity
  const recentActions = memory.shortTerm.recentActions.filter(
    a => now.getTime() - a.timestamp.getTime() < 60000
  );
  
  if (recentActions.length === 0 && sessionDuration > 300000) { // 5 minutes idle
    return {
      continue: false,
      reason: 'فترة خمول طويلة',
      suggestedAction: 'استئناف النشاط أو إنهاء الجلسة',
    };
  }
  
  return {
    continue: true,
    reason: 'الجلسة طبيعية',
  };
}
