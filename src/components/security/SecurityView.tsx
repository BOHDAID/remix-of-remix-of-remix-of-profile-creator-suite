import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Lock, Fingerprint, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function SecurityView() {
  const { security, updateSecurity } = useAppStore();
  const { t, isRTL } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          {t('securityTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('securityDesc')}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t('appLock')}
          </h2>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label>{t('appLockDesc')}</Label>
            </div>
            <Switch
              checked={security.appLockEnabled}
              onCheckedChange={(checked) => updateSecurity({ appLockEnabled: checked })}
            />
          </div>

          {security.appLockEnabled && (
            <Button variant="outline" onClick={() => toast.info(isRTL ? 'قريباً' : 'Coming soon')}>
              {t('setPassword')}
            </Button>
          )}
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>{t('fingerprintLogin')}</Label>
                <p className="text-xs text-muted-foreground">{t('fingerprintLoginDesc')}</p>
              </div>
            </div>
            <Switch
              checked={security.fingerprintEnabled}
              onCheckedChange={(checked) => updateSecurity({ fingerprintEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>{t('dataEncryption')}</Label>
                <p className="text-xs text-muted-foreground">{t('dataEncryptionDesc')}</p>
              </div>
            </div>
            <Switch
              checked={security.dataEncryptionEnabled}
              onCheckedChange={(checked) => updateSecurity({ dataEncryptionEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label>{t('intrusionDetection')}</Label>
                <p className="text-xs text-muted-foreground">{t('intrusionDetectionDesc')}</p>
              </div>
            </div>
            <Switch
              checked={security.intrusionDetectionEnabled}
              onCheckedChange={(checked) => updateSecurity({ intrusionDetectionEnabled: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
