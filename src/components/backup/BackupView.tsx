import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function BackupView() {
  const { backups } = useAppStore();
  const { t, isRTL } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Database className="w-7 h-7 text-primary" />
          {t('backupTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('backupDesc')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            {t('createBackup')}
          </h2>
          <Button variant="glow" className="w-full" onClick={() => toast.info(isRTL ? 'قريباً' : 'Coming soon')}>
            {t('createBackup')}
          </Button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {t('restoreBackup')}
          </h2>
          <Button variant="outline" className="w-full" onClick={() => toast.info(isRTL ? 'قريباً' : 'Coming soon')}>
            {t('restoreBackup')}
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {t('encryptedBackup')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'تشفير النسخ الاحتياطية لحماية بياناتك' : 'Encrypt backups to protect your data'}
        </p>
      </div>

      {backups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{isRTL ? 'لا توجد نسخ احتياطية' : 'No backups found'}</p>
        </div>
      )}
    </div>
  );
}
