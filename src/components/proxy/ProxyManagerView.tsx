import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Network, Gauge, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ProxyManagerView() {
  const { proxyChains } = useAppStore();
  const { t, isRTL } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Network className="w-7 h-7 text-primary" />
            {t('proxyManager')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('proxySettings')}</p>
        </div>
        <Button variant="glow" onClick={() => toast.info(isRTL ? 'قريباً' : 'Coming soon')}>
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة بروكسي' : 'Add Proxy'}
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            {t('testProxy')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'اختبر سرعة وحالة البروكسيات المضافة' : 'Test speed and status of added proxies'}
          </p>
          <Button variant="outline" onClick={() => toast.info(isRTL ? 'قريباً' : 'Coming soon')}>
            <RefreshCw className="w-4 h-4" />
            {t('testProxy')}
          </Button>
        </div>

        {proxyChains.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{isRTL ? 'لا توجد بروكسيات' : 'No proxies added'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
