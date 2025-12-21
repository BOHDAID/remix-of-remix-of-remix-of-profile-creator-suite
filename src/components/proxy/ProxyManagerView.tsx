import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Network, 
  Gauge, 
  RefreshCw, 
  Plus, 
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { ProxySettings, ProxyChain } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function ProxyManagerView() {
  const { proxyChains, addProxyChain, updateProxyChain, deleteProxyChain } = useAppStore();
  const { t, isRTL } = useTranslation();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingProxy, setTestingProxy] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  
  // Form state
  const [proxyName, setProxyName] = useState('');
  const [proxyType, setProxyType] = useState<'http' | 'https' | 'socks4' | 'socks5'>('http');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUsername, setProxyUsername] = useState('');
  const [proxyPassword, setProxyPassword] = useState('');

  const resetForm = () => {
    setProxyName('');
    setProxyType('http');
    setProxyHost('');
    setProxyPort('');
    setProxyUsername('');
    setProxyPassword('');
  };

  const handleAddProxy = () => {
    if (!proxyName.trim() || !proxyHost.trim() || !proxyPort.trim()) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const proxy: ProxySettings = {
      type: proxyType,
      host: proxyHost.trim(),
      port: proxyPort.trim(),
      username: proxyUsername.trim() || undefined,
      password: proxyPassword.trim() || undefined,
      status: 'active',
      lastTested: undefined,
      speed: undefined,
    };

    const chain: ProxyChain = {
      id: crypto.randomUUID(),
      name: proxyName.trim(),
      proxies: [proxy],
      enabled: true,
    };

    addProxyChain(chain);
    setShowAddDialog(false);
    resetForm();
    toast.success(isRTL ? 'تم إضافة البروكسي بنجاح' : 'Proxy added successfully');
  };

  const handleTestProxy = async (chain: ProxyChain) => {
    setTestingProxy(chain.id);
    
    // Simulate proxy test
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const success = Math.random() > 0.3; // 70% success rate for simulation
    const speed = success ? Math.floor(50 + Math.random() * 200) : 0;
    
    const updatedProxies = chain.proxies.map(p => ({
      ...p,
      status: success ? 'active' as const : 'failed' as const,
      speed,
      lastTested: new Date(),
    }));

    updateProxyChain(chain.id, { proxies: updatedProxies });
    setTestingProxy(null);
    
    if (success) {
      toast.success(isRTL ? `البروكسي يعمل - السرعة: ${speed}ms` : `Proxy working - Speed: ${speed}ms`);
    } else {
      toast.error(isRTL ? 'فشل الاتصال بالبروكسي' : 'Proxy connection failed');
    }
  };

  const handleTestAllProxies = async () => {
    if (proxyChains.length === 0) {
      toast.error(isRTL ? 'لا توجد بروكسيات للاختبار' : 'No proxies to test');
      return;
    }

    setTestingAll(true);
    
    for (const chain of proxyChains) {
      await handleTestProxy(chain);
    }
    
    setTestingAll(false);
    toast.success(isRTL ? 'تم اختبار جميع البروكسيات' : 'All proxies tested');
  };

  const handleDeleteProxy = (id: string) => {
    deleteProxyChain(id);
    toast.success(isRTL ? 'تم حذف البروكسي' : 'Proxy deleted');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

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
        <Button variant="glow" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة بروكسي' : 'Add Proxy'}
        </Button>
      </div>

      {/* Test All Button */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t('testProxy')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'اختبر سرعة وحالة البروكسيات المضافة' : 'Test speed and status of added proxies'}
        </p>
        <Button 
          variant="outline" 
          onClick={handleTestAllProxies}
          disabled={testingAll || proxyChains.length === 0}
        >
          {testingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {testingAll 
            ? (isRTL ? 'جاري الاختبار...' : 'Testing...') 
            : t('testProxy')
          }
        </Button>
      </div>

      {/* Proxy List */}
      {proxyChains.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
          <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{isRTL ? 'لا توجد بروكسيات' : 'No proxies added'}</p>
          <p className="text-sm mt-1">
            {isRTL ? 'أضف بروكسي للبدء' : 'Add a proxy to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {proxyChains.map((chain) => {
            const proxy = chain.proxies[0];
            const isTestingThis = testingProxy === chain.id;
            
            return (
              <div 
                key={chain.id} 
                className={cn(
                  "glass-card rounded-xl p-5 transition-all duration-300 group",
                  proxy?.status === 'active' && "border-success/30",
                  proxy?.status === 'failed' && "border-destructive/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      proxy?.status === 'active' ? "bg-success/20" : 
                      proxy?.status === 'failed' ? "bg-destructive/20" : "bg-primary/20"
                    )}>
                      <Globe className={cn(
                        "w-6 h-6",
                        proxy?.status === 'active' ? "text-success" : 
                        proxy?.status === 'failed' ? "text-destructive" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {chain.name}
                        {getStatusIcon(proxy?.status)}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {proxy?.type}://{proxy?.host}:{proxy?.port}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Speed indicator */}
                    {proxy?.speed !== undefined && proxy.speed > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className={cn(
                          "w-4 h-4",
                          proxy.speed < 100 ? "text-success" :
                          proxy.speed < 200 ? "text-warning" : "text-destructive"
                        )} />
                        <span>{proxy.speed}ms</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestProxy(chain)}
                        disabled={isTestingThis}
                      >
                        {isTestingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProxy(chain.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Last tested info */}
                {proxy?.lastTested && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {isRTL ? 'آخر اختبار: ' : 'Last tested: '}
                    {new Date(proxy.lastTested).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Proxy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {isRTL ? 'إضافة بروكسي جديد' : 'Add New Proxy'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم البروكسي' : 'Proxy Name'}</Label>
              <Input
                value={proxyName}
                onChange={(e) => setProxyName(e.target.value)}
                placeholder={isRTL ? 'مثال: بروكسي أمريكي' : 'e.g., US Proxy'}
                className="bg-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'النوع' : 'Type'}</Label>
                <Select value={proxyType} onValueChange={(v) => setProxyType(v as any)}>
                  <SelectTrigger className="bg-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks4">SOCKS4</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'المنفذ' : 'Port'}</Label>
                <Input
                  value={proxyPort}
                  onChange={(e) => setProxyPort(e.target.value)}
                  placeholder="8080"
                  className="bg-input"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'العنوان' : 'Host'}</Label>
              <Input
                value={proxyHost}
                onChange={(e) => setProxyHost(e.target.value)}
                placeholder="proxy.example.com"
                className="bg-input"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'اسم المستخدم (اختياري)' : 'Username (optional)'}</Label>
                <Input
                  value={proxyUsername}
                  onChange={(e) => setProxyUsername(e.target.value)}
                  placeholder="username"
                  className="bg-input"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'كلمة المرور (اختياري)' : 'Password (optional)'}</Label>
                <Input
                  type="password"
                  value={proxyPassword}
                  onChange={(e) => setProxyPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="glow" onClick={handleAddProxy}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
