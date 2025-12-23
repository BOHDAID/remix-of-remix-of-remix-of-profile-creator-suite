import { useState, useEffect } from 'react';
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
  EyeOff
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionData {
  profileId: string;
  profileName: string;
  cookies: number;
  localStorage: number;
  sessionStorage: number;
  indexedDB: number;
  lastSync: Date;
  encrypted: boolean;
  status: 'active' | 'expired' | 'invalid';
}

interface SavedCredential {
  id: string;
  site: string;
  username: string;
  password: string;
  lastUsed: Date;
  autoFill: boolean;
}

export function SessionManagerView() {
  const { profiles } = useAppStore();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState({
    autoSync: true,
    encryptData: true,
    clearOnClose: false,
    syncInterval: 30,
    backupEnabled: true
  });

  useEffect(() => {
    initializeSessions();
    initializeCredentials();
  }, [profiles]);

  const initializeSessions = () => {
    const data: SessionData[] = profiles.slice(0, 6).map(p => ({
      profileId: p.id,
      profileName: p.name,
      cookies: Math.floor(Math.random() * 50) + 10,
      localStorage: Math.floor(Math.random() * 100),
      sessionStorage: Math.floor(Math.random() * 30),
      indexedDB: Math.floor(Math.random() * 20),
      lastSync: new Date(Date.now() - Math.random() * 3600000),
      encrypted: Math.random() > 0.3,
      status: Math.random() > 0.2 ? 'active' : Math.random() > 0.5 ? 'expired' : 'invalid'
    }));
    setSessions(data);
  };

  const initializeCredentials = () => {
    const creds: SavedCredential[] = [
      { id: '1', site: 'facebook.com', username: 'user@example.com', password: 'pass123!@#', lastUsed: new Date(), autoFill: true },
      { id: '2', site: 'twitter.com', username: 'myaccount', password: 'securePass456', lastUsed: new Date(), autoFill: true },
      { id: '3', site: 'instagram.com', username: 'insta_user', password: 'instaPass789', lastUsed: new Date(), autoFill: false },
      { id: '4', site: 'linkedin.com', username: 'professional@work.com', password: 'linkedPass!', lastUsed: new Date(), autoFill: true },
    ];
    setCredentials(creds);
  };

  const syncSession = (profileId: string) => {
    setSessions(prev => prev.map(s => 
      s.profileId === profileId 
        ? { ...s, lastSync: new Date(), status: 'active' as const }
        : s
    ));
    toast.success('تم مزامنة الجلسة بنجاح');
  };

  const clearSession = (profileId: string) => {
    setSessions(prev => prev.map(s =>
      s.profileId === profileId
        ? { ...s, cookies: 0, localStorage: 0, sessionStorage: 0, indexedDB: 0, status: 'invalid' as const }
        : s
    ));
    toast.success('تم مسح بيانات الجلسة');
  };

  const exportSession = (profileId: string) => {
    const session = sessions.find(s => s.profileId === profileId);
    if (session) {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.profileName}.json`;
      a.click();
      toast.success('تم تصدير الجلسة');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success">نشط</Badge>;
      case 'expired':
        return <Badge className="bg-warning/20 text-warning">منتهي</Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive">غير صالح</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20">
            <Cookie className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الجلسات</h1>
            <p className="text-muted-foreground">إدارة الكوكيز وبيانات الاعتماد</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير الكل
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions" className="gap-2">
            <Cookie className="w-4 h-4" />
            الجلسات
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="w-4 h-4" />
            بيانات الاعتماد
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Shield className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.profileId} className="glass-effect">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{session.profileName}</CardTitle>
                    {getStatusBadge(session.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Cookie className="w-3 h-3" />
                        <span>كوكيز</span>
                      </div>
                      <p className="font-bold">{session.cookies}</p>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Database className="w-3 h-3" />
                        <span>LocalStorage</span>
                      </div>
                      <p className="font-bold">{session.localStorage}</p>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>SessionStorage</span>
                      </div>
                      <p className="font-bold">{session.sessionStorage}</p>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Globe className="w-3 h-3" />
                        <span>IndexedDB</span>
                      </div>
                      <p className="font-bold">{session.indexedDB}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">آخر مزامنة</span>
                    <span>{session.lastSync.toLocaleTimeString('ar-SA')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {session.encrypted ? (
                        <Lock className="w-4 h-4 text-success" />
                      ) : (
                        <Unlock className="w-4 h-4 text-warning" />
                      )}
                      <span className="text-sm">
                        {session.encrypted ? 'مشفر' : 'غير مشفر'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => syncSession(session.profileId)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => exportSession(session.profileId)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => clearSession(session.profileId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>بيانات الاعتماد المحفوظة</CardTitle>
                <Button size="sm" className="gap-2">
                  <Key className="w-4 h-4" />
                  إضافة جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {credentials.map((cred) => (
                    <div 
                      key={cred.id}
                      className="p-4 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-primary" />
                          <span className="font-medium">{cred.site}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cred.autoFill ? 'text-success' : ''}>
                            {cred.autoFill ? 'تعبئة تلقائية' : 'يدوي'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">اسم المستخدم</p>
                          <div className="flex items-center gap-2">
                            <Input value={cred.username} readOnly className="h-8" />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyToClipboard(cred.username)}
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
                              className="h-8" 
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
                              onClick={() => copyToClipboard(cred.password)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          آخر استخدام: {cred.lastUsed.toLocaleDateString('ar-SA')}
                        </span>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card className="glass-effect max-w-2xl">
            <CardHeader>
              <CardTitle>إعدادات الجلسات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">مزامنة تلقائية</p>
                  <p className="text-sm text-muted-foreground">مزامنة الجلسات تلقائياً</p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(v) => setSettings(s => ({...s, autoSync: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تشفير البيانات</p>
                  <p className="text-sm text-muted-foreground">تشفير جميع بيانات الجلسات</p>
                </div>
                <Switch
                  checked={settings.encryptData}
                  onCheckedChange={(v) => setSettings(s => ({...s, encryptData: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">مسح عند الإغلاق</p>
                  <p className="text-sm text-muted-foreground">مسح بيانات الجلسة عند إغلاق المتصفح</p>
                </div>
                <Switch
                  checked={settings.clearOnClose}
                  onCheckedChange={(v) => setSettings(s => ({...s, clearOnClose: v}))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">نسخ احتياطي</p>
                  <p className="text-sm text-muted-foreground">نسخ احتياطي تلقائي للجلسات</p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
