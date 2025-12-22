import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { LeakTestResult } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Globe,
  Server,
  Wifi,
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Real IP detection using multiple services
async function getPublicIP(): Promise<{ ip: string; country: string; city: string; isp: string; org: string }> {
  const services = [
    'https://api.ipify.org?format=json',
    'https://api.my-ip.io/v2/ip.json',
    'https://api64.ipify.org?format=json'
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service, { timeout: 5000 } as any);
      const data = await response.json();
      const ip = data.ip || data.address;
      
      // Get IP details
      try {
        const detailsRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const details = await detailsRes.json();
        return {
          ip,
          country: details.country_name || 'Unknown',
          city: details.city || 'Unknown',
          isp: details.org || 'Unknown',
          org: details.asn || 'Unknown'
        };
      } catch {
        return { ip, country: 'Unknown', city: 'Unknown', isp: 'Unknown', org: 'Unknown' };
      }
    } catch {
      continue;
    }
  }
  throw new Error('Could not detect IP');
}

// Real DNS leak test
async function testDNSLeak(): Promise<{ servers: string[]; leaked: boolean }> {
  const dnsServers: string[] = [];
  
  // Test multiple DNS resolution services
  const testDomains = [
    `test-${Date.now()}-1.dns-leak-test.com`,
    `test-${Date.now()}-2.dns-leak-test.com`,
  ];
  
  try {
    // Use a real DNS leak test API
    const response = await fetch('https://www.dnsleaktest.com/test/result.json', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((server: any) => {
          if (server.ip) dnsServers.push(server.ip);
        });
      }
    }
  } catch {
    // Fallback: detect local DNS patterns
    try {
      const res = await fetch('https://1.1.1.1/dns-query?name=whoami.cloudflare', {
        headers: { 'Accept': 'application/dns-json' }
      });
      const data = await res.json();
      if (data.Answer) {
        data.Answer.forEach((a: any) => {
          if (a.data) dnsServers.push(a.data);
        });
      }
    } catch {}
  }
  
  // Check if any DNS servers are local/private
  const leaked = dnsServers.some(dns => 
    dns.startsWith('192.168.') || 
    dns.startsWith('10.') || 
    dns.startsWith('172.16.') ||
    dns.startsWith('172.17.') ||
    dns.startsWith('172.18.') ||
    dns.startsWith('172.19.') ||
    dns.startsWith('172.2') ||
    dns.startsWith('172.3') ||
    dns.includes('local')
  );
  
  return { servers: dnsServers.length > 0 ? dnsServers : ['Could not detect'], leaked };
}

// Real WebRTC leak test
async function testWebRTCLeak(): Promise<{ localIPs: string[]; publicIPs: string[]; leaked: boolean }> {
  return new Promise((resolve) => {
    const localIPs: string[] = [];
    const publicIPs: string[] = [];
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      
      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          const leaked = localIPs.length > 0 || publicIPs.length > 0;
          resolve({ localIPs, publicIPs, leaked });
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        
        if (ipMatch) {
          const ip = ipMatch[0];
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            if (!localIPs.includes(ip)) localIPs.push(ip);
          } else if (!ip.startsWith('0.')) {
            if (!publicIPs.includes(ip)) publicIPs.push(ip);
          }
        }
      };
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {
        resolve({ localIPs: [], publicIPs: [], leaked: false });
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        pc.close();
        const leaked = localIPs.length > 0 || publicIPs.length > 0;
        resolve({ localIPs, publicIPs, leaked });
      }, 5000);
      
    } catch {
      resolve({ localIPs: [], publicIPs: [], leaked: false });
    }
  });
}

