import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Play, 
  Square, 
  Settings2, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Shield,
  Loader2,
  Eye,
  Wifi,
  WifiOff,
  Globe,
  Fingerprint as FingerprintIcon,
  Zap,
  Clock,
  Activity,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Signal,
  SignalHigh,
  SignalLow,
  ChevronRight,
  Copy,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { checkLicenseStatus } from '@/lib/licenseUtils';
import { ProfileInspector } from './ProfileInspector';
import { 
  ProfileHealth, 
  calculateRiskScore, 
  FingerprintValidation,
  FingerprintError
} from '@/types/profile-extended';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfileTableViewProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  searchQuery: string;
}

// Generate mock health data for demo
function generateProfileHealth(profile: Profile): ProfileHealth {
  const hasProxy = !!profile.proxy?.host;
  const hasFingerprint = !!profile.fingerprint;
  
  const fpErrors: FingerprintError[] = [];
  let fpScore = 100;
  
  if (profile.fingerprint) {
    if (profile.userAgent?.includes('Windows') && profile.fingerprint.platform !== 'Win32') {
      fpErrors.push({
        field: 'Platform',
        expected: 'Win32',
        actual: profile.fingerprint.platform || 'Unknown',
        severity: 'critical',
        fix: 'تغيير Platform إلى Win32 ليتوافق مع User Agent'
      });
      fpScore -= 30;
    }
    
    if (profile.fingerprint.gpu && profile.fingerprint.webglRenderer) {
      if (!profile.fingerprint.webglRenderer.includes(profile.fingerprint.gpu.split(' ')[0])) {
        fpErrors.push({
          field: 'WebGL Renderer',
          expected: `يحتوي على ${profile.fingerprint.gpu}`,
          actual: profile.fingerprint.webglRenderer,
          severity: 'warning',
          fix: 'تحديث WebGL Renderer ليتوافق مع GPU'
        });
        fpScore -= 15;
      }
    }
  } else {
    fpErrors.push({
      field: 'البصمة',
      expected: 'بصمة مخصصة',
      actual: 'غير موجودة',
      severity: 'critical',
      fix: 'إنشاء بصمة رقمية للبروفايل'
    });
    fpScore = 20;
  }

  const fingerprintValidation: FingerprintValidation = {
    isValid: fpErrors.filter(e => e.severity === 'critical').length === 0,
    score: Math.max(0, fpScore),
    errors: fpErrors,
    lastChecked: new Date()
  };

  const health: ProfileHealth = {
    fingerprintValidation,
    riskScore: { overall: 0, factors: [], status: 'safe', color: 'green' },
    proxyStatus: {
      enabled: hasProxy,
      working: hasProxy && Math.random() > 0.2,
      lastTested: hasProxy ? new Date() : null,
      latency: hasProxy ? Math.floor(Math.random() * 500) + 50 : null,
      ip: hasProxy ? `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` : null,
      country: hasProxy ? ['US', 'UK', 'DE', 'FR', 'NL'][Math.floor(Math.random()*5)] : null
    },
    vpnStatus: {
      enabled: false,
      connected: false,
      server: null,
      country: null,
      extensionId: null
    },
    lastActivity: profile.status === 'running' ? new Date() : null,
    sessionAge: Math.random() * 48,
    thermalScore: profile.status === 'running' ? Math.floor(Math.random() * 60) + 20 : 0
  };

  health.riskScore = calculateRiskScore(health);
  
  return health;
}

