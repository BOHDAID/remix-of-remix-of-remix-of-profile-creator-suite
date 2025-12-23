import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  Github,
  Key,
  Link,
  CheckCheck
} from 'lucide-react';
import { isElectron, getElectronAPI, ManualUpdateProgress } from '@/lib/electron';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpdateState {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  progress: number;
  version: string | null;
  error: string | null;
}

interface ManualUpdateState {
  repoUrl: string;
  accessToken: string;
  verifying: boolean;
  verified: boolean;
  updating: boolean;
  repoName: string | null;
  latestVersion: string | null;
  currentVersion: string | null;
  hasUpdate: boolean;
  progress: ManualUpdateProgress | null;
  error: string | null;
}

export function UpdatesView() {
  const [updateState, setUpdateState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0,
    version: null,
    error: null,
  });

  const [manualUpdate, setManualUpdate] = useState<ManualUpdateState>({
    repoUrl: '',
    accessToken: '',
    verifying: false,
    verified: false,
    updating: false,
    repoName: null,
    latestVersion: null,
    currentVersion: null,
    hasUpdate: false,
    progress: null,
    error: null,
  });

  const electronAPI = getElectronAPI();

  useEffect(() => {
    if (!isElectron()) return;

    electronAPI?.onUpdateAvailable((info) => {
      setUpdateState(prev => ({
        ...prev,
        available: true,
        version: info.version,
        checking: false,
      }));
    });

    electronAPI?.onUpdateProgress((progress) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: true,
        progress: progress.percent,
      }));
    });

    electronAPI?.onUpdateDownloaded((info) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        version: info.version,
      }));
    });

    electronAPI?.onManualUpdateProgress((progress) => {
      setManualUpdate(prev => ({
        ...prev,
        progress,
      }));
    });
  }, [electronAPI]);

  const handleCheckForUpdates = async () => {
    if (!isElectron()) {
      toast.error('التحقق من التحديثات متاح فقط في تطبيق سطح المكتب');
      return;
    }

    setUpdateState(prev => ({ ...prev, checking: true, error: null }));

    try {
      const result = await electronAPI?.checkForUpdates();
      
      if (result?.success) {
        if (result.updateInfo) {
          setUpdateState(prev => ({
            ...prev,
            available: true,
            version: result.updateInfo?.version || null,
            checking: false,
          }));
          toast.success(`تحديث جديد متاح: ${result.updateInfo.version}`);
        } else {
          setUpdateState(prev => ({
            ...prev,
            checking: false,
            available: false,
          }));
          toast.success('أنت تستخدم أحدث إصدار');
        }
      } else {
        const errorMsg = result?.error || 'فشل التحقق من التحديثات';
        const isNoRelease = errorMsg.toLowerCase().includes('no published versions') || 
                            errorMsg.toLowerCase().includes('cannot find latest');
        
        if (isNoRelease) {
          setUpdateState(prev => ({
            ...prev,
            checking: false,
            available: false,
            error: null,
          }));
          toast.success('أنت تستخدم أحدث إصدار متاح');
        } else {
          setUpdateState(prev => ({
            ...prev,
            checking: false,
            error: errorMsg,
          }));
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        error: 'حدث خطأ أثناء التحقق من التحديثات',
      }));
      toast.error('حدث خطأ أثناء التحقق من التحديثات');
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await electronAPI?.installUpdate();
    } catch (error) {
      toast.error('حدث خطأ أثناء تثبيت التحديث');
    }
  };

  const handleVerifyRepo = async () => {
    if (!manualUpdate.repoUrl) {
      toast.error('الرجاء إدخال رابط المستودع');
      return;
    }

    setManualUpdate(prev => ({ 
      ...prev, 
      verifying: true, 
      verified: false, 
      error: null 
    }));

    try {
      const result = await electronAPI?.verifyGitHubRepo(
        manualUpdate.repoUrl, 
        manualUpdate.accessToken
      );

      if (result?.success) {
        setManualUpdate(prev => ({
          ...prev,
          verifying: false,
          verified: true,
          repoName: result.repoName || null,
          latestVersion: result.latestVersion || null,
          currentVersion: result.currentVersion || null,
          hasUpdate: result.hasUpdate || false,
        }));
        
        if (result.hasUpdate) {
          toast.success(`تم التحقق! تحديث جديد متاح: ${result.latestVersion}`);
        } else {
          toast.success('تم التحقق! أنت تستخدم أحدث إصدار');
        }
      } else {
        setManualUpdate(prev => ({
          ...prev,
          verifying: false,
          verified: false,
          error: result?.error || 'فشل التحقق',
        }));
        toast.error(result?.error || 'فشل التحقق من المستودع');
      }
    } catch (error) {
      setManualUpdate(prev => ({
        ...prev,
        verifying: false,
        error: 'حدث خطأ أثناء التحقق',
      }));
      toast.error('حدث خطأ أثناء التحقق من المستودع');
    }
  };

  const handleManualUpdate = async () => {
    setManualUpdate(prev => ({ ...prev, updating: true, error: null }));

    try {
      const result = await electronAPI?.updateFromGitHub(
        manualUpdate.repoUrl,
        manualUpdate.accessToken
      );

      if (result?.success) {
        toast.success(result.message || 'تم التحديث بنجاح');
      } else {
        setManualUpdate(prev => ({
          ...prev,
          updating: false,
          error: result?.error || 'فشل التحديث',
        }));
        toast.error(result?.error || 'فشل التحديث');
      }
    } catch (error) {
      setManualUpdate(prev => ({
        ...prev,
        updating: false,
        error: 'حدث خطأ أثناء التحديث',
      }));
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const resetManualUpdate = () => {
    setManualUpdate({
      repoUrl: '',
      accessToken: '',
      verifying: false,
      verified: false,
      updating: false,
      repoName: null,
      latestVersion: null,
      currentVersion: null,
      hasUpdate: false,
      progress: null,
      error: null,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">التحديثات</h1>
        <p className="text-muted-foreground">تحقق من وجود تحديثات جديدة للتطبيق</p>
      </div>

      {!isElectron() && (
        <div className="glass-card rounded-xl p-6 border-warning/20 bg-warning/5 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning" />
            <p className="text-warning">
              هذه الميزة متاحة فقط في تطبيق سطح المكتب
            </p>
          </div>
        </div>
      )}

      {/* Auto Update Section */}
      <div className="glass-card rounded-xl p-8 mb-6">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Status Icon */}
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center",
            updateState.downloaded ? "bg-success/20" :
            updateState.available ? "bg-primary/20" :
            updateState.error ? "bg-destructive/20" :
            "bg-muted"
          )}>
            {updateState.checking || updateState.downloading ? (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            ) : updateState.downloaded ? (
              <CheckCircle2 className="w-12 h-12 text-success" />
            ) : updateState.available ? (
              <Sparkles className="w-12 h-12 text-primary" />
            ) : updateState.error ? (
              <AlertCircle className="w-12 h-12 text-destructive" />
            ) : (
              <RefreshCw className="w-12 h-12 text-muted-foreground" />
            )}
          </div>

          {/* Status Text */}
          <div>
            {updateState.checking ? (
              <h2 className="text-xl font-semibold">جاري التحقق من التحديثات...</h2>
            ) : updateState.downloading ? (
              <>
                <h2 className="text-xl font-semibold">جاري تحميل التحديث</h2>
                <p className="text-muted-foreground mt-1">
                  الإصدار {updateState.version} - {updateState.progress.toFixed(0)}%
                </p>
                <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${updateState.progress}%` }}
                  />
                </div>
              </>
            ) : updateState.downloaded ? (
              <>
                <h2 className="text-xl font-semibold text-success">التحديث جاهز للتثبيت</h2>
                <p className="text-muted-foreground mt-1">
                  الإصدار {updateState.version} جاهز. أعد تشغيل التطبيق للتثبيت.
                </p>
              </>
            ) : updateState.available ? (
              <>
                <h2 className="text-xl font-semibold text-primary">تحديث جديد متاح!</h2>
                <p className="text-muted-foreground mt-1">
                  الإصدار {updateState.version} متاح للتحميل
                </p>
              </>
            ) : updateState.error ? (
              <>
                <h2 className="text-xl font-semibold text-destructive">حدث خطأ</h2>
                <p className="text-muted-foreground mt-1">{updateState.error}</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">التحقق التلقائي من التحديثات</h2>
                <p className="text-muted-foreground mt-1">
                  اضغط على الزر أدناه للتحقق من وجود تحديثات جديدة
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {updateState.downloaded ? (
              <Button onClick={handleInstallUpdate} variant="glow" size="lg">
                <Download className="w-5 h-5 ml-2" />
                تثبيت وإعادة التشغيل
              </Button>
            ) : (
              <Button
                onClick={handleCheckForUpdates}
                variant="glow"
                size="lg"
                disabled={updateState.checking || updateState.downloading || !isElectron()}
              >
                {updateState.checking ? (
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 ml-2" />
                )}
                {updateState.checking ? 'جاري التحقق...' : 'التحقق من التحديثات'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Manual GitHub Update Section */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Github className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">التحديث اليدوي من GitHub</h3>
        </div>

        {!manualUpdate.verified ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repoUrl" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                رابط المستودع
              </Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/username/repo أو username/repo"
                value={manualUpdate.repoUrl}
                onChange={(e) => setManualUpdate(prev => ({ ...prev, repoUrl: e.target.value }))}
                disabled={manualUpdate.verifying}
                className="text-left ltr"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Access Token (Classic)
              </Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={manualUpdate.accessToken}
                onChange={(e) => setManualUpdate(prev => ({ ...prev, accessToken: e.target.value }))}
                disabled={manualUpdate.verifying}
                className="text-left ltr"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                اختياري للمستودعات العامة، مطلوب للمستودعات الخاصة
              </p>
            </div>

            {manualUpdate.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{manualUpdate.error}</p>
              </div>
            )}

            <Button
              onClick={handleVerifyRepo}
              disabled={manualUpdate.verifying || !manualUpdate.repoUrl || !isElectron()}
              className="w-full"
            >
              {manualUpdate.verifying ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4 ml-2" />
              )}
              {manualUpdate.verifying ? 'جاري التحقق...' : 'تحقق من المستودع'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Verified Info */}
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-medium text-success">تم التحقق بنجاح</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المستودع:</span>
                  <span className="font-mono">{manualUpdate.repoName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإصدار الحالي:</span>
                  <span className="font-mono">{manualUpdate.currentVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر إصدار:</span>
                  <span className="font-mono text-primary">{manualUpdate.latestVersion}</span>
                </div>
              </div>
            </div>

            {/* Update Progress */}
            {manualUpdate.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{manualUpdate.progress.message}</span>
                  <span>{manualUpdate.progress.percent}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${manualUpdate.progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {manualUpdate.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{manualUpdate.error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleManualUpdate}
                disabled={manualUpdate.updating || !isElectron()}
                variant="glow"
                className="flex-1"
              >
                {manualUpdate.updating ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 ml-2" />
                )}
                {manualUpdate.updating ? 'جاري التحديث...' : 'تحديث الآن'}
              </Button>
              <Button
                onClick={resetManualUpdate}
                variant="outline"
                disabled={manualUpdate.updating}
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-3">معلومات التحديث</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>التحديث التلقائي:</strong> يتم التحقق من التحديثات تلقائياً عند فتح التطبيق</li>
          <li>• <strong>التحديث اليدوي:</strong> استخدم رابط المستودع و Access Token للتحديث من GitHub مباشرة</li>
          <li>• Access Token يمكن إنشاؤه من GitHub Settings → Developer settings → Personal access tokens</li>
        </ul>
      </div>
    </div>
  );
}
