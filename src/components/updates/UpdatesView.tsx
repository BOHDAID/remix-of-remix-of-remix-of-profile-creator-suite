import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { isElectron, getElectronAPI } from '@/lib/electron';
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
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          error: result?.error || 'فشل التحقق من التحديثات',
        }));
        toast.error(result?.error || 'فشل التحقق من التحديثات');
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

      <div className="glass-card rounded-xl p-8">
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
                <h2 className="text-xl font-semibold">التحقق من التحديثات</h2>
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

      {/* Info Card */}
      <div className="glass-card rounded-xl p-6 mt-6">
        <h3 className="font-semibold mb-3">معلومات التحديث التلقائي</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• يتم التحقق من التحديثات تلقائياً عند فتح التطبيق</li>
          <li>• يتم تحميل التحديثات في الخلفية دون إزعاجك</li>
          <li>• سيُطلب منك إعادة التشغيل عند اكتمال التحميل</li>
        </ul>
      </div>
    </div>
  );
}