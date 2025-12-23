import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cookie,
  Key,
  Database,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Globe,
  FileJson,
  Copy,
  Eye,
  EyeOff,
  Search,
  Play,
  Zap,
  BarChart3,
  ExternalLink,
  Plus,
  Settings2
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  universalSessionService, 
  UniversalSession, 
  LoginCredential
} from '@/lib/universalSessionCapture';

export function SessionManagerView() {
  const { profiles } = useAppStore();
  const [sessions, setSessions] = useState<UniversalSession[]>([]);
  const [credentials, setCredentials] = useState<LoginCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<UniversalSession | null>(null);
  const [stats, setStats] = useState(universalSessionService.getStats());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState({
    autoCapture: true,
    autoLogin: true,
    encryptData: true,
    clearOnClose: false,
    syncInterval: 30,
    backupEnabled: true,
    captureAllSites: true,
    detectLoginPages: true
  });

  useEffect(() => {
    loadData();
    
    // Subscribe to session updates
    const unsubscribe = universalSessionService.onSessionUpdate(() => {
      loadData();
    });

    return () => unsubscribe();
  }, [profiles]);

  const loadData = () => {
    // Get only real sessions - no mock data
    const allSessions = universalSessionService.getAllSessions();
    setSessions(allSessions);
    setCredentials(universalSessionService.getAllCredentials());
    setStats(universalSessionService.getStats());
  };

  const refreshSession = (sessionId: string) => {
    universalSessionService.refreshAllSessionStatus();
    loadData();
    toast.success('تم تحديث حالة الجلسة');
  };

  const deleteSession = (sessionId: string) => {
    universalSessionService.deleteSession(sessionId);
    loadData();
    toast.success('تم حذف الجلسة');
  };

  const exportSession = (session: UniversalSession) => {
    try {
      const data = universalSessionService.exportSession(session.id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.siteName}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير الجلسة');
    } catch (error) {
      toast.error('فشل تصدير الجلسة');
    }
  };

  const exportAllSessions = () => {
    try {
      const data = JSON.stringify({
        exportedAt: new Date().toISOString(),
        sessions: sessions,
        credentials: credentials.map(c => ({ ...c, password: '***HIDDEN***' }))
      }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-sessions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`تم تصدير ${sessions.length} جلسة`);
    } catch (error) {
      toast.error('فشل التصدير');
    }
  };

  const importSessions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        let imported = 0;
        
        if (data.sessions && Array.isArray(data.sessions)) {
          data.sessions.forEach((session: UniversalSession) => {
            universalSessionService.importSession(JSON.stringify(session));
            imported++;
          });
        } else if (data.id && data.domain) {
          universalSessionService.importSession(e.target?.result as string);
          imported = 1;
        }

        loadData();
        toast.success(`تم استيراد ${imported} جلسة`);
      } catch (error) {
        toast.error('ملف غير صالح');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label ? `تم نسخ ${label}` : 'تم النسخ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-0">نشط</Badge>;
      case 'expired':
        return <Badge className="bg-warning/20 text-warning border-0">منتهي</Badge>;
      case 'revoked':
        return <Badge className="bg-destructive/20 text-destructive border-0">ملغى</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">غير معروف</Badge>;
    }
  };

  const getLoginStateBadge = (state: string) => {
    switch (state) {
      case 'logged_in':
        return <Badge className="bg-success/20 text-success border-0">مسجل دخول</Badge>;
      case 'logged_out':
        return <Badge className="bg-destructive/20 text-destructive border-0">مسجل خروج</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-0">غير معروف</Badge>;
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.siteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCredentials = credentials.filter(c =>
    c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importSessions}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Cookie className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الجلسات العالمية</h1>
            <p className="text-muted-foreground">التقاط وإدارة جلسات كل المواقع تلقائياً</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button variant="outline" onClick={exportAllSessions} className="gap-2">
            <Download className="w-4 h-4" />
            تصدير الكل
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.totalSessions}</p>
            <p className="text-sm text-muted-foreground">إجمالي الجلسات</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-success">{stats.activeSessions}</p>
            <p className="text-sm text-muted-foreground">جلسات نشطة</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-warning">{stats.expiredSessions}</p>
            <p className="text-sm text-muted-foreground">منتهية</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.totalCredentials}</p>
            <p className="text-sm text-muted-foreground">بيانات اعتماد</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{stats.uniqueDomains}</p>
            <p className="text-sm text-muted-foreground">مواقع فريدة</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{stats.tokensByType.jwt}</p>
            <p className="text-sm text-muted-foreground">توكنات JWT</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="البحث في الجلسات والمواقع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-background/50"
        />
      </div>

      <Tabs defaultValue="sessions">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="sessions" className="gap-2">
            <Cookie className="w-4 h-4" />
            الجلسات ({filteredSessions.length})
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="w-4 h-4" />
            بيانات الاعتماد
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <Card className="glass-effect lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  الجلسات المحفوظة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredSessions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد جلسات محفوظة</p>
                        <p className="text-sm mt-2">سيتم التقاط الجلسات تلقائياً عند تسجيل الدخول</p>
                      </div>
                    ) : (
                      filteredSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            selectedSession?.id === session.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 bg-card/30'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{session.siteName}</p>
                                <p className="text-sm text-muted-foreground">{session.domain}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session.status)}
                              {getLoginStateBadge(session.loginState)}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-sm mt-3">
                            <div className="p-2 rounded bg-background/50 text-center">
                              <p className="font-bold text-primary">{session.cookies.length}</p>
                              <p className="text-xs text-muted-foreground">كوكيز</p>
                            </div>
                            <div className="p-2 rounded bg-background/50 text-center">
                              <p className="font-bold text-blue-400">{Object.keys(session.localStorage).length}</p>
                              <p className="text-xs text-muted-foreground">localStorage</p>
                            </div>
                            <div className="p-2 rounded bg-background/50 text-center">
                              <p className="font-bold text-purple-400">{session.tokens.length}</p>
                              <p className="text-xs text-muted-foreground">توكنات</p>
                            </div>
                            <div className="p-2 rounded bg-background/50 text-center">
                              <p className="font-bold text-orange-400">
                                {Math.floor((Date.now() - session.capturedAt.getTime()) / 60000)}
                              </p>
                              <p className="text-xs text-muted-foreground">دقيقة</p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshSession(session.id);
                              }}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportSession(session);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(JSON.stringify(session.cookies), 'الكوكيز');
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  تفاصيل الجلسة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="p-3 rounded-lg bg-background/50">
                        <h4 className="font-medium mb-2">معلومات الموقع</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الدومين</span>
                            <span className="font-mono">{selectedSession.domain}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحالة</span>
                            {getStatusBadge(selectedSession.status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">تاريخ الالتقاط</span>
                            <span>{selectedSession.capturedAt.toLocaleString('ar-SA')}</span>
                          </div>
                          {selectedSession.expiresAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ينتهي في</span>
                              <span>{selectedSession.expiresAt.toLocaleString('ar-SA')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tokens */}
                      <div className="p-3 rounded-lg bg-background/50">
                        <h4 className="font-medium mb-2">التوكنات ({selectedSession.tokens.length})</h4>
                        <div className="space-y-2">
                          {selectedSession.tokens.map((token) => (
                            <div key={token.id} className="p-2 rounded bg-card/50 border border-border">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">{token.type}</Badge>
                                <Badge className={cn(
                                  "text-xs border-0",
                                  token.isValid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                                )}>
                                  {token.isValid ? 'صالح' : 'منتهي'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{token.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded flex-1 truncate">
                                  {token.maskedValue}
                                </code>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => copyToClipboard(token.value, token.name)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cookies */}
                      <div className="p-3 rounded-lg bg-background/50">
                        <h4 className="font-medium mb-2">الكوكيز ({selectedSession.cookies.length})</h4>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {selectedSession.cookies.map((cookie, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-1 rounded hover:bg-card/50">
                              <span className="font-mono truncate max-w-[150px]">{cookie.name}</span>
                              <div className="flex items-center gap-1">
                                {cookie.secure && <Lock className="w-3 h-3 text-success" />}
                                {cookie.httpOnly && <Shield className="w-3 h-3 text-blue-400" />}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => copyToClipboard(cookie.value, cookie.name)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="p-3 rounded-lg bg-background/50">
                        <h4 className="font-medium mb-2">البيانات الوصفية</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">المتصفح</span>
                            <span>{selectedSession.metadata.browser}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">النظام</span>
                            <span>{selectedSession.metadata.os}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الشاشة</span>
                            <span>{selectedSession.metadata.screenResolution}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">المنطقة</span>
                            <span>{selectedSession.metadata.timezone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" onClick={() => {
                          const script = universalSessionService.generateSessionInjectionScript(selectedSession);
                          copyToClipboard(script, 'سكريبت الحقن');
                        }}>
                          <Play className="w-4 h-4" />
                          نسخ سكريبت الحقن
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>اختر جلسة لعرض التفاصيل</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  بيانات الاعتماد المحفوظة
                </CardTitle>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {filteredCredentials.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بيانات اعتماد محفوظة</p>
                    <p className="text-sm mt-2">سيتم حفظها تلقائياً عند تسجيل الدخول</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCredentials.map((cred) => (
                      <div 
                        key={cred.id}
                        className="p-4 rounded-lg border border-border bg-card/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                              <Globe className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">{cred.siteName}</p>
                              <p className="text-sm text-muted-foreground">{cred.domain}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {cred.autoLogin && (
                              <Badge className="bg-success/20 text-success border-0">
                                <Zap className="w-3 h-3 ml-1" />
                                تلقائي
                              </Badge>
                            )}
                            {cred.twoFactorEnabled && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-0">
                                <Shield className="w-3 h-3 ml-1" />
                                2FA
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">اسم المستخدم</p>
                            <div className="flex items-center gap-2">
                              <Input value={cred.username} readOnly className="h-8 bg-background/50" />
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyToClipboard(cred.username, 'اسم المستخدم')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">كلمة المرور</p>
                            <div className="flex items-center gap-2">
                              <Input 
                                type={showPasswords[cred.id] ? 'text' : 'password'}
                                value={cred.password} 
                                readOnly 
                                className="h-8 bg-background/50" 
                              />
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => togglePasswordVisibility(cred.id)}
                              >
                                {showPasswords[cred.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyToClipboard(cred.password, 'كلمة المرور')}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            آخر استخدام: {cred.lastUsed?.toLocaleDateString('ar-SA') || 'لم يستخدم'}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Play className="w-3 h-3" />
                              تسجيل دخول
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="glass-effect max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                إعدادات إدارة الجلسات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التقاط تلقائي</p>
                  <p className="text-sm text-muted-foreground">التقاط الجلسات تلقائياً عند تسجيل الدخول</p>
                </div>
                <Switch
                  checked={settings.autoCapture}
                  onCheckedChange={(v) => setSettings(s => ({...s, autoCapture: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تسجيل دخول تلقائي</p>
                  <p className="text-sm text-muted-foreground">تسجيل الدخول تلقائياً باستخدام البيانات المحفوظة</p>
                </div>
                <Switch
                  checked={settings.autoLogin}
                  onCheckedChange={(v) => setSettings(s => ({...s, autoLogin: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التقاط كل المواقع</p>
                  <p className="text-sm text-muted-foreground">التقاط الجلسات من أي موقع (بدون قائمة محددة)</p>
                </div>
                <Switch
                  checked={settings.captureAllSites}
                  onCheckedChange={(v) => setSettings(s => ({...s, captureAllSites: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">اكتشاف صفحات تسجيل الدخول</p>
                  <p className="text-sm text-muted-foreground">اكتشاف صفحات تسجيل الدخول تلقائياً</p>
                </div>
                <Switch
                  checked={settings.detectLoginPages}
                  onCheckedChange={(v) => setSettings(s => ({...s, detectLoginPages: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تشفير البيانات</p>
                  <p className="text-sm text-muted-foreground">تشفير جميع البيانات المحفوظة</p>
                </div>
                <Switch
                  checked={settings.encryptData}
                  onCheckedChange={(v) => setSettings(s => ({...s, encryptData: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">مسح عند الإغلاق</p>
                  <p className="text-sm text-muted-foreground">مسح الجلسات عند إغلاق البروفايل</p>
                </div>
                <Switch
                  checked={settings.clearOnClose}
                  onCheckedChange={(v) => setSettings(s => ({...s, clearOnClose: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">نسخ احتياطي تلقائي</p>
                  <p className="text-sm text-muted-foreground">نسخ احتياطي للجلسات بشكل دوري</p>
                </div>
                <Switch
                  checked={settings.backupEnabled}
                  onCheckedChange={(v) => setSettings(s => ({...s, backupEnabled: v}))}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <p className="font-medium mb-3">فترة المزامنة</p>
                <div className="flex gap-2">
                  {[15, 30, 60, 120].map(interval => (
                    <Button
                      key={interval}
                      variant={settings.syncInterval === interval ? 'default' : 'outline'}
                      onClick={() => setSettings(s => ({...s, syncInterval: interval}))}
                    >
                      {interval} ثانية
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف جميع الجلسات؟')) {
                      sessions.forEach(s => universalSessionService.deleteSession(s.id));
                      loadData();
                      toast.success('تم حذف جميع الجلسات');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف جميع الجلسات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
