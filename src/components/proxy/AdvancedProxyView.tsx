import { useState } from 'react';
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
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProxyHealth {
  id: string;
  name: string;
  host: string;
  type: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: Date;
  bandwidth: { used: number; limit: number };
  requests: number;
  country: string;
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
  const { proxyChains } = useAppStore();
  const [activeTab, setActiveTab] = useState('health');

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

  // Sample Health Data
  const [proxyHealth] = useState<ProxyHealth[]>([
    { id: '1', name: 'US Residential 1', host: '192.168.1.1:8080', type: 'HTTP', status: 'healthy', latency: 45, uptime: 99.9, lastCheck: new Date(), bandwidth: { used: 2.5, limit: 10 }, requests: 15234, country: 'US' },
    { id: '2', name: 'UK Datacenter', host: '10.0.0.1:3128', type: 'SOCKS5', status: 'healthy', latency: 78, uptime: 99.5, lastCheck: new Date(), bandwidth: { used: 5.2, limit: 10 }, requests: 8921, country: 'UK' },
    { id: '3', name: 'DE Mobile', host: '172.16.0.1:1080', type: 'SOCKS5', status: 'degraded', latency: 156, uptime: 95.2, lastCheck: new Date(), bandwidth: { used: 8.1, limit: 10 }, requests: 4521, country: 'DE' },
    { id: '4', name: 'JP Residential', host: '192.168.2.1:8080', type: 'HTTP', status: 'down', latency: 0, uptime: 0, lastCheck: new Date(), bandwidth: { used: 0, limit: 10 }, requests: 0, country: 'JP' },
  ]);

  // Multi-Hop Chains
  const [multiHopChains, setMultiHopChains] = useState<MultiHopChain[]>([
    {
      id: '1',
      name: 'Triple Layer',
      hops: [
        { order: 1, host: '192.168.1.1', country: 'US', latency: 45 },
        { order: 2, host: '10.0.0.1', country: 'UK', latency: 78 },
        { order: 3, host: '172.16.0.1', country: 'DE', latency: 92 }
      ],
      enabled: true,
      totalLatency: 215
    }
  ]);

  // Geo Consistency Checks
  const [geoChecks] = useState<GeoCheck[]>([
    { id: '1', proxyName: 'US Residential 1', expected: { country: 'US', city: 'New York', timezone: 'America/New_York' }, actual: { country: 'US', city: 'New York', timezone: 'America/New_York' }, consistent: true, checkedAt: new Date() },
    { id: '2', proxyName: 'UK Datacenter', expected: { country: 'UK', city: 'London', timezone: 'Europe/London' }, actual: { country: 'UK', city: 'Manchester', timezone: 'Europe/London' }, consistent: false, checkedAt: new Date() },
  ]);

  const runSpeedTest = (proxyId: string) => {
    toast.success(isRTL ? 'جاري اختبار السرعة...' : 'Running speed test...');
    setTimeout(() => {
      toast.success(isRTL ? 'تم اختبار السرعة: 45ms' : 'Speed test complete: 45ms');
    }, 2000);
  };

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
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3 animate-pulse text-green-500" />
            {proxyHealth.filter(p => p.status === 'healthy').length}/{proxyHealth.length} {isRTL ? 'نشط' : 'Active'}
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
                <p className="text-2xl font-bold text-green-400">{proxyHealth.filter(p => p.status === 'healthy').length}</p>
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
                <p className="text-2xl font-bold text-yellow-400">{proxyHealth.filter(p => p.status === 'degraded').length}</p>
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
                <p className="text-2xl font-bold text-red-400">{proxyHealth.filter(p => p.status === 'down').length}</p>
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
                <p className="text-2xl font-bold text-blue-400">
                  {Math.round(proxyHealth.filter(p => p.status !== 'down').reduce((a, p) => a + p.latency, 0) / proxyHealth.filter(p => p.status !== 'down').length || 0)}ms
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="health">{isRTL ? 'صحة البروكسي' : 'Health'}</TabsTrigger>
          <TabsTrigger value="rotation">{isRTL ? 'التدوير الذكي' : 'AI Rotation'}</TabsTrigger>
          <TabsTrigger value="multihop">{isRTL ? 'متعدد القفزات' : 'Multi-Hop'}</TabsTrigger>
          <TabsTrigger value="geo">{isRTL ? 'تطابق الموقع' : 'Geo-Consistency'}</TabsTrigger>
          <TabsTrigger value="dns">DNS</TabsTrigger>
          <TabsTrigger value="carrier">{isRTL ? 'شبكة الموبايل' : 'Mobile Carrier'}</TabsTrigger>
        </TabsList>

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
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {proxyHealth.map((proxy) => (
                    <div 
                      key={proxy.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        proxy.status === 'healthy' && "bg-green-500/5 border-green-500/20",
                        proxy.status === 'degraded' && "bg-yellow-500/5 border-yellow-500/20",
                        proxy.status === 'down' && "bg-red-500/5 border-red-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            proxy.status === 'healthy' && "bg-green-500",
                            proxy.status === 'degraded' && "bg-yellow-500",
                            proxy.status === 'down' && "bg-red-500"
                          )} />
                          <div>
                            <p className="font-medium">{proxy.name}</p>
                            <p className="text-xs text-muted-foreground">{proxy.host} • {proxy.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{proxy.country}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => runSpeedTest(proxy.id)}>
                            <Zap className="w-4 h-4 mr-1" />
                            {isRTL ? 'اختبار' : 'Test'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => warmupProxy(proxy.id)}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {isRTL ? 'تسخين' : 'Warmup'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{isRTL ? 'التأخير' : 'Latency'}</p>
                          <p className="font-medium">{proxy.latency}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRTL ? 'وقت التشغيل' : 'Uptime'}</p>
                          <p className="font-medium">{proxy.uptime}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRTL ? 'الطلبات' : 'Requests'}</p>
                          <p className="font-medium">{proxy.requests.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{isRTL ? 'البيانات' : 'Bandwidth'}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={(proxy.bandwidth.used / proxy.bandwidth.limit) * 100} className="h-2" />
                            <span className="text-xs">{proxy.bandwidth.used}/{proxy.bandwidth.limit}GB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
    </div>
  );
}
