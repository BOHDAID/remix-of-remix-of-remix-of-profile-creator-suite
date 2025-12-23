import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Save,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  generateIdentityDNA, 
  mutateIdentityDNA, 
  dnaToFingerprint,
  IdentityDNA,
  MutationReason 
} from '@/lib/identityDNA';

// Storage key for DNA data
const DNA_STORAGE_KEY = 'identity-dna-profiles';

// Load DNA profiles from localStorage
const loadDNAProfiles = (): Map<string, IdentityDNA> => {
  try {
    const stored = localStorage.getItem(DNA_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const map = new Map<string, IdentityDNA>();
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        map.set(key, {
          ...value,
          createdAt: new Date(value.createdAt),
          lastMutated: new Date(value.lastMutated),
          mutations: value.mutations.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        });
      });
      return map;
    }
  } catch (e) {
    console.error('Failed to load DNA profiles:', e);
  }
  return new Map();
};

// Save DNA profiles to localStorage
const saveDNAProfiles = (profiles: Map<string, IdentityDNA>) => {
  try {
    const obj: Record<string, IdentityDNA> = {};
    profiles.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(DNA_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save DNA profiles:', e);
  }
};

interface DNASettings {
  autoMutation: boolean;
  mutationInterval: number; // hours
  preserveCore: boolean;
  smartMutation: boolean;
  antiPattern: boolean;
}

const DEFAULT_SETTINGS: DNASettings = {
  autoMutation: true,
  mutationInterval: 24,
  preserveCore: true,
  smartMutation: true,
  antiPattern: true
};

const SETTINGS_STORAGE_KEY = 'identity-dna-settings';

const loadSettings = (): DNASettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load DNA settings:', e);
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: DNASettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save DNA settings:', e);
  }
};

