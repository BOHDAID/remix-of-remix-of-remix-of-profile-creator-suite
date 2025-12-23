import { useState, useEffect } from 'react';
import { Profile, ProxySettings, FingerprintSettings } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  MousePointer, Key, Camera, Bot
} from 'lucide-react';
import { checkLicenseStatus } from '@/lib/licenseUtils';
import { FingerprintTab } from './FingerprintTab';
import { testProxy, ProxyConfig } from '@/lib/proxyTester';

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
];

interface CreateProfileModalProps {
  open: boolean;
  onClose: () => void;
  editProfile?: Profile | null;
}

export function CreateProfileModal({ open, onClose, editProfile }: CreateProfileModalProps) {
  const { addProfile, updateProfile, extensions, settings, license, profiles, setActiveView } = useAppStore();
  
  // التحقق من حالة الترخيص
  const licenseCheck = checkLicenseStatus(license, profiles.length);
  
  const [name, setName] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [proxyType, setProxyType] = useState<'http' | 'https' | 'socks4' | 'socks5'>('http');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUsername, setProxyUsername] = useState('');
  const [proxyPassword, setProxyPassword] = useState('');
  const [proxyAutoSwitch, setProxyAutoSwitch] = useState(false);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [selectedBuiltInExtensions, setSelectedBuiltInExtensions] = useState<string[]>([]);
  const [userAgent, setUserAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [fingerprint, setFingerprint] = useState<FingerprintSettings | undefined>(undefined);
  const [autoLoadExtensions, setAutoLoadExtensions] = useState(true);
  
  // حالات البروكسي
  const [proxyTesting, setProxyTesting] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<'untested' | 'active' | 'failed'>('untested');
  const [proxyLatency, setProxyLatency] = useState<number | null>(null);
  const [proxyLocation, setProxyLocation] = useState<string | null>(null);

  useEffect(() => {
    if (editProfile) {
      setName(editProfile.name);
      setUseProxy(!!editProfile.proxy);
      if (editProfile.proxy) {
        setProxyType(editProfile.proxy.type);
        setProxyHost(editProfile.proxy.host);
        setProxyPort(editProfile.proxy.port);
        setProxyUsername(editProfile.proxy.username || '');
        setProxyPassword(editProfile.proxy.password || '');
        setProxyAutoSwitch(editProfile.proxy.autoSwitch || false);
        setProxyStatus(editProfile.proxy.status === 'active' ? 'active' : editProfile.proxy.status === 'failed' ? 'failed' : 'untested');
      }
      setSelectedExtensions(editProfile.extensions.filter(id => !id.startsWith('builtin-')));
      setSelectedBuiltInExtensions(editProfile.extensions.filter(id => id.startsWith('builtin-')));
      setUserAgent(editProfile.userAgent);
      setNotes(editProfile.notes);
      setFingerprint(editProfile.fingerprint);
      setAutoLoadExtensions(editProfile.autoLoadExtensions ?? true);
    } else {
      resetForm();
    }
  }, [editProfile, open]);

  const resetForm = () => {
    setName('');
    setUseProxy(false);
    setProxyType('http');
    setProxyHost('');
    setProxyPort('');
    setProxyUsername('');
    setProxyPassword('');
    setProxyAutoSwitch(false);
    setSelectedExtensions([]);
    setSelectedBuiltInExtensions([]);
    setUserAgent(settings.defaultUserAgent);
    setNotes('');
    setFingerprint(undefined);
    setAutoLoadExtensions(true);
    setProxyStatus('untested');
    setProxyLatency(null);
    setProxyLocation(null);
  };

  const handleTestProxy = async () => {
    if (!proxyHost || !proxyPort) {
      toast.error('يرجى إدخال عنوان البروكسي والمنفذ');
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

    // التحقق من حد البروفايلات (فقط للبروفايلات الجديدة)
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

    if (editProfile) {
      updateProfile(editProfile.id, {
        name,
        proxy,
        extensions: allExtensions,
        userAgent: userAgent || settings.defaultUserAgent,
        notes,
        fingerprint,
        autoLoadExtensions,
      });
      toast.success('تم تحديث البروفايل بنجاح');
    } else {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        name,
        proxy,
        extensions: allExtensions,
        userAgent: userAgent || settings.defaultUserAgent,
        status: 'stopped',
        createdAt: new Date(),
        notes,
        fingerprint,
        autoLoadExtensions,
      };
      addProfile(newProfile);
      toast.success('تم إنشاء البروفايل بنجاح');
    }

    onClose();
    resetForm();
  };

  const toggleExtension = (extId: string) => {
    setSelectedExtensions(prev => 
      prev.includes(extId)
        ? prev.filter(id => id !== extId)
        : [...prev, extId]
    );
  };

  const toggleBuiltInExtension = (extId: string) => {
    setSelectedBuiltInExtensions(prev => 
      prev.includes(extId)
        ? prev.filter(id => id !== extId)
        : [...prev, extId]
    );
  };

  const getExtensionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Key': return <Key className="w-5 h-5" />;
      case 'Camera': return <Camera className="w-5 h-5" />;
      case 'Bot': return <Bot className="w-5 h-5" />;
      default: return <Puzzle className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
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
                {!license && ' قم بتفعيل الترخيص للحصول على المزيد.'}
                {license && ' قم بترقية الترخيص للحصول على المزيد.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                setActiveView('license');
              }}
              className="border-warning/50 text-warning hover:bg-warning/10"
            >
              {license ? 'ترقية' : 'تفعيل'}
            </Button>
          </div>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-muted">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">عام</span>
            </TabsTrigger>
            <TabsTrigger value="proxy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">البروكسي</span>
            </TabsTrigger>
            <TabsTrigger value="fingerprint" className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              <span className="hidden sm:inline">البصمة</span>
            </TabsTrigger>
            <TabsTrigger value="extensions" className="flex items-center gap-2">
              <Puzzle className="w-4 h-4" />
              <span className="hidden sm:inline">الملحقات</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">متقدم</span>
            </TabsTrigger>
          </TabsList>

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
          </TabsContent>

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع البروكسي</Label>
                    <Select value={proxyType} onValueChange={(v) => setProxyType(v as any)}>
                      <SelectTrigger className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="socks4">SOCKS4</SelectItem>
                        <SelectItem value="socks5">SOCKS5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proxyPort">المنفذ</Label>
                    <Input
                      id="proxyPort"
                      value={proxyPort}
                      onChange={(e) => setProxyPort(e.target.value)}
                      placeholder="8080"
                      className="bg-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyHost">عنوان البروكسي</Label>
                  <Input
                    id="proxyHost"
                    value={proxyHost}
                    onChange={(e) => setProxyHost(e.target.value)}
                    placeholder="proxy.example.com"
                    className="bg-input"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proxyUsername">اسم المستخدم (اختياري)</Label>
                    <Input
                      id="proxyUsername"
                      value={proxyUsername}
                      onChange={(e) => setProxyUsername(e.target.value)}
                      placeholder="username"
                      className="bg-input"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proxyPassword">كلمة المرور (اختياري)</Label>
                    <Input
                      id="proxyPassword"
                      type="password"
                      value={proxyPassword}
                      onChange={(e) => setProxyPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-input"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* خيارات متقدمة للبروكسي */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    خيارات متقدمة
                  </h4>
                  
                  <div className="flex items-center justify-between">
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

                  {proxyLocation && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span>الموقع: {proxyLocation}</span>
                    </div>
                  )}
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

          <TabsContent value="fingerprint" className="space-y-4 mt-4">
            <FingerprintTab fingerprint={fingerprint} onChange={setFingerprint} />
          </TabsContent>

          <TabsContent value="extensions" className="space-y-4 mt-4">
            {/* خيار التشغيل التلقائي للإضافات */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Puzzle className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="autoLoadExtensions" className="cursor-pointer font-medium">
                    تشغيل الإضافات تلقائياً
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    تشغيل الإضافات المحددة عند فتح هذا البروفايل
                  </p>
                </div>
              </div>
              <Checkbox
                id="autoLoadExtensions"
                checked={autoLoadExtensions}
                onCheckedChange={(checked) => setAutoLoadExtensions(checked as boolean)}
                className="h-5 w-5"
              />
            </div>

            {/* الملحقات المدمجة */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                الملحقات المدمجة
              </h4>
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
                    <Badge variant="secondary" className="text-xs">
                      مدمج
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            {/* الملحقات المخصصة */}
            {extensions.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                  <Puzzle className="w-4 h-4" />
                  الملحقات المخصصة
                </h4>
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

            {extensions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground border-t border-border mt-4">
                <p className="text-sm">لا توجد ملحقات مخصصة مضافة</p>
                <p className="text-xs">اذهب إلى قسم الملحقات لإضافة ملحقات جديدة</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* User Agent */}
            <div className="space-y-2">
              <Label htmlFor="userAgent">User Agent</Label>
              <Textarea
                id="userAgent"
                value={userAgent}
                onChange={(e) => setUserAgent(e.target.value)}
                placeholder={settings.defaultUserAgent}
                className="bg-input resize-none font-mono text-sm"
                rows={3}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                اتركه فارغاً لاستخدام User Agent الافتراضي
              </p>
            </div>

            {/* خيارات أمان متقدمة */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                خيارات الخصوصية
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">منع WebRTC Leak</p>
                      <p className="text-xs text-muted-foreground">منع تسريب IP الحقيقي عبر WebRTC</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">محاكاة حركة الماوس</p>
                      <p className="text-xs text-muted-foreground">محاكاة سلوك المستخدم الطبيعي</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* ملخص البروفايل */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                ملخص البروفايل
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>البروكسي: {useProxy ? `${proxyType}://${proxyHost}:${proxyPort}` : 'غير مفعل'}</span>
                <span>الملحقات: {selectedExtensions.length + selectedBuiltInExtensions.length}</span>
                <span>البصمة: {fingerprint ? 'مخصصة' : 'افتراضية'}</span>
                <span>تحميل تلقائي: {autoLoadExtensions ? 'نعم' : 'لا'}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button variant="glow" onClick={handleSubmit} className="flex-1">
            {editProfile ? 'حفظ التغييرات' : 'إنشاء البروفايل'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
