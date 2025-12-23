import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Eye, 
  EyeOff,
  Scan,
  Camera,
  Brain,
  Activity,
  Target,
  Zap,
  Settings2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MousePointer2,
  Monitor,
  Crosshair,
  Layers,
  TrendingUp,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  visionMonitor, 
  VisionEvent,
  VisionMonitorStats,
  VisionMonitorConfig,
  DetectedElement,
  AIAnalysisResult
} from '@/lib/visionMonitor';
import { captchaSolver } from '@/lib/captchaSolver';
import { isElectron } from '@/lib/electron';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

export function VisionMonitorView() {
  const { isRTL } = useTranslation();
  const { profiles } = useAppStore();
  
  const [config, setConfig] = useState<VisionMonitorConfig>(visionMonitor.getConfig());
  const [stats, setStats] = useState<VisionMonitorStats>(visionMonitor.getStats());
  const [activeTab, setActiveTab] = useState('live');
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResult | null>(null);
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Profile selection for monitoring
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const runningProfiles = profiles.filter(p => p.status === 'running');
  
  // Capture sources state
  const [captureSources, setCaptureSources] = useState<{ id: string; name: string; type: string; thumbnail: string }[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  
  // Live preview state
  const [livePreviewImage, setLivePreviewImage] = useState<string | null>(null);
  const [isLivePreviewActive, setIsLivePreviewActive] = useState(false);
  const [livePreviewFps, setLivePreviewFps] = useState(0);
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);
  const livePreviewIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = visionMonitor.subscribe((event: VisionEvent) => {
      handleVisionEvent(event);
      setStats(visionMonitor.getStats());
    });

    return () => { unsubscribe(); };
  }, []);

  const handleVisionEvent = (event: VisionEvent) => {
    const log: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: event.type,
      message: '',
      status: 'info',
    };

    switch (event.type) {
      case 'capture':
        log.message = 'تم التقاط الشاشة';
        log.status = 'success';
        break;
      case 'analysis':
        log.message = `تحليل: ${event.analysis.summary}`;
        log.status = 'info';
        setCurrentAnalysis(event.analysis);
        setDetectedElements(event.analysis.elements);
        break;
      case 'action_started':
        log.message = `تنفيذ: ${event.action.action}`;
        log.status = 'warning';
        break;
      case 'action_completed':
        log.message = event.success ? 'تم تنفيذ الإجراء بنجاح' : 'فشل تنفيذ الإجراء';
        log.status = event.success ? 'success' : 'error';
        if (event.success) toast.success('تم تنفيذ الإجراء');
        break;
      case 'captcha_solved':
        log.message = event.success 
          ? `✅ تم حل CAPTCHA (${event.captchaType}) تلقائياً` 
          : `❌ فشل حل CAPTCHA (${event.captchaType})`;
        log.status = event.success ? 'success' : 'error';
        if (event.success) {
          toast.success(`تم حل ${event.captchaType} تلقائياً بواسطة AI`);
        }
        break;
      default:
        return;
    }

    setActivityLog(prev => [log, ...prev].slice(0, 100));
  };

  const updateConfig = (updates: Partial<VisionMonitorConfig>) => {
    visionMonitor.updateConfig(updates);
    setConfig(visionMonitor.getConfig());
  };

  const runManualScan = useCallback(async () => {
    if (!config.enabled) {
      toast.error('يرجى تفعيل المراقبة أولاً');
      return;
    }

    if (!selectedProfileId) {
      toast.error('يرجى اختيار بروفايل للمراقبة أولاً');
      return;
    }

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);
    if (!selectedProfile || selectedProfile.status !== 'running') {
      toast.error('البروفايل المختار غير نشط');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    // Simulate progressive scan
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }

    // Run actual detection on the selected profile's window
    const testSession = visionMonitor.startSession(selectedProfileId);
    const capture = await visionMonitor.captureProfileWindow(selectedProfileId);
    
    if (capture) {
      const analysis = await visionMonitor.analyzeCapture(selectedProfileId, capture);
      if (analysis) {
        setCurrentAnalysis(analysis);
        setDetectedElements(analysis.elements);
        toast.success(`تم اكتشاف ${analysis.elements.length} عنصر في ${selectedProfile.name}`);
      }
    } else {
      toast.error('فشل التقاط نافذة البروفايل');
    }

    visionMonitor.stopSession(selectedProfileId);
    setIsScanning(false);
  }, [config.enabled, selectedProfileId, profiles]);

  const handleReset = () => {
    visionMonitor.resetStats();
    setStats(visionMonitor.getStats());
    setActivityLog([]);
    setCurrentAnalysis(null);
    setDetectedElements([]);
    toast.success('تم إعادة تعيين البيانات');
  };

  // Load available capture sources
  const loadCaptureSources = useCallback(async () => {
    if (!visionMonitor.isRealCaptureAvailable()) {
      toast.error('التقاط الشاشة الحقيقي متاح فقط في تطبيق Electron');
      return;
    }

    setIsLoadingSources(true);
    try {
      const sources = await visionMonitor.getCaptureSources();
      setCaptureSources(sources);
      setShowSourceSelector(true);
      
      if (sources.length === 0) {
        toast.error('لم يتم العثور على مصادر التقاط');
      } else {
        toast.success(`تم العثور على ${sources.length} مصدر`);
      }
    } catch (error) {
      toast.error('فشل في تحميل مصادر الالتقاط');
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  const selectCaptureSource = (sourceId: string) => {
    setSelectedSource(sourceId);
    const source = captureSources.find(s => s.id === sourceId);
    if (source) {
      toast.success(`تم اختيار: ${source.name}`);
    }
    setShowSourceSelector(false);
  };

  // Start/Stop live preview
  const toggleLivePreview = useCallback(async () => {
    if (isLivePreviewActive) {
      // Stop live preview
      if (livePreviewIntervalRef.current) {
        clearInterval(livePreviewIntervalRef.current);
        livePreviewIntervalRef.current = null;
      }
      await visionMonitor.stopContinuousCapture();
      setIsLivePreviewActive(false);
      setLivePreviewImage(null);
      toast.success('تم إيقاف المعاينة المباشرة');
    } else {
      // Start live preview
      if (!visionMonitor.isRealCaptureAvailable()) {
        toast.error('المعاينة المباشرة تعمل فقط في تطبيق Electron');
        return;
      }

      // Check if a profile is selected for monitoring
      if (!selectedProfileId) {
        toast.error('يرجى اختيار بروفايل للمراقبة أولاً');
        return;
      }

      // Verify the profile is running
      const selectedProfile = profiles.find(p => p.id === selectedProfileId);
      if (!selectedProfile || selectedProfile.status !== 'running') {
        toast.error('البروفايل المختار غير نشط');
        return;
      }

      setIsLivePreviewActive(true);
      let frameCount = 0;
      let lastFpsUpdate = Date.now();

      // Capture function - captures profile window instead of entire screen
      const captureFrame = async () => {
        try {
          const { electronAPI } = await import('@/lib/electron');
          if (electronAPI && selectedProfileId) {
            // Use captureProfileWindow instead of captureScreen
            const result = await electronAPI.captureProfileWindow(selectedProfileId);
            if (result.success && result.capture) {
              setLivePreviewImage(result.capture.imageData);
              setLastCaptureTime(new Date());
              frameCount++;

              // Update FPS every second
              const now = Date.now();
              if (now - lastFpsUpdate >= 1000) {
                setLivePreviewFps(frameCount);
                frameCount = 0;
                lastFpsUpdate = now;
              }
            }
          }
        } catch (error) {
          console.error('Live preview capture error:', error);
        }
      };

      // Initial capture
      await captureFrame();

      // Set interval for continuous capture (1 second)
      livePreviewIntervalRef.current = window.setInterval(captureFrame, 1000);
      toast.success(`تم تفعيل المراقبة للبروفايل: ${selectedProfile.name}`);
    }
  }, [isLivePreviewActive, selectedProfileId, profiles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (livePreviewIntervalRef.current) {
        clearInterval(livePreviewIntervalRef.current);
      }
    };
  }, []);

  const getElementIcon = (type: DetectedElement['type']) => {
    const icons = {
      button: '🔘',
      input: '📝',
      link: '🔗',
      image: '🖼️',
      text: '📄',
      captcha: '🤖',
      popup: '💬',
      form: '📋',
      unknown: '❓',
    };
    return icons[type] || icons.unknown;
  };

  const getPageTypeColor = (type: AIAnalysisResult['pageType']) => {
    const colors = {
      login: 'bg-blue-500/20 text-blue-500',
      form: 'bg-purple-500/20 text-purple-500',
      captcha: 'bg-orange-500/20 text-orange-500',
      content: 'bg-green-500/20 text-green-500',
      error: 'bg-red-500/20 text-red-500',
      success: 'bg-emerald-500/20 text-emerald-500',
      unknown: 'bg-gray-500/20 text-gray-500',
    };
    return colors[type] || colors.unknown;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              {config.enabled && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-background" />
              )}
            </div>
            عيون الذكاء الاصطناعي
            {visionMonitor.isRealCaptureAvailable() && (
              <Badge className="bg-green-500/20 text-green-500 text-xs">
                التقاط حقيقي
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام مراقبة وتحليل الشاشة بالذكاء الاصطناعي
            {!visionMonitor.isRealCaptureAvailable() && (
              <span className="text-yellow-500 text-xs mr-2">(وضع المحاكاة - للتقاط الحقيقي استخدم تطبيق Electron)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Profile Selector for monitoring */}
          {visionMonitor.isRealCaptureAvailable() && (
            <Select value={selectedProfileId || ''} onValueChange={setSelectedProfileId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="اختر بروفايل للمراقبة" />
              </SelectTrigger>
              <SelectContent>
                {runningProfiles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    لا توجد بروفايلات نشطة
                  </SelectItem>
                ) : (
                  runningProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {/* Source Selector Button */}
          {visionMonitor.isRealCaptureAvailable() && (
            <Button
              variant="outline"
              onClick={loadCaptureSources}
              disabled={isLoadingSources}
              className="gap-2"
            >
              {isLoadingSources ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
              {selectedSource ? 'تغيير المصدر' : 'اختيار المصدر'}
            </Button>
          )}
          
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
            <Eye className={cn("w-4 h-4", config.enabled ? "text-cyan-500" : "text-muted-foreground")} />
            <span className="text-sm">تفعيل العيون</span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
          <Button
            variant="glow"
            onClick={runManualScan}
            disabled={isScanning || !config.enabled || !selectedProfileId}
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Scan className="w-4 h-4 ml-2" />
            )}
            فحص الآن
          </Button>
        </div>
      </div>

      {/* Source Selector Modal */}
      {showSourceSelector && (
        <Card className="glass-card border-cyan-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5 text-cyan-500" />
                اختر مصدر الالتقاط
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSourceSelector(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              اختر الشاشة أو النافذة التي تريد مراقبتها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {captureSources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => selectCaptureSource(source.id)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:scale-105",
                    selectedSource === source.id 
                      ? "border-cyan-500 ring-2 ring-cyan-500/30" 
                      : "border-border hover:border-cyan-500/50"
                  )}
                >
                  <div className="aspect-video bg-muted relative">
                    {source.thumbnail && source.thumbnail !== 'data:image/png;base64,' ? (
                      <img 
                        src={source.thumbnail} 
                        alt={source.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {source.type === 'screen' ? (
                          <Monitor className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <Layers className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {selectedSource === source.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-muted/50">
                    <p className="text-xs font-medium truncate">{source.name}</p>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] mt-1",
                        source.type === 'screen' ? "bg-blue-500/20 text-blue-500" : "bg-purple-500/20 text-purple-500"
                      )}
                    >
                      {source.type === 'screen' ? 'شاشة' : 'نافذة'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            {captureSources.length === 0 && !isLoadingSources && (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لم يتم العثور على مصادر التقاط</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={loadCaptureSources}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة البحث
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Progress */}
      {isScanning && (
        <Card className="glass-card border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Crosshair className="w-8 h-8 text-cyan-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">جاري المسح...</span>
                  <span className="text-sm text-muted-foreground">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="live">العرض المباشر</TabsTrigger>
          <TabsTrigger value="elements">العناصر المكتشفة</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Camera className="w-5 h-5 text-cyan-500" />
                  <Badge variant="secondary">لقطات</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.totalCaptures}</p>
                <p className="text-sm text-muted-foreground">إجمالي الالتقاطات</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <Badge variant="secondary">تحليلات</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.totalAnalyses}</p>
                <p className="text-sm text-muted-foreground">تحليلات AI</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <Badge variant="secondary">عناصر</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.elementsDetected}</p>
                <p className="text-sm text-muted-foreground">عناصر مكتشفة</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <Badge variant="secondary">إجراءات</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.actionsPerformed}</p>
                <p className="text-sm text-muted-foreground">إجراءات منفذة</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview Section */}
          <Card className="glass-card border-cyan-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="relative">
                    <Camera className="w-5 h-5 text-cyan-500" />
                    {isLivePreviewActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  المعاينة المباشرة
                  {isLivePreviewActive && (
                    <Badge className="bg-red-500/20 text-red-500 animate-pulse">
                      ● LIVE
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isLivePreviewActive && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{livePreviewFps} FPS</span>
                      {lastCaptureTime && (
                        <span>آخر التقاط: {lastCaptureTime.toLocaleTimeString('ar-SA')}</span>
                      )}
                    </div>
                  )}
                  <Button
                    variant={isLivePreviewActive ? "destructive" : "glow"}
                    size="sm"
                    onClick={toggleLivePreview}
                    disabled={!visionMonitor.isRealCaptureAvailable()}
                  >
                    {isLivePreviewActive ? (
                      <>
                        <Pause className="w-4 h-4 ml-2" />
                        إيقاف
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-2" />
                        تشغيل
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {!visionMonitor.isRealCaptureAvailable() && (
                <p className="text-xs text-yellow-500 mt-2">
                  المعاينة المباشرة تتطلب تطبيق Electron للعمل
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg overflow-hidden bg-black/50 border border-border">
                {livePreviewImage ? (
                  <div className="relative">
                    <img 
                      src={livePreviewImage} 
                      alt="Live Preview"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                    {/* Overlay with detected elements highlight */}
                    {detectedElements.length > 0 && config.highlightElements && (
                      <div className="absolute inset-0 pointer-events-none">
                        {detectedElements.slice(0, 5).map((element, i) => (
                          <div
                            key={element.id}
                            className="absolute border-2 border-cyan-500 bg-cyan-500/10 rounded"
                            style={{
                              left: `${(element.bounds.x / 1920) * 100}%`,
                              top: `${(element.bounds.y / 1080) * 100}%`,
                              width: `${(element.bounds.width / 1920) * 100}%`,
                              height: `${(element.bounds.height / 1080) * 100}%`,
                            }}
                          >
                            <span className="absolute -top-5 left-0 text-[10px] bg-cyan-500 text-white px-1 rounded">
                              {element.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Live indicator overlay */}
                    {isLivePreviewActive && (
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white">LIVE</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
                    <Monitor className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm">اضغط على "تشغيل" لبدء المعاينة المباشرة</p>
                    {selectedSource && (
                      <p className="text-xs mt-2 text-cyan-500">
                        المصدر المحدد: {captureSources.find(s => s.id === selectedSource)?.name || selectedSource}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CAPTCHA Solver Integration Status */}
          <Card className="glass-card border-orange-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                ربط CAPTCHA Solver
                <Badge className={captchaSolver.isEnabled() ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}>
                  {captchaSolver.isEnabled() ? "متصل" : "غير متصل"}
                </Badge>
              </CardTitle>
              <CardDescription>
                عند اكتشاف CAPTCHA، يتم تفعيل حل CAPTCHA تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-orange-500">{captchaSolver.getStats().totalAttempts}</p>
                  <p className="text-xs text-muted-foreground">محاولات</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-green-500">{captchaSolver.getStats().successfulSolves}</p>
                  <p className="text-xs text-muted-foreground">نجاح</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-cyan-500">{captchaSolver.getStats().successRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">معدل النجاح</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm">اكتشاف تلقائي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🤖</span>
                    <span className="text-sm">حل CAPTCHA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Analysis */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  التحليل الحالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">نوع الصفحة</span>
                      <Badge className={getPageTypeColor(currentAnalysis.pageType)}>
                        {currentAnalysis.pageType}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">الملخص</span>
                      <p className="mt-1 font-medium">{currentAnalysis.summary}</p>
                    </div>

                    {currentAnalysis.threats.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          تحذيرات
                        </span>
                        <ul className="mt-1 space-y-1">
                          {currentAnalysis.threats.map((threat, i) => (
                            <li key={i} className="text-sm text-yellow-500">{threat}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentAnalysis.opportunities.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          الفرص
                        </span>
                        <ul className="mt-1 space-y-1">
                          {currentAnalysis.opportunities.map((opp, i) => (
                            <li key={i} className="text-sm text-green-500">{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد تحليل حالي</p>
                    <p className="text-sm">قم بتشغيل فحص لرؤية النتائج</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  الإجراءات المقترحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentAnalysis?.suggestedActions && currentAnalysis.suggestedActions.length > 0 ? (
                  <div className="space-y-3">
                    {currentAnalysis.suggestedActions.map((action, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          action.priority === 'high' && "border-red-500/30 bg-red-500/5",
                          action.priority === 'medium' && "border-yellow-500/30 bg-yellow-500/5",
                          action.priority === 'low' && "border-blue-500/30 bg-blue-500/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            action.priority === 'high' ? 'destructive' :
                            action.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {action.priority === 'high' ? 'عالي' : action.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <span className="text-sm">{action.action}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MousePointer2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد إجراءات مقترحة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Eyes Animation */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  {/* Eye visualization */}
                  <div className={cn(
                    "flex gap-8",
                    config.enabled && "animate-pulse"
                  )}>
                    {/* Left Eye */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                        <div className={cn(
                          "w-6 h-6 rounded-full bg-cyan-500 transition-all duration-300",
                          isScanning && "animate-bounce"
                        )} />
                      </div>
                      {config.enabled && (
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                      )}
                    </div>

                    {/* Right Eye */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                        <div className={cn(
                          "w-6 h-6 rounded-full bg-cyan-500 transition-all duration-300",
                          isScanning && "animate-bounce"
                        )} />
                      </div>
                      {config.enabled && (
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                      )}
                    </div>
                  </div>

                  {/* Status text */}
                  <p className={cn(
                    "text-center mt-6 font-medium",
                    config.enabled ? "text-cyan-500" : "text-muted-foreground"
                  )}>
                    {isScanning ? 'جاري المسح...' : config.enabled ? 'العيون نشطة ومراقبة' : 'العيون متوقفة'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  العناصر المكتشفة ({detectedElements.length})
                </span>
                <Badge variant="outline">
                  متوسط الثقة: {(stats.averageConfidence * 100).toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {detectedElements.length > 0 ? (
                  <div className="space-y-3">
                    {detectedElements.map((element) => (
                      <div 
                        key={element.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{getElementIcon(element.type)}</span>
                          <div>
                            <p className="font-medium">{element.label}</p>
                            <p className="text-sm text-muted-foreground">
                              نوع: {element.type} | موقع: ({element.bounds.x}, {element.bounds.y})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{(element.confidence * 100).toFixed(0)}%</p>
                            <Progress value={element.confidence * 100} className="w-20 h-1" />
                          </div>
                          {element.actionable && (
                            <Button size="sm" variant="outline">
                              {element.suggestedAction}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم اكتشاف عناصر بعد</p>
                    <p className="text-sm">قم بتشغيل فحص لاكتشاف العناصر</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  سجل النشاط
                </span>
                <Button variant="ghost" size="sm" onClick={() => setActivityLog([])}>
                  مسح
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {activityLog.length > 0 ? (
                  <div className="space-y-2">
                    {activityLog.map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg",
                          log.status === 'success' && "bg-success/10",
                          log.status === 'error' && "bg-destructive/10",
                          log.status === 'warning' && "bg-warning/10",
                          log.status === 'info' && "bg-muted/50"
                        )}
                      >
                        {log.status === 'success' && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
                        {log.status === 'error' && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                        {log.status === 'warning' && <AlertTriangle className="w-5 h-5 text-warning shrink-0" />}
                        {log.status === 'info' && <Eye className="w-5 h-5 text-cyan-500 shrink-0" />}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.timestamp.toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أنشطة مسجلة</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                إعدادات المراقبة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Capture */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">الالتقاط التلقائي</p>
                  <p className="text-sm text-muted-foreground">التقاط الشاشة تلقائياً</p>
                </div>
                <Switch
                  checked={config.autoCapture}
                  onCheckedChange={(autoCapture) => updateConfig({ autoCapture })}
                />
              </div>

              {/* Auto Analyze */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التحليل التلقائي</p>
                  <p className="text-sm text-muted-foreground">تحليل كل لقطة بالـ AI</p>
                </div>
                <Switch
                  checked={config.analyzeOnCapture}
                  onCheckedChange={(analyzeOnCapture) => updateConfig({ analyzeOnCapture })}
                />
              </div>

              {/* Auto Act */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التنفيذ التلقائي</p>
                  <p className="text-sm text-muted-foreground">تنفيذ الإجراءات عالية الأولوية تلقائياً</p>
                </div>
                <Switch
                  checked={config.autoAct}
                  onCheckedChange={(autoAct) => updateConfig({ autoAct })}
                />
              </div>

              {/* Highlight Elements */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تمييز العناصر</p>
                  <p className="text-sm text-muted-foreground">إظهار العناصر المكتشفة على الشاشة</p>
                </div>
                <Switch
                  checked={config.highlightElements}
                  onCheckedChange={(highlightElements) => updateConfig({ highlightElements })}
                />
              </div>

              {/* Capture Interval */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">فترة الالتقاط</p>
                  <Badge variant="outline">{config.captureInterval / 1000}ث</Badge>
                </div>
                <Slider
                  value={[config.captureInterval]}
                  onValueChange={([captureInterval]) => updateConfig({ captureInterval })}
                  min={500}
                  max={10000}
                  step={500}
                />
              </div>

              {/* Sensitivity */}
              <div className="space-y-3">
                <p className="font-medium">الحساسية</p>
                <Select 
                  value={config.sensitivity} 
                  onValueChange={(sensitivity: 'low' | 'medium' | 'high') => updateConfig({ sensitivity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">إعادة التعيين</p>
                  <p className="text-sm text-muted-foreground">حذف جميع البيانات والإحصائيات</p>
                </div>
                <Button variant="destructive" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
