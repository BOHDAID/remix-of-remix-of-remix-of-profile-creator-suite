import { Profile } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  Trash2, 
  Edit, 
  Globe,
  Shield,
  Puzzle,
  Loader2,
  Lock,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { useState } from 'react';
import { checkLicenseStatus } from '@/lib/licenseUtils';

interface ProfileCardProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onClone?: (profile: Profile) => void;
}

export function ProfileCard({ profile, onEdit, onClone }: ProfileCardProps) {
  const { updateProfile, deleteProfile, extensions, settings, license, profiles, setActiveView } = useAppStore();
  const [launching, setLaunching] = useState(false);
  const electronAPI = getElectronAPI();

  // التحقق من حالة الترخيص
  const licenseCheck = checkLicenseStatus(license, profiles.length);

  const handleStart = async () => {
    // التحقق من الترخيص أولاً
    if (!licenseCheck.canRun) {
      toast.error(licenseCheck.message, {
        action: {
          label: 'تفعيل الترخيص',
          onClick: () => setActiveView('license'),
        },
      });
      return;
    }

    if (!isElectron()) {
      toast.error('تشغيل المتصفح متاح فقط في تطبيق سطح المكتب');
      return;
    }

    if (!settings.chromiumPath) {
      toast.error('يرجى تحديد مسار Chromium في الإعدادات أولاً');
      return;
    }

    setLaunching(true);

    try {
      // Get extension paths based on profile's autoLoadExtensions setting
      const shouldLoadExtensions = profile.autoLoadExtensions ?? true;
      const profileExtensions = shouldLoadExtensions
        ? extensions.filter(e => profile.extensions.includes(e.id) && e.enabled).map(e => e.path)
        : [];

      const result = await electronAPI?.launchProfile({
        chromiumPath: settings.chromiumPath,
        proxy: profile.proxy,
        extensions: profileExtensions,
        userAgent: profile.userAgent || settings.defaultUserAgent,
        profileId: profile.id,
        fingerprint: profile.fingerprint
      });

      if (result?.success) {
        updateProfile(profile.id, { status: 'running' });
        toast.success(`تم تشغيل البروفايل: ${profile.name}`);
      } else {
        toast.error(result?.error || 'فشل تشغيل المتصفح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تشغيل المتصفح');
    } finally {
      setLaunching(false);
    }
  };

  const handleStop = async () => {
    if (!isElectron()) {
      toast.error('إيقاف المتصفح متاح فقط في تطبيق سطح المكتب');
      return;
    }

    try {
      const result = await electronAPI?.stopProfile(profile.id);
      if (result?.success) {
        updateProfile(profile.id, { status: 'stopped' });
        toast.success(`تم إيقاف البروفايل: ${profile.name}`);
      } else {
        toast.error(result?.error || 'فشل إيقاف المتصفح');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إيقاف المتصفح');
    }
  };

  const handleDelete = () => {
    deleteProfile(profile.id);
    toast.success('تم حذف البروفايل بنجاح');
  };

  const profileExtensions = extensions.filter(e => profile.extensions.includes(e.id));
  const isRunning = profile.status === 'running';

  return (
    <div className={cn(
      "glass-card rounded-xl p-5 transition-all duration-300 hover:border-primary/30 group",
      isRunning && "border-success/30 bg-success/5"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isRunning ? "bg-success/20" : "bg-primary/20"
          )}>
            <Globe className={cn(
              "w-6 h-6",
              isRunning ? "text-success" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{profile.name}</h3>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isRunning 
                  ? "bg-success/20 text-success" 
                  : "bg-muted text-muted-foreground"
              )}>
                {isRunning ? 'يعمل' : 'متوقف'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onClone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClone(profile)}
              className="h-8 w-8"
              title="استنساخ"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(profile)}
            className="h-8 w-8"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Shield className="w-4 h-4" />
            <span>البروكسي</span>
          </div>
          <p className="font-medium text-sm truncate">
            {profile.proxy 
              ? `${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`
              : 'بدون بروكسي'
            }
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Puzzle className="w-4 h-4" />
            <span>الملحقات</span>
          </div>
          <p className="font-medium text-sm">
            {profileExtensions.length} ملحق
          </p>
        </div>
      </div>

      {/* Extensions Preview */}
      {profileExtensions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {profileExtensions.slice(0, 3).map((ext) => (
            <span 
              key={ext.id}
              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
            >
              {ext.name}
            </span>
          ))}
          {profileExtensions.length > 3 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
              +{profileExtensions.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      {profile.notes && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {profile.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isRunning ? (
          <Button
            onClick={handleStop}
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <Square className="w-4 h-4 ml-2" />
            إيقاف
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            variant={licenseCheck.canRun ? "glow" : "outline"}
            className={cn(
              "flex-1",
              !licenseCheck.canRun && "border-warning/50 text-warning hover:bg-warning/10"
            )}
            disabled={launching}
          >
            {launching ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : !licenseCheck.canRun ? (
              <Lock className="w-4 h-4 ml-2" />
            ) : (
              <Play className="w-4 h-4 ml-2" />
            )}
            {launching ? 'جاري التشغيل...' : !licenseCheck.canRun ? 'جدد اشتراكك' : 'تشغيل'}
          </Button>
        )}
      </div>
    </div>
  );
}
