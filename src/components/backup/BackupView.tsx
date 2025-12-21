import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Download, 
  Upload, 
  Shield, 
  Trash2, 
  FileJson,
  Calendar,
  HardDrive,
  Lock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { BackupData } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BackupView() {
  const { backups, addBackup, deleteBackup, profiles, extensions, settings } = useAppStore();
  const { t, isRTL } = useTranslation();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [backupName, setBackupName] = useState('');
  const [encryptBackup, setEncryptBackup] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error(isRTL ? 'يرجى إدخال اسم النسخة الاحتياطية' : 'Please enter backup name');
      return;
    }

    setIsCreating(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const backup: BackupData = {
      id: crypto.randomUUID(),
      name: backupName.trim(),
      createdAt: new Date(),
      size: JSON.stringify({ profiles, extensions, settings }).length,
      encrypted: encryptBackup,
      profiles: [...profiles],
      extensions: [...extensions],
      settings: { ...settings },
    };

    addBackup(backup);
    setShowCreateDialog(false);
    setBackupName('');
    setEncryptBackup(false);
    setIsCreating(false);
    toast.success(isRTL ? 'تم إنشاء النسخة الاحتياطية بنجاح' : 'Backup created successfully');
  };

  const handleRestoreBackup = async (backup: BackupData) => {
    setIsRestoring(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Restore profiles
    backup.profiles.forEach(profile => {
      const exists = profiles.find(p => p.id === profile.id);
      if (!exists) {
        useAppStore.getState().addProfile(profile);
      }
    });

    // Restore extensions
    backup.extensions.forEach(ext => {
      const exists = extensions.find(e => e.id === ext.id);
      if (!exists) {
        useAppStore.getState().addExtension(ext);
      }
    });

    setIsRestoring(false);
    setShowRestoreDialog(false);
    toast.success(isRTL ? 'تم استعادة النسخة الاحتياطية بنجاح' : 'Backup restored successfully');
  };

  const handleDeleteBackup = (id: string) => {
    deleteBackup(id);
    setDeleteConfirm(null);
    toast.success(isRTL ? 'تم حذف النسخة الاحتياطية' : 'Backup deleted');
  };

  const handleExportBackup = (backup: BackupData) => {
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${backup.name}_${new Date(backup.createdAt).toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success(isRTL ? 'تم تصدير النسخة الاحتياطية' : 'Backup exported');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;
        
        // Validate backup structure
        if (!backup.id || !backup.name || !backup.profiles || !backup.extensions) {
          throw new Error('Invalid backup format');
        }

        // Generate new ID for imported backup
        backup.id = crypto.randomUUID();
        backup.name = `${backup.name} (${isRTL ? 'مستورد' : 'Imported'})`;
        backup.createdAt = new Date();

        addBackup(backup);
        toast.success(isRTL ? 'تم استيراد النسخة الاحتياطية بنجاح' : 'Backup imported successfully');
      } catch (error) {
        toast.error(isRTL ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? 'إنشاء نسخة احتياطية من جميع البروفايلات والملحقات والإعدادات'
              : 'Create a backup of all profiles, extensions, and settings'
            }
          </p>
          <Button variant="glow" className="w-full" onClick={() => setShowCreateDialog(true)}>
            <Download className="w-4 h-4" />
            {t('createBackup')}
          </Button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {isRTL ? 'استيراد نسخة' : 'Import Backup'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL 
              ? 'استيراد نسخة احتياطية من ملف JSON'
              : 'Import a backup from a JSON file'
            }
          </p>
          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="w-full pointer-events-none">
              <Upload className="w-4 h-4" />
              {isRTL ? 'اختر ملف' : 'Choose File'}
            </Button>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          {isRTL ? 'النسخ الاحتياطية المحفوظة' : 'Saved Backups'}
          <span className="text-muted-foreground text-sm font-normal">({backups.length})</span>
        </h2>

        {backups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{isRTL ? 'لا توجد نسخ احتياطية' : 'No backups found'}</p>
            <p className="text-sm mt-1">
              {isRTL ? 'أنشئ نسخة احتياطية للحفاظ على بياناتك' : 'Create a backup to preserve your data'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {backups.map((backup) => (
              <div key={backup.id} className="glass-card rounded-xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    {backup.encrypted ? (
                      <Lock className="w-5 h-5 text-primary" />
                    ) : (
                      <FileJson className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{backup.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(backup.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(backup.size)}
                      </span>
                      <span>
                        {backup.profiles.length} {isRTL ? 'بروفايل' : 'profiles'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportBackup(backup)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreBackup(backup)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(backup.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {isRTL ? 'إنشاء نسخة احتياطية جديدة' : 'Create New Backup'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم النسخة الاحتياطية' : 'Backup Name'}</Label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder={isRTL ? 'مثال: نسخة العمل' : 'e.g., Work Backup'}
                className="bg-input"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>{isRTL ? 'تشفير النسخة' : 'Encrypt Backup'}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'حماية إضافية للبيانات الحساسة' : 'Extra protection for sensitive data'}
                  </p>
                </div>
              </div>
              <Switch
                checked={encryptBackup}
                onCheckedChange={setEncryptBackup}
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium mb-2">{isRTL ? 'سيتم حفظ:' : 'Will save:'}</p>
              <ul className="space-y-1">
                <li>• {profiles.length} {isRTL ? 'بروفايل' : 'profiles'}</li>
                <li>• {extensions.length} {isRTL ? 'ملحق' : 'extensions'}</li>
                <li>• {isRTL ? 'جميع الإعدادات' : 'All settings'}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="glow" onClick={handleCreateBackup} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRTL ? 'جاري الإنشاء...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {isRTL ? 'إنشاء' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'حذف النسخة الاحتياطية؟' : 'Delete Backup?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف النسخة الاحتياطية نهائياً.'
                : 'This action cannot be undone. The backup will be permanently deleted.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteBackup(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
