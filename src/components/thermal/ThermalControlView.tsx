import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Thermometer,
  Activity,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle2,
  Snowflake,
  Flame,
  Zap,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Shield,
  History,
  Bell,
  Trash2
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  thermalManager, 
  selfHealingManager,
  ThermalState,
  ThermalWarning,
  SelfHealingEvent,
  ActivityEvent
} from '@/lib/thermalControl';

// Storage keys
const THERMAL_SETTINGS_KEY = 'thermal-control-settings';
const THERMAL_DATA_KEY = 'thermal-control-data';

interface ThermalSettings {
  enabled: boolean;
  maxTemperature: number;
  cooldownThreshold: number;
  autoCooldown: boolean;
  maxRequestsPerMinute: number;
  minDelayBetweenActions: number;
  adaptiveThrottling: boolean;
  notifyOnCritical: boolean;
  pauseOnCritical: boolean;
}

interface ProfileThermalData {
  profileId: string;
  profileName: string;
  state: ThermalState;
  actionsToday: number;
  lastReset: string;
  isPaused: boolean;
  healingEvents: SelfHealingEvent[];
}

const DEFAULT_SETTINGS: ThermalSettings = {
  enabled: true,
  maxTemperature: 80,
  cooldownThreshold: 60,
  autoCooldown: true,
  maxRequestsPerMinute: 30,
  minDelayBetweenActions: 2000,
  adaptiveThrottling: true,
  notifyOnCritical: true,
  pauseOnCritical: false
};

// Load/Save functions
const loadSettings = (): ThermalSettings => {
  try {
    const stored = localStorage.getItem(THERMAL_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to load thermal settings:', e);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: ThermalSettings) => {
  try {
    localStorage.setItem(THERMAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save thermal settings:', e);
  }
};

const loadThermalData = (): Map<string, ProfileThermalData> => {
  try {
    const stored = localStorage.getItem(THERMAL_DATA_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map<string, ProfileThermalData>();
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        map.set(key, {
          ...value,
          state: {
            ...value.state,
            lastActivity: value.state.lastActivity ? new Date(value.state.lastActivity) : null,
            cooldownUntil: value.state.cooldownUntil ? new Date(value.state.cooldownUntil) : null,
            warnings: (value.state.warnings || []).map((w: any) => ({
              ...w,
              timestamp: new Date(w.timestamp)
            }))
          },
          healingEvents: (value.healingEvents || []).map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp)
          }))
        });
      });
      return map;
    }
  } catch (e) {
    console.error('Failed to load thermal data:', e);
  }
  return new Map();
};

