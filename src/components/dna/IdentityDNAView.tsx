import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dna,
  RefreshCw,
  Clock,
  Shield,
  Fingerprint,
  Activity,
  Settings,
  Sparkles,
  Zap,
  History,
  TrendingUp,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DNAProfile {
  profileId: string;
  profileName: string;
  dnaVersion: number;
  mutationRate: number;
  lastMutation: Date;
  nextMutation: Date;
  stability: number;
  traits: DNATrait[];
  history: DNAMutation[];
}

interface DNATrait {
  name: string;
  value: string;
  mutable: boolean;
  lastChanged: Date;
}

interface DNAMutation {
  id: string;
  timestamp: Date;
  trait: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export function IdentityDNAView() {
  const { profiles } = useAppStore();
  const [dnaProfiles, setDnaProfiles] = useState<DNAProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<DNAProfile | null>(null);
  const [settings, setSettings] = useState({
    autoMutation: true,
    mutationInterval: 24, // hours
    preserveCore: true,
    smartMutation: true,
    antiPattern: true
  });

  useEffect(() => {
    initializeDNA();
  }, [profiles]);

  const initializeDNA = () => {
    const data: DNAProfile[] = profiles.slice(0, 6).map(p => ({
      profileId: p.id,
      profileName: p.name,
      dnaVersion: Math.floor(Math.random() * 50) + 1,
      mutationRate: Math.random() * 0.3 + 0.1,
      lastMutation: new Date(Date.now() - Math.random() * 86400000),
      nextMutation: new Date(Date.now() + Math.random() * 86400000),
      stability: 70 + Math.random() * 25,
      traits: [
        { name: 'User Agent', value: 'Chrome 120.0.0', mutable: true, lastChanged: new Date() },
        { name: 'Screen Resolution', value: '1920x1080', mutable: true, lastChanged: new Date() },
        { name: 'Timezone', value: 'Asia/Riyadh', mutable: false, lastChanged: new Date() },
        { name: 'Language', value: 'ar-SA', mutable: false, lastChanged: new Date() },
        { name: 'Platform', value: 'Win32', mutable: true, lastChanged: new Date() },
        { name: 'WebGL Vendor', value: 'Google Inc.', mutable: true, lastChanged: new Date() },
        { name: 'Audio Hash', value: generateHash(), mutable: true, lastChanged: new Date() },
        { name: 'Canvas Hash', value: generateHash(), mutable: true, lastChanged: new Date() },
      ],
      history: generateMutationHistory()
    }));
    setDnaProfiles(data);
    if (data.length > 0) setSelectedProfile(data[0]);
  };

  const generateHash = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const generateMutationHistory = (): DNAMutation[] => {
    const traits = ['User Agent', 'Screen Resolution', 'Audio Hash', 'Canvas Hash', 'WebGL Vendor'];
    return Array.from({ length: 5 }, (_, i) => ({
      id: `mut-${i}`,
      timestamp: new Date(Date.now() - i * 3600000 * 6),
      trait: traits[Math.floor(Math.random() * traits.length)],
      oldValue: generateHash(),
      newValue: generateHash(),
      reason: ['تحديث دوري', 'اكتشاف نمط', 'طلب يدوي', 'تغيير تلقائي'][Math.floor(Math.random() * 4)]
    }));
  };

  const triggerMutation = (profileId: string) => {
    setDnaProfiles(prev => prev.map(p => {
      if (p.profileId !== profileId) return p;
      
      const mutatedTraits = p.traits.map(t => {
        if (!t.mutable) return t;
        if (Math.random() > p.mutationRate) return t;
        return { ...t, value: generateHash(), lastChanged: new Date() };
      });

      const newMutation: DNAMutation = {
        id: `mut-${Date.now()}`,
        timestamp: new Date(),
        trait: 'Multiple',
        oldValue: 'Various',
        newValue: 'Mutated',
        reason: 'طلب يدوي'
      };

      return {
        ...p,
        traits: mutatedTraits,
        dnaVersion: p.dnaVersion + 1,
        lastMutation: new Date(),
        nextMutation: new Date(Date.now() + settings.mutationInterval * 3600000),
        history: [newMutation, ...p.history].slice(0, 20)
      };
    }));

    toast.success('تم تنفيذ الطفرة بنجاح');
  };

