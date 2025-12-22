import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Upload
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
import { Progress } from '@/components/ui/progress';

interface ParsedProxy {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
  username?: string;
  password?: string;
  raw: string;
  status?: 'pending' | 'testing' | 'success' | 'failed';
  speed?: number;
}

interface BulkProxyImportProps {
  open: boolean;
  onClose: () => void;
}

// Parse proxy string in various formats
function parseProxyString(line: string): ParsedProxy | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Formats supported:
  // 1. type://host:port
  // 2. type://user:pass@host:port
  // 3. host:port
  // 4. host:port:user:pass
  // 5. user:pass@host:port
  // 6. host:port@user:pass

  let type: 'http' | 'https' | 'socks4' | 'socks5' = 'http';
  let host = '';
  let port = '';
  let username: string | undefined;
  let password: string | undefined;

  // Check for protocol prefix
  const protocolMatch = trimmed.match(/^(https?|socks[45]):\/\//i);
  let remaining = trimmed;
  
  if (protocolMatch) {
    type = protocolMatch[1].toLowerCase() as typeof type;
    remaining = trimmed.substring(protocolMatch[0].length);
  }

  // Check for user:pass@host:port format
  if (remaining.includes('@')) {
    const atIndex = remaining.lastIndexOf('@');
    const beforeAt = remaining.substring(0, atIndex);
    const afterAt = remaining.substring(atIndex + 1);
    
    // Could be user:pass@host:port or host:port@user:pass
    const afterParts = afterAt.split(':');
    const beforeParts = beforeAt.split(':');
    
    if (afterParts.length >= 2 && !isNaN(parseInt(afterParts[1]))) {
      // user:pass@host:port format
      host = afterParts[0];
      port = afterParts[1];
      if (beforeParts.length >= 2) {
        username = beforeParts[0];
        password = beforeParts.slice(1).join(':');
      }
    } else if (beforeParts.length >= 2 && !isNaN(parseInt(beforeParts[1]))) {
      // host:port@user:pass format
      host = beforeParts[0];
      port = beforeParts[1];
      if (afterParts.length >= 2) {
        username = afterParts[0];
        password = afterParts.slice(1).join(':');
      }
    }
  } else {
    // No @ sign - could be host:port or host:port:user:pass
    const parts = remaining.split(':');
    if (parts.length >= 2) {
      host = parts[0];
      port = parts[1];
      if (parts.length >= 4) {
        username = parts[2];
        password = parts.slice(3).join(':');
      }
    }
  }

  if (!host || !port || isNaN(parseInt(port))) {
    return null;
  }

  return {
    type,
    host,
    port,
    username,
    password,
    raw: trimmed,
    status: 'pending'
  };
}

// Simulate proxy test (in real app, this would test actual connection)
async function testProxy(proxy: ParsedProxy): Promise<{ success: boolean; speed: number }> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  const success = Math.random() > 0.2; // 80% success rate for simulation
  const speed = success ? Math.floor(50 + Math.random() * 200) : 0;
  return { success, speed };
}

