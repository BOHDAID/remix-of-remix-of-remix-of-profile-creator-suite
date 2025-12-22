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
  AlertTriangle
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

// Simulated leak test - in real app would make actual requests through proxy
async function performLeakTest(): Promise<{
  ip: string;
  dnsServers: string[];
  webrtcIPs: string[];
}> {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  
  // Simulate different scenarios
  const scenarios = [
    { ip: '185.199.228.220', dnsServers: ['8.8.8.8', '8.8.4.4'], webrtcIPs: [] },
    { ip: '104.26.6.88', dnsServers: ['1.1.1.1'], webrtcIPs: [] },
    { ip: '192.168.1.100', dnsServers: ['192.168.1.1'], webrtcIPs: ['192.168.1.100'] }, // Leak scenario
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

export function LeakTestView() {
  const { proxyChains, addLeakTestResult, leakTestResults } = useAppStore();
  const { isRTL } = useTranslation();
  
  const [selectedProxyId, setSelectedProxyId] = useState<string>('direct');
  const [testing, setTesting] = useState(false);
  const [currentResult, setCurrentResult] = useState<LeakTestResult | null>(null);

  const handleRunTest = async () => {
    setTesting(true);
    setCurrentResult(null);
    
    try {
      const testData = await performLeakTest();
      
      const selectedProxy = proxyChains.find(c => c.id === selectedProxyId);
      const expectedIP = selectedProxy?.proxies[0]?.host;
      
      const ipLeak = expectedIP ? testData.ip !== expectedIP : false;
      const dnsLeak = testData.dnsServers.some(dns => 
        dns.startsWith('192.168.') || dns.startsWith('10.') || dns.startsWith('172.')
      );
      const webrtcLeak = testData.webrtcIPs.length > 0;
      
      const result: LeakTestResult = {
        id: crypto.randomUUID(),
        proxyChainId: selectedProxyId,
        timestamp: new Date(),
        ipLeak,
        dnsLeak,
        webrtcLeak,
        detectedIP: testData.ip,
        expectedIP,
        dnsServers: testData.dnsServers
      };
      
      setCurrentResult(result);
      addLeakTestResult(result);
      
      if (ipLeak || dnsLeak || webrtcLeak) {
        toast.error(isRTL ? 'تم اكتشاف تسريب!' : 'Leak detected!');
      } else {
        toast.success(isRTL ? 'لا يوجد تسريب - أنت آمن' : 'No leaks - You are safe');
      }
    } catch (error) {
      toast.error(isRTL ? 'فشل الاختبار' : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const recentTests = leakTestResults.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-7 h-7 text-primary" />
          {isRTL ? 'فحص التسريبات' : 'Leak Test'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'اختبر تسريب IP و DNS و WebRTC' : 'Test for IP, DNS, and WebRTC leaks'}
        </p>
      </div>

      {/* Test Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-primary" />
            {isRTL ? 'إعدادات الاختبار' : 'Test Configuration'}
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
              variant="glow" 
              onClick={handleRunTest}
              disabled={testing}
              className="min-w-[150px]"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRTL ? 'جاري الفحص...' : 'Testing...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {isRTL ? 'بدء الفحص' : 'Run Test'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
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
                      ? (isRTL ? 'تم اكتشاف تسريب' : 'Leak Detected')
                      : (isRTL ? 'لا يوجد تسريب' : 'No Leak')
                    }
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'IP المكتشف:' : 'Detected IP:'}</p>
                <p className="font-mono text-sm">{currentResult.detectedIP}</p>
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
                      ? (isRTL ? 'تم اكتشاف تسريب' : 'Leak Detected')
                      : (isRTL ? 'لا يوجد تسريب' : 'No Leak')
                    }
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'خوادم DNS:' : 'DNS Servers:'}</p>
                {currentResult.dnsServers.map((dns, i) => (
                  <p key={i} className="font-mono text-sm">{dns}</p>
                ))}
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
                      ? (isRTL ? 'تم اكتشاف تسريب' : 'Leak Detected')
                      : (isRTL ? 'لا يوجد تسريب' : 'No Leak')
                    }
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  {currentResult.webrtcLeak 
                    ? (isRTL ? 'WebRTC يكشف IP الحقيقي' : 'WebRTC reveals real IP')
                    : (isRTL ? 'WebRTC محمي' : 'WebRTC protected')
                  }
                </p>
              </div>
            </CardContent>
          </Card>
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
                        <p className="font-medium">{proxyName || result.detectedIP}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
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
    </div>
  );
}
