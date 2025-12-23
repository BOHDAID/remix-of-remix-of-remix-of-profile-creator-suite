import { useState, useRef } from 'react';
import { 
  Network, 
  Globe, 
  Zap, 
  Shield, 
  RefreshCw, 
  Plus, 
  Trash2,
  Activity,
  Clock,
  MapPin,
  Server,
  Wifi,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Settings2,
  Play,
  Pause,
  BarChart3,
  Smartphone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardPaste
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { testProxyWithCors, ProxyTestResult } from '@/lib/proxyTester';
import { ProxyChain } from '@/types';

// Parse proxy string in various formats
function parseProxyString(input: string): { type: 'http' | 'https' | 'socks4' | 'socks5'; host: string; port: string; username?: string; password?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Patterns to match:
  // type://user:pass@host:port
  // type://host:port
  // user:pass@host:port
  // host:port:user:pass
  // host:port

  let type: 'http' | 'https' | 'socks4' | 'socks5' = 'http';
  let host = '';
  let port = '';
  let username: string | undefined;
  let password: string | undefined;

  // Check for protocol prefix
  const protocolMatch = trimmed.match(/^(https?|socks[45]):\/\//i);
  let remaining = trimmed;
  if (protocolMatch) {
    const proto = protocolMatch[1].toLowerCase();
    if (proto === 'socks5') type = 'socks5';
    else if (proto === 'socks4') type = 'socks4';
    else if (proto === 'https') type = 'https';
    else type = 'http';
    remaining = trimmed.slice(protocolMatch[0].length);
  }

  // Check for user:pass@host:port
  const atMatch = remaining.match(/^([^:]+):([^@]+)@(.+):(\d+)$/);
  if (atMatch) {
    username = atMatch[1];
    password = atMatch[2];
    host = atMatch[3];
    port = atMatch[4];
    return { type, host, port, username, password };
  }

  // Check for host:port:user:pass
  const colonMatch = remaining.match(/^([^:]+):(\d+):([^:]+):(.+)$/);
  if (colonMatch) {
    host = colonMatch[1];
    port = colonMatch[2];
    username = colonMatch[3];
    password = colonMatch[4];
    return { type, host, port, username, password };
  }

  // Check for host:port
  const simpleMatch = remaining.match(/^([^:]+):(\d+)$/);
  if (simpleMatch) {
    host = simpleMatch[1];
    port = simpleMatch[2];
    return { type, host, port };
  }

  return null;
}

interface ProxyHealthInfo {
  status: 'healthy' | 'degraded' | 'down' | 'untested';
  latency: number;
  country?: string;
  city?: string;
  ip?: string;
  lastTested?: Date;
}

interface MultiHopChain {
  id: string;
  name: string;
  hops: { order: number; host: string; country: string; latency: number }[];
  enabled: boolean;
  totalLatency: number;
}

interface GeoCheck {
  id: string;
  proxyName: string;
  expected: { country: string; city: string; timezone: string };
  actual: { country: string; city: string; timezone: string };
  consistent: boolean;
  checkedAt: Date;
}

export function AdvancedProxyView() {
  const { isRTL } = useTranslation();
  const { proxyChains, addProxyChain, updateProxyChain, deleteProxyChain, setActiveView } = useAppStore();
  const [activeTab, setActiveTab] = useState('health');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);
  const [proxyHealthMap, setProxyHealthMap] = useState<Map<string, ProxyHealthInfo>>(new Map());

  // Paste input state
  const [pasteInput, setPasteInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ReturnType<typeof parseProxyString> | null>(null);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -240 : 240;
    el.scrollBy({ left: isRTL ? -delta : delta, behavior: 'smooth' });
  };

  // Form state for add proxy
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
    setPasteInput('');
    setParsedPreview(null);
  };

  // Auto-parse pasted proxy
  const handlePasteChange = (value: string) => {
    setPasteInput(value);
    const parsed = parseProxyString(value);
    setParsedPreview(parsed);
    if (parsed) {
      setProxyType(parsed.type);
      setProxyHost(parsed.host);
      setProxyPort(parsed.port);
      setProxyUsername(parsed.username || '');
      setProxyPassword(parsed.password || '');
    }
  };

  const handleAddProxy = () => {
    if (!proxyHost.trim() || !proxyPort.trim()) {
      toast.error(isRTL ? 'يرجى ملء العنوان والمنفذ' : 'Please fill host and port');
      return;
    }

    const name = proxyName.trim() || `${proxyHost}:${proxyPort}`;
    const proxy = {
      type: proxyType,
      host: proxyHost.trim(),
      port: proxyPort.trim(),
      username: proxyUsername.trim() || undefined,
      password: proxyPassword.trim() || undefined,
      status: 'active' as const,
      lastTested: undefined,
      speed: undefined,
    };

    const chain: ProxyChain = {
      id: crypto.randomUUID(),
      name,
      proxies: [proxy],
      enabled: true,
    };

    addProxyChain(chain);
    setShowAddDialog(false);
    resetForm();
    toast.success(isRTL ? 'تم إضافة البروكسي بنجاح' : 'Proxy added successfully');
  };

  // Real proxy test
  const handleTestProxy = async (chain: ProxyChain) => {
    const proxy = chain.proxies[0];
    if (!proxy) return;

    setTestingProxyId(chain.id);
    toast.info(isRTL ? 'جاري فحص البروكسي...' : 'Testing proxy...');

    try {
      const result = await testProxyWithCors({
        type: proxy.type,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
      });

      const healthInfo: ProxyHealthInfo = {
        status: result.success ? (result.latency < 200 ? 'healthy' : 'degraded') : 'down',
        latency: result.latency,
        country: result.country,
        city: result.city,
        ip: result.ip,
        lastTested: new Date(),
      };

      setProxyHealthMap(prev => new Map(prev).set(chain.id, healthInfo));

      // Update proxy in store
      const updatedProxies = chain.proxies.map(p => ({
        ...p,
        status: result.success ? 'active' as const : 'failed' as const,
        speed: result.latency,
        lastTested: new Date(),
      }));
      updateProxyChain(chain.id, { proxies: updatedProxies });

      if (result.success) {
        toast.success(
          isRTL ? `البروكسي يعمل - ${result.latency}ms` : `Proxy working - ${result.latency}ms`,
          { description: result.country ? `${result.city || ''}, ${result.country}` : undefined }
        );
      } else {
        toast.error(isRTL ? 'فشل الاتصال بالبروكسي' : 'Proxy connection failed', {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error(isRTL ? 'خطأ في الفحص' : 'Test error');
    }

    setTestingProxyId(null);
  };

  const handleDeleteProxy = (id: string) => {
    deleteProxyChain(id);
    toast.success(isRTL ? 'تم حذف البروكسي' : 'Proxy deleted');
  };

  const getHealthInfo = (chainId: string): ProxyHealthInfo => {
    return proxyHealthMap.get(chainId) || { status: 'untested', latency: 0 };
  };

  // Count stats from real data
  const healthyCount = proxyChains.filter(c => {
    const h = proxyHealthMap.get(c.id);
    return h?.status === 'healthy';
  }).length;
  const degradedCount = proxyChains.filter(c => {
    const h = proxyHealthMap.get(c.id);
    return h?.status === 'degraded';
  }).length;
  const downCount = proxyChains.filter(c => {
    const h = proxyHealthMap.get(c.id);
    return h?.status === 'down';
  }).length;
  const avgLatency = proxyChains.length > 0
    ? Math.round(
        proxyChains.reduce((sum, c) => sum + (proxyHealthMap.get(c.id)?.latency || 0), 0) / proxyChains.length
      )
    : 0;

  // AI Rotation Settings
  const [rotationConfig, setRotationConfig] = useState({
    enabled: true,
    strategy: 'ai-optimized' as 'round-robin' | 'random' | 'performance' | 'ai-optimized',
    interval: 300,
    stickySession: true,
    sessionDuration: 30
  });

  // DNS Settings
  const [dnsConfig, setDnsConfig] = useState({
    protocol: 'doh' as 'standard' | 'doh' | 'dot',
    servers: ['1.1.1.1', '8.8.8.8'],
    blockAds: true,
    blockTrackers: true
  });

  // Warmup Settings
  const [warmupConfig, setWarmupConfig] = useState({
    enabled: true,
    sites: ['google.com', 'youtube.com', 'facebook.com'],
    requestCount: 5,
    interval: 1000
  });

  // Mobile Carrier
  const [carrierConfig, setCarrierConfig] = useState({
    enabled: false,
    carrier: 'Verizon',
    country: 'US',
    networkType: '5G' as '3G' | '4G' | '5G' | 'LTE'
  });

  // Multi-Hop Chains
  const [multiHopChains, setMultiHopChains] = useState<MultiHopChain[]>([]);

  // Geo Consistency Checks
  const [geoChecks] = useState<GeoCheck[]>([]);

  const warmupProxy = (proxyId: string) => {
    toast.success(isRTL ? 'جاري تسخين البروكسي...' : 'Warming up proxy...');
    setTimeout(() => {
      toast.success(isRTL ? 'تم تسخين البروكسي بنجاح' : 'Proxy warmup complete');
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Network className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'البروكسي المتقدم' : 'Advanced Proxy'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'إدارة متقدمة وذكية للبروكسيات' : 'Advanced and intelligent proxy management'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="glow" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة بروكسي' : 'Add Proxy'}
          </Button>
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3 animate-pulse text-green-500" />
            {healthyCount}/{proxyChains.length} {isRTL ? 'نشط' : 'Active'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'صحي' : 'Healthy'}</p>
                <p className="text-2xl font-bold text-green-400">{healthyCount}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'متدهور' : 'Degraded'}</p>
                <p className="text-2xl font-bold text-yellow-400">{degradedCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'معطل' : 'Down'}</p>
                <p className="text-2xl font-bold text-red-400">{downCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'متوسط التأخير' : 'Avg Latency'}</p>
                <p className="text-2xl font-bold text-blue-400">{avgLatency}ms</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="relative">
          <div ref={tabsRef} className="overflow-x-auto">
            <TabsList className="bg-card w-max">
              <TabsTrigger value="health">{isRTL ? 'صحة البروكسي' : 'Health'}</TabsTrigger>
              <TabsTrigger value="rotation">{isRTL ? 'التدوير الذكي' : 'AI Rotation'}</TabsTrigger>
              <TabsTrigger value="multihop">{isRTL ? 'متعدد القفزات' : 'Multi-Hop'}</TabsTrigger>
              <TabsTrigger value="geo">{isRTL ? 'تطابق الموقع' : 'Geo-Consistency'}</TabsTrigger>
              <TabsTrigger value="dns">DNS</TabsTrigger>
              <TabsTrigger value="carrier">{isRTL ? 'شبكة الموبايل' : 'Mobile Carrier'}</TabsTrigger>
            </TabsList>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scrollTabs('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm"
            aria-label={isRTL ? 'تحريك يمين' : 'Scroll left'}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scrollTabs('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm"
            aria-label={isRTL ? 'تحريك يسار' : 'Scroll right'}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Health Dashboard */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {isRTL ? 'لوحة صحة البروكسيات' : 'Proxy Health Dashboard'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proxyChains.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{isRTL ? 'لا توجد بروكسيات' : 'No proxies added'}</p>
                  <p className="text-sm mt-1">{isRTL ? 'أضف بروكسي للبدء' : 'Add a proxy to get started'}</p>
                  <Button variant="glow" className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {isRTL ? 'إضافة بروكسي' : 'Add Proxy'}
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {proxyChains.map((chain) => {
                      const proxy = chain.proxies[0];
                      const health = getHealthInfo(chain.id);
                      const isTesting = testingProxyId === chain.id;

                      return (
                        <div 
                          key={chain.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            health.status === 'healthy' && "bg-green-500/5 border-green-500/20",
                            health.status === 'degraded' && "bg-yellow-500/5 border-yellow-500/20",
                            health.status === 'down' && "bg-red-500/5 border-red-500/20",
                            health.status === 'untested' && "bg-muted/50 border-border"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                health.status === 'healthy' && "bg-green-500",
                                health.status === 'degraded' && "bg-yellow-500",
                                health.status === 'down' && "bg-red-500",
                                health.status === 'untested' && "bg-gray-500"
                              )} />
                              <div>
                                <p className="font-medium">{chain.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {proxy?.type?.toUpperCase()}://{proxy?.host}:{proxy?.port}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {health.country && (
                                <Badge variant="outline">{health.country}</Badge>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleTestProxy(chain)}
                                disabled={isTesting}
                              >
                                {isTesting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Zap className="w-4 h-4 mr-1" />
                                )}
                                {isRTL ? 'فحص' : 'Test'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteProxy(chain.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</p>
                              <p className="font-medium capitalize">
                                {health.status === 'untested' 
                                  ? (isRTL ? 'لم يُختبر' : 'Untested')
                                  : health.status === 'healthy'
                                    ? (isRTL ? 'يعمل' : 'Healthy')
                                    : health.status === 'degraded'
                                      ? (isRTL ? 'بطيء' : 'Slow')
                                      : (isRTL ? 'معطل' : 'Down')
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{isRTL ? 'التأخير' : 'Latency'}</p>
                              <p className="font-medium">{health.latency > 0 ? `${health.latency}ms` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{isRTL ? 'الموقع' : 'Location'}</p>
                              <p className="font-medium">
                                {health.city && health.country 
                                  ? `${health.city}, ${health.country}` 
                                  : health.country || '-'
                                }
                              </p>
                            </div>
                          </div>
                          {health.ip && (
                            <p className="text-xs text-muted-foreground mt-2">
                              IP: {health.ip}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Rotation */}
        <TabsContent value="rotation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {isRTL ? 'التدوير الذكي للبروكسي' : 'AI Proxy Rotation'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'تدوير تلقائي وذكي للبروكسيات بناءً على الأداء'
                  : 'Automatic and intelligent proxy rotation based on performance'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تفعيل التدوير' : 'Enable Rotation'}</label>
                </div>
                <Switch 
                  checked={rotationConfig.enabled}
                  onCheckedChange={(v) => setRotationConfig(s => ({ ...s, enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'استراتيجية التدوير' : 'Rotation Strategy'}</label>
                <Select 
                  value={rotationConfig.strategy}
                  onValueChange={(v) => setRotationConfig(s => ({ ...s, strategy: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">{isRTL ? 'دائري' : 'Round Robin'}</SelectItem>
                    <SelectItem value="random">{isRTL ? 'عشوائي' : 'Random'}</SelectItem>
                    <SelectItem value="performance">{isRTL ? 'حسب الأداء' : 'Performance'}</SelectItem>
                    <SelectItem value="ai-optimized">{isRTL ? 'محسن بالذكاء الاصطناعي' : 'AI Optimized'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'فاصل التدوير' : 'Rotation Interval'}: {rotationConfig.interval}s
                </label>
                <Slider 
                  value={[rotationConfig.interval]} 
                  min={30}
                  max={3600}
                  step={30}
                  onValueChange={([v]) => setRotationConfig(s => ({ ...s, interval: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'جلسات ثابتة' : 'Sticky Sessions'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'الحفاظ على نفس البروكسي خلال الجلسة' : 'Keep same proxy during session'}
                  </p>
                </div>
                <Switch 
                  checked={rotationConfig.stickySession}
                  onCheckedChange={(v) => setRotationConfig(s => ({ ...s, stickySession: v }))}
                />
              </div>

              {rotationConfig.stickySession && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRTL ? 'مدة الجلسة' : 'Session Duration'}: {rotationConfig.sessionDuration} {isRTL ? 'دقيقة' : 'min'}
                  </label>
                  <Slider 
                    value={[rotationConfig.sessionDuration]} 
                    min={5}
                    max={120}
                    step={5}
                    onValueChange={([v]) => setRotationConfig(s => ({ ...s, sessionDuration: v }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Hop */}
        <TabsContent value="multihop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                {isRTL ? 'سلاسل البروكسي متعددة القفزات' : 'Multi-Hop Proxy Chains'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'توجيه حركة المرور عبر عدة بروكسيات للحماية القصوى'
                  : 'Route traffic through multiple proxies for maximum protection'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {multiHopChains.map((chain) => (
                <div key={chain.id} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">{chain.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {chain.hops.length} {isRTL ? 'قفزات' : 'hops'} • {chain.totalLatency}ms {isRTL ? 'إجمالي التأخير' : 'total latency'}
                      </p>
                    </div>
                    <Switch checked={chain.enabled} />
                  </div>
                  <div className="flex items-center gap-2">
                    {chain.hops.map((hop, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">{hop.country}</p>
                          <p className="text-sm font-medium">{hop.latency}ms</p>
                        </div>
                        {idx < chain.hops.length - 1 && (
                          <div className="w-8 h-0.5 bg-primary/50" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geo Consistency */}
        <TabsContent value="geo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {isRTL ? 'فحص تطابق الموقع الجغرافي' : 'Geo-Consistency Check'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geoChecks.map((check) => (
                  <div 
                    key={check.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      check.consistent ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{check.proxyName}</p>
                      <Badge variant={check.consistent ? 'default' : 'destructive'}>
                        {check.consistent ? (isRTL ? 'متطابق' : 'Consistent') : (isRTL ? 'غير متطابق' : 'Mismatch')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">{isRTL ? 'المتوقع' : 'Expected'}</p>
                        <p>{check.expected.country} • {check.expected.city}</p>
                        <p className="text-xs text-muted-foreground">{check.expected.timezone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">{isRTL ? 'الفعلي' : 'Actual'}</p>
                        <p>{check.actual.country} • {check.actual.city}</p>
                        <p className="text-xs text-muted-foreground">{check.actual.timezone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DNS */}
        <TabsContent value="dns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {isRTL ? 'إعدادات DNS المشفر' : 'Encrypted DNS Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'بروتوكول DNS' : 'DNS Protocol'}</label>
                <Select 
                  value={dnsConfig.protocol}
                  onValueChange={(v) => setDnsConfig(s => ({ ...s, protocol: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{isRTL ? 'قياسي' : 'Standard'}</SelectItem>
                    <SelectItem value="doh">DNS over HTTPS (DoH)</SelectItem>
                    <SelectItem value="dot">DNS over TLS (DoT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{isRTL ? 'حظر الإعلانات' : 'Block Ads'}</label>
                <Switch 
                  checked={dnsConfig.blockAds}
                  onCheckedChange={(v) => setDnsConfig(s => ({ ...s, blockAds: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{isRTL ? 'حظر المتتبعات' : 'Block Trackers'}</label>
                <Switch 
                  checked={dnsConfig.blockTrackers}
                  onCheckedChange={(v) => setDnsConfig(s => ({ ...s, blockTrackers: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile Carrier */}
        <TabsContent value="carrier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                {isRTL ? 'محاكاة شبكة الموبايل' : 'Mobile Carrier Simulation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{isRTL ? 'تفعيل محاكاة الموبايل' : 'Enable Mobile Simulation'}</label>
                <Switch 
                  checked={carrierConfig.enabled}
                  onCheckedChange={(v) => setCarrierConfig(s => ({ ...s, enabled: v }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'مزود الخدمة' : 'Carrier'}</label>
                  <Select 
                    value={carrierConfig.carrier}
                    onValueChange={(v) => setCarrierConfig(s => ({ ...s, carrier: v }))}
                    disabled={!carrierConfig.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Verizon">Verizon</SelectItem>
                      <SelectItem value="AT&T">AT&T</SelectItem>
                      <SelectItem value="T-Mobile">T-Mobile</SelectItem>
                      <SelectItem value="Vodafone">Vodafone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isRTL ? 'نوع الشبكة' : 'Network Type'}</label>
                  <Select 
                    value={carrierConfig.networkType}
                    onValueChange={(v) => setCarrierConfig(s => ({ ...s, networkType: v as any }))}
                    disabled={!carrierConfig.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3G">3G</SelectItem>
                      <SelectItem value="4G">4G</SelectItem>
                      <SelectItem value="LTE">LTE</SelectItem>
                      <SelectItem value="5G">5G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Proxy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {isRTL ? 'إضافة بروكسي جديد' : 'Add New Proxy'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Paste Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4" />
                {isRTL ? 'لصق البروكسي (تحليل تلقائي)' : 'Paste Proxy (Auto-detect)'}
              </Label>
              <Textarea
                value={pasteInput}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={isRTL 
                  ? 'الصق البروكسي بأي صيغة:\nhost:port\nuser:pass@host:port\nsocks5://host:port'
                  : 'Paste proxy in any format:\nhost:port\nuser:pass@host:port\nsocks5://host:port'
                }
                className="bg-input font-mono text-sm min-h-[80px]"
                dir="ltr"
              />
              {parsedPreview && (
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                  <p className="text-green-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {isRTL ? 'تم التعرف على البروكسي' : 'Proxy detected'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 font-mono">
                    {parsedPreview.type.toUpperCase()}://{parsedPreview.host}:{parsedPreview.port}
                    {parsedPreview.username && ` (${isRTL ? 'مع مصادقة' : 'with auth'})`}
                  </p>
                </div>
              )}
              {pasteInput && !parsedPreview && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                  <p className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {isRTL ? 'صيغة غير معروفة' : 'Unknown format'}
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {isRTL ? 'أو أدخل يدوياً' : 'or enter manually'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'اسم البروكسي (اختياري)' : 'Proxy Name (optional)'}</Label>
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
            <Button variant="glow" onClick={handleAddProxy} disabled={!proxyHost || !proxyPort}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
