import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Cookie,
  Globe,
  Copy,
  Download,
  Trash2,
  Search,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  RefreshCw,
  Play,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isElectron, electronAPI, CapturedSession, generateSessionInjectionScript } from '@/lib/electron';
import { useAppStore } from '@/stores/appStore';

export function QuickSessionsPanel() {
  const { profiles } = useAppStore();
  const [sessions, setSessions] = useState<CapturedSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Listen for new session captures
  useEffect(() => {
    if (isElectron && electronAPI?.onSessionCaptured) {
      electronAPI.onSessionCaptured((session: CapturedSession) => {
        setSessions(prev => [session, ...prev]);
        toast.success(`تم التقاط جلسة ${session.siteName}`, {
          description: `${session.cookies.length} كوكيز، ${session.tokens.length} توكنات`
        });
      });
    }
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      if (isElectron && electronAPI?.getCapturedSessions) {
        const result = await electronAPI.getCapturedSessions();
        if (result.success) {
          setSessions(result.sessions || []);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
    setIsLoading(false);
  };

  const refreshSessions = () => {
    loadSessions();
    toast.success('تم تحديث الجلسات');
  };

  const copySession = (session: CapturedSession) => {
    const data = {
      domain: session.domain,
      cookies: session.cookies,
      tokens: session.tokens.map(t => ({ name: t.name, value: t.value, type: t.type })),
      localStorage: session.localStorage,
      capturedAt: session.capturedAt
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success(`تم نسخ جلسة ${session.siteName}`);
  };

  const copyCookies = (session: CapturedSession) => {
    const cookieString = session.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    navigator.clipboard.writeText(cookieString);
    toast.success('تم نسخ الكوكيز');
  };

  const copyTokens = (session: CapturedSession) => {
    const tokens = session.tokens.map(t => ({ name: t.name, value: t.value, type: t.type }));
    navigator.clipboard.writeText(JSON.stringify(tokens, null, 2));
    toast.success('تم نسخ التوكنات');
  };

  const downloadSession = (session: CapturedSession) => {
    const data = JSON.stringify(session, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.siteName}-${session.domain}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الجلسة');
  };

  const deleteSession = async (session: CapturedSession) => {
    if (isElectron && electronAPI?.deleteCapturedSession) {
      await electronAPI.deleteCapturedSession(session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
      toast.success('تم حذف الجلسة');
    }
  };

  const deleteAllSessions = async () => {
    if (confirm('هل أنت متأكد من حذف جميع الجلسات؟')) {
      if (isElectron && electronAPI?.deleteAllSessions) {
        await electronAPI.deleteAllSessions();
        setSessions([]);
        toast.success('تم حذف جميع الجلسات');
      }
    }
  };

  const downloadAllSessions = () => {
    const data = JSON.stringify({
      exportedAt: new Date().toISOString(),
      count: sessions.length,
      sessions: sessions
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تحميل ${sessions.length} جلسة`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-3 h-3 text-success" />;
      case 'expired':
        return <AlertTriangle className="w-3 h-3 text-warning" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.siteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = sessions.filter(s => s.status === 'active').length;
  const expiredCount = sessions.filter(s => s.status === 'expired').length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative gap-2"
        >
          <Cookie className="w-4 h-4" />
          <span className="hidden md:inline">الجلسات</span>
          {sessions.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
              {sessions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              الجلسات المحفوظة
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10 text-success">
                {activeCount} نشط
              </Badge>
              {expiredCount > 0 && (
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  {expiredCount} منتهي
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="p-4 border-b border-border space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الجلسات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 bg-background/50"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={refreshSessions}>
              <RefreshCw className="w-3 h-3" />
              تحديث
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={downloadAllSessions}>
              <Download className="w-3 h-3" />
              تحميل الكل
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1 text-destructive hover:text-destructive" 
              onClick={deleteAllSessions}
            >
              <Trash2 className="w-3 h-3" />
              حذف الكل
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد جلسات محفوظة</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{session.siteName}</p>
                          {getStatusIcon(session.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{session.domain}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Quick copy cookies */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyCookies(session)}
                        title="نسخ الكوكيز"
                      >
                        <Cookie className="w-3 h-3" />
                      </Button>
                      
                      {/* Quick copy tokens */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyTokens(session)}
                        title="نسخ التوكنات"
                      >
                        <Key className="w-3 h-3" />
                      </Button>

                      {/* More options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => copySession(session)}>
                            <Copy className="w-4 h-4 ml-2" />
                            نسخ الجلسة كاملة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyCookies(session)}>
                            <Cookie className="w-4 h-4 ml-2" />
                            نسخ الكوكيز
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyTokens(session)}>
                            <Key className="w-4 h-4 ml-2" />
                            نسخ التوكنات
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => downloadSession(session)}>
                            <Download className="w-4 h-4 ml-2" />
                            تحميل JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const script = generateSessionInjectionScript(session);
                            navigator.clipboard.writeText(script);
                            toast.success('تم نسخ سكريبت الحقن');
                          }}>
                            <Play className="w-4 h-4 ml-2" />
                            نسخ سكريبت الحقن
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteSession(session)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف الجلسة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Session stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Cookie className="w-3 h-3" />
                      {session.cookies.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {session.tokens.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor((Date.now() - new Date(session.capturedAt).getTime()) / 60000)} د
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
