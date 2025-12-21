import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { LicenseInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Crown,
  Zap,
  Shield,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LICENSE_TIERS = [
  {
    type: 'trial',
    name: 'تجريبي',
    icon: AlertCircle,
    color: 'warning',
    maxProfiles: 3,
    features: ['3 بروفايلات', 'ملحقات محدودة', 'دعم أساسي'],
  },
  {
    type: 'basic',
    name: 'أساسي',
    icon: Zap,
    color: 'primary',
    maxProfiles: 10,
    features: ['10 بروفايلات', 'جميع الملحقات', 'دعم بريدي'],
  },
  {
    type: 'pro',
    name: 'احترافي',
    icon: Crown,
    color: 'success',
    maxProfiles: 50,
    features: ['50 بروفايل', 'جميع الملحقات', 'دعم أولوية', 'API'],
  },
  {
    type: 'enterprise',
    name: 'مؤسسات',
    icon: Shield,
    color: 'accent',
    maxProfiles: -1,
    features: ['بروفايلات غير محدودة', 'دعم مخصص', 'تخصيص كامل'],
  },
];

export function LicenseView() {
  const { license, setLicense, profiles } = useAppStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);

  const activateLicense = async () => {
    if (!licenseKey.trim()) {
      toast.error('يرجى إدخال كود الترخيص');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Decode the license key (Base64 encoded JSON)
      const decoded = JSON.parse(atob(licenseKey.trim()));
      
      // Validate license structure
      if (!decoded.k || !decoded.t || decoded.m === undefined) {
        throw new Error('Invalid license format');
      }

      // Check expiration
      if (decoded.e && new Date(decoded.e) < new Date()) {
        toast.error('كود الترخيص منتهي الصلاحية');
        setLoading(false);
        return;
      }

      const newLicense: LicenseInfo = {
        key: decoded.k,
        status: 'active',
        expiresAt: decoded.e ? new Date(decoded.e) : null,
        maxProfiles: decoded.m,
        type: decoded.t as LicenseInfo['type'],
      };

      setLicense(newLicense);
      setLicenseKey('');
      toast.success('تم تفعيل الترخيص بنجاح');
    } catch (error) {
      toast.error('كود الترخيص غير صالح');
    }
    
    setLoading(false);
  };

  const deactivateLicense = () => {
    setLicense(null);
    toast.info('تم إلغاء تفعيل الترخيص');
  };

  const currentTier = license 
    ? LICENSE_TIERS.find(t => t.type === license.type) 
    : null;

  const getStatusIcon = () => {
    if (!license) return <XCircle className="w-6 h-6 text-destructive" />;
    switch (license.status) {
      case 'active':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-warning" />;
      default:
        return <XCircle className="w-6 h-6 text-destructive" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Key className="w-7 h-7 text-primary" />
          الترخيص
        </h1>
        <p className="text-muted-foreground mt-1">
          إدارة ترخيص البرنامج
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Current License Status */}
        <div className={cn(
          "glass-card rounded-xl p-6",
          license?.status === 'active' && "border-success/30"
        )}>
          <div className="flex items-center gap-4 mb-6">
            {getStatusIcon()}
            <div>
              <h2 className="font-semibold text-lg">
                {license ? `ترخيص ${currentTier?.name}` : 'غير مفعّل'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {license?.status === 'active' 
                  ? `صالح حتى: ${license.expiresAt?.toLocaleDateString('ar-SA')}`
                  : 'أدخل كود الترخيص للتفعيل'
                }
              </p>
            </div>
          </div>

          {license?.status === 'active' && currentTier && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="w-4 h-4" />
                  <span>البروفايلات</span>
                </div>
                <p className="font-bold text-2xl">
                  {profiles.length}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' / '}
                    {license.maxProfiles === -1 ? '∞' : license.maxProfiles}
                  </span>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Key className="w-4 h-4" />
                  <span>نوع الترخيص</span>
                </div>
                <p className="font-bold text-2xl">{currentTier.name}</p>
              </div>
            </div>
          )}

          {license?.status === 'active' && (
            <Button 
              variant="outline" 
              onClick={deactivateLicense}
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              إلغاء التفعيل
            </Button>
          )}
        </div>

        {/* Activate License */}
        {!license && (
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">تفعيل الترخيص</h2>
            <div className="space-y-2">
              <Label htmlFor="licenseKey">كود الترخيص</Label>
              <Input
                id="licenseKey"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="أدخل كود الترخيص"
                className="bg-input font-mono"
                dir="ltr"
              />
            </div>
            <Button 
              variant="glow" 
              onClick={activateLicense}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'جاري التحقق...' : 'تفعيل الترخيص'}
            </Button>
          </div>
        )}

        {/* License Tiers */}
        <div className="space-y-4">
          <h2 className="font-semibold">مستويات الترخيص</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LICENSE_TIERS.map((tier) => {
              const Icon = tier.icon;
              const isActive = license?.type === tier.type;
              
              return (
                <div
                  key={tier.type}
                  className={cn(
                    "glass-card rounded-xl p-5 transition-all duration-300",
                    isActive && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      tier.color === 'warning' && "bg-warning/20",
                      tier.color === 'primary' && "bg-primary/20",
                      tier.color === 'success' && "bg-success/20",
                      tier.color === 'accent' && "bg-accent/20",
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        tier.color === 'warning' && "text-warning",
                        tier.color === 'primary' && "text-primary",
                        tier.color === 'success' && "text-success",
                        tier.color === 'accent' && "text-accent",
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold">{tier.name}</h3>
                      {isActive && (
                        <span className="text-xs text-primary">مفعّل حالياً</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
