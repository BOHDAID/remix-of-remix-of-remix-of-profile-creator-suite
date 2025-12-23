import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Play, 
  Pause, 
  Shield, 
  Fingerprint, 
  Network, 
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity,
  Eye,
  Lock,
  Cpu,
  Thermometer
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface AutonomousTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  progress: number;
  message: string;
  icon: React.ReactNode;
}

interface AutoProfile {
  profileId: string;
  profileName: string;
  status: 'queued' | 'scanning' | 'repairing' | 'launching' | 'running' | 'completed' | 'failed';
  tasks: AutonomousTask[];
  overallProgress: number;
  securityScore: number;
}

export function AutonomousModeView() {
  const { profiles } = useAppStore();
  const [isActive, setIsActive] = useState(false);
  const [autoProfiles, setAutoProfiles] = useState<AutoProfile[]>([]);
  const [globalSettings, setGlobalSettings] = useState({
    autoRepair: true,
    autoRotateFingerprint: true,
    autoTestProxy: true,
    autoWarmup: true,
    thermalProtection: true,
    riskThreshold: 30,
    parallelProfiles: 3
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isActive && profiles.length > 0) {
      initializeAutonomousMode();
    }
  }, [isActive, profiles]);

  const initializeAutonomousMode = () => {
    const initialProfiles: AutoProfile[] = profiles.slice(0, 5).map(p => ({
      profileId: p.id,
      profileName: p.name,
      status: 'queued',
      overallProgress: 0,
      securityScore: 0,
      tasks: [
        { id: '1', name: 'فحص البصمة', status: 'pending', progress: 0, message: 'في الانتظار...', icon: <Fingerprint className="w-4 h-4" /> },
        { id: '2', name: 'فحص البروكسي', status: 'pending', progress: 0, message: 'في الانتظار...', icon: <Network className="w-4 h-4" /> },
        { id: '3', name: 'تحليل المخاطر', status: 'pending', progress: 0, message: 'في الانتظار...', icon: <Shield className="w-4 h-4" /> },
        { id: '4', name: 'إصلاح تلقائي', status: 'pending', progress: 0, message: 'في الانتظار...', icon: <RefreshCw className="w-4 h-4" /> },
        { id: '5', name: 'تشغيل آمن', status: 'pending', progress: 0, message: 'في الانتظار...', icon: <Play className="w-4 h-4" /> },
      ]
    }));
    setAutoProfiles(initialProfiles);
    addLog('تم تهيئة الوضع التلقائي');
    simulateAutonomousExecution(initialProfiles);
  };

  const simulateAutonomousExecution = async (initialProfiles: AutoProfile[]) => {
    for (let i = 0; i < initialProfiles.length; i++) {
      if (!isActive) break;
      
      const profile = initialProfiles[i];
      addLog(`بدء معالجة: ${profile.profileName}`);
      
      // Update profile status to scanning
      setAutoProfiles(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'scanning' } : p
      ));

      // Simulate each task
      for (let taskIdx = 0; taskIdx < profile.tasks.length; taskIdx++) {
        await simulateTask(i, taskIdx);
      }

      // Mark profile as completed
      setAutoProfiles(prev => prev.map((p, idx) => 
        idx === i ? { ...p, status: 'completed', overallProgress: 100, securityScore: 85 + Math.random() * 15 } : p
      ));
      addLog(`اكتمل: ${profile.profileName} - نتيجة الأمان: ${(85 + Math.random() * 15).toFixed(0)}%`);
    }
  };

  const simulateTask = (profileIdx: number, taskIdx: number): Promise<void> => {
    return new Promise((resolve) => {
      const taskNames = ['فحص البصمة', 'فحص البروكسي', 'تحليل المخاطر', 'إصلاح تلقائي', 'تشغيل آمن'];
      
      setAutoProfiles(prev => prev.map((p, idx) => {
        if (idx !== profileIdx) return p;
        const newTasks = [...p.tasks];
        newTasks[taskIdx] = { ...newTasks[taskIdx], status: 'running', message: 'جاري التنفيذ...' };
        return { ...p, tasks: newTasks, status: taskIdx < 3 ? 'scanning' : taskIdx === 3 ? 'repairing' : 'launching' };
      }));

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setAutoProfiles(prev => prev.map((p, idx) => {
          if (idx !== profileIdx) return p;
          const newTasks = [...p.tasks];
          newTasks[taskIdx] = { ...newTasks[taskIdx], progress };
          const overallProgress = ((taskIdx * 100 + progress) / (p.tasks.length * 100)) * 100;
          return { ...p, tasks: newTasks, overallProgress };
        }));

        if (progress >= 100) {
          clearInterval(interval);
          const success = Math.random() > 0.1;
          setAutoProfiles(prev => prev.map((p, idx) => {
            if (idx !== profileIdx) return p;
            const newTasks = [...p.tasks];
            newTasks[taskIdx] = { 
              ...newTasks[taskIdx], 
              status: success ? 'completed' : 'warning',
              progress: 100,
              message: success ? 'تم بنجاح' : 'تحذير بسيط'
            };
            return { ...p, tasks: newTasks };
          }));
          addLog(`${taskNames[taskIdx]} - ${success ? 'نجاح' : 'تحذير'}`);
          resolve();
        }
      }, 100);
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getProfileStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      queued: 'bg-muted text-muted-foreground',
      scanning: 'bg-blue-500/20 text-blue-400',
      repairing: 'bg-orange-500/20 text-orange-400',
      launching: 'bg-purple-500/20 text-purple-400',
      running: 'bg-success/20 text-success',
      completed: 'bg-success/20 text-success',
      failed: 'bg-destructive/20 text-destructive'
    };
    const labels: Record<string, string> = {
      queued: 'في الانتظار',
      scanning: 'جاري الفحص',
      repairing: 'جاري الإصلاح',
      launching: 'جاري التشغيل',
      running: 'يعمل',
      completed: 'مكتمل',
      failed: 'فشل'
    };
    return <Badge className={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الوضع التلقائي</h1>
            <p className="text-muted-foreground">فحص وإصلاح وتشغيل البروفايلات تلقائياً</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => setIsActive(!isActive)}
          className={cn(
            "gap-2",
            isActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isActive ? 'إيقاف' : 'تشغيل'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات الوضع التلقائي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span>إصلاح تلقائي</span>
              </div>
              <Switch 
                checked={globalSettings.autoRepair} 
                onCheckedChange={(v) => setGlobalSettings(s => ({...s, autoRepair: v}))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-muted-foreground" />
                <span>تدوير البصمة</span>
              </div>
              <Switch 
                checked={globalSettings.autoRotateFingerprint} 
                onCheckedChange={(v) => setGlobalSettings(s => ({...s, autoRotateFingerprint: v}))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-muted-foreground" />
                <span>فحص البروكسي</span>
              </div>
              <Switch 
                checked={globalSettings.autoTestProxy} 
                onCheckedChange={(v) => setGlobalSettings(s => ({...s, autoTestProxy: v}))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span>تسخين الجلسة</span>
              </div>
              <Switch 
                checked={globalSettings.autoWarmup} 
                onCheckedChange={(v) => setGlobalSettings(s => ({...s, autoWarmup: v}))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-muted-foreground" />
                <span>الحماية الحرارية</span>
              </div>
              <Switch 
                checked={globalSettings.thermalProtection} 
                onCheckedChange={(v) => setGlobalSettings(s => ({...s, thermalProtection: v}))} 
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">حد المخاطر</span>
                <span className="text-sm text-primary">{globalSettings.riskThreshold}%</span>
              </div>
              <Progress value={globalSettings.riskThreshold} className="h-2" />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">البروفايلات المتوازية</span>
                <span className="text-sm text-primary">{globalSettings.parallelProfiles}</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 10].map(n => (
                  <Button
                    key={n}
                    size="sm"
                    variant={globalSettings.parallelProfiles === n ? 'default' : 'outline'}
                    onClick={() => setGlobalSettings(s => ({...s, parallelProfiles: n}))}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Profiles */}
        <Card className="glass-effect lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              البروفايلات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {autoProfiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>اضغط "تشغيل" لبدء الوضع التلقائي</p>
                  </div>
                ) : (
                  autoProfiles.map((profile) => (
                    <div key={profile.profileId} className="p-4 rounded-lg bg-card/50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-primary" />
                          <span className="font-medium">{profile.profileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getProfileStatusBadge(profile.status)}
                          {profile.securityScore > 0 && (
                            <Badge variant="outline" className="bg-success/10 text-success">
                              {profile.securityScore.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Progress value={profile.overallProgress} className="h-2 mb-3" />
                      
                      <div className="grid grid-cols-5 gap-2">
                        {profile.tasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="flex flex-col items-center gap-1 p-2 rounded bg-background/50"
                            title={task.message}
                          >
                            {getStatusIcon(task.status)}
                            <span className="text-xs text-center">{task.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            سجل العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1 font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">لا توجد سجلات بعد...</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="text-muted-foreground hover:text-foreground transition-colors">
                    {log}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