const saveThermalData = (data: Map<string, ProfileThermalData>) => {
  try {
    const obj: Record<string, ProfileThermalData> = {};
    data.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(THERMAL_DATA_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save thermal data:', e);
  }
};

export function ThermalControlView() {
  const { profiles } = useAppStore();
  const [thermalData, setThermalData] = useState<Map<string, ProfileThermalData>>(new Map());
  const [settings, setSettings] = useState<ThermalSettings>(DEFAULT_SETTINGS);
  const [globalStatus, setGlobalStatus] = useState<'normal' | 'elevated' | 'critical'>('normal');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    const loadedData = loadThermalData();
    setSettings(loadedSettings);
    setThermalData(loadedData);

    // Initialize missing profiles
    profiles.forEach(profile => {
      if (!loadedData.has(profile.id)) {
        const initialState = thermalManager.getState(profile.id);
        loadedData.set(profile.id, {
          profileId: profile.id,
          profileName: profile.name,
          state: initialState,
          actionsToday: 0,
          lastReset: new Date().toDateString(),
          isPaused: false,
          healingEvents: []
        });
      }
    });
    setThermalData(new Map(loadedData));
    saveThermalData(loadedData);

    if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Update global status
  useEffect(() => {
    const dataArray = Array.from(thermalData.values());
    const criticalCount = dataArray.filter(p => p.state.status === 'critical').length;
    const hotCount = dataArray.filter(p => p.state.status === 'hot').length;
    
    if (criticalCount > 0) {
      setGlobalStatus('critical');
      if (settings.notifyOnCritical) {
        toast.error('تحذير: بروفايل في حالة حرجة!', { duration: 5000 });
      }
    } else if (hotCount > 2) {
      setGlobalStatus('elevated');
    } else {
      setGlobalStatus('normal');
    }
  }, [thermalData, settings.notifyOnCritical]);

  // Cooling cycle
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      setThermalData(prev => {
        const newData = new Map(prev);
        const now = new Date();

        newData.forEach((data, profileId) => {
          // Natural cooling over time
          if (data.state.lastActivity) {
            const idleTime = now.getTime() - new Date(data.state.lastActivity).getTime();
            const coolingRate = Math.floor(idleTime / 30000); // 1 degree per 30 seconds
            data.state.temperature = Math.max(0, data.state.temperature - coolingRate * 0.5);
          }

          // Auto cooldown if enabled
          if (settings.autoCooldown && data.state.temperature > settings.cooldownThreshold) {
            data.state.temperature = Math.max(0, data.state.temperature - 2);
          }

          // Update status
          data.state.status = getStatusFromTemp(data.state.temperature);

          // Reset daily counters
          if (data.lastReset !== now.toDateString()) {
            data.actionsToday = 0;
            data.lastReset = now.toDateString();
          }

          // Clear expired cooldown
          if (data.state.cooldownUntil && now > new Date(data.state.cooldownUntil)) {
            data.state.cooldownUntil = null;
          }

          // Clear old warnings (older than 1 hour)
          data.state.warnings = data.state.warnings.filter(
            w => now.getTime() - new Date(w.timestamp).getTime() < 3600000
          );
        });

        saveThermalData(newData);
        return newData;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [settings.enabled, settings.autoCooldown, settings.cooldownThreshold]);

  const getStatusFromTemp = (temp: number): ThermalState['status'] => {
    if (temp >= 90) return 'critical';
    if (temp >= 70) return 'hot';
    if (temp >= 40) return 'warm';
    return 'cold';
  };

  const recordActivity = useCallback((profileId: string, eventType: ActivityEvent['type']) => {
    if (!settings.enabled) return;

    const heatMap: Record<ActivityEvent['type'], number> = {
      'page_load': 5,
      'click': 2,
      'scroll': 1,
      'form_submit': 8,
      'navigation': 4,
      'api_call': 6,
    };

    setThermalData(prev => {
      const newData = new Map(prev);
      const data = newData.get(profileId);
      
      if (data && !data.isPaused) {
        const heatIncrease = heatMap[eventType];
        data.state.temperature = Math.min(100, data.state.temperature + heatIncrease);
        data.state.lastActivity = new Date();
        data.state.activityScore = (data.state.activityScore || 0) + 1;
        data.actionsToday++;
        data.state.status = getStatusFromTemp(data.state.temperature);

        // Check for burst activity
        if (data.state.activityScore > settings.maxRequestsPerMinute) {
          const warning: ThermalWarning = {
            type: 'burst_detected',
            message: 'نشاط مكثف - خطر الكشف',
            timestamp: new Date(),
            severity: 'warning'
          };
          data.state.warnings.push(warning);
          
          if (settings.pauseOnCritical && data.state.status === 'critical') {
            data.isPaused = true;
            toast.warning(`تم إيقاف البروفايل ${data.profileName} تلقائياً بسبب الحرارة العالية`);
          }
        }

        newData.set(profileId, data);
        saveThermalData(newData);
      }
      
      return newData;
    });

    // Record in manager
    thermalManager.recordActivity({
      type: eventType,
      timestamp: new Date(),
      profileId
    });
  }, [settings]);

  const cooldownProfile = (profileId: string) => {
    setThermalData(prev => {
      const newData = new Map(prev);
      const data = newData.get(profileId);
      
      if (data) {
        data.state.temperature = Math.max(0, data.state.temperature - 30);
        data.state.cooldownUntil = new Date(Date.now() + 5 * 60000); // 5 minutes
        data.state.status = getStatusFromTemp(data.state.temperature);
        data.state.warnings.push({
          type: 'high_activity',
          message: 'تم فرض فترة تبريد',
          timestamp: new Date(),
          severity: 'info'
        });
        
        newData.set(profileId, data);
        saveThermalData(newData);
      }
      
      return newData;
    });
    
    thermalManager.enforceCooldown(profileId, 5);
    toast.success('تم بدء فترة التبريد');
  };

  const cooldownAll = () => {
    setThermalData(prev => {
      const newData = new Map(prev);
      
      newData.forEach((data, profileId) => {
        data.state.temperature = Math.max(0, data.state.temperature - 30);
        data.state.cooldownUntil = new Date(Date.now() + 5 * 60000);
        data.state.status = getStatusFromTemp(data.state.temperature);
      });
      
      saveThermalData(newData);
      return newData;
    });
    
    toast.success('تم بدء تبريد جميع البروفايلات');
  };

  const togglePause = (profileId: string) => {
    setThermalData(prev => {
      const newData = new Map(prev);
      const data = newData.get(profileId);
      
      if (data) {
        data.isPaused = !data.isPaused;
        newData.set(profileId, data);
        saveThermalData(newData);
        toast.success(data.isPaused ? 'تم إيقاف البروفايل مؤقتاً' : 'تم استئناف البروفايل');
      }
      
      return newData;
    });
  };

  const simulateActivity = (profileId: string) => {
    setIsSimulating(true);
    const events: ActivityEvent['type'][] = ['click', 'scroll', 'page_load', 'navigation', 'api_call'];
    let count = 0;
    
    const interval = setInterval(() => {
      if (count >= 10) {
        clearInterval(interval);
        setIsSimulating(false);
        toast.success('انتهت المحاكاة');
        return;
      }
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      recordActivity(profileId, randomEvent);
      count++;
    }, 500);
  };

  const clearWarnings = (profileId: string) => {
    setThermalData(prev => {
      const newData = new Map(prev);
      const data = newData.get(profileId);
      
      if (data) {
        data.state.warnings = [];
        newData.set(profileId, data);
        saveThermalData(newData);
      }
      
      return newData;
    });
    toast.success('تم مسح التحذيرات');
  };

  const resetProfile = (profileId: string) => {
    setThermalData(prev => {
      const newData = new Map(prev);
      const profile = profiles.find(p => p.id === profileId);
      
      if (profile) {
        newData.set(profileId, {
          profileId,
          profileName: profile.name,
          state: {
            profileId,
            temperature: 0,
            status: 'cold',
            lastActivity: null,
            activityScore: 0,
            cooldownUntil: null,
            warnings: []
          },
          actionsToday: 0,
          lastReset: new Date().toDateString(),
          isPaused: false,
          healingEvents: []
        });
        saveThermalData(newData);
      }
      
      return newData;
    });
    toast.success('تم إعادة تعيين البروفايل');
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return 'text-red-500';
    if (temp >= 70) return 'text-orange-500';
    if (temp >= 40) return 'text-yellow-500';
    return 'text-blue-400';
  };

  const getTemperatureIcon = (status: ThermalState['status']) => {
    switch (status) {
      case 'critical': return <Flame className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'hot': return <Thermometer className="w-5 h-5 text-orange-500" />;
      case 'warm': return <Thermometer className="w-5 h-5 text-yellow-500" />;
      default: return <Snowflake className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTimeSince = (date: Date | null) => {
    if (!date) return 'غير نشط';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}د`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}س`;
    return `${Math.floor(seconds / 86400)} يوم`;
  };

  const dataArray = Array.from(thermalData.values());
  const averageTemp = dataArray.length > 0 
    ? dataArray.reduce((acc, p) => acc + p.state.temperature, 0) / dataArray.length 
    : 0;

  const selectedData = selectedProfileId ? thermalData.get(selectedProfileId) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            globalStatus === 'critical' ? 'bg-red-500/20' : 
            globalStatus === 'elevated' ? 'bg-orange-500/20' : 'bg-blue-500/20'
          )}>
            <Thermometer className={cn(
              "w-8 h-8",
              globalStatus === 'critical' ? 'text-red-500 animate-pulse' : 
              globalStatus === 'elevated' ? 'text-orange-500' : 'text-blue-400'
            )} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التحكم الحراري</h1>
            <p className="text-muted-foreground">مراقبة وتبريد نشاط البروفايلات في الوقت الفعلي</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-3 py-1",
            globalStatus === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
            globalStatus === 'elevated' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
            'bg-green-500/20 text-green-400 border-green-500/30'
          )}>
            {globalStatus === 'critical' ? 'حالة حرجة' : globalStatus === 'elevated' ? 'حالة مرتفعة' : 'حالة طبيعية'}
          </Badge>
          <Button onClick={cooldownAll} variant="outline" className="gap-2">
            <Snowflake className="w-4 h-4" />
            تبريد الكل
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط الحرارة</p>
                <p className={cn("text-2xl font-bold", getTemperatureColor(averageTemp))}>
                  {averageTemp.toFixed(1)}°
                </p>
              </div>
              <Thermometer className={cn("w-8 h-8 opacity-50", getTemperatureColor(averageTemp))} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بروفايلات حرجة</p>
                <p className="text-2xl font-bold text-red-500">
                  {dataArray.filter(p => p.state.status === 'critical').length}
                </p>
              </div>
              <Flame className="w-8 h-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإجراءات اليوم</p>
                <p className="text-2xl font-bold text-primary">
                  {dataArray.reduce((acc, p) => acc + p.actionsToday, 0)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">في وضع الإيقاف</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {dataArray.filter(p => p.isPaused).length}
                </p>
              </div>
              <Pause className="w-8 h-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات التحكم الحراري
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">تفعيل النظام</p>
                <p className="text-xs text-muted-foreground">مراقبة النشاط</p>
              </div>
              <Switch 
                checked={settings.enabled} 
                onCheckedChange={(v) => setSettings(s => ({...s, enabled: v}))} 
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">تبريد تلقائي</p>
                <p className="text-xs text-muted-foreground">عند تجاوز العتبة</p>
              </div>
              <Switch 
                checked={settings.autoCooldown} 
                onCheckedChange={(v) => setSettings(s => ({...s, autoCooldown: v}))} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">تقليل السرعة التكيفي</p>
                <p className="text-xs text-muted-foreground">حسب الحرارة</p>
              </div>
              <Switch 
                checked={settings.adaptiveThrottling} 
                onCheckedChange={(v) => setSettings(s => ({...s, adaptiveThrottling: v}))} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">إشعار عند الحرج</p>
                <p className="text-xs text-muted-foreground">تنبيه فوري</p>
              </div>
              <Switch 
                checked={settings.notifyOnCritical} 
                onCheckedChange={(v) => setSettings(s => ({...s, notifyOnCritical: v}))} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">إيقاف تلقائي عند الحرج</p>
                <p className="text-xs text-muted-foreground">حماية من الحظر</p>
              </div>
              <Switch 
                checked={settings.pauseOnCritical} 
                onCheckedChange={(v) => setSettings(s => ({...s, pauseOnCritical: v}))} 
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>الحد الأقصى للحرارة</span>
                <span className="text-primary font-medium">{settings.maxTemperature}°</span>
              </div>
              <Slider 
                value={[settings.maxTemperature]} 
                onValueChange={([v]) => setSettings(s => ({...s, maxTemperature: v}))}
                min={50}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>عتبة التبريد</span>
                <span className="text-primary font-medium">{settings.cooldownThreshold}°</span>
              </div>
              <Slider 
                value={[settings.cooldownThreshold]} 
                onValueChange={([v]) => setSettings(s => ({...s, cooldownThreshold: v}))}
                min={30}
                max={80}
                step={5}
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <div className="flex justify-between text-sm">
                <span>أقصى طلبات/دقيقة</span>
                <span className="text-primary font-medium">{settings.maxRequestsPerMinute}</span>
              </div>
              <Slider 
                value={[settings.maxRequestsPerMinute]} 
                onValueChange={([v]) => setSettings(s => ({...s, maxRequestsPerMinute: v}))}
                min={5}
                max={60}
                step={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thermal Monitor */}
        <Card className="glass-effect lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                مراقب الحرارة ({dataArray.length} بروفايل)
              </CardTitle>
              {selectedData && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => simulateActivity(selectedProfileId!)}
                    disabled={isSimulating || selectedData.isPaused}
                  >
                    {isSimulating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePause(selectedProfileId!)}
                  >
                    {selectedData.isPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {dataArray.map((data) => (
                  <div 
                    key={data.profileId}
                    onClick={() => setSelectedProfileId(data.profileId)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedProfileId === data.profileId ? 'ring-2 ring-primary' : '',
                      data.state.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                      data.state.status === 'hot' ? 'bg-orange-500/10 border-orange-500/30' :
                      data.isPaused ? 'bg-yellow-500/10 border-yellow-500/30' :
                      data.state.cooldownUntil ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-card/50 border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {data.isPaused ? (
                          <Pause className="w-5 h-5 text-yellow-400" />
                        ) : data.state.cooldownUntil ? (
                          <Snowflake className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          getTemperatureIcon(data.state.status)
                        )}
                        <div>
                          <span className="font-medium">{data.profileName}</span>
                          {data.isPaused && (
                            <Badge variant="outline" className="ml-2 text-xs text-yellow-400 border-yellow-400/50">
                              متوقف
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-bold", getTemperatureColor(data.state.temperature))}>
                          {data.state.temperature.toFixed(1)}°
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            cooldownProfile(data.profileId);
                          }}
                          disabled={!!data.state.cooldownUntil}
                        >
                          <Snowflake className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground text-xs">النشاط/د</p>
                        <p className="font-medium">{data.state.activityScore || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">إجراءات اليوم</p>
                        <p className="font-medium">{data.actionsToday}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">التحذيرات</p>
                        <p className={cn(
                          "font-medium",
                          data.state.warnings.length > 0 ? 'text-yellow-400' : 'text-green-400'
                        )}>
                          {data.state.warnings.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">آخر نشاط</p>
                        <p className="font-medium">{getTimeSince(data.state.lastActivity)}</p>
                      </div>
                    </div>

                    <Progress 
                      value={data.state.temperature} 
                      className={cn(
                        "h-2",
                        data.state.status === 'critical' ? '[&>div]:bg-red-500' :
                        data.state.status === 'hot' ? '[&>div]:bg-orange-500' :
                        data.state.status === 'warm' ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-blue-400'
                      )}
                    />

                    {/* Warnings */}
                    {data.state.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {data.state.warnings.slice(-2).map((warning, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <AlertTriangle className={cn(
                              "w-3 h-3",
                              warning.severity === 'critical' ? 'text-red-400' :
                              warning.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                            )} />
                            <span className="text-muted-foreground">{warning.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {dataArray.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد بروفايلات للمراقبة</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Profile Details */}
      {selectedData && (
        <Card className="glass-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                تفاصيل: {selectedData.profileName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearWarnings(selectedProfileId!)}
                  disabled={selectedData.state.warnings.length === 0}
                >
                  <Bell className="w-4 h-4 mr-1" />
                  مسح التحذيرات
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetProfile(selectedProfileId!)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warnings List */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  التحذيرات ({selectedData.state.warnings.length})
                </h4>
                <ScrollArea className="h-[150px]">
                  {selectedData.state.warnings.length > 0 ? (
                    <div className="space-y-2">
                      {selectedData.state.warnings.map((warning, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-2 rounded text-sm flex items-center justify-between",
                            warning.severity === 'critical' ? 'bg-red-500/10' :
                            warning.severity === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                          )}
                        >
                          <span>{warning.message}</span>
                          <span className="text-xs text-muted-foreground">
                            {getTimeSince(warning.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      لا توجد تحذيرات
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className={cn("text-2xl font-bold", getTemperatureColor(selectedData.state.temperature))}>
                    {selectedData.state.temperature.toFixed(1)}°
                  </p>
                  <p className="text-xs text-muted-foreground">الحرارة</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-primary">{selectedData.actionsToday}</p>
                  <p className="text-xs text-muted-foreground">إجراءات اليوم</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-2xl font-bold text-blue-400">{selectedData.state.activityScore || 0}</p>
                  <p className="text-xs text-muted-foreground">النشاط/دقيقة</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className={cn(
                    "text-2xl font-bold",
                    selectedData.isPaused ? 'text-yellow-400' : 'text-green-400'
                  )}>
                    {selectedData.isPaused ? 'متوقف' : 'نشط'}
                  </p>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