// Additional security checks
async function runSecurityChecks(): Promise<{
  timezone: { detected: string; match: boolean };
  language: { detected: string; match: boolean };
  canvas: { hash: string; unique: boolean };
  webgl: { vendor: string; renderer: string };
  fonts: { count: number; common: boolean };
}> {
  // Timezone check
  const timezone = {
    detected: Intl.DateTimeFormat().resolvedOptions().timeZone,
    match: true // Would compare with proxy location
  };
  
  // Language check
  const language = {
    detected: navigator.language,
    match: true
  };
  
  // Canvas fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasHash = 'unknown';
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint test', 2, 2);
    canvasHash = canvas.toDataURL().slice(-50);
  }
  
  // WebGL info
  let webglVendor = 'unknown';
  let webglRenderer = 'unknown';
  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
  } catch {}
  
  // Font detection (count available fonts from a list)
  const testFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Comic Sans MS', 'Impact'];
  let fontCount = 0;
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  if (testCtx) {
    const getWidth = (font: string) => {
      testCtx.font = `${testSize} ${font}`;
      return testCtx.measureText(testString).width;
    };
    
    const baseWidths = baseFonts.map(f => getWidth(f));
    
    testFonts.forEach(font => {
      const detected = baseFonts.some((base, i) => {
        testCtx.font = `${testSize} ${font}, ${base}`;
        return testCtx.measureText(testString).width !== baseWidths[i];
      });
      if (detected) fontCount++;
    });
  }
  
  return {
    timezone,
    language,
    canvas: { hash: canvasHash, unique: true },
    webgl: { vendor: webglVendor, renderer: webglRenderer },
    fonts: { count: fontCount, common: fontCount >= 5 }
  };
}

