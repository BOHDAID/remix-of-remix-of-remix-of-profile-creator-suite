import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Lock, Fingerprint, Eye, AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function SecurityView() {
  const { security, updateSecurity, setLocked } = useAppStore();
  const { t, isRTL } = useTranslation();
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Password strength checker
  const getPasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;

    if (strength <= 2) return { strength: 1, label: isRTL ? 'ضعيفة' : 'Weak', color: 'bg-destructive' };
    if (strength <= 4) return { strength: 2, label: isRTL ? 'متوسطة' : 'Medium', color: 'bg-warning' };
    return { strength: 3, label: isRTL ? 'قوية' : 'Strong', color: 'bg-success' };
  };

  const handleSetPassword = () => {
    // If password already exists, verify current password
    if (security.passwordHash && currentPassword !== security.passwordHash) {
      toast.error(isRTL ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      return;
    }

    if (password.length < 6) {
      toast.error(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    // In a real app, you would hash the password
    updateSecurity({ 
      passwordHash: password,
      appLockEnabled: true,
      failedAttempts: 0,
    });

    setShowPasswordDialog(false);
    setPassword('');
    setConfirmPassword('');
    setCurrentPassword('');
    toast.success(isRTL ? 'تم تعيين كلمة المرور بنجاح' : 'Password set successfully');
  };

  const handleRemovePassword = () => {
    updateSecurity({
      passwordHash: undefined,
      appLockEnabled: false,
    });
    toast.success(isRTL ? 'تم إزالة كلمة المرور' : 'Password removed');
  };

  const handleToggleAppLock = (enabled: boolean) => {
    if (enabled && !security.passwordHash) {
      // Need to set password first
      setShowPasswordDialog(true);
    } else {
      updateSecurity({ appLockEnabled: enabled });
      if (enabled) {
        toast.success(isRTL ? 'تم تفعيل قفل التطبيق' : 'App lock enabled');
      } else {
        toast.info(isRTL ? 'تم تعطيل قفل التطبيق' : 'App lock disabled');
      }
    }
  };

  const handleLockNow = () => {
    if (!security.passwordHash) {
      toast.error(isRTL ? 'يرجى تعيين كلمة مرور أولاً' : 'Please set a password first');
      return;
    }
    setLocked(true);
    toast.info(isRTL ? 'تم قفل التطبيق' : 'App locked');
  };

  const passwordStrength = getPasswordStrength(password);

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
        {/* App Lock Section */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {t('appLock')}
          </h2>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label>{t('appLockDesc')}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL 
                  ? 'حماية التطبيق بكلمة مرور عند فتحه'
                  : 'Protect the app with a password when opening'
                }
              </p>
            </div>
            <Switch
              checked={security.appLockEnabled}
              onCheckedChange={handleToggleAppLock}
            />
          </div>

          {security.appLockEnabled && (
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordDialog(true)}
              >
                <Lock className="w-4 h-4" />
                {security.passwordHash 
                  ? (isRTL ? 'تغيير كلمة المرور' : 'Change Password')
                  : t('setPassword')
                }
              </Button>
              {security.passwordHash && (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleLockNow}
                  >
                    <Lock className="w-4 h-4" />
                    {isRTL ? 'قفل الآن' : 'Lock Now'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleRemovePassword}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    {isRTL ? 'إزالة كلمة المرور' : 'Remove Password'}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Auto Lock */}
          {security.appLockEnabled && security.passwordHash && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>{isRTL ? 'القفل التلقائي' : 'Auto Lock'}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL 
                    ? `قفل التطبيق تلقائياً بعد ${security.autoLockTimeout} دقائق من عدم النشاط`
                    : `Auto lock after ${security.autoLockTimeout} minutes of inactivity`
                  }
                </p>
              </div>
              <Switch
                checked={security.autoLockEnabled}
                onCheckedChange={(checked) => updateSecurity({ autoLockEnabled: checked })}
              />
            </div>
          )}
        </div>

        {/* Other Security Options */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {isRTL ? 'خيارات أمان إضافية' : 'Additional Security Options'}
          </h2>

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
              onCheckedChange={(checked) => {
                updateSecurity({ fingerprintEnabled: checked });
                toast.info(isRTL 
                  ? (checked ? 'تم تفعيل البصمة' : 'تم تعطيل البصمة')
                  : (checked ? 'Fingerprint enabled' : 'Fingerprint disabled')
                );
              }}
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
              onCheckedChange={(checked) => {
                updateSecurity({ dataEncryptionEnabled: checked });
                toast.info(isRTL 
                  ? (checked ? 'تم تفعيل التشفير' : 'تم تعطيل التشفير')
                  : (checked ? 'Encryption enabled' : 'Encryption disabled')
                );
              }}
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
              onCheckedChange={(checked) => {
                updateSecurity({ intrusionDetectionEnabled: checked });
                toast.info(isRTL 
                  ? (checked ? 'تم تفعيل كشف الاختراق' : 'تم تعطيل كشف الاختراق')
                  : (checked ? 'Intrusion detection enabled' : 'Intrusion detection disabled')
                );
              }}
            />
          </div>
        </div>

        {/* Security Status */}
        {security.failedAttempts > 0 && (
          <div className="glass-card rounded-xl p-6 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-warning" />
              <div>
                <h3 className="font-semibold text-warning">
                  {isRTL ? 'تنبيه أمني' : 'Security Alert'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? `${security.failedAttempts} محاولات فاشلة لفتح التطبيق`
                    : `${security.failedAttempts} failed attempts to unlock the app`
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateSecurity({ failedAttempts: 0 })}
                className="mr-auto"
              >
                {isRTL ? 'مسح' : 'Clear'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {security.passwordHash 
                ? (isRTL ? 'تغيير كلمة المرور' : 'Change Password')
                : (isRTL ? 'تعيين كلمة المرور' : 'Set Password')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {security.passwordHash && (
              <div className="space-y-2">
                <Label>{isRTL ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-input"
              />
              {password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div 
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.strength 
                            ? passwordStrength.color 
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.strength === 1 ? 'text-destructive' :
                    passwordStrength.strength === 2 ? 'text-warning' : 'text-success'
                  }`}>
                    {isRTL ? 'قوة كلمة المرور: ' : 'Password strength: '}{passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-input"
              />
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success">
                        {isRTL ? 'متطابقة' : 'Passwords match'}
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-destructive" />
                      <span className="text-destructive">
                        {isRTL ? 'غير متطابقة' : 'Passwords do not match'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPassword('');
              setConfirmPassword('');
              setCurrentPassword('');
            }}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="glow" 
              onClick={handleSetPassword}
              disabled={!password || password !== confirmPassword}
            >
              <Lock className="w-4 h-4" />
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