export function IdentityDNAView() {
  const { profiles, updateProfile } = useAppStore();
  const [dnaProfiles, setDnaProfiles] = useState<Map<string, IdentityDNA>>(new Map());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DNASettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadedDNA = loadDNAProfiles();
    const loadedSettings = loadSettings();
    setDnaProfiles(loadedDNA);
    setSettings(loadedSettings);
    
    // Auto-select first profile if available
    if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Auto-mutation timer
  useEffect(() => {
    if (!settings.autoMutation) return;

    const checkMutations = () => {
      const now = Date.now();
      const intervalMs = settings.mutationInterval * 3600000;

      dnaProfiles.forEach((dna, profileId) => {
        const lastMutation = new Date(dna.lastMutated).getTime();
        if (now - lastMutation >= intervalMs) {
          triggerMutation(profileId, 'natural_evolution');
        }
      });
    };

    const timer = setInterval(checkMutations, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [settings.autoMutation, settings.mutationInterval, dnaProfiles]);

  const getOrCreateDNA = useCallback((profileId: string): IdentityDNA => {
    const existing = dnaProfiles.get(profileId);
    if (existing) return existing;

    const profile = profiles.find(p => p.id === profileId);
    const newDNA = generateIdentityDNA(profileId, profile?.fingerprint);
    
    const newMap = new Map(dnaProfiles);
    newMap.set(profileId, newDNA);
    setDnaProfiles(newMap);
    saveDNAProfiles(newMap);
    
    return newDNA;
  }, [dnaProfiles, profiles]);

  const selectedDNA = selectedProfileId ? dnaProfiles.get(selectedProfileId) || getOrCreateDNA(selectedProfileId) : null;
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const triggerMutation = (profileId: string, reason: MutationReason = 'user_requested') => {
    const currentDNA = dnaProfiles.get(profileId);
    if (!currentDNA) {
      const newDNA = getOrCreateDNA(profileId);
      return;
    }

    const mutatedDNA = mutateIdentityDNA(currentDNA, reason);
    
    const newMap = new Map(dnaProfiles);
    newMap.set(profileId, mutatedDNA);
    setDnaProfiles(newMap);
    saveDNAProfiles(newMap);

    toast.success(`تم تنفيذ الطفرة - الجيل ${mutatedDNA.generation}`);
  };

  const applyDNAToProfile = async (profileId: string) => {
    const dna = dnaProfiles.get(profileId);
    if (!dna) {
      toast.error('لا يوجد DNA لهذا البروفايل');
      return;
    }

    setIsSaving(true);
    try {
      const fingerprint = dnaToFingerprint(dna);
      updateProfile(profileId, { fingerprint });
      toast.success('تم تطبيق DNA على البروفايل بنجاح');
    } catch (error) {
      toast.error('فشل تطبيق DNA على البروفايل');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerGlobalMutation = () => {
    let mutatedCount = 0;
    const newMap = new Map(dnaProfiles);

    profiles.forEach(profile => {
      const dna = newMap.get(profile.id);
      if (dna) {
        const mutated = mutateIdentityDNA(dna, 'user_requested');
        newMap.set(profile.id, mutated);
        mutatedCount++;
      }
    });

    setDnaProfiles(newMap);
    saveDNAProfiles(newMap);
    toast.success(`تم تنفيذ طفرة شاملة على ${mutatedCount} بروفايل`);
  };

  const regenerateDNA = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const newDNA = generateIdentityDNA(profileId, profile?.fingerprint);
    
    const newMap = new Map(dnaProfiles);
    newMap.set(profileId, newDNA);
    setDnaProfiles(newMap);
    saveDNAProfiles(newMap);
    
    toast.success('تم إعادة توليد DNA جديد');
  };

  const deleteDNA = (profileId: string) => {
    const newMap = new Map(dnaProfiles);
    newMap.delete(profileId);
    setDnaProfiles(newMap);
    saveDNAProfiles(newMap);
    
    if (selectedProfileId === profileId) {
      setSelectedProfileId(profiles.find(p => p.id !== profileId)?.id || null);
    }
    
    toast.success('تم حذف DNA البروفايل');
  };

  const exportDNA = (profileId: string) => {
    const dna = dnaProfiles.get(profileId);
    if (!dna) return;

    const blob = new Blob([JSON.stringify(dna, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dna-${selectedProfile?.name || profileId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير DNA');
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 90) return 'text-green-400';
    if (consistency >= 70) return 'text-yellow-400';
    if (consistency >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
    if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
    return `منذ ${Math.floor(seconds / 86400)} يوم`;
  };

  const getNextMutationTime = (dna: IdentityDNA) => {
    const nextTime = new Date(dna.lastMutated).getTime() + settings.mutationInterval * 3600000;
    const remaining = nextTime - Date.now();
    if (remaining <= 0) return 'الآن';
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}س ${minutes}د`;
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
            <p className="text-muted-foreground">نظام الطفرات التلقائية للهوية الرقمية</p>
          </div>
        </div>
        <Button 
          onClick={triggerGlobalMutation}
          className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
        >
          <Sparkles className="w-4 h-4" />
          طفرة شاملة
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-400">{dnaProfiles.size}</p>
                <p className="text-sm text-muted-foreground">هويات DNA</p>
              </div>
              <Fingerprint className="w-8 h-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-pink-400">
                  {Array.from(dnaProfiles.values()).reduce((sum, d) => sum + d.generation, 0)}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي الأجيال</p>
              </div>
              <TrendingUp className="w-8 h-8 text-pink-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {Array.from(dnaProfiles.values()).reduce((sum, d) => sum + d.mutations.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي الطفرات</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {dnaProfiles.size > 0 
                    ? Math.round(Array.from(dnaProfiles.values()).reduce((sum, d) => sum + d.consistency, 0) / dnaProfiles.size)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">متوسط الاتساق</p>
              </div>
              <Shield className="w-8 h-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile List */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              البروفايلات ({profiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {profiles.map((profile) => {
                  const dna = dnaProfiles.get(profile.id);
                  const hasDNA = !!dna;
                  
                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfileId(profile.id);
                        if (!hasDNA) getOrCreateDNA(profile.id);
                      }}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedProfileId === profile.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{profile.name}</span>
                        {hasDNA ? (
                          <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                            v{dna.generation}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">بدون DNA</Badge>
                        )}
                      </div>
                      
                      {hasDNA && dna && (
                        <>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">الاتساق</span>
                            <span className={getConsistencyColor(dna.consistency)}>
                              {dna.consistency.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={dna.consistency} className="h-1.5" />

                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeSince(dna.lastMutated)}
                            </span>
                            <span>{dna.mutations.length} طفرة</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {profiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد بروفايلات</p>
                  </div>
                )}
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
                {selectedProfile && <span className="text-muted-foreground">- {selectedProfile.name}</span>}
              </CardTitle>
              {selectedDNA && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => exportDNA(selectedProfileId!)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateDNA(selectedProfileId!)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => triggerMutation(selectedProfileId!)}
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    تنفيذ طفرة
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedDNA ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-purple-400">{selectedDNA.generation}</p>
                    <p className="text-xs text-muted-foreground">الجيل</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-pink-400">
                      {selectedDNA.mutations.length}
                    </p>
                    <p className="text-xs text-muted-foreground">الطفرات</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {getNextMutationTime(selectedDNA)}
                    </p>
                    <p className="text-xs text-muted-foreground">الطفرة التالية</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <p className={cn("text-2xl font-bold", getConsistencyColor(selectedDNA.consistency))}>
                      {selectedDNA.consistency.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">الاتساق</p>
                  </div>
                </div>

                {/* Traits */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    السمات الجينية
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">GPU</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {selectedDNA.traits.hardware.gpuRenderer}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">الشاشة</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.screen.width}x{selectedDNA.traits.screen.height}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">المنطقة الزمنية</span>
                        <Shield className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.locale.timezone}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">اللغة</span>
                        <Shield className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.locale.language}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">النظام</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.browser.platform}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">الذاكرة</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.hardware.deviceMemory} GB
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Canvas Seed</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.canvas.noiseSeed}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-card/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Audio Noise</span>
                        <RefreshCw className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedDNA.traits.audio.noiseLevel.toExponential(4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <Button 
                  onClick={() => applyDNAToProfile(selectedProfileId!)}
                  disabled={isSaving}
                  className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  تطبيق DNA على البروفايل
                </Button>

                {/* Mutation History */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    سجل الطفرات ({selectedDNA.mutations.length})
                  </h3>
                  <ScrollArea className="h-[150px]">
                    {selectedDNA.mutations.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDNA.mutations.slice().reverse().map((mutation) => (
                          <div 
                            key={mutation.id}
                            className="p-2 rounded bg-background/30 flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className={cn(
                                "w-3 h-3",
                                mutation.gradual ? 'text-blue-400' : 'text-purple-400'
                              )} />
                              <span className="font-mono text-xs">{mutation.field}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground text-xs">
                              <Badge variant="outline" className="text-xs">
                                {mutation.reason === 'natural_evolution' ? 'تطور طبيعي' :
                                 mutation.reason === 'user_requested' ? 'يدوي' :
                                 mutation.reason === 'location_change' ? 'تغيير موقع' :
                                 mutation.reason === 'browser_update' ? 'تحديث متصفح' :
                                 mutation.reason === 'consistency_fix' ? 'إصلاح اتساق' :
                                 'تقليل مخاطر'}
                              </Badge>
                              <span>{getTimeSince(mutation.timestamp)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        لا توجد طفرات مسجلة بعد
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Delete DNA */}
                <Button 
                  variant="outline"
                  onClick={() => deleteDNA(selectedProfileId!)}
                  className="w-full gap-2 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف DNA هذا البروفايل
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Dna className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="mb-2">اختر بروفايل لعرض تفاصيل DNA</p>
                <p className="text-sm">سيتم إنشاء DNA جديد تلقائياً للبروفايلات الجديدة</p>
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
            إعدادات نظام DNA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">طفرة تلقائية</p>
                <p className="text-xs text-muted-foreground">تغيير DNA تلقائياً</p>
              </div>
              <Switch
                checked={settings.autoMutation}
                onCheckedChange={(v) => setSettings(s => ({...s, autoMutation: v}))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">حفظ القيم الأساسية</p>
                <p className="text-xs text-muted-foreground">حماية المنطقة واللغة</p>
              </div>
              <Switch
                checked={settings.preserveCore}
                onCheckedChange={(v) => setSettings(s => ({...s, preserveCore: v}))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">طفرة ذكية</p>
                <p className="text-xs text-muted-foreground">تغييرات متسقة فقط</p>
              </div>
              <Switch
                checked={settings.smartMutation}
                onCheckedChange={(v) => setSettings(s => ({...s, smartMutation: v}))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-sm">مكافحة الأنماط</p>
                <p className="text-xs text-muted-foreground">تجنب التكرار</p>
              </div>
              <Switch
                checked={settings.antiPattern}
                onCheckedChange={(v) => setSettings(s => ({...s, antiPattern: v}))}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">فترة الطفرة</span>
                <span className="text-primary">{settings.mutationInterval} ساعة</span>
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
