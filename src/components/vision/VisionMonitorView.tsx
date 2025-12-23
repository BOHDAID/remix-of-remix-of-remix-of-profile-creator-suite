import { useState, useEffect, useCallback } from 'react';
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

    setIsScanning(true);
    setScanProgress(0);

    // Simulate progressive scan
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 200));
    }

    // Run actual detection
    const testSession = visionMonitor.startSession('manual_scan');
    const capture = await visionMonitor.captureScreen('manual_scan');
    
    if (capture) {
      const analysis = await visionMonitor.analyzeCapture('manual_scan', capture);
      if (analysis) {
        setCurrentAnalysis(analysis);
        setDetectedElements(analysis.elements);
        toast.success(`تم اكتشاف ${analysis.elements.length} عنصر`);
      }
    }

    visionMonitor.stopSession('manual_scan');
    setIsScanning(false);
  }, [config.enabled]);

  const handleReset = () => {
    visionMonitor.resetStats();
    setStats(visionMonitor.getStats());
    setActivityLog([]);
    setCurrentAnalysis(null);
    setDetectedElements([]);
    toast.success('تم إعادة تعيين البيانات');
  };

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
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام مراقبة وتحليل الشاشة بالذكاء الاصطناعي
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            disabled={isScanning || !config.enabled}
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
