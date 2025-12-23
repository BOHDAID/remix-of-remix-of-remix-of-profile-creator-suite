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
  Globe,
  Fingerprint as FingerprintIcon
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
  
  // Fingerprint validation
  const fpErrors: FingerprintError[] = [];
  let fpScore = 100;
  
  if (profile.fingerprint) {
    // Check UA vs Platform consistency
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
    
    // Check GPU vs WebGL
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

    // Check timezone
    if (hasProxy && profile.fingerprint.timezone) {
      // Simple check - in real app, would check against proxy IP location
      fpScore -= 0; // Assume OK for demo
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

  // Get or generate health for a profile
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

  const getRiskColor = (risk: number) => {
    if (risk <= 25) return 'text-success';
    if (risk <= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getStatusBadge = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">🟢 OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">🟡 تحذير</Badge>;
      case 'danger':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">🔴 خطر</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>اسم البروفايل</TableHead>
              <TableHead className="text-center">Proxy</TableHead>
              <TableHead className="text-center">VPN</TableHead>
              <TableHead className="text-center">Fingerprint</TableHead>
              <TableHead className="text-center">Risk</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile, index) => {
              const health = getProfileHealth(profile);
              const isLaunching = launchingId === profile.id;
              
              return (
                <TableRow 
                  key={profile.id}
                  className={cn(
                    "transition-colors",
                    profile.status === 'running' && "bg-success/5"
                  )}
                >
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {profile.icon ? (
                        <span className="text-xl">{profile.icon}</span>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: profile.color || 'hsl(var(--primary) / 0.2)' }}
                        >
                          {profile.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        {profile.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {profile.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {health.proxyStatus.enabled ? (
                      health.proxyStatus.working ? (
                        <div className="flex flex-col items-center gap-1">
                          <Check className="w-5 h-5 text-success" />
                          <span className="text-xs text-muted-foreground">
                            {health.proxyStatus.latency}ms
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                          <span className="text-xs text-warning">فشل</span>
                        </div>
                      )
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {health.vpnStatus.enabled ? (
                      health.vpnStatus.connected ? (
                        <div className="flex flex-col items-center gap-1">
                          <Wifi className="w-5 h-5 text-success" />
                          <span className="text-xs text-muted-foreground">
                            {health.vpnStatus.country}
                          </span>
                        </div>
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      )
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {health.fingerprintValidation.isValid ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        ✅ Valid
                      </Badge>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          ❌ Invalid
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-xs text-primary"
                          onClick={() => setErrorDialogProfile(profile)}
                        >
                          Show Error
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className={cn("font-bold text-lg", getRiskColor(health.riskScore.overall))}>
                      {health.riskScore.overall}%
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getStatusBadge(health.riskScore.status)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {profile.status === 'running' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStop(profile)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLaunch(profile)}
                          disabled={isLaunching || !licenseCheck.canRun}
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        >
                          {isLaunching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setInspectorProfile(profile)}
                        className="h-8 w-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(profile)}
                        className="h-8 w-8"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(profile)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد بروفايلات'}
          </div>
        )}
      </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              أخطاء البصمة: {errorDialogProfile?.name}
            </DialogTitle>
          </DialogHeader>
          {errorDialogProfile && (
            <div className="space-y-4">
              {getProfileHealth(errorDialogProfile).fingerprintValidation.errors.map((error, i) => (
                <div key={i} className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={error.severity === 'critical' ? 'destructive' : 'outline'}>
                      {error.severity === 'critical' ? 'حرج' : 'تحذير'}
                    </Badge>
                    <span className="font-medium">{error.field}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">المتوقع: </span>
                      <span className="text-success">{error.expected}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الفعلي: </span>
                      <span className="text-destructive">{error.actual}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-primary/10 p-2 rounded">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">الحل: {error.fix}</span>
                  </div>
                </div>
              ))}
              
              {getProfileHealth(errorDialogProfile).fingerprintValidation.errors.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد أخطاء
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
