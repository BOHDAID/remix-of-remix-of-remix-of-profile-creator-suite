import { useState, useEffect } from 'react';
import { Profile, ProxySettings, FingerprintSettings, AntiTrackingSettings } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Globe, Shield, Puzzle, FileText, AlertTriangle, Fingerprint, 
  CheckCircle2, XCircle, Loader2, RefreshCw, Zap, Lock, Eye,
  MousePointer, Key, Camera, Bot, ShieldCheck, Monitor, Mic, Type,
  Dna, Activity, Brain, Keyboard, Clock, Save, Cpu
} from 'lucide-react';
import { checkLicenseStatus } from '@/lib/licenseUtils';
import { FingerprintTab } from './FingerprintTab';
import { testProxy, ProxyConfig } from '@/lib/proxyTester';
import { generateIdentityDNA, IdentityDNA, dnaToFingerprint } from '@/lib/identityDNA';
import { generateBehaviorPattern, BehaviorPattern } from '@/lib/behavioralSimulation';

// الملحقات المدمجة
const BUILT_IN_EXTENSIONS = [
  {
    id: 'builtin-auto-login',
    name: 'تسجيل الدخول التلقائي',
    description: 'حفظ واستعادة بيانات تسجيل الدخول تلقائياً',
    icon: 'Key',
    path: 'auto-login',
    category: 'automation'
  },
  {
    id: 'builtin-session-capture',
    name: 'التقاط الجلسات',
    description: 'التقاط وحفظ جلسات المتصفح (الكوكيز والتخزين المحلي)',
    icon: 'Camera',
    path: 'session-capture',
    category: 'session'
  },
  {
    id: 'builtin-captcha-solver',
    name: 'حل CAPTCHA بالذكاء الاصطناعي',
    description: 'حل CAPTCHA تلقائياً باستخدام الذكاء الاصطناعي',
    icon: 'Bot',
    path: 'captcha-solver',
    category: 'automation'
  },
  {
    id: 'builtin-vision-monitor',
    name: 'مراقبة الرؤية AI',
    description: 'مراقبة الصفحات والتنبيهات الذكية',
    icon: 'Eye',
    path: 'vision-monitor',
    category: 'monitoring'
  },
];

// الإعدادات الافتراضية لمكافحة التتبع
const defaultAntiTracking: AntiTrackingSettings = {
  canvasFingerprint: true,
  webglFingerprint: true,
  audioFingerprint: true,
  fontFingerprint: true,
  mouseMovementSimulation: true,
  timezoneSpoof: false,
  languageSpoof: false,
  screenResolutionSpoof: false,
  webrtcLeakPrevention: true,
  doNotTrack: true,
};

// إعدادات السلوك الافتراضية
const defaultBehaviorSettings = {
  enabled: true,
  mouseMovement: 'natural' as 'natural' | 'aggressive' | 'slow',
  typingPattern: 'human' as 'human' | 'fast' | 'random',
  scrollBehavior: 'smooth' as 'smooth' | 'jumpy' | 'natural',
  clickDelay: 50,
  pauseBetweenActions: 100,
};

// إعدادات الجلسات الافتراضية
const defaultSessionSettings = {
  enabled: true,
  maxSessions: 10,
  sessionLifetime: 60,
  autoRotate: false,
  persistCookies: true,
};

// إعدادات CAPTCHA الافتراضية
const defaultCaptchaSettings = {
  enabled: false,
  autoSolve: true,
  maxRetries: 3,
  timeout: 30,
};

// إعدادات Vision Monitor الافتراضية
const defaultVisionSettings = {
  enabled: false,
  screenshotInterval: 5,
  detectChanges: true,
  alertOnError: true,
};

// Parse proxy string in various formats
function parseProxyString(input: string): { type: 'http' | 'https' | 'socks4' | 'socks5'; host: string; port: string; username?: string; password?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // Format: protocol://user:pass@host:port
  const fullMatch = trimmed.match(/^(https?|socks[45]):\/\/(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/i);
  if (fullMatch) {
    return {
      type: fullMatch[1].toLowerCase() as any,
      username: fullMatch[2],
      password: fullMatch[3],
      host: fullMatch[4],
      port: fullMatch[5],
    };
  }
  
  // Format: user:pass@host:port or host:port:user:pass
  const parts = trimmed.split(/[@:]/);
  
  // host:port:user:pass
  if (parts.length === 4 && /^\d+$/.test(parts[1])) {
    return {
      type: 'http',
      host: parts[0],
      port: parts[1],
      username: parts[2],
      password: parts[3],
    };
  }
  
  // user:pass@host:port
  if (parts.length === 4 && /^\d+$/.test(parts[3])) {
    return {
      type: 'http',
      username: parts[0],
      password: parts[1],
      host: parts[2],
      port: parts[3],
    };
  }
  
  // host:port
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    return {
      type: 'http',
      host: parts[0],
      port: parts[1],
    };
  }
  
  return null;
}