export function ProfileTableView({ profiles, onEdit, onDelete, searchQuery }: ProfileTableViewProps) {
  const { updateProfile, extensions, settings, license, setActiveView, deleteProfile } = useAppStore();
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [inspectorProfile, setInspectorProfile] = useState<Profile | null>(null);
  const [errorDialogProfile, setErrorDialogProfile] = useState<Profile | null>(null);
  const [profileHealthMap, setProfileHealthMap] = useState<Map<string, ProfileHealth>>(new Map());

  const electronAPI = getElectronAPI();
  const licenseCheck = checkLicenseStatus(license, profiles.length);

  const getProfileHealth = (profile: Profile): ProfileHealth => {
    if (!profileHealthMap.has(profile.id)) {
      const health = generateProfileHealth(profile);
      setProfileHealthMap(prev => new Map(prev).set(profile.id, health));
      return health;
    }
    return profileHealthMap.get(profile.id)!;
  };

  const handleLaunch = async (profile: Profile) => {
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

    setLaunchingId(profile.id);

    try {
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
        toast.success(`تم تشغيل ${profile.name}`);
      } else {
        toast.error(result?.error || 'فشل تشغيل البروفايل');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تشغيل البروفايل');
    } finally {
      setLaunchingId(null);
    }
  };

  const handleStop = async (profile: Profile) => {
    try {
      const result = await electronAPI?.stopProfile(profile.id);
      if (result?.success) {
        updateProfile(profile.id, { status: 'stopped' });
        toast.success(`تم إيقاف ${profile.name}`);
      } else {
        toast.error(result?.error || 'فشل إيقاف البروفايل');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskGradient = (risk: number) => {
    if (risk <= 25) return 'from-emerald-500/20 to-emerald-500/5';
    if (risk <= 50) return 'from-amber-500/20 to-amber-500/5';
    return 'from-red-500/20 to-red-500/5';
  };

  const getRiskIcon = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'danger':
        return <ShieldX className="w-5 h-5 text-red-400" />;
    }
  };

  const getProxyIcon = (health: ProfileHealth) => {
    if (!health.proxyStatus.enabled) {
      return <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
        <WifiOff className="w-5 h-5 text-muted-foreground/50" />
      </div>;
    }
    if (health.proxyStatus.working) {
      return <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
        <Signal className="w-5 h-5 text-emerald-400" />
      </div>;
    }
    return <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/10 flex items-center justify-center border border-red-500/30">
      <SignalLow className="w-5 h-5 text-red-400" />
    </div>;
  };

  return (
    <TooltipProvider>
      <>
        <div className="space-y-3">
          {filteredProfiles.map((profile, index) => {
            const health = getProfileHealth(profile);
            const isLaunching = launchingId === profile.id;
            const isRunning = profile.status === 'running';
            
            return (
              <div
                key={profile.id}
                className={cn(
                  "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
                  "bg-gradient-to-r from-card via-card to-card/80",
                  "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30",
                  isRunning && "ring-2 ring-emerald-500/50 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                )}
              >
                {/* Animated gradient background for running profiles */}
                {isRunning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 animate-pulse" />
                )}
                
                <div className="relative p-4">
                  <div className="flex items-center gap-4">
                    {/* Profile Avatar & Number */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center border border-border">
                          {index + 1}
                        </span>
                        {profile.icon ? (
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl border border-primary/20 shadow-lg">
                            {profile.icon}
                          </div>
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border shadow-lg"
                            style={{ 
                              backgroundColor: profile.color || 'hsl(var(--primary) / 0.15)',
                              borderColor: profile.color ? `${profile.color}50` : 'hsl(var(--primary) / 0.3)'
                            }}
                          >
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isRunning && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                        )}
                      </div>
                      
                      <div className="min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{profile.name}</h3>
                          {isRunning && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                              <Activity className="w-3 h-3 mr-1" />
                              نشط
                            </Badge>
                          )}
                        </div>
                        {profile.notes ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                            {profile.notes}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 mt-0.5">
                            بدون ملاحظات
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Cards */}
                    <div className="flex-1 flex items-center justify-center gap-3">
                      {/* Proxy Status */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 min-w-[80px]">
                            {getProxyIcon(health)}
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {health.proxyStatus.enabled 
                                ? health.proxyStatus.working 
                                  ? `${health.proxyStatus.latency}ms` 
                                  : 'فشل'
                                : 'بدون'
                              }
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>البروكسي: {health.proxyStatus.enabled ? (health.proxyStatus.working ? 'يعمل' : 'لا يعمل') : 'غير مفعل'}</p>
                          {health.proxyStatus.ip && <p className="text-xs text-muted-foreground">IP: {health.proxyStatus.ip}</p>}
                        </TooltipContent>
                      </Tooltip>

                      {/* VPN Status */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 min-w-[80px]">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center border",
                              health.vpnStatus.enabled 
                                ? health.vpnStatus.connected 
                                  ? "bg-gradient-to-br from-blue-500/30 to-blue-600/10 border-blue-500/30"
                                  : "bg-gradient-to-br from-amber-500/30 to-amber-600/10 border-amber-500/30"
                                : "bg-muted/50 border-transparent"
                            )}>
                              <Wifi className={cn(
                                "w-5 h-5",
                                health.vpnStatus.enabled 
                                  ? health.vpnStatus.connected ? "text-blue-400" : "text-amber-400"
                                  : "text-muted-foreground/50"
                              )} />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {health.vpnStatus.enabled ? (health.vpnStatus.connected ? health.vpnStatus.country || 'متصل' : 'منقطع') : 'بدون'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>VPN: {health.vpnStatus.enabled ? (health.vpnStatus.connected ? 'متصل' : 'غير متصل') : 'غير مفعل'}</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Fingerprint Status */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex flex-col items-center gap-1 min-w-[80px] cursor-pointer"
                            onClick={() => !health.fingerprintValidation.isValid && setErrorDialogProfile(profile)}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center border",
                              health.fingerprintValidation.isValid 
                                ? "bg-gradient-to-br from-violet-500/30 to-violet-600/10 border-violet-500/30 shadow-lg shadow-violet-500/10"
                                : "bg-gradient-to-br from-red-500/30 to-red-600/10 border-red-500/30"
                            )}>
                              <FingerprintIcon className={cn(
                                "w-5 h-5",
                                health.fingerprintValidation.isValid ? "text-violet-400" : "text-red-400"
                              )} />
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold",
                              health.fingerprintValidation.isValid ? "text-violet-400" : "text-red-400"
                            )}>
                              {health.fingerprintValidation.score}%
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>البصمة: {health.fingerprintValidation.isValid ? 'صالحة' : 'غير صالحة'}</p>
                          {health.fingerprintValidation.errors.length > 0 && (
                            <p className="text-xs text-red-400">{health.fingerprintValidation.errors.length} أخطاء</p>
                          )}
                        </TooltipContent>
                      </Tooltip>

                      {/* Risk Score */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 min-w-[100px]">
                            <div className={cn(
                              "w-16 h-10 rounded-xl flex items-center justify-center gap-1.5 border",
                              `bg-gradient-to-br ${getRiskGradient(health.riskScore.overall)}`,
                              health.riskScore.status === 'safe' && "border-emerald-500/30",
                              health.riskScore.status === 'warning' && "border-amber-500/30",
                              health.riskScore.status === 'danger' && "border-red-500/30"
                            )}>
                              {getRiskIcon(health.riskScore.status)}
                              <span className={cn(
                                "font-bold text-lg",
                                health.riskScore.status === 'safe' && "text-emerald-400",
                                health.riskScore.status === 'warning' && "text-amber-400",
                                health.riskScore.status === 'danger' && "text-red-400"
                              )}>
                                {health.riskScore.overall}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-semibold",
                              health.riskScore.status === 'safe' && "text-emerald-400",
                              health.riskScore.status === 'warning' && "text-amber-400",
                              health.riskScore.status === 'danger' && "text-red-400"
                            )}>
                              {health.riskScore.status === 'safe' && 'آمن'}
                              {health.riskScore.status === 'warning' && 'تحذير'}
                              {health.riskScore.status === 'danger' && 'خطر'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>درجة المخاطرة: {health.riskScore.overall}%</p>
                          {health.riskScore.factors.map((f, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{f.name}: {f.description}</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Primary Action: Launch/Stop */}
                      {isRunning ? (
                        <Button
                          onClick={() => handleStop(profile)}
                          className="h-11 px-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 border-0"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          إيقاف
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleLaunch(profile)}
                          disabled={isLaunching || !licenseCheck.canRun}
                          className="h-11 px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 border-0 disabled:opacity-50"
                        >
                          {isLaunching ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          تشغيل
                        </Button>
                      )}

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setInspectorProfile(profile)}
                              className="h-9 w-9 rounded-xl hover:bg-primary/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>فحص البروفايل</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(profile)}
                              className="h-9 w-9 rounded-xl hover:bg-primary/10"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-primary/10"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(profile.id);
                              toast.success('تم نسخ ID');
                            }}>
                              <Copy className="w-4 h-4 ml-2" />
                              نسخ ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setInspectorProfile(profile)}>
                              <Eye className="w-4 h-4 ml-2" />
                              فحص البصمة
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(profile)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف البروفايل
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد بروفايلات'}
            </p>
            <p className="text-muted-foreground/50 text-sm mt-1">
              {!searchQuery && 'أنشئ بروفايل جديد للبدء'}
            </p>
          </div>
        )}

        {/* Profile Inspector Dialog */}
        <Dialog open={!!inspectorProfile} onOpenChange={() => setInspectorProfile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FingerprintIcon className="w-5 h-5 text-primary" />
                فحص البروفايل: {inspectorProfile?.name}
              </DialogTitle>
            </DialogHeader>
            {inspectorProfile && (
              <ProfileInspector 
                profile={inspectorProfile} 
                health={getProfileHealth(inspectorProfile)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Error Details Dialog */}
        <Dialog open={!!errorDialogProfile} onOpenChange={() => setErrorDialogProfile(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                أخطاء البصمة: {errorDialogProfile?.name}
              </DialogTitle>
            </DialogHeader>
            {errorDialogProfile && (
              <div className="space-y-4 mt-4">
                {getProfileHealth(errorDialogProfile).fingerprintValidation.errors.map((error, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-4 rounded-xl border",
                      error.severity === 'critical' 
                        ? "bg-red-500/10 border-red-500/30" 
                        : "bg-amber-500/10 border-amber-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={cn(
                        "w-4 h-4",
                        error.severity === 'critical' ? "text-red-400" : "text-amber-400"
                      )} />
                      <span className="font-semibold">{error.field}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        error.severity === 'critical' 
                          ? "bg-red-500/20 text-red-400 border-red-500/30" 
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      )}>
                        {error.severity === 'critical' ? 'حرج' : 'تحذير'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground">المتوقع:</span>
                        <p className="font-mono text-xs bg-background/50 px-2 py-1 rounded mt-1">{error.expected}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الفعلي:</span>
                        <p className="font-mono text-xs bg-background/50 px-2 py-1 rounded mt-1">{error.actual}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-primary">الحل:</span> {error.fix}
                    </p>
                  </div>
                ))}
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setErrorDialogProfile(null);
                    onEdit(errorDialogProfile);
                  }}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  تعديل البروفايل
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
}