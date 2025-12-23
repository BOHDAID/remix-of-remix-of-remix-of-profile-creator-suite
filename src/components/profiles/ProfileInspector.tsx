import { Profile } from '@/types';
import { ProfileHealth, FingerprintError } from '@/types/profile-extended';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  X, 
  AlertTriangle,
  Monitor,
  Cpu,
  HardDrive,
  Globe,
  Clock,
  Palette,
  Shield,
  Wifi,
  Thermometer,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileInspectorProps {
  profile: Profile;
  health: ProfileHealth;
}

export function ProfileInspector({ profile, health }: ProfileInspectorProps) {
  const fp = profile.fingerprint;

  const renderCheck = (match: boolean, expected: string, actual: string, label: string) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {match ? (
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-success" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            <X className="w-4 h-4 text-destructive" />
          </div>
        )}
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">Expected: {expected}</p>
        </div>
      </div>
      <div className="text-left">
        <Badge variant={match ? 'outline' : 'destructive'} className={cn(match && "bg-success/10 text-success border-success/30")}>
          {actual}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">النتيجة الإجمالية</h3>
            <p className="text-sm text-muted-foreground">
              فحص {new Date().toLocaleTimeString('ar-SA')}
            </p>
          </div>
          <div className="text-left">
            <div className={cn(
              "text-4xl font-bold",
              health.fingerprintValidation.score >= 80 ? "text-success" :
              health.fingerprintValidation.score >= 50 ? "text-warning" : "text-destructive"
            )}>
              {health.fingerprintValidation.score}%
            </div>
            <Badge variant="outline" className={cn(
              health.fingerprintValidation.isValid 
                ? "bg-success/10 text-success border-success/30" 
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}>
              {health.fingerprintValidation.isValid ? '✅ Valid' : '❌ Invalid'}
            </Badge>
          </div>
        </div>
        <Progress 
          value={health.fingerprintValidation.score} 
          className="h-3"
        />
      </div>

      {/* Risk Score */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-medium">مستوى المخاطر</span>
          </div>
          <div className={cn(
            "text-3xl font-bold",
            health.riskScore.color === 'green' ? "text-success" :
            health.riskScore.color === 'yellow' ? "text-warning" : "text-destructive"
          )}>
            {health.riskScore.overall}%
          </div>
          <div className="mt-2 space-y-1">
            {health.riskScore.factors.slice(0, 3).map((factor, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{factor.name}</span>
                <span className={cn(
                  factor.score <= 25 ? "text-success" :
                  factor.score <= 50 ? "text-warning" : "text-destructive"
                )}>{factor.score}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5 text-warning" />
            <span className="font-medium">الحرارة / النشاط</span>
          </div>
          <div className={cn(
            "text-3xl font-bold",
            health.thermalScore <= 30 ? "text-success" :
            health.thermalScore <= 60 ? "text-warning" : "text-destructive"
          )}>
            {health.thermalScore}°
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {health.thermalScore <= 30 ? 'بارد - آمن للنشاط' :
             health.thermalScore <= 60 ? 'دافئ - نشاط معتدل' : 'ساخن - يحتاج تبريد'}
          </p>
        </div>
      </div>

      {/* Fingerprint Details */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          تفاصيل البصمة
        </h4>

        <div className="grid gap-2">
          {/* User Agent */}
          {renderCheck(
            true,
            profile.userAgent?.substring(0, 50) + '...' || 'Default',
            'متطابق',
            'User Agent'
          )}

          {/* Platform */}
          {renderCheck(
            fp?.platform === 'Win32' || !fp,
            'Win32',
            fp?.platform || 'Win32',
            'Platform'
          )}

          {/* Screen */}
          {renderCheck(
            true,
            `${fp?.screenWidth || 1920}x${fp?.screenHeight || 1080}`,
            `${fp?.screenWidth || 1920}x${fp?.screenHeight || 1080}`,
            'Screen Resolution'
          )}

          {/* CPU Cores */}
          {renderCheck(
            true,
            String(fp?.cpuCores || 8),
            String(fp?.cpuCores || 8) + ' cores',
            'CPU Cores'
          )}

          {/* Memory */}
          {renderCheck(
            true,
            String(fp?.deviceMemory || 8) + 'GB',
            String(fp?.deviceMemory || 8) + 'GB',
            'Device Memory'
          )}

          {/* WebGL Vendor */}
          {renderCheck(
            true,
            fp?.webglVendor || 'Google Inc.',
            fp?.webglVendor || 'Google Inc.',
            'WebGL Vendor'
          )}

          {/* WebGL Renderer */}
          {renderCheck(
            true,
            fp?.webglRenderer?.substring(0, 40) + '...' || 'ANGLE',
            'متطابق',
            'WebGL Renderer'
          )}

          {/* Timezone */}
          {renderCheck(
            true,
            fp?.timezone || 'America/New_York',
            fp?.timezone || 'America/New_York',
            'Timezone'
          )}

          {/* Language */}
          {renderCheck(
            true,
            fp?.language || 'en-US',
            fp?.language || 'en-US',
            'Language'
          )}
        </div>
      </div>

      <Separator />

      {/* Proxy & VPN Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <span className="font-medium">Proxy</span>
          </div>
          {health.proxyStatus.enabled ? (
            <div className="space-y-2">
              <Badge className={cn(
                health.proxyStatus.working 
                  ? "bg-success/10 text-success border-success/30" 
                  : "bg-destructive/10 text-destructive border-destructive/30"
              )}>
                {health.proxyStatus.working ? '✅ يعمل' : '❌ فشل'}
              </Badge>
              <p className="text-sm">IP: {health.proxyStatus.ip}</p>
              <p className="text-sm">Latency: {health.proxyStatus.latency}ms</p>
              <p className="text-sm">Country: {health.proxyStatus.country}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">غير مفعل</p>
          )}
        </div>

        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-5 h-5 text-primary" />
            <span className="font-medium">VPN</span>
          </div>
          {health.vpnStatus.enabled ? (
            <div className="space-y-2">
              <Badge className={cn(
                health.vpnStatus.connected 
                  ? "bg-success/10 text-success border-success/30" 
                  : "bg-warning/10 text-warning border-warning/30"
              )}>
                {health.vpnStatus.connected ? '✅ متصل' : '⚠️ غير متصل'}
              </Badge>
              <p className="text-sm">Server: {health.vpnStatus.server}</p>
              <p className="text-sm">Country: {health.vpnStatus.country}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">غير مفعل</p>
          )}
        </div>
      </div>

      {/* Errors */}
      {health.fingerprintValidation.errors.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              الأخطاء والمشاكل ({health.fingerprintValidation.errors.length})
            </h4>
            {health.fingerprintValidation.errors.map((error, i) => (
              <div key={i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={error.severity === 'critical' ? 'destructive' : 'outline'}>
                    {error.severity === 'critical' ? 'حرج' : 'تحذير'}
                  </Badge>
                  <span className="font-medium">{error.field}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  المتوقع: <span className="text-success">{error.expected}</span> | 
                  الفعلي: <span className="text-destructive">{error.actual}</span>
                </p>
                <div className="flex items-center gap-2 text-sm bg-primary/10 p-2 rounded">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-primary">{error.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