interface CreateProfileModalProps {
  open: boolean;
  onClose: () => void;
  editProfile?: Profile | null;
}

export function CreateProfileModal({ open, onClose, editProfile }: CreateProfileModalProps) {
  const { addProfile, updateProfile, extensions, settings, license, profiles, setActiveView } = useAppStore();
  
  // التحقق من حالة الترخيص
  const licenseCheck = checkLicenseStatus(license, profiles.length);
  
  // الحالات الأساسية
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [userAgent, setUserAgent] = useState('');
  
  // البروكسي الذكي
  const [useProxy, setUseProxy] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [proxyType, setProxyType] = useState<'http' | 'https' | 'socks4' | 'socks5'>('http');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUsername, setProxyUsername] = useState('');
  const [proxyPassword, setProxyPassword] = useState('');
  const [proxyAutoSwitch, setProxyAutoSwitch] = useState(false);
  const [proxyTesting, setProxyTesting] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<'untested' | 'active' | 'failed'>('untested');
  const [proxyLatency, setProxyLatency] = useState<number | null>(null);
  const [proxyLocation, setProxyLocation] = useState<string | null>(null);
  
  // الإضافات
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [selectedBuiltInExtensions, setSelectedBuiltInExtensions] = useState<string[]>([]);
  const [autoLoadExtensions, setAutoLoadExtensions] = useState(true);
  
  // البصمة
  const [fingerprint, setFingerprint] = useState<FingerprintSettings | undefined>(undefined);
  const [antiTracking, setAntiTracking] = useState<AntiTrackingSettings>(defaultAntiTracking);
  
  // DNA الهوية
  const [useDNA, setUseDNA] = useState(false);
  const [identityDNA, setIdentityDNA] = useState<IdentityDNA | null>(null);
  
  // إعدادات السلوك
  const [behaviorSettings, setBehaviorSettings] = useState(defaultBehaviorSettings);
  
  // إعدادات الجلسات
  const [sessionSettings, setSessionSettings] = useState(defaultSessionSettings);
  
  // إعدادات CAPTCHA
  const [captchaSettings, setCaptchaSettings] = useState(defaultCaptchaSettings);
  
  // إعدادات Vision Monitor
  const [visionSettings, setVisionSettings] = useState(defaultVisionSettings);

  useEffect(() => {
    if (editProfile) {
      setName(editProfile.name);
      setNotes(editProfile.notes);
      setUserAgent(editProfile.userAgent);
      setUseProxy(!!editProfile.proxy);
      if (editProfile.proxy) {
        setProxyType(editProfile.proxy.type);
        setProxyHost(editProfile.proxy.host);
        setProxyPort(editProfile.proxy.port);
        setProxyUsername(editProfile.proxy.username || '');
        setProxyPassword(editProfile.proxy.password || '');
        setProxyAutoSwitch(editProfile.proxy.autoSwitch || false);
        setProxyStatus(editProfile.proxy.status === 'active' ? 'active' : editProfile.proxy.status === 'failed' ? 'failed' : 'untested');
        // تحديث حقل الإدخال
        const proxyStr = `${editProfile.proxy.type}://${editProfile.proxy.username ? `${editProfile.proxy.username}:${editProfile.proxy.password}@` : ''}${editProfile.proxy.host}:${editProfile.proxy.port}`;
        setProxyInput(proxyStr);
      }
      setSelectedExtensions(editProfile.extensions.filter(id => !id.startsWith('builtin-')));
      setSelectedBuiltInExtensions(editProfile.extensions.filter(id => id.startsWith('builtin-')));
      setFingerprint(editProfile.fingerprint);
      setAutoLoadExtensions(editProfile.autoLoadExtensions ?? true);
      setAntiTracking(editProfile.antiTracking || defaultAntiTracking);
      
      // تحميل الإعدادات المتقدمة
      if ((editProfile as any).identityDNA) {
        setUseDNA(true);
        setIdentityDNA((editProfile as any).identityDNA);
      }
      if ((editProfile as any).behaviorSettings) {
        setBehaviorSettings((editProfile as any).behaviorSettings);
      }
      if ((editProfile as any).sessionSettings) {
        setSessionSettings((editProfile as any).sessionSettings);
      }
      if ((editProfile as any).captchaSettings) {
        setCaptchaSettings((editProfile as any).captchaSettings);
      }
      if ((editProfile as any).visionSettings) {
        setVisionSettings((editProfile as any).visionSettings);
      }
    } else {
      resetForm();
    }
  }, [editProfile, open]);

  const resetForm = () => {
    setName('');
    setNotes('');
    setUserAgent(settings.defaultUserAgent);
    setUseProxy(false);
    setProxyInput('');
    setProxyType('http');
    setProxyHost('');
    setProxyPort('');
    setProxyUsername('');
    setProxyPassword('');
    setProxyAutoSwitch(false);
    setProxyTesting(false);
    setProxyStatus('untested');
    setProxyLatency(null);
    setProxyLocation(null);
    setSelectedExtensions([]);
    setSelectedBuiltInExtensions([]);
    setAutoLoadExtensions(true);
    setFingerprint(undefined);
    setAntiTracking(defaultAntiTracking);
    setUseDNA(false);
    setIdentityDNA(null);
    setBehaviorSettings(defaultBehaviorSettings);
    setSessionSettings(defaultSessionSettings);
    setCaptchaSettings(defaultCaptchaSettings);
    setVisionSettings(defaultVisionSettings);
  };

  // معالجة لصق البروكسي الذكي
  const handleProxyInputChange = (value: string) => {
    setProxyInput(value);
    const parsed = parseProxyString(value);
    if (parsed) {
      setProxyType(parsed.type);
      setProxyHost(parsed.host);
      setProxyPort(parsed.port);
      setProxyUsername(parsed.username || '');
      setProxyPassword(parsed.password || '');
      setProxyStatus('untested');
      toast.success('تم تحليل البروكسي بنجاح');
    }
  };

  // توليد DNA الهوية
  const handleGenerateDNA = () => {
    const newDNA = generateIdentityDNA(editProfile?.id || 'new-profile', fingerprint);
    setIdentityDNA(newDNA);
    // تطبيق DNA على البصمة
    const dnaFingerprint = dnaToFingerprint(newDNA);
    setFingerprint(dnaFingerprint);
    toast.success('تم توليد DNA الهوية وتطبيقه');
  };

  const updateAntiTracking = (key: keyof AntiTrackingSettings, value: boolean) => {
    setAntiTracking(prev => ({ ...prev, [key]: value }));
  };

  const handleTestProxy = async () => {
    if (!proxyHost || !proxyPort) {
      toast.error('يرجى إدخال البروكسي أولاً');
      return;
    }

    setProxyTesting(true);
    setProxyStatus('untested');
    
    try {
      const config: ProxyConfig = {
        type: proxyType,
        host: proxyHost,
        port: proxyPort,
        username: proxyUsername || undefined,
        password: proxyPassword || undefined,
      };
      
      const result = await testProxy(config);
      
      if (result.success) {
        setProxyStatus('active');
        setProxyLatency(result.latency);
        setProxyLocation(result.country ? `${result.country}${result.city ? `, ${result.city}` : ''}` : null);
        toast.success(`البروكسي يعمل! التأخير: ${result.latency}ms`);
      } else {
        setProxyStatus('failed');
        setProxyLatency(null);
        setProxyLocation(null);
        toast.error(result.error || 'فشل اختبار البروكسي');
      }
    } catch (error) {
      setProxyStatus('failed');
      toast.error('حدث خطأ أثناء اختبار البروكسي');
    } finally {
      setProxyTesting(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم البروفايل');
      return;
    }

    // التحقق من حد البروفايلات
    if (!editProfile && !licenseCheck.canCreate) {
      const maxProfiles = licenseCheck.maxProfiles === -1 ? 'غير محدود' : licenseCheck.maxProfiles;
      toast.error(`لقد وصلت للحد الأقصى من البروفايلات (${maxProfiles}). قم بترقية الترخيص للحصول على المزيد.`, {
        action: {
          label: 'ترقية الترخيص',
          onClick: () => {
            onClose();
            setActiveView('license');
          },
        },
      });
      return;
    }

    const proxy: ProxySettings | null = useProxy && proxyHost && proxyPort
      ? {
          type: proxyType,
          host: proxyHost,
          port: proxyPort,
          username: proxyUsername || undefined,
          password: proxyPassword || undefined,
          status: proxyStatus === 'active' ? 'active' : proxyStatus === 'failed' ? 'failed' : undefined,
          speed: proxyLatency || undefined,
          autoSwitch: proxyAutoSwitch,
          lastTested: proxyStatus !== 'untested' ? new Date() : undefined,
        }
      : null;

    // دمج الملحقات المدمجة مع الملحقات المخصصة
    const allExtensions = [...selectedExtensions, ...selectedBuiltInExtensions];
    
    // إضافة ملحقات CAPTCHA و Vision إذا كانت مفعلة
    if (captchaSettings.enabled && !allExtensions.includes('builtin-captcha-solver')) {
      allExtensions.push('builtin-captcha-solver');
    }
    if (visionSettings.enabled && !allExtensions.includes('builtin-vision-monitor')) {
      allExtensions.push('builtin-vision-monitor');
    }

    const profileData = {
      name,
      proxy,
      extensions: allExtensions,
      userAgent: userAgent || settings.defaultUserAgent,
      notes,
      fingerprint,
      autoLoadExtensions,
      antiTracking,
      // الميزات الجديدة
      identityDNA: useDNA ? identityDNA : null,
      behaviorSettings,
      sessionSettings,
      captchaSettings,
      visionSettings,
    };

    if (editProfile) {
      updateProfile(editProfile.id, profileData);
      toast.success('تم تحديث البروفايل بنجاح');
    } else {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        ...profileData,
        status: 'stopped',
        createdAt: new Date(),
      };
      addProfile(newProfile);
      toast.success('تم إنشاء البروفايل بنجاح');
    }

    onClose();
    resetForm();
  };

  const toggleExtension = (extId: string) => {
    setSelectedExtensions(prev => 
      prev.includes(extId) ? prev.filter(id => id !== extId) : [...prev, extId]
    );
  };

  const toggleBuiltInExtension = (extId: string) => {
    setSelectedBuiltInExtensions(prev => 
      prev.includes(extId) ? prev.filter(id => id !== extId) : [...prev, extId]
    );
  };

  const getExtensionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Key': return <Key className="w-5 h-5" />;
      case 'Camera': return <Camera className="w-5 h-5" />;
      case 'Bot': return <Bot className="w-5 h-5" />;
      case 'Eye': return <Eye className="w-5 h-5" />;
      default: return <Puzzle className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {editProfile ? 'تعديل البروفايل' : 'إنشاء بروفايل جديد'}
          </DialogTitle>
        </DialogHeader>

        {/* تحذير حد البروفايلات */}
        {!editProfile && !licenseCheck.canCreate && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-warning">وصلت للحد الأقصى من البروفايلات</p>
              <p className="text-sm text-muted-foreground">
                لديك {licenseCheck.currentProfiles} من {licenseCheck.maxProfiles === -1 ? '∞' : licenseCheck.maxProfiles} بروفايل.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onClose(); setActiveView('license'); }}
              className="border-warning/50 text-warning hover:bg-warning/10"
            >
              {license ? 'ترقية' : 'تفعيل'}
            </Button>
          </div>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-6 w-full bg-muted">
            <TabsTrigger value="general" className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">عام</span>
            </TabsTrigger>
            <TabsTrigger value="proxy" className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">بروكسي</span>
            </TabsTrigger>
            <TabsTrigger value="dna" className="flex items-center gap-1">
              <Dna className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">DNA</span>
            </TabsTrigger>
            <TabsTrigger value="fingerprint" className="flex items-center gap-1">
              <Fingerprint className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">البصمة</span>
            </TabsTrigger>
            <TabsTrigger value="extensions" className="flex items-center gap-1">
              <Puzzle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">الملحقات</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">AI</span>
            </TabsTrigger>
          </TabsList>

          {/* تبويب عام */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم البروفايل</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: حساب العمل"
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                className="bg-input resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userAgent">User Agent</Label>
              <Textarea
                id="userAgent"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                placeholder={settings.defaultUserAgent}
                className="bg-input resize-none font-mono text-sm"
                rows={2}
                dir="ltr"
              />
            </div>
          </TabsContent>

          {/* تبويب البروكسي الذكي */}
          <TabsContent value="proxy" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="useProxy"
                  checked={useProxy}
                  onCheckedChange={(checked) => setUseProxy(checked as boolean)}
                />
                <Label htmlFor="useProxy" className="cursor-pointer">
                  استخدام بروكسي
                </Label>
              </div>
              {useProxy && proxyStatus !== 'untested' && (
                <Badge variant={proxyStatus === 'active' ? 'default' : 'destructive'} className="flex items-center gap-1">
                  {proxyStatus === 'active' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      نشط {proxyLatency && `(${proxyLatency}ms)`}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      فاشل
                    </>
                  )}
                </Badge>
              )}
            </div>

            {useProxy && (
              <div className="space-y-4 animate-fade-in">
                {/* إدخال البروكسي الذكي */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <Label className="font-medium">لصق البروكسي (ذكي)</Label>
                  </div>
                  <Textarea
                    value={proxyInput}
                    onChange={(e) => handleProxyInputChange(e.target.value)}
                    placeholder="الصق البروكسي هنا بأي صيغة:
socks5://user:pass@host:port
http://host:port:user:pass
host:port:user:pass
host:port"
                    className="bg-input resize-none font-mono text-sm"
                    rows={3}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم تحليل البروكسي تلقائياً واستخراج المعلومات
                  </p>
                </div>

                {/* معاينة البروكسي المحلل */}
                {proxyHost && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
                    <h4 className="font-medium text-sm">تفاصيل البروكسي</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">النوع:</span>
                        <Badge variant="secondary" className="mr-2">{proxyType.toUpperCase()}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">العنوان:</span>
                        <span className="mr-2 font-mono">{proxyHost}:{proxyPort}</span>
                      </div>
                      {proxyUsername && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">المصادقة:</span>
                          <span className="mr-2">{proxyUsername}:****</span>
                        </div>
                      )}
                      {proxyLocation && (
                        <div className="col-span-2 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>الموقع: {proxyLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* خيارات متقدمة */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <Label htmlFor="autoSwitch" className="cursor-pointer">التبديل التلقائي</Label>
                    <p className="text-xs text-muted-foreground">التبديل لبروكسي آخر عند الفشل</p>
                  </div>
                  <Switch
                    id="autoSwitch"
                    checked={proxyAutoSwitch}
                    onCheckedChange={setProxyAutoSwitch}
                  />
                </div>

                {/* زر اختبار البروكسي */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleTestProxy}
                  disabled={proxyTesting || !proxyHost || !proxyPort}
                >
                  {proxyTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2" />
                      اختبار البروكسي
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* تبويب DNA الهوية */}
          <TabsContent value="dna" className="space-y-4 mt-4">
            {/* تفعيل DNA */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Dna className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="font-medium">DNA الهوية الحية</Label>
                  <p className="text-xs text-muted-foreground">هوية رقمية فريدة تتطور مع الوقت</p>
                </div>
              </div>
              <Switch checked={useDNA} onCheckedChange={setUseDNA} />
            </div>

            {useDNA && (
              <div className="space-y-4 animate-fade-in">
                {/* توليد DNA */}
                <Button onClick={handleGenerateDNA} className="w-full" variant="glow">
                  <Cpu className="w-4 h-4 ml-2" />
                  توليد DNA جديد
                </Button>

                {identityDNA && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">معلومات DNA</h4>
                      <Badge variant="secondary">الجيل {identityDNA.generation}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>التناسق: <Badge variant={identityDNA.consistency > 80 ? 'default' : 'destructive'}>{identityDNA.consistency}%</Badge></div>
                      <div>التغييرات: {identityDNA.mutations.length}</div>
                    </div>
                  </div>
                )}

                {/* إعدادات السلوك */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">إعدادات السلوك</h4>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>تفعيل محاكاة السلوك</Label>
                    <Switch
                      checked={behaviorSettings.enabled}
                      onCheckedChange={(checked) => setBehaviorSettings(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {behaviorSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MousePointer className="w-4 h-4" />
                          حركة الماوس
                        </Label>
                        <Select
                          value={behaviorSettings.mouseMovement}
                          onValueChange={(v) => setBehaviorSettings(prev => ({ ...prev, mouseMovement: v as any }))}
                        >
                          <SelectTrigger className="bg-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="natural">طبيعي</SelectItem>
                            <SelectItem value="slow">بطيء</SelectItem>
                            <SelectItem value="aggressive">سريع</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Keyboard className="w-4 h-4" />
                          نمط الكتابة
                        </Label>
                        <Select
                          value={behaviorSettings.typingPattern}
                          onValueChange={(v) => setBehaviorSettings(prev => ({ ...prev, typingPattern: v as any }))}
                        >
                          <SelectTrigger className="bg-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="human">بشري</SelectItem>
                            <SelectItem value="fast">سريع</SelectItem>
                            <SelectItem value="random">عشوائي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>تأخير النقر (ms): {behaviorSettings.clickDelay}</Label>
                        <Slider
                          value={[behaviorSettings.clickDelay]}
                          onValueChange={([v]) => setBehaviorSettings(prev => ({ ...prev, clickDelay: v }))}
                          min={0}
                          max={500}
                          step={10}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>التوقف بين الإجراءات (ms): {behaviorSettings.pauseBetweenActions}</Label>
                        <Slider
                          value={[behaviorSettings.pauseBetweenActions]}
                          onValueChange={([v]) => setBehaviorSettings(prev => ({ ...prev, pauseBetweenActions: v }))}
                          min={0}
                          max={1000}
                          step={50}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* إعدادات الجلسات */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">إعدادات الجلسات</h4>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>إدارة الجلسات</Label>
                    <Switch
                      checked={sessionSettings.enabled}
                      onCheckedChange={(checked) => setSessionSettings(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {sessionSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>الحد الأقصى للجلسات: {sessionSettings.maxSessions}</Label>
                        <Slider
                          value={[sessionSettings.maxSessions]}
                          onValueChange={([v]) => setSessionSettings(prev => ({ ...prev, maxSessions: v }))}
                          min={1}
                          max={50}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>عمر الجلسة (دقائق): {sessionSettings.sessionLifetime}</Label>
                        <Slider
                          value={[sessionSettings.sessionLifetime]}
                          onValueChange={([v]) => setSessionSettings(prev => ({ ...prev, sessionLifetime: v }))}
                          min={5}
                          max={480}
                          step={5}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>تدوير تلقائي</Label>
                        <Switch
                          checked={sessionSettings.autoRotate}
                          onCheckedChange={(checked) => setSessionSettings(prev => ({ ...prev, autoRotate: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>حفظ الكوكيز</Label>
                        <Switch
                          checked={sessionSettings.persistCookies}
                          onCheckedChange={(checked) => setSessionSettings(prev => ({ ...prev, persistCookies: checked }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* تبويب البصمة */}
          <TabsContent value="fingerprint" className="space-y-4 mt-4">
            <FingerprintTab fingerprint={fingerprint} onChange={setFingerprint} />
            
            {/* خيارات مكافحة التتبع */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                مكافحة التتبع
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'webrtcLeakPrevention' as const, icon: Eye, label: 'منع WebRTC Leak' },
                  { key: 'canvasFingerprint' as const, icon: Monitor, label: 'تزوير Canvas' },
                  { key: 'webglFingerprint' as const, icon: ShieldCheck, label: 'تزوير WebGL' },
                  { key: 'audioFingerprint' as const, icon: Mic, label: 'تزوير الصوت' },
                  { key: 'fontFingerprint' as const, icon: Type, label: 'تزوير الخطوط' },
                  { key: 'doNotTrack' as const, icon: Shield, label: 'Do Not Track' },
                ].map(({ key, icon: Icon, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    <Switch
                      checked={antiTracking[key]}
                      onCheckedChange={(checked) => updateAntiTracking(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* تبويب الملحقات */}
          <TabsContent value="extensions" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Puzzle className="w-5 h-5 text-primary" />
                <div>
                  <Label className="cursor-pointer font-medium">تشغيل الإضافات تلقائياً</Label>
                  <p className="text-xs text-muted-foreground">تشغيل الإضافات عند فتح البروفايل</p>
                </div>
              </div>
              <Checkbox
                checked={autoLoadExtensions}
                onCheckedChange={(checked) => setAutoLoadExtensions(checked as boolean)}
                className="h-5 w-5"
              />
            </div>

            {/* الملحقات المدمجة */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">الملحقات المدمجة</h4>
              <div className="space-y-2">
                {BUILT_IN_EXTENSIONS.map((ext) => (
                  <label
                    key={ext.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedBuiltInExtensions.includes(ext.id)
                        ? 'bg-primary/15 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={selectedBuiltInExtensions.includes(ext.id)}
                      onCheckedChange={() => toggleBuiltInExtension(ext.id)}
                    />
                    <div className={`p-2 rounded-lg ${
                      selectedBuiltInExtensions.includes(ext.id) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {getExtensionIcon(ext.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{ext.name}</p>
                      <p className="text-sm text-muted-foreground">{ext.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">مدمج</Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* الملحقات المخصصة */}
            {extensions.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="font-medium text-sm text-muted-foreground">الملحقات المخصصة</h4>
                <div className="space-y-2">
                  {extensions.map((ext) => (
                    <label
                      key={ext.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedExtensions.includes(ext.id)
                          ? 'bg-primary/15 border border-primary/30'
                          : 'bg-muted/50 hover:bg-muted border border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={selectedExtensions.includes(ext.id)}
                        onCheckedChange={() => toggleExtension(ext.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{ext.name}</p>
                        <p className="text-sm text-muted-foreground">{ext.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* تبويب AI (CAPTCHA و Vision) */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            {/* إعدادات CAPTCHA */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Bot className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <Label className="font-medium">حل CAPTCHA بالذكاء الاصطناعي</Label>
                    <p className="text-xs text-muted-foreground">حل التحديات تلقائياً</p>
                  </div>
                </div>
                <Switch
                  checked={captchaSettings.enabled}
                  onCheckedChange={(checked) => setCaptchaSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {captchaSettings.enabled && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <Label>حل تلقائي</Label>
                    <Switch
                      checked={captchaSettings.autoSolve}
                      onCheckedChange={(checked) => setCaptchaSettings(prev => ({ ...prev, autoSolve: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>محاولات إعادة المحاولة: {captchaSettings.maxRetries}</Label>
                    <Slider
                      value={[captchaSettings.maxRetries]}
                      onValueChange={([v]) => setCaptchaSettings(prev => ({ ...prev, maxRetries: v }))}
                      min={1}
                      max={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>مهلة الانتظار (ثانية): {captchaSettings.timeout}</Label>
                    <Slider
                      value={[captchaSettings.timeout]}
                      onValueChange={([v]) => setCaptchaSettings(prev => ({ ...prev, timeout: v }))}
                      min={10}
                      max={120}
                      step={5}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* إعدادات Vision Monitor */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="font-medium">مراقبة الرؤية AI</Label>
                    <p className="text-xs text-muted-foreground">مراقبة الصفحات والتنبيهات</p>
                  </div>
                </div>
                <Switch
                  checked={visionSettings.enabled}
                  onCheckedChange={(checked) => setVisionSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {visionSettings.enabled && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>فاصل التقاط الصور (ثانية): {visionSettings.screenshotInterval}</Label>
                    <Slider
                      value={[visionSettings.screenshotInterval]}
                      onValueChange={([v]) => setVisionSettings(prev => ({ ...prev, screenshotInterval: v }))}
                      min={1}
                      max={60}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>اكتشاف التغييرات</Label>
                    <Switch
                      checked={visionSettings.detectChanges}
                      onCheckedChange={(checked) => setVisionSettings(prev => ({ ...prev, detectChanges: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>تنبيه عند الخطأ</Label>
                    <Switch
                      checked={visionSettings.alertOnError}
                      onCheckedChange={(checked) => setVisionSettings(prev => ({ ...prev, alertOnError: checked }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ملخص وأزرار الإجراء */}
        <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
          <h4 className="font-medium text-sm mb-2">ملخص البروفايل</h4>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <span>البروكسي: {useProxy ? `${proxyType}://${proxyHost}:${proxyPort}` : 'غير مفعل'}</span>
            <span>DNA: {useDNA ? 'مفعل' : 'غير مفعل'}</span>
            <span>الملحقات: {selectedExtensions.length + selectedBuiltInExtensions.length}</span>
            <span>CAPTCHA: {captchaSettings.enabled ? 'مفعل' : 'غير مفعل'}</span>
            <span>Vision: {visionSettings.enabled ? 'مفعل' : 'غير مفعل'}</span>
            <span>مكافحة التتبع: {Object.values(antiTracking).filter(Boolean).length}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button variant="glow" onClick={handleSubmit} className="flex-1">
            <Save className="w-4 h-4 ml-2" />
            {editProfile ? 'حفظ التغييرات' : 'إنشاء البروفايل'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
