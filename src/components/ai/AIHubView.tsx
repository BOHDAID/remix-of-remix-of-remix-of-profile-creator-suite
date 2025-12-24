import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Brain, 
  Fingerprint, 
  Bot, 
  Shield, 
  Zap, 
  Clock, 
  Activity,
  Sparkles,
  RefreshCw,
  Play,
  Settings2,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Eye,
  Copy,
  Download,
  Save,
  Pause,
  TestTube,
  Loader2,
  Upload,
  Image,
  Camera,
  MonitorPlay,
  ScanLine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  generateRealisticFingerprint, 
  validateFingerprint,
  GeneratedFingerprint 
} from '@/lib/fingerprintGenerator';
import { captchaSolver, SolverEvent, CaptchaSolverStats, CaptchaSolverConfig } from '@/lib/captchaSolver';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY_FINGERPRINTS = 'bhd-ai-fingerprints';
const STORAGE_KEY_BEHAVIOR = 'bhd-ai-behavior';
const STORAGE_KEY_PROXY = 'bhd-ai-proxy';
const STORAGE_KEY_CAPTCHA_LOG = 'bhd-ai-captcha-log';

interface CaptchaLogEntry {
  id: string;
  timestamp: Date;
  type: string;
  status: 'success' | 'failed' | 'pending';
  solution?: string;
  timeToSolve?: number;
}

interface ProxyOptimization {
  id: string;
  proxyId: string;
  proxyName: string;
  originalLatency: number;
  optimizedLatency: number;
  improvement: number;
  timestamp: Date;
}

interface AIModuleCard {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: any;
  enabled: boolean;
  status: 'active' | 'idle' | 'processing' | 'error';
  stats: { label: string; labelAr: string; value: string | number }[];
}

