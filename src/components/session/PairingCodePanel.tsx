import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Link2, 
  RefreshCw, 
  Copy, 
  Check, 
  Clock, 
  Smartphone,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { universalSessionService } from '@/lib/universalSessionCapture';

interface PairingCodePanelProps {
  onSessionsImported?: (count: number) => void;
}

export function PairingCodePanel({ onSessionsImported }: PairingCodePanelProps) {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // توليد كود عشوائي
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // إنشاء كود ربط جديد
  const createPairingCode = async () => {
    setIsGenerating(true);
    try {
      const code = generateCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

      const { error } = await supabase
        .from('pairing_codes')
        .insert({
          code,
          device_name: 'Desktop App',
          expires_at: expires.toISOString()
        });

      if (error) {
        console.error('Failed to create pairing code:', error);
        toast.error('فشل إنشاء كود الربط');
        return;
      }

      setPairingCode(code);
      setExpiresAt(expires);
      toast.success('تم إنشاء كود الربط');
    } catch (error) {
      console.error('Error creating pairing code:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  // نسخ الكود
  const copyCode = async () => {
    if (!pairingCode) return;
    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success('تم نسخ الكود');
    setTimeout(() => setCopied(false), 2000);
  };

  // جلب الجلسات المعلقة
  const fetchPendingSessions = useCallback(async () => {
    if (!pairingCode) return;
    
    setIsFetching(true);
    try {
      // Check pending count first
      const { data: countData } = await supabase
        .from('pending_sessions')
        .select('id')
        .eq('pairing_code', pairingCode)
        .is('fetched_at', null);
      
      setPendingCount(countData?.length || 0);

      if (!countData || countData.length === 0) {
        return;
      }

      // Fetch full sessions
      const { data: pendingData, error } = await supabase
        .from('pending_sessions')
        .select('id, session_data')
        .eq('pairing_code', pairingCode)
        .is('fetched_at', null);

      if (error) {
        console.error('Failed to fetch pending sessions:', error);
        return;
      }

      if (pendingData && pendingData.length > 0) {
        // Mark as fetched
        const ids = pendingData.map(p => p.id);
        await supabase
          .from('pending_sessions')
          .update({ fetched_at: new Date().toISOString() })
          .in('id', ids);

        // Import sessions
        let imported = 0;
        for (const pending of pendingData) {
          const sessionData = pending.session_data as any;
          if (sessionData) {
            try {
              universalSessionService.captureSession(
                sessionData.profileId || 'default',
                sessionData.url || `https://${sessionData.domain}`,
                {
                  cookies: sessionData.cookies || [],
                  localStorage: sessionData.localStorage || {},
                  sessionStorage: sessionData.sessionStorage || {}
                }
              );
              imported++;
            } catch (e) {
              console.error('Failed to import session:', e);
            }
          }
        }

        if (imported > 0) {
          toast.success(`تم استيراد ${imported} جلسة من الإضافة`);
          onSessionsImported?.(imported);
        }
        
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Error fetching pending sessions:', error);
    } finally {
      setIsFetching(false);
    }
  }, [pairingCode, onSessionsImported]);

  // تحديث الوقت المتبقي
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('');
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('منتهي');
        setPairingCode('');
        setExpiresAt(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // فحص دوري للجلسات المعلقة
  useEffect(() => {
    if (!pairingCode) return;
    
    const interval = setInterval(fetchPendingSessions, 3000);
    return () => clearInterval(interval);
  }, [pairingCode, fetchPendingSessions]);

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-5 h-5 text-primary" />
          ربط إضافة المتصفح
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pairingCode ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              أنشئ كود ربط لمزامنة الجلسات من إضافة المتصفح
            </p>
            <Button 
              onClick={createPairingCode} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              إنشاء كود ربط
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* عرض الكود */}
            <div className="bg-background/50 rounded-lg p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">أدخل هذا الكود في إضافة المتصفح</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">
                  {pairingCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>ينتهي خلال {timeLeft}</span>
              </div>
            </div>

            {/* حالة الجلسات المعلقة */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">جلسات في الانتظار:</span>
                <Badge variant={pendingCount > 0 ? 'default' : 'secondary'}>
                  {pendingCount}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPendingSessions}
                disabled={isFetching}
              >
                {isFetching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* زر إنشاء كود جديد */}
            <Button
              variant="outline"
              size="sm"
              onClick={createPairingCode}
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              إنشاء كود جديد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}