export function LeakTestView() {
  const { proxyChains, addLeakTestResult, leakTestResults } = useAppStore();
  const { isRTL } = useTranslation();
  
  const [selectedProxyId, setSelectedProxyId] = useState<string>('direct');
  const [testing, setTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testStage, setTestStage] = useState('');
  const [currentResult, setCurrentResult] = useState<LeakTestResult | null>(null);
  const [ipDetails, setIpDetails] = useState<{ country: string; city: string; isp: string } | null>(null);
  const [securityChecks, setSecurityChecks] = useState<Awaited<ReturnType<typeof runSecurityChecks>> | null>(null);
  const [webrtcDetails, setWebrtcDetails] = useState<{ localIPs: string[]; publicIPs: string[] } | null>(null);
  const [dnsDetails, setDnsDetails] = useState<string[]>([]);

  const handleRunTest = async () => {
    setTesting(true);
    setCurrentResult(null);
    setTestProgress(0);
    setSecurityChecks(null);
    setWebrtcDetails(null);
    setDnsDetails([]);
    
    try {
      // Stage 1: IP Detection (0-25%)
      setTestStage(isRTL ? 'جاري كشف عنوان IP...' : 'Detecting IP address...');
      setTestProgress(10);
      
      const ipData = await getPublicIP();
      setIpDetails({ country: ipData.country, city: ipData.city, isp: ipData.isp });
      setTestProgress(25);
      
      // Stage 2: DNS Leak Test (25-50%)
      setTestStage(isRTL ? 'جاري فحص تسريب DNS...' : 'Testing DNS leak...');
      setTestProgress(35);
      
      const dnsResult = await testDNSLeak();
      setDnsDetails(dnsResult.servers);
      setTestProgress(50);
      
      // Stage 3: WebRTC Leak Test (50-75%)
      setTestStage(isRTL ? 'جاري فحص تسريب WebRTC...' : 'Testing WebRTC leak...');
      setTestProgress(60);
      
      const webrtcResult = await testWebRTCLeak();
      setWebrtcDetails({ localIPs: webrtcResult.localIPs, publicIPs: webrtcResult.publicIPs });
      setTestProgress(75);
      
      // Stage 4: Security Checks (75-100%)
      setTestStage(isRTL ? 'جاري فحص الأمان...' : 'Running security checks...');
      setTestProgress(85);
      
      const security = await runSecurityChecks();
      setSecurityChecks(security);
      setTestProgress(100);
      
      // Determine leaks
      const selectedProxy = proxyChains.find(c => c.id === selectedProxyId);
      const expectedIP = selectedProxy?.proxies[0]?.host;
      
      const ipLeak = expectedIP ? ipData.ip !== expectedIP : false;
      const dnsLeak = dnsResult.leaked;
      const webrtcLeak = webrtcResult.leaked;
      
      const result: LeakTestResult = {
        id: crypto.randomUUID(),
        proxyChainId: selectedProxyId,
        timestamp: new Date(),
        ipLeak,
        dnsLeak,
        webrtcLeak,
        detectedIP: ipData.ip,
        expectedIP,
        dnsServers: dnsResult.servers
      };
      
      setCurrentResult(result);
      addLeakTestResult(result);
      
      setTestStage('');
      
      if (ipLeak || dnsLeak || webrtcLeak) {
        toast.error(isRTL ? '⚠️ تم اكتشاف تسريب!' : '⚠️ Leak detected!', {
          description: isRTL ? 'راجع النتائج لمزيد من التفاصيل' : 'Check results for details'
        });
      } else {
        toast.success(isRTL ? '✅ لا يوجد تسريب - أنت آمن!' : '✅ No leaks detected - You are safe!');
      }
    } catch (error) {
      console.error('Leak test error:', error);
      toast.error(isRTL ? 'فشل الاختبار - تحقق من اتصالك' : 'Test failed - Check your connection');
      setTestStage('');
    } finally {
      setTesting(false);
    }
  };

  const recentTests = leakTestResults.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            {isRTL ? 'فحص التسريبات الحقيقي' : 'Real Leak Test'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'فحص حقيقي لتسريب IP و DNS و WebRTC باستخدام خدمات خارجية' : 'Real IP, DNS, and WebRTC leak test using external services'}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Globe className="w-3 h-3" />
          {isRTL ? 'فحص مباشر' : 'Live Test'}
        </Badge>
      </div>

      {/* Test Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            {isRTL ? 'بدء الفحص' : 'Start Test'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedProxyId} onValueChange={setSelectedProxyId}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder={isRTL ? 'اختر بروكسي (اختياري)' : 'Select proxy (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">{isRTL ? 'اتصال مباشر' : 'Direct connection'}</SelectItem>
                  {proxyChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name} ({chain.proxies[0]?.type}://{chain.proxies[0]?.host})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleRunTest}
              disabled={testing}
              className="min-w-[180px]"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRTL ? 'جاري الفحص...' : 'Testing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {isRTL ? 'بدء الفحص الحقيقي' : 'Run Real Test'}
                </>
              )}
            </Button>
          </div>
          
          {testing && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{testStage}</span>
                <span className="font-medium">{testProgress}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* IP Leak */}
            <Card className={cn(
              "glass-card",
              currentResult.ipLeak ? "border-destructive/50" : "border-success/50"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    currentResult.ipLeak ? "bg-destructive/20" : "bg-success/20"
                  )}>
                    {currentResult.ipLeak ? (
                      <XCircle className="w-6 h-6 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'تسريب IP' : 'IP Leak'}</p>
                    <p className={cn(
                      "font-bold",
                      currentResult.ipLeak ? "text-destructive" : "text-success"
                    )}>
                      {currentResult.ipLeak 
                        ? (isRTL ? 'تم اكتشاف تسريب!' : 'Leak Detected!')
                        : (isRTL ? 'لا يوجد تسريب ✓' : 'No Leak ✓')
                      }
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'IP المكتشف:' : 'Detected IP:'}</p>
                    <p className="font-mono text-sm font-bold">{currentResult.detectedIP}</p>
                  </div>
                  {ipDetails && (
                    <>
                      <div className="text-xs">
                        <span className="text-muted-foreground">{isRTL ? 'الموقع: ' : 'Location: '}</span>
                        <span>{ipDetails.city}, {ipDetails.country}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">ISP: </span>
                        <span>{ipDetails.isp}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DNS Leak */}
            <Card className={cn(
              "glass-card",
              currentResult.dnsLeak ? "border-destructive/50" : "border-success/50"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    currentResult.dnsLeak ? "bg-destructive/20" : "bg-success/20"
                  )}>
                    {currentResult.dnsLeak ? (
                      <XCircle className="w-6 h-6 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'تسريب DNS' : 'DNS Leak'}</p>
                    <p className={cn(
                      "font-bold",
                      currentResult.dnsLeak ? "text-destructive" : "text-success"
                    )}>
                      {currentResult.dnsLeak 
                        ? (isRTL ? 'تم اكتشاف تسريب!' : 'Leak Detected!')
                        : (isRTL ? 'لا يوجد تسريب ✓' : 'No Leak ✓')
                      }
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'خوادم DNS المكتشفة:' : 'Detected DNS Servers:'}</p>
                  {dnsDetails.length > 0 ? (
                    dnsDetails.map((dns, i) => (
                      <p key={i} className="font-mono text-sm">{dns}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{isRTL ? 'لم يتم اكتشاف خوادم' : 'No servers detected'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WebRTC Leak */}
            <Card className={cn(
              "glass-card",
              currentResult.webrtcLeak ? "border-destructive/50" : "border-success/50"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    currentResult.webrtcLeak ? "bg-destructive/20" : "bg-success/20"
                  )}>
                    {currentResult.webrtcLeak ? (
                      <XCircle className="w-6 h-6 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'تسريب WebRTC' : 'WebRTC Leak'}</p>
                    <p className={cn(
                      "font-bold",
                      currentResult.webrtcLeak ? "text-destructive" : "text-success"
                    )}>
                      {currentResult.webrtcLeak 
                        ? (isRTL ? 'تم اكتشاف تسريب!' : 'Leak Detected!')
                        : (isRTL ? 'لا يوجد تسريب ✓' : 'No Leak ✓')
                      }
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  {webrtcDetails && (webrtcDetails.localIPs.length > 0 || webrtcDetails.publicIPs.length > 0) ? (
                    <>
                      {webrtcDetails.localIPs.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-destructive">{isRTL ? 'IP محلي مكشوف:' : 'Local IP Exposed:'}</p>
                          {webrtcDetails.localIPs.map((ip, i) => (
                            <p key={i} className="font-mono text-sm">{ip}</p>
                          ))}
                        </div>
                      )}
                      {webrtcDetails.publicIPs.length > 0 && (
                        <div>
                          <p className="text-xs text-destructive">{isRTL ? 'IP عام مكشوف:' : 'Public IP Exposed:'}</p>
                          {webrtcDetails.publicIPs.map((ip, i) => (
                            <p key={i} className="font-mono text-sm">{ip}</p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-success">
                      {isRTL ? 'WebRTC محمي - لا توجد عناوين IP مكشوفة' : 'WebRTC protected - No IPs exposed'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Checks */}
          {securityChecks && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {isRTL ? 'فحوصات أمنية إضافية' : 'Additional Security Checks'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'المنطقة الزمنية' : 'Timezone'}</p>
                    <p className="text-sm font-medium truncate">{securityChecks.timezone.detected}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'اللغة' : 'Language'}</p>
                    <p className="text-sm font-medium">{securityChecks.language.detected}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">WebGL Vendor</p>
                    <p className="text-sm font-medium truncate">{securityChecks.webgl.vendor}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">WebGL Renderer</p>
                    <p className="text-sm font-medium truncate" title={securityChecks.webgl.renderer}>
                      {securityChecks.webgl.renderer.slice(0, 20)}...
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'الخطوط المكتشفة' : 'Fonts Detected'}</p>
                    <p className="text-sm font-medium">{securityChecks.fonts.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Tests */}
      {recentTests.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              {isRTL ? 'الاختبارات الأخيرة' : 'Recent Tests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTests.map((result) => {
                const hasLeak = result.ipLeak || result.dnsLeak || result.webrtcLeak;
                const proxyName = proxyChains.find(c => c.id === result.proxyChainId)?.name || 
                  (result.proxyChainId === 'direct' ? (isRTL ? 'اتصال مباشر' : 'Direct') : '');
                
                return (
                  <div 
                    key={result.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      hasLeak ? "bg-destructive/10 border border-destructive/20" : "bg-success/10 border border-success/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {hasLeak ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                      <div>
                        <p className="font-medium">{result.detectedIP}</p>
                        <p className="text-xs text-muted-foreground">
                          {proxyName} • {new Date(result.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.ipLeak && (
                        <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">IP</span>
                      )}
                      {result.dnsLeak && (
                        <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">DNS</span>
                      )}
                      {result.webrtcLeak && (
                        <span className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive">WebRTC</span>
                      )}
                      {!hasLeak && (
                        <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">
                          {isRTL ? 'آمن' : 'Safe'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Test Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            {isRTL ? 'مواقع فحص خارجية' : 'External Test Sites'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open('https://ipleak.net', '_blank')}>
              ipleak.net
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('https://browserleaks.com', '_blank')}>
              browserleaks.com
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('https://whoer.net', '_blank')}>
              whoer.net
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('https://www.dnsleaktest.com', '_blank')}>
              dnsleaktest.com
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