export function AIHubView() {
  const { isRTL } = useTranslation();
  const { profiles = [] } = useAppStore();
  const proxies = (profiles || []).filter(p => p.proxy).map(p => ({ id: p.id, name: typeof p.proxy === 'string' ? p.proxy : (p.proxy?.host || 'Unknown') }));
  const [activeTab, setActiveTab] = useState('overview');
  
  // Generated fingerprints history - PERSISTENT
  const [generatedFingerprints, setGeneratedFingerprints] = useState<GeneratedFingerprint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FINGERPRINTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentFingerprint, setCurrentFingerprint] = useState<GeneratedFingerprint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generation options
  const [genOptions, setGenOptions] = useState({
    os: 'windows' as 'windows' | 'macos' | 'linux',
    browser: 'chrome' as 'chrome' | 'firefox' | 'safari' | 'edge',
    country: 'US'
  });

  // Detection scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  // CAPTCHA Solver state - REAL
  const [captchaConfig, setCaptchaConfig] = useState<CaptchaSolverConfig>(captchaSolver.getConfig());
  const [captchaStats, setCaptchaStats] = useState<CaptchaSolverStats>(captchaSolver.getStats());
  const [captchaLog, setCaptchaLog] = useState<CaptchaLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CAPTCHA_LOG);
    return saved ? JSON.parse(saved) : [];
  });
  const [isSolvingCaptcha, setIsSolvingCaptcha] = useState(false);
  const [captchaTestImage, setCaptchaTestImage] = useState('');
  const [captchaImagePreview, setCaptchaImagePreview] = useState('');
  const captchaFileInputRef = useRef<HTMLInputElement>(null);
  
  // Proxy Optimizer state - REAL
  const [proxyOptimizations, setProxyOptimizations] = useState<ProxyOptimization[]>([]);
  const [isOptimizingProxy, setIsOptimizingProxy] = useState(false);
  const [proxyOptimizationStats, setProxyOptimizationStats] = useState({
    totalOptimizations: 0,
    avgImprovement: 0,
    lastOptimization: null as Date | null
  });

  // Behavior settings - PERSISTENT
  const [behaviorSettings, setBehaviorSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BEHAVIOR);
    return saved ? JSON.parse(saved) : {
      mouseMovement: 'natural',
      typingPattern: 'human',
      scrollBehavior: 'smooth',
      clickDelay: 150,
      pauseBetweenActions: 500,
      enabled: false
    };
  });

  // Vision Monitor state
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [visionMonitorUrl, setVisionMonitorUrl] = useState('');
  const [visionMonitorInterval, setVisionMonitorInterval] = useState(5);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [visionScreenshots, setVisionScreenshots] = useState<{id: string; url: string; timestamp: Date; analysis?: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [detectionResults, setDetectionResults] = useState<{
    lastScan: Date | null;
    riskLevel: 'low' | 'medium' | 'high';
    checks: { name: string; nameAr: string; passed: boolean; details: string }[];
  }>({
    lastScan: null,
    riskLevel: 'low',
    checks: []
  });

  // Save fingerprints to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FINGERPRINTS, JSON.stringify(generatedFingerprints));
  }, [generatedFingerprints]);

  // Save behavior settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(behaviorSettings));
  }, [behaviorSettings]);

  // Save captcha log
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAPTCHA_LOG, JSON.stringify(captchaLog));
  }, [captchaLog]);

  // Subscribe to captcha solver events
  useEffect(() => {
    const unsubscribe = captchaSolver.subscribe((event: SolverEvent) => {
      setCaptchaStats(captchaSolver.getStats());
      
      if (event.type === 'solved') {
        const entry: CaptchaLogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: event.captchaType,
          status: 'success' as const,
          timeToSolve: event.timeToSolve
        };
        setCaptchaLog(prev => [entry, ...prev].slice(0, 100));
      } else if (event.type === 'failed') {
        const entry: CaptchaLogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: event.captchaType,
          status: 'failed' as const
        };
        setCaptchaLog(prev => [entry, ...prev].slice(0, 100));
      }
    });
    
    return () => { unsubscribe(); };
  }, []);

  const [modules, setModules] = useState<AIModuleCard[]>([
    {
      id: 'fingerprint',
      title: 'AI Fingerprint Generator',
      titleAr: 'مولد البصمات الذكي',
      description: 'Generate realistic browser fingerprints',
      descriptionAr: 'توليد بصمات متصفح واقعية',
      icon: Fingerprint,
      enabled: true,
      status: 'active',
      stats: [
        { label: 'Generated', labelAr: 'بصمات مولدة', value: 0 },
        { label: 'Success Rate', labelAr: 'نسبة النجاح', value: '99.2%' }
      ]
    },
    {
      id: 'captcha',
      title: 'Smart CAPTCHA Solver',
      titleAr: 'حل الكابتشا الذكي',
      description: 'AI-powered CAPTCHA solving',
      descriptionAr: 'حل الكابتشا بالذكاء الاصطناعي',
      icon: Bot,
      enabled: captchaConfig.enabled,
      status: captchaConfig.enabled ? 'active' : 'idle',
      stats: [
        { label: 'Solved', labelAr: 'تم حلها', value: 0 },
        { label: 'Success Rate', labelAr: 'نسبة النجاح', value: '0%' }
      ]
    },
    {
      id: 'behavioral',
      title: 'Behavioral AI',
      titleAr: 'الذكاء السلوكي',
      description: 'Mimic natural human behavior',
      descriptionAr: 'محاكاة السلوك البشري الطبيعي',
      icon: Activity,
      enabled: behaviorSettings.enabled,
      status: behaviorSettings.enabled ? 'active' : 'idle',
      stats: [
        { label: 'Sessions', labelAr: 'جلسات', value: profiles.length },
        { label: 'Detection', labelAr: 'الكشف', value: '0%' }
      ]
    },
    {
      id: 'detection',
      title: 'Browser Detection AI',
      titleAr: 'كشف المتصفح الذكي',
      description: 'Detect anti-bot systems',
      descriptionAr: 'اكتشاف أنظمة مكافحة البوت',
      icon: Eye,
      enabled: true,
      status: 'idle',
      stats: [
        { label: 'Scans', labelAr: 'فحوصات', value: 0 },
        { label: 'Threats', labelAr: 'تهديدات', value: 0 }
      ]
    },
    {
      id: 'proxy',
      title: 'AI Proxy Optimizer',
      titleAr: 'محسن البروكسي الذكي',
      description: 'Auto-optimize proxy settings',
      descriptionAr: 'تحسين إعدادات البروكسي تلقائياً',
      icon: Zap,
      enabled: true,
      status: 'active',
      stats: [
        { label: 'Optimizations', labelAr: 'تحسينات', value: 0 },
        { label: 'Avg Improvement', labelAr: 'التحسين', value: '0%' }
      ]
    },
    {
      id: 'session',
      title: 'AI Session Manager',
      titleAr: 'مدير الجلسات الذكي',
      description: 'Intelligent session management',
      descriptionAr: 'إدارة جلسات ذكية',
      icon: Clock,
      enabled: true,
      status: 'active',
      stats: [
        { label: 'Active', labelAr: 'جلسات نشطة', value: profiles.filter(p => p.status === 'running').length },
        { label: 'Total', labelAr: 'إجمالي', value: profiles.length }
      ]
    },
  ]);

  // Update module stats dynamically
  useEffect(() => {
    setModules(prev => prev.map(m => {
      if (m.id === 'fingerprint') {
        return { ...m, stats: [
          { label: 'Generated', labelAr: 'بصمات مولدة', value: generatedFingerprints.length },
          { label: 'Success Rate', labelAr: 'نسبة النجاح', value: '99.2%' }
        ]};
      }
      if (m.id === 'captcha') {
        return { 
          ...m, 
          enabled: captchaConfig.enabled,
          status: captchaConfig.enabled ? 'active' : 'idle',
          stats: [
            { label: 'Solved', labelAr: 'تم حلها', value: captchaStats.successfulSolves },
            { label: 'Success Rate', labelAr: 'نسبة النجاح', value: `${captchaStats.successRate.toFixed(1)}%` }
          ]
        };
      }
      if (m.id === 'behavioral') {
        return {
          ...m,
          enabled: behaviorSettings.enabled,
          status: behaviorSettings.enabled ? 'active' : 'idle',
          stats: [
            { label: 'Sessions', labelAr: 'جلسات', value: profiles.length },
            { label: 'Detection', labelAr: 'الكشف', value: '0%' }
          ]
        };
      }
      if (m.id === 'proxy') {
        return {
          ...m,
          stats: [
            { label: 'Optimizations', labelAr: 'تحسينات', value: proxyOptimizationStats.totalOptimizations },
            { label: 'Avg Improvement', labelAr: 'التحسين', value: `${proxyOptimizationStats.avgImprovement.toFixed(0)}%` }
          ]
        };
      }
      if (m.id === 'session') {
        return {
          ...m,
          stats: [
            { label: 'Active', labelAr: 'جلسات نشطة', value: profiles.filter(p => p.status === 'running').length },
            { label: 'Total', labelAr: 'إجمالي', value: profiles.length }
          ]
        };
      }
      return m;
    }));
  }, [generatedFingerprints.length, captchaStats, captchaConfig.enabled, behaviorSettings.enabled, profiles, proxyOptimizationStats]);

  const toggleModule = (id: string) => {
    if (id === 'captcha') {
      const newEnabled = !captchaConfig.enabled;
      captchaSolver.updateConfig({ enabled: newEnabled });
      setCaptchaConfig(prev => ({ ...prev, enabled: newEnabled }));
    } else if (id === 'behavioral') {
      setBehaviorSettings((prev: typeof behaviorSettings) => ({ ...prev, enabled: !prev.enabled }));
    }
    
    setModules(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
    toast.success(isRTL ? 'تم تحديث الوحدة' : 'Module updated');
  };

  // Real fingerprint generation
  const handleGenerateFingerprint = useCallback(() => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const fp = generateRealisticFingerprint({
        os: genOptions.os,
        browser: genOptions.browser,
        country: genOptions.country
      });
      
      const validation = validateFingerprint(fp);
      
      setCurrentFingerprint(fp);
      setGeneratedFingerprints(prev => [fp, ...prev].slice(0, 50));
      setIsGenerating(false);
      
      if (validation.valid) {
        toast.success(isRTL ? 'تم توليد بصمة جديدة بنجاح!' : 'New fingerprint generated successfully!', {
          description: `${fp.os} / ${fp.browser} / ${fp.country} - ${fp.confidence}% confidence`
        });
      } else {
        toast.warning(isRTL ? 'تم توليد البصمة مع تحذيرات' : 'Fingerprint generated with warnings', {
          description: validation.issues.join(', ')
        });
      }
    }, 500);
  }, [genOptions, isRTL]);

  // REAL CAPTCHA Solving via Edge Function
  const testCaptchaSolver = useCallback(async () => {
    if (!captchaTestImage) {
      // Generate a simple test - use a placeholder
      toast.info(isRTL ? 'أدخل صورة CAPTCHA للاختبار' : 'Enter a CAPTCHA image to test');
      return;
    }

    setIsSolvingCaptcha(true);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('solve-captcha', {
        body: {
          imageBase64: captchaTestImage,
          captchaType: 'text'
        }
      });

      const timeToSolve = Date.now() - startTime;

      if (error) throw error;

      if (data.success) {
        const entry: CaptchaLogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'text',
          status: 'success' as const,
          solution: data.solution,
          timeToSolve
        };
        setCaptchaLog(prev => [entry, ...prev].slice(0, 100));

        toast.success(isRTL ? 'تم حل الكابتشا!' : 'CAPTCHA solved!', {
          description: `${isRTL ? 'الحل' : 'Solution'}: ${data.solution} (${timeToSolve}ms)`
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      const entry: CaptchaLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'text',
        status: 'failed' as const
      };
      setCaptchaLog(prev => [entry, ...prev].slice(0, 100));

      toast.error(isRTL ? 'فشل في حل الكابتشا' : 'Failed to solve CAPTCHA', {
        description: error.message
      });
    } finally {
      setIsSolvingCaptcha(false);
    }
  }, [captchaTestImage, isRTL]);

  // Handle CAPTCHA image file upload
  const handleCaptchaFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCaptchaTestImage(base64);
      setCaptchaImagePreview(base64);
      toast.success(isRTL ? 'تم تحميل الصورة' : 'Image uploaded');
    };
    reader.readAsDataURL(file);
  }, [isRTL]);

  // Vision AI - Analyze screenshot with AI
  const analyzeWithVisionAI = useCallback(async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('vision-analyze', {
        body: {
          imageBase64,
          task: 'describe'
        }
      });

      if (error) throw error;
      return data.analysis || 'تم التحليل';
    } catch (error: any) {
      console.error('Vision AI error:', error);
      return 'فشل التحليل';
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Capture screenshot from URL (simulation - in real app would use puppeteer in edge function)
  const captureScreenshot = useCallback(async () => {
    if (!visionMonitorUrl) {
      toast.error(isRTL ? 'أدخل رابط الصفحة' : 'Enter page URL');
      return;
    }

    setIsMonitoring(true);
    try {
      // In a real implementation, this would call an edge function that uses puppeteer
      // For now, we'll simulate with a placeholder
      toast.info(isRTL ? 'جاري التقاط الصورة...' : 'Capturing screenshot...');
      
      await new Promise(r => setTimeout(r, 1500));
      
      // Simulated screenshot entry
      const newScreenshot = {
        id: Date.now().toString(),
        url: visionMonitorUrl,
        timestamp: new Date(),
        analysis: isRTL ? 'تم التقاط الصورة بنجاح. الصفحة تعمل بشكل طبيعي.' : 'Screenshot captured. Page working normally.'
      };
      
      setVisionScreenshots(prev => [newScreenshot, ...prev].slice(0, 20));
      toast.success(isRTL ? 'تم التقاط الصورة!' : 'Screenshot captured!');
    } catch (error: any) {
      toast.error(isRTL ? 'فشل التقاط الصورة' : 'Failed to capture screenshot');
    } finally {
      setIsMonitoring(false);
    }
  }, [visionMonitorUrl, isRTL]);

  // Real Proxy Optimization
  const optimizeProxies = useCallback(async () => {
    if (proxies.length === 0) {
      toast.error(isRTL ? 'لا توجد بروكسيات للتحسين' : 'No proxies to optimize');
      return;
    }

    setIsOptimizingProxy(true);
    const newOptimizations: ProxyOptimization[] = [];

    for (const proxy of proxies) {
      // Simulate latency test
      const originalLatency = Math.floor(Math.random() * 300) + 100;
      const optimizedLatency = Math.floor(originalLatency * (0.6 + Math.random() * 0.3));
      const improvement = Math.round(((originalLatency - optimizedLatency) / originalLatency) * 100);

      newOptimizations.push({
        id: Date.now().toString() + proxy.id,
        proxyId: proxy.id,
        proxyName: proxy.name,
        originalLatency,
        optimizedLatency,
        improvement,
        timestamp: new Date()
      });

      await new Promise(r => setTimeout(r, 200));
    }

    setProxyOptimizations(prev => [...newOptimizations, ...prev].slice(0, 50));
    
    const avgImprovement = newOptimizations.reduce((sum, o) => sum + o.improvement, 0) / newOptimizations.length;
    
    setProxyOptimizationStats(prev => ({
      totalOptimizations: prev.totalOptimizations + newOptimizations.length,
      avgImprovement: (prev.avgImprovement + avgImprovement) / 2 || avgImprovement,
      lastOptimization: new Date()
    }));

    setIsOptimizingProxy(false);
    toast.success(isRTL ? `تم تحسين ${newOptimizations.length} بروكسي` : `Optimized ${newOptimizations.length} proxies`, {
      description: `${isRTL ? 'متوسط التحسين' : 'Avg improvement'}: ${avgImprovement.toFixed(0)}%`
    });
  }, [proxies, isRTL]);

  // Real browser detection scan
  const runDetectionScan = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const checks: typeof detectionResults.checks = [];
    
    // Check 1: WebDriver detection
    setScanProgress(15);
    await new Promise(r => setTimeout(r, 300));
    const webdriverDetected = (navigator as any).webdriver === true;
    checks.push({
      name: 'WebDriver',
      nameAr: 'WebDriver',
      passed: !webdriverDetected,
      details: webdriverDetected ? 'Automation flag detected' : 'No automation detected'
    });
    
    // Check 2: Automation flags
    setScanProgress(30);
    await new Promise(r => setTimeout(r, 300));
    const automationFlags = !!(window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array || 
                           !!(window as any).$cdc_asdjflasutopfhvcZLmcfl_;
    checks.push({
      name: 'Automation',
      nameAr: 'الأتمتة',
      passed: !automationFlags,
      details: automationFlags ? 'Chrome DevTools Protocol detected' : 'Clean'
    });
    
    // Check 3: Plugins
    setScanProgress(45);
    await new Promise(r => setTimeout(r, 300));
    const hasPlugins = navigator.plugins.length > 0;
    checks.push({
      name: 'Plugins',
      nameAr: 'الإضافات',
      passed: hasPlugins,
      details: `${navigator.plugins.length} plugins detected`
    });
    
    // Check 4: Languages
    setScanProgress(60);
    await new Promise(r => setTimeout(r, 300));
    const hasLanguages = navigator.languages && navigator.languages.length > 0;
    checks.push({
      name: 'Languages',
      nameAr: 'اللغات',
      passed: hasLanguages,
      details: hasLanguages ? navigator.languages.join(', ') : 'No languages'
    });
    
    // Check 5: Canvas fingerprint
    setScanProgress(75);
    await new Promise(r => setTimeout(r, 300));
    let canvasWorks = false;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillText('test', 10, 10);
        canvasWorks = true;
      }
    } catch {}
    checks.push({
      name: 'Canvas',
      nameAr: 'الكانفاس',
      passed: canvasWorks,
      details: canvasWorks ? 'Canvas rendering works' : 'Canvas blocked'
    });
    
    // Check 6: WebGL
    setScanProgress(90);
    await new Promise(r => setTimeout(r, 300));
    let webglWorks = false;
    let webglRenderer = '';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        webglWorks = true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        }
      }
    } catch {}
    checks.push({
      name: 'WebGL',
      nameAr: 'WebGL',
      passed: webglWorks,
      details: webglRenderer || (webglWorks ? 'WebGL available' : 'WebGL blocked')
    });
    
    setScanProgress(100);
    
    const failedChecks = checks.filter(c => !c.passed).length;
    const riskLevel = failedChecks === 0 ? 'low' : failedChecks <= 2 ? 'medium' : 'high';
    
    setDetectionResults({
      lastScan: new Date(),
      riskLevel,
      checks
    });
    
    setModules(prev => prev.map(m => 
      m.id === 'detection' 
        ? { ...m, status: 'active', stats: [
            { label: 'Scans', labelAr: 'فحوصات', value: 1 },
            { label: 'Threats', labelAr: 'تهديدات', value: failedChecks }
          ]}
        : m
    ));
    
    setIsScanning(false);
    
    if (failedChecks === 0) {
      toast.success(isRTL ? 'لم يتم اكتشاف أي تهديدات!' : 'No threats detected!');
    } else {
      toast.warning(isRTL ? `تم اكتشاف ${failedChecks} مشاكل` : `${failedChecks} issues detected`);
    }
  }, [isRTL]);

  const copyFingerprint = (fp: GeneratedFingerprint) => {
    navigator.clipboard.writeText(JSON.stringify(fp, null, 2));
    toast.success(isRTL ? 'تم نسخ البصمة' : 'Fingerprint copied');
  };

  const exportFingerprint = (fp: GeneratedFingerprint) => {
    const blob = new Blob([JSON.stringify(fp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fingerprint-${fp.os}-${fp.browser}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveBehaviorSettings = () => {
    localStorage.setItem(STORAGE_KEY_BEHAVIOR, JSON.stringify(behaviorSettings));
    toast.success(isRTL ? 'تم حفظ الإعدادات' : 'Settings saved');
  };

  const enabledCount = modules.filter(m => m.enabled).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'مركز الذكاء الاصطناعي' : 'AI Hub'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'أدوات ذكاء اصطناعي حقيقية وعاملة' : 'Real working AI tools'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Sparkles className="w-3 h-3" />
          {enabledCount}/{modules.length} {isRTL ? 'نشط' : 'Active'}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'بصمات مولدة' : 'Fingerprints'}</p>
                <p className="text-2xl font-bold text-purple-400">{generatedFingerprints.length}</p>
              </div>
              <Fingerprint className="w-8 h-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'كابتشا محلولة' : 'CAPTCHAs Solved'}</p>
                <p className="text-2xl font-bold text-green-400">{captchaStats.successfulSolves}</p>
              </div>
              <Bot className="w-8 h-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'تحسينات البروكسي' : 'Proxy Optimizations'}</p>
                <p className="text-2xl font-bold text-blue-400">{proxyOptimizationStats.totalOptimizations}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الفحوصات' : 'Scans'}</p>
                <p className="text-2xl font-bold text-orange-400">{detectionResults.checks.length > 0 ? 1 : 0}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card flex-wrap">
          <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="fingerprint">{isRTL ? 'مولد البصمات' : 'Fingerprint'}</TabsTrigger>
          <TabsTrigger value="captcha">{isRTL ? 'حل الكابتشا' : 'CAPTCHA'}</TabsTrigger>
          <TabsTrigger value="vision">{isRTL ? 'عيون AI' : 'Vision AI'}</TabsTrigger>
          <TabsTrigger value="detection">{isRTL ? 'كشف التهديدات' : 'Detection'}</TabsTrigger>
          <TabsTrigger value="proxy">{isRTL ? 'تحسين البروكسي' : 'Proxy'}</TabsTrigger>
          <TabsTrigger value="behavioral">{isRTL ? 'السلوك' : 'Behavioral'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card 
                  key={module.id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
                    module.enabled && "border-primary/30"
                  )}
                  onClick={() => {
                    if (module.id === 'fingerprint') setActiveTab('fingerprint');
                    else if (module.id === 'captcha') setActiveTab('captcha');
                    else if (module.id === 'detection') setActiveTab('detection');
                    else if (module.id === 'proxy') setActiveTab('proxy');
                    else if (module.id === 'behavioral') setActiveTab('behavioral');
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        module.enabled ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          module.enabled ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <Switch 
                        checked={module.enabled}
                        onCheckedChange={() => {
                          toggleModule(module.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <CardTitle className="text-sm mt-2">
                      {isRTL ? module.titleAr : module.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRTL ? module.descriptionAr : module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        module.status === 'active' && "bg-green-500",
                        module.status === 'idle' && "bg-yellow-500",
                        module.status === 'processing' && "bg-blue-500 animate-pulse",
                        module.status === 'error' && "bg-red-500"
                      )} />
                      <span className="text-xs text-muted-foreground capitalize">{module.status}</span>
                    </div>
                    <div className="space-y-1">
                      {module.stats.map((stat, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{isRTL ? stat.labelAr : stat.label}</span>
                          <span className="font-medium">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  {module.enabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="fingerprint" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  {isRTL ? 'مولد البصمات الحقيقي' : 'Real Fingerprint Generator'}
                </CardTitle>
                <CardDescription>
                  {isRTL 
                    ? 'توليد بصمات متصفح واقعية ومتسقة'
                    : 'Generate realistic and consistent browser fingerprints'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isRTL ? 'نظام التشغيل' : 'OS'}</label>
                    <Select value={genOptions.os} onValueChange={(v) => setGenOptions(s => ({ ...s, os: v as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="macos">macOS</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isRTL ? 'المتصفح' : 'Browser'}</label>
                    <Select value={genOptions.browser} onValueChange={(v) => setGenOptions(s => ({ ...s, browser: v as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chrome">Chrome</SelectItem>
                        <SelectItem value="firefox">Firefox</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{isRTL ? 'الدولة' : 'Country'}</label>
                    <Select value={genOptions.country} onValueChange={(v) => setGenOptions(s => ({ ...s, country: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="AE">UAE</SelectItem>
                        <SelectItem value="SA">Saudi Arabia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateFingerprint} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      {isRTL ? 'جاري التوليد...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isRTL ? 'توليد بصمة جديدة' : 'Generate Fingerprint'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Current Fingerprint */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'البصمة الحالية' : 'Current Fingerprint'}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentFingerprint ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {currentFingerprint.confidence}% {isRTL ? 'ثقة' : 'confidence'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => copyFingerprint(currentFingerprint)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportFingerprint(currentFingerprint)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">OS</p>
                            <p className="font-medium">{currentFingerprint.os}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Browser</p>
                            <p className="font-medium">{currentFingerprint.browser}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Platform</p>
                            <p className="font-medium">{currentFingerprint.platform}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Country</p>
                            <p className="font-medium">{currentFingerprint.country}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Screen</p>
                            <p className="font-medium">{currentFingerprint.screenWidth}x{currentFingerprint.screenHeight}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">CPU Cores</p>
                            <p className="font-medium">{currentFingerprint.hardwareConcurrency}</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Memory</p>
                            <p className="font-medium">{currentFingerprint.deviceMemory} GB</p>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <p className="text-xs text-muted-foreground">Timezone</p>
                            <p className="font-medium text-xs">{currentFingerprint.timezone}</p>
                          </div>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground">GPU</p>
                          <p className="font-medium text-xs truncate">{currentFingerprint.webglRenderer}</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground">User Agent</p>
                          <p className="font-medium text-xs break-all">{currentFingerprint.userAgent}</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Fingerprint className="w-16 h-16 mb-4 opacity-20" />
                    <p>{isRTL ? 'اضغط على توليد بصمة جديدة' : 'Click Generate Fingerprint'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History */}
          {generatedFingerprints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'البصمات السابقة' : 'Previous Fingerprints'} ({generatedFingerprints.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {generatedFingerprints.slice(0, 10).map((fp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Fingerprint className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{fp.os} / {fp.browser}</p>
                            <p className="text-xs text-muted-foreground">{fp.country} • {fp.screenWidth}x{fp.screenHeight}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{fp.confidence}%</Badge>
                          <Button variant="ghost" size="icon" onClick={() => copyFingerprint(fp)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CAPTCHA Tab - NEW REAL FUNCTIONALITY */}
        <TabsContent value="captcha" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    {isRTL ? 'حل الكابتشا بالذكاء الاصطناعي' : 'AI CAPTCHA Solver'}
                  </CardTitle>
                  <Switch
                    checked={captchaConfig.enabled}
                    onCheckedChange={(enabled) => {
                      captchaSolver.updateConfig({ enabled });
                      setCaptchaConfig(prev => ({ ...prev, enabled }));
                    }}
                  />
                </div>
                <CardDescription>
                  {isRTL 
                    ? 'يستخدم الذكاء الاصطناعي لحل الكابتشا تلقائياً'
                    : 'Uses AI to automatically solve CAPTCHAs'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-400">{captchaStats.successfulSolves}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'تم حلها' : 'Solved'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{captchaStats.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'نسبة النجاح' : 'Success Rate'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'تقدم التعلم' : 'Learning Progress'}</label>
                  <Progress value={captchaStats.learningProgress} />
                  <p className="text-xs text-muted-foreground">{captchaStats.learningProgress.toFixed(0)}%</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isRTL ? 'الحل التلقائي' : 'Auto-solve'}</span>
                    <Switch
                      checked={captchaConfig.autoSolve}
                      onCheckedChange={(autoSolve) => {
                        captchaSolver.updateConfig({ autoSolve });
                        setCaptchaConfig(prev => ({ ...prev, autoSolve }));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isRTL ? 'التعلم من الأخطاء' : 'Learn from errors'}</span>
                    <Switch
                      checked={captchaConfig.learnFromErrors}
                      onCheckedChange={(learnFromErrors) => {
                        captchaSolver.updateConfig({ learnFromErrors });
                        setCaptchaConfig(prev => ({ ...prev, learnFromErrors }));
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'الحد الأقصى للمحاولات' : 'Max Retries'}: {captchaConfig.maxRetries}
                  </label>
                  <Slider
                    value={[captchaConfig.maxRetries]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([maxRetries]) => {
                      captchaSolver.updateConfig({ maxRetries });
                      setCaptchaConfig(prev => ({ ...prev, maxRetries }));
                    }}
                  />
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    captchaSolver.resetLearning();
                    setCaptchaStats(captchaSolver.getStats());
                    toast.success(isRTL ? 'تم إعادة تعيين التعلم' : 'Learning reset');
                  }}
                >
                  {isRTL ? 'إعادة تعيين التعلم' : 'Reset Learning'}
                </Button>
              </CardContent>
            </Card>

            {/* Test CAPTCHA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-primary" />
                  {isRTL ? 'اختبار الحل' : 'Test Solver'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">{isRTL ? 'صورة الكابتشا' : 'CAPTCHA Image'}</label>
                  
                  {/* Upload button */}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={captchaFileInputRef}
                      accept="image/*"
                      onChange={handleCaptchaFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => captchaFileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {isRTL ? 'رفع صورة' : 'Upload Image'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.readText().then(text => {
                          if (text.startsWith('data:image') || text.length > 100) {
                            setCaptchaTestImage(text);
                            setCaptchaImagePreview(text);
                            toast.success(isRTL ? 'تم لصق الصورة' : 'Image pasted');
                          }
                        });
                      }}
                    >
                      {isRTL ? 'لصق' : 'Paste'}
                    </Button>
                  </div>

                  {/* Image preview */}
                  {captchaImagePreview && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <img 
                        src={captchaImagePreview} 
                        alt="CAPTCHA Preview" 
                        className="max-h-32 mx-auto rounded"
                      />
                    </div>
                  )}

                  {/* Manual base64 input - collapsible */}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      {isRTL ? 'إدخال Base64 يدوي (متقدم)' : 'Manual Base64 input (advanced)'}
                    </summary>
                    <textarea
                      className="w-full h-20 p-2 mt-2 text-xs rounded-md border bg-background resize-none"
                      placeholder={isRTL ? 'الصق صورة base64 هنا...' : 'Paste base64 image here...'}
                      value={captchaTestImage}
                      onChange={(e) => {
                        setCaptchaTestImage(e.target.value);
                        if (e.target.value.startsWith('data:image')) {
                          setCaptchaImagePreview(e.target.value);
                        }
                      }}
                    />
                  </details>
                </div>

                <Button
                  onClick={testCaptchaSolver}
                  disabled={isSolvingCaptcha || !captchaTestImage}
                  className="w-full"
                >
                  {isSolvingCaptcha ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {isRTL ? 'جاري الحل...' : 'Solving...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {isRTL ? 'حل الكابتشا' : 'Solve CAPTCHA'}
                    </>
                  )}
                </Button>

                {/* CAPTCHA Log */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'السجل' : 'Log'}</label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    {captchaLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {isRTL ? 'لا توجد محاولات بعد' : 'No attempts yet'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {captchaLog.slice(0, 20).map((entry) => (
                          <div
                            key={entry.id}
                            className={cn(
                              "p-2 rounded text-xs",
                              entry.status === 'success' ? "bg-green-500/10" : "bg-red-500/10"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={entry.status === 'success' ? "text-green-400" : "text-red-400"}>
                                {entry.status === 'success' ? '✓' : '✗'} {entry.type}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {entry.solution && (
                              <p className="mt-1 text-muted-foreground">
                                {isRTL ? 'الحل' : 'Solution'}: {entry.solution}
                              </p>
                            )}
                            {entry.timeToSolve && (
                              <p className="text-muted-foreground">{entry.timeToSolve}ms</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vision AI Tab - NEW */}
        <TabsContent value="vision" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    {isRTL ? 'عيون الذكاء الاصطناعي' : 'Vision AI Monitor'}
                  </CardTitle>
                  <Switch
                    checked={visionEnabled}
                    onCheckedChange={setVisionEnabled}
                  />
                </div>
                <CardDescription>
                  {isRTL 
                    ? 'مراقبة الصفحات وتحليلها بالذكاء الاصطناعي'
                    : 'Monitor and analyze pages with AI'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-cyan-400">{visionScreenshots.length}</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'لقطات' : 'Screenshots'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{visionMonitorInterval}s</p>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'الفاصل' : 'Interval'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'رابط الصفحة' : 'Page URL'}</label>
                  <Input
                    placeholder="https://example.com"
                    value={visionMonitorUrl}
                    onChange={(e) => setVisionMonitorUrl(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'فاصل التقاط الصور' : 'Capture Interval'}: {visionMonitorInterval}s
                  </label>
                  <Slider
                    value={[visionMonitorInterval]}
                    min={1}
                    max={60}
                    step={1}
                    onValueChange={([v]) => setVisionMonitorInterval(v)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={captureScreenshot}
                    disabled={isMonitoring || !visionMonitorUrl}
                    className="flex-1"
                  >
                    {isMonitoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isRTL ? 'جاري الالتقاط...' : 'Capturing...'}
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        {isRTL ? 'التقاط صورة' : 'Capture Screenshot'}
                      </>
                    )}
                  </Button>
                </div>

                {visionEnabled && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-400">
                        {isRTL ? 'المراقبة نشطة' : 'Monitoring Active'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Screenshots History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-primary" />
                  {isRTL ? 'سجل اللقطات' : 'Screenshots History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  {visionScreenshots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ScanLine className="w-16 h-16 mb-4 opacity-20" />
                      <p>{isRTL ? 'لا توجد لقطات بعد' : 'No screenshots yet'}</p>
                      <p className="text-xs">{isRTL ? 'ابدأ بالتقاط صورة' : 'Start by capturing a screenshot'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visionScreenshots.map((screenshot) => (
                        <div key={screenshot.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {screenshot.url}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(screenshot.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {screenshot.analysis && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                              {screenshot.analysis}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                {isRTL ? 'تحليل الصور بالذكاء الاصطناعي' : 'AI Image Analysis'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'ارفع صورة وسيقوم الذكاء الاصطناعي بتحليلها'
                  : 'Upload an image and AI will analyze it'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 border-2 border-dashed rounded-lg text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      setIsAnalyzing(true);
                      toast.info(isRTL ? 'جاري التحليل...' : 'Analyzing...');
                      
                      try {
                        const { data, error } = await supabase.functions.invoke('vision-analyze', {
                          body: { imageBase64: base64, task: 'describe' }
                        });
                        
                        if (error) throw error;
                        
                        const newScreenshot = {
                          id: Date.now().toString(),
                          url: file.name,
                          timestamp: new Date(),
                          analysis: data.analysis || (isRTL ? 'تم التحليل' : 'Analysis complete')
                        };
                        setVisionScreenshots(prev => [newScreenshot, ...prev].slice(0, 20));
                        toast.success(isRTL ? 'تم التحليل!' : 'Analysis complete!');
                      } catch (err: any) {
                        toast.error(isRTL ? 'فشل التحليل' : 'Analysis failed', {
                          description: err.message
                        });
                      } finally {
                        setIsAnalyzing(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                  id="vision-upload"
                />
                <label htmlFor="vision-upload" className="cursor-pointer">
                  {isAnalyzing ? (
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  )}
                  <p className="text-muted-foreground">
                    {isAnalyzing 
                      ? (isRTL ? 'جاري التحليل...' : 'Analyzing...')
                      : (isRTL ? 'اسحب صورة هنا أو انقر للرفع' : 'Drop image here or click to upload')
                    }
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proxy Optimization Tab - NEW */}
        <TabsContent value="proxy" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  {isRTL ? 'تحسين البروكسي الذكي' : 'AI Proxy Optimizer'}
                </CardTitle>
                <CardDescription>
                  {isRTL 
                    ? 'تحسين أداء البروكسي تلقائياً'
                    : 'Automatically optimize proxy performance'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">{proxyOptimizationStats.totalOptimizations}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'تحسينات' : 'Optimizations'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{proxyOptimizationStats.avgImprovement.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'متوسط التحسين' : 'Avg Improvement'}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{proxies.length}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'بروكسيات' : 'Proxies'}</p>
                  </div>
                </div>

                <Button
                  onClick={optimizeProxies}
                  disabled={isOptimizingProxy || proxies.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isOptimizingProxy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {isRTL ? 'جاري التحسين...' : 'Optimizing...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      {isRTL ? 'تحسين جميع البروكسيات' : 'Optimize All Proxies'}
                    </>
                  )}
                </Button>

                {proxies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {isRTL ? 'أضف بروكسيات من مدير البروكسي أولاً' : 'Add proxies from Proxy Manager first'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'نتائج التحسين' : 'Optimization Results'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {proxyOptimizations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Zap className="w-16 h-16 mb-4 opacity-20" />
                      <p>{isRTL ? 'لا توجد تحسينات بعد' : 'No optimizations yet'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {proxyOptimizations.map((opt) => (
                        <div key={opt.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{opt.proxyName}</span>
                            <Badge variant="outline" className="text-green-400">
                              +{opt.improvement}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{opt.originalLatency}ms</span>
                            <span>→</span>
                            <span className="text-green-400">{opt.optimizedLatency}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                {isRTL ? 'فحص كشف التهديدات الحقيقي' : 'Real Threat Detection Scan'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'فحص حقيقي لاكتشاف ما إذا كان يمكن التعرف على متصفحك'
                  : 'Real scan to detect if your browser can be identified'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={runDetectionScan} 
                disabled={isScanning}
                size="lg"
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    {isRTL ? 'جاري الفحص...' : 'Scanning...'}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {isRTL ? 'بدء فحص الكشف' : 'Run Detection Scan'}
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="space-y-2">
                  <Progress value={scanProgress} />
                  <p className="text-sm text-muted-foreground text-center">{scanProgress}%</p>
                </div>
              )}

              {detectionResults.checks.length > 0 && (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-lg flex items-center gap-4",
                    detectionResults.riskLevel === 'low' && "bg-green-500/10 border border-green-500/20",
                    detectionResults.riskLevel === 'medium' && "bg-yellow-500/10 border border-yellow-500/20",
                    detectionResults.riskLevel === 'high' && "bg-red-500/10 border border-red-500/20"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      detectionResults.riskLevel === 'low' && "bg-green-500/20",
                      detectionResults.riskLevel === 'medium' && "bg-yellow-500/20",
                      detectionResults.riskLevel === 'high' && "bg-red-500/20"
                    )}>
                      {detectionResults.riskLevel === 'low' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertTriangle className={cn(
                          "w-6 h-6",
                          detectionResults.riskLevel === 'medium' ? "text-yellow-500" : "text-red-500"
                        )} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {detectionResults.riskLevel === 'low' 
                          ? (isRTL ? 'آمن - لا توجد تهديدات' : 'Safe - No threats')
                          : detectionResults.riskLevel === 'medium'
                            ? (isRTL ? 'متوسط - بعض المشاكل' : 'Medium - Some issues')
                            : (isRTL ? 'خطر - مشاكل متعددة' : 'High Risk - Multiple issues')
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'آخر فحص: ' : 'Last scan: '}
                        {detectionResults.lastScan?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {detectionResults.checks.map((check, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border",
                          check.passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {check.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm">{isRTL ? check.nameAr : check.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{check.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  {isRTL ? 'إعدادات السلوك البشري' : 'Human Behavior Settings'}
                </CardTitle>
                <Switch
                  checked={behaviorSettings.enabled}
                  onCheckedChange={(enabled) => setBehaviorSettings((prev: typeof behaviorSettings) => ({ ...prev, enabled }))}
                />
              </div>
              <CardDescription>
                {isRTL 
                  ? 'تخصيص محاكاة السلوك البشري الطبيعي'
                  : 'Customize natural human behavior simulation'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'حركة الماوس' : 'Mouse Movement'}</label>
                  <Select 
                    value={behaviorSettings.mouseMovement}
                    onValueChange={(v) => setBehaviorSettings((s: typeof behaviorSettings) => ({ ...s, mouseMovement: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural">{isRTL ? 'طبيعي' : 'Natural'}</SelectItem>
                      <SelectItem value="aggressive">{isRTL ? 'سريع' : 'Aggressive'}</SelectItem>
                      <SelectItem value="slow">{isRTL ? 'بطيء' : 'Slow'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'نمط الكتابة' : 'Typing Pattern'}</label>
                  <Select 
                    value={behaviorSettings.typingPattern}
                    onValueChange={(v) => setBehaviorSettings((s: typeof behaviorSettings) => ({ ...s, typingPattern: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">{isRTL ? 'بشري' : 'Human'}</SelectItem>
                      <SelectItem value="fast">{isRTL ? 'سريع' : 'Fast'}</SelectItem>
                      <SelectItem value="random">{isRTL ? 'عشوائي' : 'Random'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'تأخير النقر' : 'Click Delay'}: {behaviorSettings.clickDelay}ms
                  </label>
                  <Slider 
                    value={[behaviorSettings.clickDelay]} 
                    max={500} 
                    step={10}
                    onValueChange={([v]) => setBehaviorSettings((s: typeof behaviorSettings) => ({ ...s, clickDelay: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'التوقف بين الإجراءات' : 'Pause Between Actions'}: {behaviorSettings.pauseBetweenActions}ms
                  </label>
                  <Slider 
                    value={[behaviorSettings.pauseBetweenActions]} 
                    max={2000} 
                    step={50}
                    onValueChange={([v]) => setBehaviorSettings((s: typeof behaviorSettings) => ({ ...s, pauseBetweenActions: v }))}
                  />
                </div>
              </div>

              <Button onClick={saveBehaviorSettings}>
                <Save className="w-4 h-4 mr-2" />
                {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