  const getStabilityColor = (stability: number) => {
    if (stability >= 90) return 'text-success';
    if (stability >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Dna className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الهوية الحية (DNA)</h1>
            <p className="text-muted-foreground">نظام الطفرات التلقائية للهوية</p>
          </div>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500">
          <Sparkles className="w-4 h-4" />
          طفرة شاملة
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile List */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              البروفايلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {dnaProfiles.map((profile) => (
                  <div
                    key={profile.profileId}
                    onClick={() => setSelectedProfile(profile)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedProfile?.profileId === profile.profileId
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-border hover:border-purple-500/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{profile.profileName}</span>
                      <Badge variant="outline">v{profile.dnaVersion}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">الاستقرار</span>
                      <span className={getStabilityColor(profile.stability)}>
                        {profile.stability.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={profile.stability} className="h-1.5" />

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>معدل الطفرة: {(profile.mutationRate * 100).toFixed(0)}%</span>
                      <span>{profile.traits.filter(t => t.mutable).length} قابل للتغيير</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* DNA Details */}
        <Card className="glass-effect lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                تفاصيل DNA
              </CardTitle>
              {selectedProfile && (
                <Button 
                  size="sm" 
                  onClick={() => triggerMutation(selectedProfile.profileId)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  تنفيذ طفرة
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedProfile ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-purple-400">{selectedProfile.dnaVersion}</p>
                    <p className="text-xs text-muted-foreground">الإصدار</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-pink-400">
                      {(selectedProfile.mutationRate * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">معدل الطفرة</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {selectedProfile.traits.length}
                    </p>
                    <p className="text-xs text-muted-foreground">السمات</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className={cn("text-2xl font-bold", getStabilityColor(selectedProfile.stability))}>
                      {selectedProfile.stability.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">الاستقرار</p>
                  </div>
                </div>

                {/* Traits */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    السمات الجينية
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProfile.traits.map((trait, idx) => (
                      <div 
                        key={idx}
                        className="p-3 rounded-lg border border-border bg-card/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{trait.name}</span>
                          {trait.mutable ? (
                            <RefreshCw className="w-3 h-3 text-purple-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {trait.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mutation History */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    سجل الطفرات
                  </h3>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {selectedProfile.history.map((mutation) => (
                        <div 
                          key={mutation.id}
                          className="p-2 rounded bg-background/30 flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-purple-400" />
                            <span>{mutation.trait}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{mutation.reason}</span>
                            <span>{mutation.timestamp.toLocaleTimeString('ar-SA')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                اختر بروفايل لعرض تفاصيل DNA
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات DNA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex items-center justify-between">
              <span>طفرة تلقائية</span>
              <Switch
                checked={settings.autoMutation}
                onCheckedChange={(v) => setSettings(s => ({...s, autoMutation: v}))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>حفظ القيم الأساسية</span>
              <Switch
                checked={settings.preserveCore}
                onCheckedChange={(v) => setSettings(s => ({...s, preserveCore: v}))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>طفرة ذكية</span>
              <Switch
                checked={settings.smartMutation}
                onCheckedChange={(v) => setSettings(s => ({...s, smartMutation: v}))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>مكافحة الأنماط</span>
              <Switch
                checked={settings.antiPattern}
                onCheckedChange={(v) => setSettings(s => ({...s, antiPattern: v}))}
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>فترة الطفرة</span>
                <span className="text-primary">{settings.mutationInterval}h</span>
              </div>
              <Slider
                value={[settings.mutationInterval]}
                onValueChange={([v]) => setSettings(s => ({...s, mutationInterval: v}))}
                min={1}
                max={72}
                step={1}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
