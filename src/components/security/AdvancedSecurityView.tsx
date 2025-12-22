import { useState, useEffect } from 'react';
import { 
  Shield, 
  Bomb, 
  AlertTriangle, 
  Trash2, 
  Lock, 
  Fingerprint,
  FileText,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Key,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Keyboard,
  Volume2,
  VolumeX,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SecureNote {
  id: string;
  profileId: string;
  title: string;
  content: string;
  createdAt: Date;
  tags: string[];
}

interface SelfDestructRule {
  id: string;
  profileId: string;
  profileName: string;
  type: 'time' | 'launches' | 'date';
  value: number | string;
  enabled: boolean;
  deleteData: boolean;
  deleteCookies: boolean;
}

export function AdvancedSecurityView() {
  const { isRTL } = useTranslation();
  const { profiles } = useAppStore();
  const [activeTab, setActiveTab] = useState('panic');

  // Panic Button Settings
  const [panicConfig, setPanicConfig] = useState({
    enabled: true,
    hotkey: 'Ctrl+Shift+P',
    confirmRequired: true,
    sound: true,
    actions: {
      closeAllProfiles: true,
      deleteAllProfiles: false,
      clearHistory: true,
      clearCookies: true,
      wipeExtensions: false,
      factoryReset: false,
      lockApp: true
    }
  });

  // Self-Destruct Rules
  const [selfDestructRules, setSelfDestructRules] = useState<SelfDestructRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    profileId: '',
    type: 'time' as 'time' | 'launches' | 'date',
    value: 24,
    deleteData: true,
    deleteCookies: true
  });

  // Anti-Forensics
  const [antiForensics, setAntiForensics] = useState({
    enabled: true,
    secureDelete: true,
    clearMemory: true,
    shredderPasses: 3,
    encryptTemp: true
  });

  // Biometric
  const [biometric, setBiometric] = useState({
    enabled: false,
    type: 'fingerprint' as 'fingerprint' | 'face' | 'both',
    fallbackPassword: true,
    requireOnLaunch: true,
    requireOnSensitive: true
  });

  // Secure Notes
  const [secureNotes, setSecureNotes] = useState<SecureNote[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ profileId: '', title: '', content: '', tags: '' });
  const [showNoteContent, setShowNoteContent] = useState<Record<string, boolean>>({});

  const triggerPanic = () => {
    toast.error(isRTL ? '⚠️ تم تفعيل زر الطوارئ!' : '⚠️ Panic Button Activated!', {
      description: isRTL ? 'جاري تنفيذ إجراءات الطوارئ...' : 'Executing emergency actions...',
      duration: 5000
    });
  };

  const addSelfDestructRule = () => {
    if (!newRule.profileId) {
      toast.error(isRTL ? 'اختر بروفايل' : 'Select a profile');
      return;
    }
    const profile = profiles.find(p => p.id === newRule.profileId);
    const rule: SelfDestructRule = {
      id: crypto.randomUUID(),
      profileId: newRule.profileId,
      profileName: profile?.name || 'Unknown',
      type: newRule.type,
      value: newRule.value,
      enabled: true,
      deleteData: newRule.deleteData,
      deleteCookies: newRule.deleteCookies
    };
    setSelfDestructRules(prev => [...prev, rule]);
    setShowAddRule(false);
    setNewRule({ profileId: '', type: 'time', value: 24, deleteData: true, deleteCookies: true });
    toast.success(isRTL ? 'تمت إضافة قاعدة التدمير الذاتي' : 'Self-destruct rule added');
  };

  const deleteRule = (id: string) => {
    setSelfDestructRules(prev => prev.filter(r => r.id !== id));
    toast.success(isRTL ? 'تم حذف القاعدة' : 'Rule deleted');
  };

  const addSecureNote = () => {
    if (!newNote.title || !newNote.content) {
      toast.error(isRTL ? 'أدخل العنوان والمحتوى' : 'Enter title and content');
      return;
    }
    const note: SecureNote = {
      id: crypto.randomUUID(),
      profileId: newNote.profileId || 'global',
      title: newNote.title,
      content: newNote.content,
      createdAt: new Date(),
      tags: newNote.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    setSecureNotes(prev => [...prev, note]);
    setShowAddNote(false);
    setNewNote({ profileId: '', title: '', content: '', tags: '' });
    toast.success(isRTL ? 'تمت إضافة الملاحظة المشفرة' : 'Secure note added');
  };

  const deleteNote = (id: string) => {
    setSecureNotes(prev => prev.filter(n => n.id !== id));
    toast.success(isRTL ? 'تم حذف الملاحظة' : 'Note deleted');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'الأمان المتقدم' : 'Advanced Security'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'حماية قصوى لبياناتك وخصوصيتك' : 'Maximum protection for your data and privacy'}
            </p>
          </div>
        </div>
        
        {/* Emergency Panic Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" className="gap-2 animate-pulse">
              <Bomb className="w-5 h-5" />
              {isRTL ? 'زر الطوارئ' : 'PANIC'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {isRTL ? 'تأكيد تفعيل زر الطوارئ' : 'Confirm Panic Activation'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isRTL 
                  ? 'سيتم تنفيذ جميع إجراءات الطوارئ المحددة. هذا الإجراء لا يمكن التراجع عنه!'
                  : 'All configured emergency actions will be executed. This action cannot be undone!'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={triggerPanic} className="bg-destructive hover:bg-destructive/90">
                {isRTL ? 'تفعيل!' : 'ACTIVATE!'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="panic" className="gap-1">
            <Bomb className="w-4 h-4" />
            {isRTL ? 'الطوارئ' : 'Panic'}
          </TabsTrigger>
          <TabsTrigger value="destruct" className="gap-1">
            <Timer className="w-4 h-4" />
            {isRTL ? 'تدمير ذاتي' : 'Self-Destruct'}
          </TabsTrigger>
          <TabsTrigger value="forensics" className="gap-1">
            <Shield className="w-4 h-4" />
            {isRTL ? 'مكافحة التحليل' : 'Anti-Forensics'}
          </TabsTrigger>
          <TabsTrigger value="biometric" className="gap-1">
            <Fingerprint className="w-4 h-4" />
            {isRTL ? 'البيومترية' : 'Biometric'}
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1">
            <FileText className="w-4 h-4" />
            {isRTL ? 'ملاحظات مشفرة' : 'Secure Notes'}
          </TabsTrigger>
        </TabsList>

        {/* Panic Button Tab */}
        <TabsContent value="panic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Bomb className="w-5 h-5" />
                {isRTL ? 'إعدادات زر الطوارئ' : 'Panic Button Settings'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'تكوين الإجراءات التي يتم تنفيذها عند الضغط على زر الطوارئ'
                  : 'Configure actions executed when panic button is pressed'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تفعيل زر الطوارئ' : 'Enable Panic Button'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'السماح بتفعيل إجراءات الطوارئ' : 'Allow emergency actions activation'}
                  </p>
                </div>
                <Switch 
                  checked={panicConfig.enabled}
                  onCheckedChange={(v) => setPanicConfig(s => ({ ...s, enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'اختصار لوحة المفاتيح' : 'Keyboard Shortcut'}</label>
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={panicConfig.hotkey}
                    onChange={(e) => setPanicConfig(s => ({ ...s, hotkey: e.target.value }))}
                    placeholder="Ctrl+Shift+P"
                    className="w-48"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {panicConfig.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <label className="text-sm font-medium">{isRTL ? 'صوت التنبيه' : 'Alert Sound'}</label>
                </div>
                <Switch 
                  checked={panicConfig.sound}
                  onCheckedChange={(v) => setPanicConfig(s => ({ ...s, sound: v }))}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">{isRTL ? 'الإجراءات' : 'Actions'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'closeAllProfiles', label: isRTL ? 'إغلاق جميع البروفايلات' : 'Close all profiles', icon: X },
                    { key: 'deleteAllProfiles', label: isRTL ? 'حذف جميع البروفايلات' : 'Delete all profiles', icon: Trash2, danger: true },
                    { key: 'clearHistory', label: isRTL ? 'مسح السجل' : 'Clear history', icon: Clock },
                    { key: 'clearCookies', label: isRTL ? 'مسح الكوكيز' : 'Clear cookies', icon: FileText },
                    { key: 'wipeExtensions', label: isRTL ? 'حذف الإضافات' : 'Wipe extensions', icon: Trash2 },
                    { key: 'lockApp', label: isRTL ? 'قفل التطبيق' : 'Lock app', icon: Lock },
                  ].map(({ key, label, icon: Icon, danger }) => (
                    <div 
                      key={key}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        danger && "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      <Checkbox 
                        checked={(panicConfig.actions as any)[key]}
                        onCheckedChange={(v) => setPanicConfig(s => ({
                          ...s,
                          actions: { ...s.actions, [key]: v }
                        }))}
                      />
                      <Icon className={cn("w-4 h-4", danger && "text-destructive")} />
                      <span className={cn("text-sm", danger && "text-destructive")}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Self-Destruct Tab */}
        <TabsContent value="destruct" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-orange-500" />
                    {isRTL ? 'قواعد التدمير الذاتي' : 'Self-Destruct Rules'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL 
                      ? 'حذف البروفايلات تلقائياً بعد فترة أو عدد معين من الاستخدامات'
                      : 'Automatically delete profiles after time or usage count'
                    }
                  </CardDescription>
                </div>
                <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {isRTL ? 'إضافة قاعدة' : 'Add Rule'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isRTL ? 'إضافة قاعدة تدمير ذاتي' : 'Add Self-Destruct Rule'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'البروفايل' : 'Profile'}</label>
                        <Select value={newRule.profileId} onValueChange={(v) => setNewRule(s => ({ ...s, profileId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={isRTL ? 'اختر بروفايل' : 'Select profile'} />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'نوع المشغل' : 'Trigger Type'}</label>
                        <Select value={newRule.type} onValueChange={(v) => setNewRule(s => ({ ...s, type: v as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time">{isRTL ? 'بعد ساعات' : 'After hours'}</SelectItem>
                            <SelectItem value="launches">{isRTL ? 'بعد عدد تشغيلات' : 'After launches'}</SelectItem>
                            <SelectItem value="date">{isRTL ? 'في تاريخ محدد' : 'On specific date'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {newRule.type === 'time' ? (isRTL ? 'الساعات' : 'Hours') :
                           newRule.type === 'launches' ? (isRTL ? 'عدد التشغيلات' : 'Launch count') :
                           (isRTL ? 'التاريخ' : 'Date')}
                        </label>
                        <Input 
                          type={newRule.type === 'date' ? 'date' : 'number'}
                          value={newRule.type === 'date' ? '' : newRule.value}
                          onChange={(e) => setNewRule(s => ({ ...s, value: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={newRule.deleteData}
                            onCheckedChange={(v) => setNewRule(s => ({ ...s, deleteData: !!v }))}
                          />
                          <label className="text-sm">{isRTL ? 'حذف البيانات' : 'Delete data'}</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={newRule.deleteCookies}
                            onCheckedChange={(v) => setNewRule(s => ({ ...s, deleteCookies: !!v }))}
                          />
                          <label className="text-sm">{isRTL ? 'حذف الكوكيز' : 'Delete cookies'}</label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddRule(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
                      <Button onClick={addSelfDestructRule}>{isRTL ? 'إضافة' : 'Add'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selfDestructRules.length > 0 ? (
                <div className="space-y-3">
                  {selfDestructRules.map((rule) => (
                    <div 
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Timer className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">{rule.profileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.type === 'time' && `${isRTL ? 'بعد' : 'After'} ${rule.value} ${isRTL ? 'ساعة' : 'hours'}`}
                            {rule.type === 'launches' && `${isRTL ? 'بعد' : 'After'} ${rule.value} ${isRTL ? 'تشغيلات' : 'launches'}`}
                            {rule.type === 'date' && `${isRTL ? 'في' : 'On'} ${rule.value}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.enabled} onCheckedChange={(v) => {
                          setSelfDestructRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: v } : r));
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Timer className="w-16 h-16 mb-4 opacity-20" />
                  <p>{isRTL ? 'لا توجد قواعد تدمير ذاتي' : 'No self-destruct rules'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anti-Forensics Tab */}
        <TabsContent value="forensics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {isRTL ? 'إعدادات مكافحة التحليل الجنائي' : 'Anti-Forensics Settings'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'منع استرجاع البيانات المحذوفة والحماية من التحليل'
                  : 'Prevent data recovery and protect from forensic analysis'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تفعيل مكافحة التحليل' : 'Enable Anti-Forensics'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'تفعيل جميع ميزات الحماية' : 'Enable all protection features'}
                  </p>
                </div>
                <Switch 
                  checked={antiForensics.enabled}
                  onCheckedChange={(v) => setAntiForensics(s => ({ ...s, enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'الحذف الآمن' : 'Secure Delete'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'الكتابة فوق الملفات قبل الحذف' : 'Overwrite files before deletion'}
                  </p>
                </div>
                <Switch 
                  checked={antiForensics.secureDelete}
                  onCheckedChange={(v) => setAntiForensics(s => ({ ...s, secureDelete: v }))}
                  disabled={!antiForensics.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'مسح الذاكرة' : 'Clear Memory'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'مسح الذاكرة عند الإغلاق' : 'Clear memory on exit'}
                  </p>
                </div>
                <Switch 
                  checked={antiForensics.clearMemory}
                  onCheckedChange={(v) => setAntiForensics(s => ({ ...s, clearMemory: v }))}
                  disabled={!antiForensics.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تشفير الملفات المؤقتة' : 'Encrypt Temp Files'}</label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'تشفير جميع الملفات المؤقتة' : 'Encrypt all temporary files'}
                  </p>
                </div>
                <Switch 
                  checked={antiForensics.encryptTemp}
                  onCheckedChange={(v) => setAntiForensics(s => ({ ...s, encryptTemp: v }))}
                  disabled={!antiForensics.enabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'عدد مرات الكتابة الفوقية' : 'Shredder Passes'}: {antiForensics.shredderPasses}
                </label>
                <Slider 
                  value={[antiForensics.shredderPasses]} 
                  min={1}
                  max={35}
                  step={1}
                  onValueChange={([v]) => setAntiForensics(s => ({ ...s, shredderPasses: v }))}
                  disabled={!antiForensics.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? '1 = سريع، 35 = أقصى أمان (معيار DoD)'
                    : '1 = fast, 35 = maximum security (DoD standard)'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Biometric Tab */}
        <TabsContent value="biometric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                {isRTL ? 'القفل البيومتري' : 'Biometric Lock'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? 'استخدام بصمة الإصبع أو التعرف على الوجه للقفل'
                  : 'Use fingerprint or face recognition for locking'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تفعيل القفل البيومتري' : 'Enable Biometric Lock'}</label>
                </div>
                <Switch 
                  checked={biometric.enabled}
                  onCheckedChange={(v) => setBiometric(s => ({ ...s, enabled: v }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'نوع البيومترية' : 'Biometric Type'}</label>
                <Select 
                  value={biometric.type}
                  onValueChange={(v) => setBiometric(s => ({ ...s, type: v as any }))}
                  disabled={!biometric.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fingerprint">{isRTL ? 'بصمة الإصبع' : 'Fingerprint'}</SelectItem>
                    <SelectItem value="face">{isRTL ? 'التعرف على الوجه' : 'Face Recognition'}</SelectItem>
                    <SelectItem value="both">{isRTL ? 'كلاهما' : 'Both'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'كلمة مرور احتياطية' : 'Fallback Password'}</label>
                </div>
                <Switch 
                  checked={biometric.fallbackPassword}
                  onCheckedChange={(v) => setBiometric(s => ({ ...s, fallbackPassword: v }))}
                  disabled={!biometric.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'طلب عند التشغيل' : 'Require on Launch'}</label>
                </div>
                <Switch 
                  checked={biometric.requireOnLaunch}
                  onCheckedChange={(v) => setBiometric(s => ({ ...s, requireOnLaunch: v }))}
                  disabled={!biometric.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'طلب للعمليات الحساسة' : 'Require for Sensitive Ops'}</label>
                </div>
                <Switch 
                  checked={biometric.requireOnSensitive}
                  onCheckedChange={(v) => setBiometric(s => ({ ...s, requireOnSensitive: v }))}
                  disabled={!biometric.enabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secure Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {isRTL ? 'الملاحظات المشفرة' : 'Secure Notes'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? 'ملاحظات مشفرة لكل بروفايل' : 'Encrypted notes for each profile'}
                  </CardDescription>
                </div>
                <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {isRTL ? 'إضافة ملاحظة' : 'Add Note'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isRTL ? 'إضافة ملاحظة مشفرة' : 'Add Secure Note'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'البروفايل (اختياري)' : 'Profile (optional)'}</label>
                        <Select value={newNote.profileId} onValueChange={(v) => setNewNote(s => ({ ...s, profileId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={isRTL ? 'عام' : 'Global'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">{isRTL ? 'عام' : 'Global'}</SelectItem>
                            {profiles.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'العنوان' : 'Title'}</label>
                        <Input 
                          value={newNote.title}
                          onChange={(e) => setNewNote(s => ({ ...s, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'المحتوى' : 'Content'}</label>
                        <Textarea 
                          value={newNote.content}
                          onChange={(e) => setNewNote(s => ({ ...s, content: e.target.value }))}
                          rows={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{isRTL ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma separated)'}</label>
                        <Input 
                          value={newNote.tags}
                          onChange={(e) => setNewNote(s => ({ ...s, tags: e.target.value }))}
                          placeholder="password, login, important"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddNote(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
                      <Button onClick={addSecureNote}>{isRTL ? 'إضافة' : 'Add'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {secureNotes.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {secureNotes.map((note) => (
                      <div 
                        key={note.id}
                        className="p-4 bg-muted/30 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-primary" />
                            <h4 className="font-medium">{note.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setShowNoteContent(s => ({ ...s, [note.id]: !s[note.id] }))}
                            >
                              {showNoteContent[note.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {showNoteContent[note.id] && (
                          <div className="p-3 bg-background rounded border text-sm">
                            {note.content}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {note.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p>{isRTL ? 'لا توجد ملاحظات مشفرة' : 'No secure notes'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