export function BulkProxyImport({ open, onClose }: BulkProxyImportProps) {
  const { addProxyChain } = useAppStore();
  const { isRTL } = useTranslation();
  
  const [proxyText, setProxyText] = useState('');
  const [parsedProxies, setParsedProxies] = useState<ParsedProxy[]>([]);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'input' | 'testing' | 'results'>('input');

  const handleParse = () => {
    const lines = proxyText.split('\n');
    const parsed: ParsedProxy[] = [];
    
    for (const line of lines) {
      const proxy = parseProxyString(line);
      if (proxy) {
        parsed.push(proxy);
      }
    }
    
    if (parsed.length === 0) {
      toast.error(isRTL ? 'لم يتم العثور على بروكسيات صالحة' : 'No valid proxies found');
      return;
    }
    
    setParsedProxies(parsed);
    setStep('testing');
    startTesting(parsed);
  };

  const startTesting = async (proxies: ParsedProxy[]) => {
    setTesting(true);
    setProgress(0);
    
    const updated = [...proxies];
    
    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'testing';
      setParsedProxies([...updated]);
      
      const result = await testProxy(updated[i]);
      updated[i].status = result.success ? 'success' : 'failed';
      updated[i].speed = result.speed;
      
      setParsedProxies([...updated]);
      setProgress(((i + 1) / updated.length) * 100);
    }
    
    setTesting(false);
    setStep('results');
    
    const successful = updated.filter(p => p.status === 'success').length;
    toast.success(
      isRTL 
        ? `تم اختبار ${updated.length} بروكسي - ${successful} يعمل`
        : `Tested ${updated.length} proxies - ${successful} working`
    );
  };

  const handleAddAll = () => {
    const workingProxies = parsedProxies.filter(p => p.status === 'success');
    
    workingProxies.forEach((p, index) => {
      const proxy: ProxySettings = {
        type: p.type,
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password,
        status: 'active',
        speed: p.speed,
        lastTested: new Date()
      };
      
      const chain: ProxyChain = {
        id: crypto.randomUUID(),
        name: `Proxy ${index + 1} (${p.host})`,
        proxies: [proxy],
        enabled: true
      };
      
      addProxyChain(chain);
    });
    
    toast.success(
      isRTL 
        ? `تم إضافة ${workingProxies.length} بروكسي`
        : `Added ${workingProxies.length} proxies`
    );
    
    handleClose();
  };

  const handleAddSelected = (onlyWorking: boolean) => {
    const proxiesToAdd = onlyWorking 
      ? parsedProxies.filter(p => p.status === 'success')
      : parsedProxies;
    
    proxiesToAdd.forEach((p, index) => {
      const proxy: ProxySettings = {
        type: p.type,
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password,
        status: p.status === 'success' ? 'active' : 'failed',
        speed: p.speed,
        lastTested: new Date()
      };
      
      const chain: ProxyChain = {
        id: crypto.randomUUID(),
        name: `Proxy ${index + 1} (${p.host})`,
        proxies: [proxy],
        enabled: true
      };
      
      addProxyChain(chain);
    });
    
    toast.success(
      isRTL 
        ? `تم إضافة ${proxiesToAdd.length} بروكسي`
        : `Added ${proxiesToAdd.length} proxies`
    );
    
    handleClose();
  };

  const handleClose = () => {
    setProxyText('');
    setParsedProxies([]);
    setStep('input');
    setProgress(0);
    onClose();
  };

  const workingCount = parsedProxies.filter(p => p.status === 'success').length;
  const failedCount = parsedProxies.filter(p => p.status === 'failed').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {isRTL ? 'استيراد بروكسيات بالجملة' : 'Bulk Proxy Import'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'ألصق البروكسيات هنا (كل بروكسي في سطر)' : 'Paste proxies here (one per line)'}</Label>
              <Textarea
                value={proxyText}
                onChange={(e) => setProxyText(e.target.value)}
                placeholder={`http://proxy1.com:8080
socks5://user:pass@proxy2.com:1080
192.168.1.1:3128
host:port:user:pass`}
                className="bg-input h-48 font-mono text-sm"
                dir="ltr"
              />
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">{isRTL ? 'الصيغ المدعومة:' : 'Supported formats:'}</p>
              <ul className="text-xs text-muted-foreground space-y-1 font-mono" dir="ltr">
                <li>• type://host:port</li>
                <li>• type://user:pass@host:port</li>
                <li>• host:port</li>
                <li>• host:port:user:pass</li>
                <li>• user:pass@host:port</li>
              </ul>
            </div>
          </div>
        )}
        
        {(step === 'testing' || step === 'results') && (
          <div className="flex-1 overflow-hidden flex flex-col py-4 space-y-4">
            {testing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{isRTL ? 'جاري الاختبار...' : 'Testing...'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {step === 'results' && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{workingCount} {isRTL ? 'يعمل' : 'working'}</span>
                </div>
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span>{failedCount} {isRTL ? 'فشل' : 'failed'}</span>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-auto space-y-2">
              {parsedProxies.map((proxy, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    proxy.status === 'success' ? 'border-success/30 bg-success/5' :
                    proxy.status === 'failed' ? 'border-destructive/30 bg-destructive/5' :
                    'border-border bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {proxy.status === 'testing' && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                    {proxy.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                    {proxy.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    {proxy.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-mono">{proxy.type}://{proxy.host}:{proxy.port}</p>
                      {proxy.username && (
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'مع مصادقة' : 'with auth'}
                        </p>
                      )}
                    </div>
                  </div>
                  {proxy.speed !== undefined && proxy.speed > 0 && (
                    <span className="text-sm text-muted-foreground">{proxy.speed}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          
          {step === 'input' && (
            <Button 
              variant="glow" 
              onClick={handleParse}
              disabled={!proxyText.trim()}
            >
              <FileText className="w-4 h-4" />
              {isRTL ? 'تحليل وفحص' : 'Parse & Test'}
            </Button>
          )}
          
          {step === 'results' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleAddSelected(false)}
              >
                {isRTL ? `إضافة الكل (${parsedProxies.length})` : `Add All (${parsedProxies.length})`}
              </Button>
              <Button 
                variant="glow" 
                onClick={handleAddAll}
                disabled={workingCount === 0}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isRTL ? `إضافة العاملة (${workingCount})` : `Add Working (${workingCount})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
