import { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface ProfileThermal {
  profileId: string;
  profileName: string;
  temperature: number;
  requestsPerMinute: number;
  lastActivity: Date;
  status: 'cold' | 'warm' | 'hot' | 'critical' | 'cooling';
  actionsToday: number;
  suspicionLevel: number;
}

export function ThermalControlView() {
  const { profiles } = useAppStore();
  const [thermalData, setThermalData] = useState<ProfileThermal[]>([]);
  const [settings, setSettings] = useState({
    enabled: true,
    maxTemperature: 80,
    cooldownThreshold: 60,
    autoCooldown: true,
    maxRequestsPerMinute: 30,
    minDelayBetweenActions: 2000,
    adaptiveThrottling: true
  });
  const [globalStatus, setGlobalStatus] = useState<'normal' | 'elevated' | 'critical'>('normal');

  useEffect(() => {
    initializeThermalData();
    const interval = setInterval(updateThermalData, 2000);
    return () => clearInterval(interval);
  }, [profiles]);

  const initializeThermalData = () => {
    const data: ProfileThermal[] = profiles.slice(0, 8).map(p => ({
      profileId: p.id,
      profileName: p.name,
      temperature: Math.random() * 60 + 20,
      requestsPerMinute: Math.floor(Math.random() * 40),
      lastActivity: new Date(Date.now() - Math.random() * 3600000),
      status: 'cold',
      actionsToday: Math.floor(Math.random() * 200),
      suspicionLevel: Math.random() * 30
    }));
    updateStatuses(data);
    setThermalData(data);
  };

  const updateStatuses = (data: ProfileThermal[]) => {
    data.forEach(p => {
      if (p.temperature >= 90) p.status = 'critical';
      else if (p.temperature >= 70) p.status = 'hot';
      else if (p.temperature >= 40) p.status = 'warm';
      else p.status = 'cold';
    });

    const criticalCount = data.filter(p => p.status === 'critical').length;
    const hotCount = data.filter(p => p.status === 'hot').length;
    
    if (criticalCount > 0) setGlobalStatus('critical');
    else if (hotCount > 2) setGlobalStatus('elevated');
    else setGlobalStatus('normal');
  };

  const updateThermalData = () => {
    setThermalData(prev => {
      const updated = prev.map(p => {
        let tempChange = (Math.random() - 0.5) * 10;
        if (p.status === 'cooling') tempChange = -5;
        if (settings.autoCooldown && p.temperature > settings.cooldownThreshold) {
          tempChange = -3;
        }
        
        const newTemp = Math.max(20, Math.min(100, p.temperature + tempChange));
        const newRpm = Math.max(0, p.requestsPerMinute + Math.floor((Math.random() - 0.5) * 10));
        
        return {
          ...p,
          temperature: newTemp,
          requestsPerMinute: newRpm,
          actionsToday: p.actionsToday + (Math.random() > 0.7 ? 1 : 0),
          suspicionLevel: Math.max(0, Math.min(100, p.suspicionLevel + (Math.random() - 0.5) * 5))
        };
      });
      updateStatuses(updated);
      return updated;
    });
  };

  const cooldownProfile = (profileId: string) => {
    setThermalData(prev => prev.map(p => 
      p.profileId === profileId ? { ...p, status: 'cooling' as const, temperature: p.temperature - 10 } : p
    ));
  };

  const cooldownAll = () => {
    setThermalData(prev => prev.map(p => ({ ...p, status: 'cooling' as const, temperature: Math.max(20, p.temperature - 15) })));
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return 'text-red-500';
    if (temp >= 70) return 'text-orange-500';
    if (temp >= 40) return 'text-yellow-500';
    return 'text-blue-400';
  };

  const getTemperatureIcon = (status: string) => {
    switch (status) {
      case 'critical': return <Flame className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'hot': return <Thermometer className="w-5 h-5 text-orange-500" />;
      case 'warm': return <Thermometer className="w-5 h-5 text-yellow-500" />;
      case 'cooling': return <Snowflake className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return <Snowflake className="w-5 h-5 text-blue-400" />;
    }
  };

  const averageTemp = thermalData.length > 0 
    ? thermalData.reduce((acc, p) => acc + p.temperature, 0) / thermalData.length 
    : 0;

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
            <p className="text-muted-foreground">مراقبة وتبريد نشاط البروفايلات</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            globalStatus === 'critical' ? 'bg-red-500/20 text-red-400' :
            globalStatus === 'elevated' ? 'bg-orange-500/20 text-orange-400' :
            'bg-success/20 text-success'
          )}>
            {globalStatus === 'critical' ? 'حرج' : globalStatus === 'elevated' ? 'مرتفع' : 'طبيعي'}
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
              <Thermometer className={cn("w-8 h-8", getTemperatureColor(averageTemp))} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">بروفايلات حرجة</p>
                <p className="text-2xl font-bold text-red-500">
                  {thermalData.filter(p => p.status === 'critical').length}
                </p>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات/د</p>
                <p className="text-2xl font-bold text-primary">
                  {thermalData.reduce((acc, p) => acc + p.requestsPerMinute, 0)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">في وضع التبريد</p>
                <p className="text-2xl font-bold text-blue-400">
                  {thermalData.filter(p => p.status === 'cooling').length}
                </p>
              </div>
              <Snowflake className="w-8 h-8 text-blue-400" />
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
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span>تفعيل النظام</span>
              <Switch 
                checked={settings.enabled} 
                onCheckedChange={(v) => setSettings(s => ({...s, enabled: v}))} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span>تبريد تلقائي</span>
              <Switch 
                checked={settings.autoCooldown} 
                onCheckedChange={(v) => setSettings(s => ({...s, autoCooldown: v}))} 
              />
            </div>

            <div className="flex items-center justify-between">
              <span>تقليل السرعة التكيفي</span>
              <Switch 
                checked={settings.adaptiveThrottling} 
                onCheckedChange={(v) => setSettings(s => ({...s, adaptiveThrottling: v}))} 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>الحد الأقصى للحرارة</span>
                <span className="text-primary">{settings.maxTemperature}°</span>
              </div>
              <Slider 
                value={[settings.maxTemperature]} 
                onValueChange={([v]) => setSettings(s => ({...s, maxTemperature: v}))}
                min={50}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>عتبة التبريد</span>
                <span className="text-primary">{settings.cooldownThreshold}°</span>
              </div>
              <Slider 
                value={[settings.cooldownThreshold]} 
                onValueChange={([v]) => setSettings(s => ({...s, cooldownThreshold: v}))}
                min={30}
                max={80}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>أقصى طلبات/دقيقة</span>
                <span className="text-primary">{settings.maxRequestsPerMinute}</span>
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
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              مراقب الحرارة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {thermalData.map((profile) => (
                  <div 
                    key={profile.profileId}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      profile.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                      profile.status === 'hot' ? 'bg-orange-500/10 border-orange-500/30' :
                      profile.status === 'cooling' ? 'bg-blue-500/10 border-blue-500/30' :
                      'bg-card/50 border-border'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTemperatureIcon(profile.status)}
                        <span className="font-medium">{profile.profileName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-lg font-bold", getTemperatureColor(profile.temperature))}>
                          {profile.temperature.toFixed(1)}°
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => cooldownProfile(profile.profileId)}
                          disabled={profile.status === 'cooling'}
                        >
                          <Snowflake className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">طلبات/د</p>
                        <p className="font-medium">{profile.requestsPerMinute}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">إجراءات اليوم</p>
                        <p className="font-medium">{profile.actionsToday}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">مستوى الشك</p>
                        <p className={cn(
                          "font-medium",
                          profile.suspicionLevel > 50 ? 'text-red-400' :
                          profile.suspicionLevel > 25 ? 'text-yellow-400' : 'text-success'
                        )}>
                          {profile.suspicionLevel.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">آخر نشاط</p>
                        <p className="font-medium">
                          {Math.floor((Date.now() - profile.lastActivity.getTime()) / 60000)}د
                        </p>
                      </div>
                    </div>

                    <Progress 
                      value={profile.temperature} 
                      className={cn(
                        "h-2 mt-3",
                        profile.status === 'critical' ? '[&>div]:bg-red-500' :
                        profile.status === 'hot' ? '[&>div]:bg-orange-500' :
                        profile.status === 'cooling' ? '[&>div]:bg-blue-400' :
                        ''
                      )}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
