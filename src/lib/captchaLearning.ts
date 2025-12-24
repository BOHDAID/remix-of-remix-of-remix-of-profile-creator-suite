// CAPTCHA Learning Service - Stores and learns from CAPTCHA solving attempts
import { supabase } from '@/integrations/supabase/client';

export interface CaptchaLearningEntry {
  id?: string;
  captcha_type: string;
  image_hash?: string;
  prompt?: string;
  solution: string;
  was_correct: boolean;
  confidence?: number;
  site_domain?: string;
  attempt_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LearningStats {
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  byType: Record<string, { total: number; success: number; rate: number }>;
}

class CaptchaLearningService {
  private cache: Map<string, CaptchaLearningEntry[]> = new Map();
  private isLoaded = false;

  // Simple hash function for images
  private async hashImage(imageBase64: string): Promise<string> {
    // Use a simple hash based on image data
    const data = imageBase64.slice(0, 1000); // Use first 1000 chars
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  // Record a CAPTCHA solving attempt
  async recordAttempt(entry: Omit<CaptchaLearningEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('captcha_learning')
        .insert({
          captcha_type: entry.captcha_type,
          image_hash: entry.image_hash,
          prompt: entry.prompt,
          solution: entry.solution,
          was_correct: entry.was_correct,
          confidence: entry.confidence,
          site_domain: entry.site_domain,
          attempt_count: entry.attempt_count || 1
        });

      if (error) {
        console.error('[CaptchaLearning] Failed to record attempt:', error);
        // Fallback to localStorage
        this.saveToLocalStorage(entry);
      } else {
        console.log('[CaptchaLearning] Attempt recorded successfully');
      }
    } catch (error) {
      console.error('[CaptchaLearning] Error recording attempt:', error);
      this.saveToLocalStorage(entry);
    }
  }

  // Mark an attempt as correct or incorrect
  async updateAttemptResult(id: string, wasCorrect: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('captcha_learning')
        .update({ was_correct: wasCorrect })
        .eq('id', id);

      if (error) {
        console.error('[CaptchaLearning] Failed to update result:', error);
      }
    } catch (error) {
      console.error('[CaptchaLearning] Error updating result:', error);
    }
  }

  // Get learning statistics
  async getStats(): Promise<LearningStats> {
    try {
      const { data, error } = await supabase
        .from('captcha_learning')
        .select('captcha_type, was_correct');

      if (error) {
        console.error('[CaptchaLearning] Failed to get stats:', error);
        return this.getLocalStats();
      }

      const stats: LearningStats = {
        totalAttempts: data?.length || 0,
        successfulAttempts: data?.filter(d => d.was_correct).length || 0,
        successRate: 0,
        byType: {}
      };

      if (stats.totalAttempts > 0) {
        stats.successRate = (stats.successfulAttempts / stats.totalAttempts) * 100;
      }

      // Group by type
      data?.forEach(entry => {
        if (!stats.byType[entry.captcha_type]) {
          stats.byType[entry.captcha_type] = { total: 0, success: 0, rate: 0 };
        }
        stats.byType[entry.captcha_type].total++;
        if (entry.was_correct) {
          stats.byType[entry.captcha_type].success++;
        }
      });

      // Calculate rates by type
      Object.keys(stats.byType).forEach(type => {
        const typeStats = stats.byType[type];
        typeStats.rate = typeStats.total > 0 ? (typeStats.success / typeStats.total) * 100 : 0;
      });

      return stats;
    } catch (error) {
      console.error('[CaptchaLearning] Error getting stats:', error);
      return this.getLocalStats();
    }
  }

  // Find similar previous solutions based on image hash or prompt
  async findSimilarSolutions(imageBase64?: string, prompt?: string, captchaType?: string): Promise<CaptchaLearningEntry[]> {
    try {
      let query = supabase
        .from('captcha_learning')
        .select('*')
        .eq('was_correct', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (captchaType) {
        query = query.eq('captcha_type', captchaType);
      }

      if (prompt) {
        query = query.ilike('prompt', `%${prompt}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CaptchaLearning] Failed to find similar:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[CaptchaLearning] Error finding similar:', error);
      return [];
    }
  }

  // Get success patterns for a specific CAPTCHA type
  async getSuccessPatterns(captchaType: string): Promise<{ solutions: string[]; commonPatterns: string[] }> {
    try {
      const { data, error } = await supabase
        .from('captcha_learning')
        .select('solution, prompt')
        .eq('captcha_type', captchaType)
        .eq('was_correct', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) {
        return { solutions: [], commonPatterns: [] };
      }

      const solutions = data.map(d => d.solution);
      const prompts = data.map(d => d.prompt).filter(Boolean) as string[];

      return {
        solutions,
        commonPatterns: [...new Set(prompts)]
      };
    } catch (error) {
      return { solutions: [], commonPatterns: [] };
    }
  }

  // Local storage fallback
  private saveToLocalStorage(entry: Omit<CaptchaLearningEntry, 'id' | 'created_at' | 'updated_at'>): void {
    try {
      const key = 'bhd_captcha_learning';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        ...entry,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      });
      // Keep only last 100 entries locally
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.error('[CaptchaLearning] LocalStorage save failed:', e);
    }
  }

  private getLocalStats(): LearningStats {
    try {
      const key = 'bhd_captcha_learning';
      const data = JSON.parse(localStorage.getItem(key) || '[]') as CaptchaLearningEntry[];
      
      const stats: LearningStats = {
        totalAttempts: data.length,
        successfulAttempts: data.filter(d => d.was_correct).length,
        successRate: 0,
        byType: {}
      };

      if (stats.totalAttempts > 0) {
        stats.successRate = (stats.successfulAttempts / stats.totalAttempts) * 100;
      }

      return stats;
    } catch {
      return { totalAttempts: 0, successfulAttempts: 0, successRate: 0, byType: {} };
    }
  }

  // Sync local data to database
  async syncLocalToDatabase(): Promise<number> {
    try {
      const key = 'bhd_captcha_learning';
      const localData = JSON.parse(localStorage.getItem(key) || '[]') as CaptchaLearningEntry[];
      
      if (localData.length === 0) return 0;

      const { error } = await supabase
        .from('captcha_learning')
        .insert(localData.map(entry => ({
          captcha_type: entry.captcha_type,
          image_hash: entry.image_hash,
          prompt: entry.prompt,
          solution: entry.solution,
          was_correct: entry.was_correct,
          confidence: entry.confidence,
          site_domain: entry.site_domain,
          attempt_count: entry.attempt_count || 1
        })));

      if (!error) {
        localStorage.removeItem(key);
        return localData.length;
      }
      
      return 0;
    } catch {
      return 0;
    }
  }
}

export const captchaLearning = new CaptchaLearningService();
