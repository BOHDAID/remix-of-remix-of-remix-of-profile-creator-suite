import { useState, useEffect } from 'react';
import { Profile, ProxySettings, FingerprintSettings } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Globe, Shield, Puzzle, FileText, AlertTriangle, Fingerprint } from 'lucide-react';
import { checkLicenseStatus } from '@/lib/licenseUtils';
import { FingerprintTab } from './FingerprintTab';

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
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [userAgent, setUserAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [fingerprint, setFingerprint] = useState<FingerprintSettings | undefined>(undefined);

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
      }
      setSelectedExtensions(editProfile.extensions);
      setUserAgent(editProfile.userAgent);
      setNotes(editProfile.notes);
      setFingerprint(editProfile.fingerprint);
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
    setSelectedExtensions([]);
    setUserAgent(settings.defaultUserAgent);
    setNotes('');
    setFingerprint(undefined);
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
        }
      : null;

    if (editProfile) {
      updateProfile(editProfile.id, {
        name,
        proxy,
        extensions: selectedExtensions,
        userAgent: userAgent || settings.defaultUserAgent,
        notes,
        fingerprint,
      });
      toast.success('تم تحديث البروفايل بنجاح');
    } else {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        name,
        proxy,
        extensions: selectedExtensions,
        userAgent: userAgent || settings.defaultUserAgent,
        status: 'stopped',
        createdAt: new Date(),
        notes,
        fingerprint,
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
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Checkbox
                id="useProxy"
                checked={useProxy}
                onCheckedChange={(checked) => setUseProxy(checked as boolean)}
              />
              <Label htmlFor="useProxy" className="cursor-pointer">
                استخدام بروكسي
              </Label>
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
              </div>
            )}
          </TabsContent>

          <TabsContent value="fingerprint" className="space-y-4 mt-4">
            <FingerprintTab fingerprint={fingerprint} onChange={setFingerprint} />
          </TabsContent>

          <TabsContent value="extensions" className="space-y-4 mt-4">
            {extensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد ملحقات مضافة</p>
                <p className="text-sm">اذهب إلى قسم الملحقات لإضافة ملحقات جديدة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {extensions.map((ext) => (
                  <label
                    key={ext.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
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
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
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
