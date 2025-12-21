import { useEffect, useState } from 'react';
import { Download, RefreshCw, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getElectronAPI, UpdateInfo, UpdateProgress } from '@/lib/electron';
import { cn } from '@/lib/utils';

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready';

export function UpdateNotification() {
  const [state, setState] = useState<UpdateState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    api.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setState('available');
      setDismissed(false);
    });

    api.onUpdateProgress((prog) => {
      setProgress(prog);
      setState('downloading');
    });

    api.onUpdateDownloaded((info) => {
      setUpdateInfo(info);
      setState('ready');
    });
  }, []);

  const handleInstall = async () => {
    const api = getElectronAPI();
    if (api) {
      await api.installUpdate();
    }
  };

  const handleCheckForUpdates = async () => {
    const api = getElectronAPI();
    if (api) {
      setState('checking');
      await api.checkForUpdates();
      // If no update, reset after a delay
      setTimeout(() => {
        if (state === 'checking') setState('idle');
      }, 5000);
    }
  };

  if (dismissed || state === 'idle') return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 w-80 rounded-lg border bg-card p-4 shadow-lg",
      "animate-in slide-in-from-bottom-4 fade-in duration-300"
    )}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {state === 'checking' && (
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">جاري البحث عن تحديثات...</span>
        </div>
      )}

      {state === 'available' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">تحديث جديد متاح!</p>
              <p className="text-sm text-muted-foreground">
                الإصدار {updateInfo?.version}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            جاري التحميل تلقائياً...
          </p>
        </div>
      )}

      {state === 'downloading' && progress && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="font-medium">جاري التحميل...</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              </p>
            </div>
            <span className="text-sm font-medium">
              {progress.percent.toFixed(0)}%
            </span>
          </div>
          <Progress value={progress.percent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            السرعة: {formatBytes(progress.bytesPerSecond)}/ث
          </p>
        </div>
      )}

      {state === 'ready' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">التحديث جاهز!</p>
              <p className="text-sm text-muted-foreground">
                الإصدار {updateInfo?.version}
              </p>
            </div>
          </div>
          <Button onClick={handleInstall} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة التشغيل والتثبيت
          </Button>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
