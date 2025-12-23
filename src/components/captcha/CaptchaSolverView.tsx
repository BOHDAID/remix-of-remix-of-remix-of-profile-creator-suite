import { useState, useEffect } from 'react';
import { 
  Bot, 
  Brain, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Settings2,
  Sparkles,
  Clock,
  Target,
  Activity,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  captchaSolver, 
  SolverEvent,
  CaptchaSolverStats,
  CaptchaSolverConfig,
  SolverSession
} from '@/lib/captchaSolver';

interface SolveLog {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  status: 'success' | 'error' | 'info' | 'warning';
}

export function CaptchaSolverView() {
  const { isRTL } = useTranslation();
  const { profiles } = useAppStore();
  
  const [config, setConfig] = useState<CaptchaSolverConfig>(captchaSolver.getConfig());
  const [stats, setStats] = useState<CaptchaSolverStats>(captchaSolver.getStats());
  const [sessions, setSessions] = useState<SolverSession[]>([]);
  const [solveLogs, setSolveLogs] = useState<SolveLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Subscribe to solver events
    const unsubscribe = captchaSolver.subscribe((event: SolverEvent) => {
      handleSolverEvent(event);
      setStats(captchaSolver.getStats());
      setSessions(captchaSolver.getAllSessions());
    });

    return () => { unsubscribe(); };
  }, []);

  const handleSolverEvent = (event: SolverEvent) => {
    const log: SolveLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: event.type,
      message: '',
      status: 'info',
    };

    switch (event.type) {
      case 'captcha_detected':
        log.message = `تم اكتشاف CAPTCHA من نوع ${event.captchaType}`;
        log.status = 'warning';
        break;
      case 'solving_started':
        log.message = `بدء حل ${event.captchaType} - المحاولة ${event.attempt}`;
        log.status = 'info';
        break;
      case 'retry':
        log.message = `إعادة المحاولة ${event.attempt} لـ ${event.captchaType}`;
        log.status = 'warning';
        break;
      case 'solved':
        log.message = `تم حل ${event.captchaType} في ${(event.timeToSolve / 1000).toFixed(1)}ث بعد ${event.attempts} محاولات`;
        log.status = 'success';
        toast.success(`تم حل CAPTCHA بنجاح!`);
        break;
      case 'failed':
        log.message = `فشل حل ${event.captchaType} بعد ${event.attempts} محاولات`;
        log.status = 'error';
        break;
      default:
        return;
    }

    setSolveLogs(prev => [log, ...prev].slice(0, 50));
  };

  const updateConfig = (updates: Partial<CaptchaSolverConfig>) => {
    captchaSolver.updateConfig(updates);
    setConfig(captchaSolver.getConfig());
  };

  const handleSimulate = async () => {
    if (!config.enabled) {
      toast.error('يرجى تفعيل حل CAPTCHA أولاً');
      return;
    }

    setIsSimulating(true);
    const testProfileId = 'simulation_' + Date.now();
    
    captchaSolver.startSession(testProfileId);
    
    // Simulate different CAPTCHA types
    const types = ['recaptcha-v2', 'hcaptcha', 'text', 'image'];
    
    for (const type of types) {
      await captchaSolver.solveCaptcha(testProfileId, type);
      await new Promise(r => setTimeout(r, 500));
    }
    
    captchaSolver.stopSession(testProfileId);
    setIsSimulating(false);
    
    toast.success('اكتملت المحاكاة!');
  };

  const handleReset = () => {
    captchaSolver.resetLearning();
    setStats(captchaSolver.getStats());
    setSolveLogs([]);
    toast.success('تم إعادة تعيين بيانات التعلم');
  };

  const captchaTypes = [
    { id: 'recaptcha-v2', name: 'reCAPTCHA v2', icon: '🔲' },
    { id: 'recaptcha-v3', name: 'reCAPTCHA v3', icon: '✅' },
    { id: 'hcaptcha', name: 'hCaptcha', icon: '🤖' },
    { id: 'text', name: 'Text CAPTCHA', icon: '🔤' },
    { id: 'image', name: 'Image CAPTCHA', icon: '🖼️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            حل CAPTCHA الذكي
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام ذكاء اصطناعي يتعلم ويتحسن تلقائياً
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">تفعيل</span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSimulate}
            disabled={isSimulating || !config.enabled}
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 animate-spin ml-2" />
            ) : (
              <Play className="w-4 h-4 ml-2" />
            )}
            محاكاة
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="learning">التعلم الذاتي</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <Badge variant="secondary">إجمالي</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.totalAttempts}</p>
                <p className="text-sm text-muted-foreground">محاولات حل</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <Badge className="bg-success/20 text-success">نجاح</Badge>
                </div>
                <p className="text-3xl font-bold text-success">{stats.successfulSolves}</p>
                <p className="text-sm text-muted-foreground">تم حلها</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <Badge variant="outline">{stats.successRate.toFixed(1)}%</Badge>
                </div>
                <p className="text-3xl font-bold">{stats.successRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">معدل النجاح</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <Badge variant="outline">متوسط</Badge>
                </div>
                <p className="text-3xl font-bold">{(stats.averageTime / 1000).toFixed(1)}ث</p>
                <p className="text-sm text-muted-foreground">وقت الحل</p>
              </CardContent>
            </Card>
          </div>

          {/* CAPTCHA Types Performance */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                أداء أنواع CAPTCHA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {captchaTypes.map((type) => {
                  const typeStats = stats.typeStats[type.id] || { success: 0, failed: 0 };
                  const total = typeStats.success + typeStats.failed;
                  const rate = total > 0 ? (typeStats.success / total) * 100 : 0;
                  
                  return (
                    <div key={type.id} className="flex items-center gap-4">
                      <span className="text-2xl w-10">{type.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {typeStats.success}/{total} ({rate.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          {/* Learning Progress */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                تقدم التعلم الذاتي
              </CardTitle>
              <CardDescription>
                النظام يتعلم من كل محاولة ويحسن أداءه تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * stats.learningProgress) / 100}
                        className="text-primary transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{stats.learningProgress.toFixed(0)}%</span>
                      <span className="text-sm text-muted-foreground">تقدم التعلم</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                    <p className="text-xs text-muted-foreground">تجارب مكتسبة</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
                    <p className="text-2xl font-bold">+{((stats.learningProgress / 10) * 2).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">تحسن في الأداء</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Gauge className="w-6 h-6 mx-auto mb-2 text-warning" />
                    <p className="text-2xl font-bold">{config.confidenceThreshold}%</p>
                    <p className="text-xs text-muted-foreground">عتبة الثقة</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">إعادة تعيين التعلم</p>
                  <p className="text-sm text-muted-foreground">حذف جميع البيانات المكتسبة والبدء من جديد</p>
                </div>
                <Button variant="destructive" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>كيف يعمل التعلم الذاتي؟</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: '🔍', title: 'اكتشاف', desc: 'يراقب النظام الصفحة ويكتشف أنواع CAPTCHA المختلفة' },
                  { icon: '🧠', title: 'تحليل', desc: 'يحلل النمط ويختار أفضل استراتيجية للحل' },
                  { icon: '🎯', title: 'تنفيذ', desc: 'يحاول حل CAPTCHA مع إعادة المحاولة عند الفشل' },
                  { icon: '📚', title: 'تعلم', desc: 'يتعلم من كل محاولة ويحسن الاستراتيجيات' },
                  { icon: '✨', title: 'تحسين', desc: 'يزداد معدل النجاح مع الوقت والتجربة' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  سجل العمليات
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSolveLogs([])}>
                  مسح
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {solveLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد سجلات بعد</p>
                    <p className="text-sm">قم بتشغيل محاكاة أو تفعيل البروفايل لرؤية السجلات</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {solveLogs.map((log) => (
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
                        {log.status === 'warning' && <Zap className="w-5 h-5 text-warning shrink-0" />}
                        {log.status === 'info' && <Bot className="w-5 h-5 text-primary shrink-0" />}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.timestamp.toLocaleTimeString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
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
                إعدادات الحل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Solve */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">حل تلقائي</p>
                  <p className="text-sm text-muted-foreground">حل CAPTCHA تلقائياً عند اكتشافها</p>
                </div>
                <Switch
                  checked={config.autoSolve}
                  onCheckedChange={(autoSolve) => updateConfig({ autoSolve })}
                />
              </div>

              {/* Learn from Errors */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التعلم من الأخطاء</p>
                  <p className="text-sm text-muted-foreground">تحسين الأداء بناءً على المحاولات الفاشلة</p>
                </div>
                <Switch
                  checked={config.learnFromErrors}
                  onCheckedChange={(learnFromErrors) => updateConfig({ learnFromErrors })}
                />
              </div>

              {/* Max Retries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">أقصى عدد محاولات</p>
                  <Badge variant="outline">{config.maxRetries}</Badge>
                </div>
                <Slider
                  value={[config.maxRetries]}
                  onValueChange={([maxRetries]) => updateConfig({ maxRetries })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              {/* Retry Delay */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">تأخير إعادة المحاولة</p>
                  <Badge variant="outline">{config.retryDelay}ms</Badge>
                </div>
                <Slider
                  value={[config.retryDelay]}
                  onValueChange={([retryDelay]) => updateConfig({ retryDelay })}
                  min={500}
                  max={5000}
                  step={100}
                />
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">عتبة الثقة</p>
                  <Badge variant="outline">{config.confidenceThreshold}%</Badge>
                </div>
                <Slider
                  value={[config.confidenceThreshold]}
                  onValueChange={([confidenceThreshold]) => updateConfig({ confidenceThreshold })}
                  min={50}
                  max={99}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأدنى من الثقة المطلوب لقبول الحل
                </p>
              </div>

              {/* Supported Types */}
              <div className="space-y-3">
                <p className="font-medium">أنواع CAPTCHA المدعومة</p>
                <div className="grid grid-cols-2 gap-2">
                  {captchaTypes.map((type) => (
                    <div
                      key={type.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                        config.supportedTypes.includes(type.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => {
                        const supported = config.supportedTypes.includes(type.id)
                          ? config.supportedTypes.filter(t => t !== type.id)
                          : [...config.supportedTypes, type.id];
                        updateConfig({ supportedTypes: supported });
                      }}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-sm">{type.name}</span>
                      {config.supportedTypes.includes(type.id) && (
                        <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
