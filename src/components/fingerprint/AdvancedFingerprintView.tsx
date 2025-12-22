import { useState } from 'react';
import { 
  Fingerprint, 
  Monitor, 
  Cpu, 
  HardDrive, 
  Globe, 
  Clock, 
  Palette,
  Volume2,
  Smartphone,
  Settings2,
  Shield,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Battery,
  Wifi,
  Type
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FingerprintModule {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: any;
  enabled: boolean;
  mode: 'spoof' | 'randomize' | 'block' | 'noise';
  risk: 'low' | 'medium' | 'high';
}

export function AdvancedFingerprintView() {
  const { isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const [modules, setModules] = useState<FingerprintModule[]>([
    { id: 'canvas', name: 'Canvas Fingerprint', nameAr: 'بصمة الكانفاس', description: 'Randomize canvas fingerprint', descriptionAr: 'تعشيق بصمة الكانفاس', icon: Palette, enabled: true, mode: 'randomize', risk: 'high' },
    { id: 'webgl', name: 'WebGL Fingerprint', nameAr: 'بصمة WebGL', description: 'Spoof WebGL renderer', descriptionAr: 'تزييف WebGL', icon: Monitor, enabled: true, mode: 'spoof', risk: 'high' },
    { id: 'timezone', name: 'Timezone', nameAr: 'المنطقة الزمنية', description: 'Match proxy location', descriptionAr: 'مطابقة موقع البروكسي', icon: Clock, enabled: true, mode: 'spoof', risk: 'medium' },
    { id: 'hardware', name: 'Hardware IDs', nameAr: 'معرفات الأجهزة', description: 'Spoof device identifiers', descriptionAr: 'تزييف معرفات الجهاز', icon: HardDrive, enabled: true, mode: 'randomize', risk: 'medium' },
    { id: 'fonts', name: 'Font Fingerprint', nameAr: 'بصمة الخطوط', description: 'Randomize font list', descriptionAr: 'تعشيق قائمة الخطوط', icon: Type, enabled: true, mode: 'randomize', risk: 'medium' },
    { id: 'battery', name: 'Battery API', nameAr: 'واجهة البطارية', description: 'Spoof battery status', descriptionAr: 'تزييف حالة البطارية', icon: Battery, enabled: false, mode: 'spoof', risk: 'low' },
    { id: 'media', name: 'Media Devices', nameAr: 'أجهزة الميديا', description: 'Randomize device list', descriptionAr: 'تعشيق قائمة الأجهزة', icon: Volume2, enabled: true, mode: 'randomize', risk: 'medium' },
    { id: 'clienthints', name: 'Client Hints', nameAr: 'تلميحات العميل', description: 'Spoof client hints', descriptionAr: 'تزييف تلميحات العميل', icon: Smartphone, enabled: true, mode: 'spoof', risk: 'medium' },
    { id: 'navigator', name: 'Navigator Props', nameAr: 'خصائص المتصفح', description: 'Spoof navigator object', descriptionAr: 'تزييف كائن المتصفح', icon: Globe, enabled: true, mode: 'spoof', risk: 'high' },
    { id: 'performance', name: 'Performance API', nameAr: 'واجهة الأداء', description: 'Add noise to timing', descriptionAr: 'إضافة تشويش للتوقيت', icon: Zap, enabled: true, mode: 'noise', risk: 'low' },
    { id: 'automation', name: 'Automation Bypass', nameAr: 'تجاوز الأتمتة', description: 'Hide automation flags', descriptionAr: 'إخفاء علامات الأتمتة', icon: Shield, enabled: true, mode: 'spoof', risk: 'high' },
    { id: 'speech', name: 'Speech Synthesis', nameAr: 'التحدث', description: 'Spoof voice list', descriptionAr: 'تزييف قائمة الأصوات', icon: Volume2, enabled: false, mode: 'randomize', risk: 'low' },
  ]);

  const [canvasSettings, setCanvasSettings] = useState({
    noiseLevel: 25,
    persistPerProfile: true,
    hashMode: 'unique' as 'unique' | 'common' | 'random'
  });

  const [webglSettings, setWebglSettings] = useState({
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)',
    unmaskedVendor: 'NVIDIA Corporation',
    unmaskedRenderer: 'GeForce RTX 3080/PCIe/SSE2'
  });

  const [navigatorSettings, setNavigatorSettings] = useState({
    platform: 'Win32',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    maxTouchPoints: 0,
    doNotTrack: null as '1' | '0' | null,
    webdriver: false,
    languages: ['en-US', 'en']
  });

  const [batterySettings, setBatterySettings] = useState({
    level: 85,
    charging: true,
    randomize: true
  });

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const setModuleMode = (id: string, mode: 'spoof' | 'randomize' | 'block' | 'noise') => {
    setModules(prev => prev.map(m => 
      m.id === id ? { ...m, mode } : m
    ));
  };

  const randomizeAll = () => {
    setModules(prev => prev.map(m => ({ ...m, enabled: true, mode: 'randomize' })));
    toast.success(isRTL ? 'تم تعشيق جميع البصمات' : 'All fingerprints randomized');
  };

  const saveProfile = () => {
    toast.success(isRTL ? 'تم حفظ إعدادات البصمة' : 'Fingerprint settings saved');
  };

  const enabledCount = modules.filter(m => m.enabled).length;
  const protectionScore = Math.round((enabledCount / modules.length) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Fingerprint className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'البصمة الرقمية المتقدمة' : 'Advanced Fingerprint'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'تحكم كامل في بصمة المتصفح' : 'Full control over browser fingerprint'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={randomizeAll}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRTL ? 'تعشيق الكل' : 'Randomize All'}
          </Button>
          <Button onClick={saveProfile}>
            <Save className="w-4 h-4 mr-2" />
            {isRTL ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Protection Score */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isRTL ? 'مستوى الحماية' : 'Protection Level'}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-violet-400">{protectionScore}%</span>
                <Badge variant={protectionScore >= 80 ? 'default' : protectionScore >= 50 ? 'secondary' : 'destructive'}>
                  {protectionScore >= 80 
                    ? (isRTL ? 'ممتاز' : 'Excellent')
                    : protectionScore >= 50 
                      ? (isRTL ? 'جيد' : 'Good')
                      : (isRTL ? 'ضعيف' : 'Weak')
                  }
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'الوحدات النشطة' : 'Active Modules'}
              </p>
              <p className="text-2xl font-bold">{enabledCount}/{modules.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="canvas">{isRTL ? 'الكانفاس' : 'Canvas'}</TabsTrigger>
          <TabsTrigger value="webgl">WebGL</TabsTrigger>
          <TabsTrigger value="navigator">{isRTL ? 'المتصفح' : 'Navigator'}</TabsTrigger>
          <TabsTrigger value="hardware">{isRTL ? 'الأجهزة' : 'Hardware'}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card 
                  key={module.id}
                  className={cn(
                    "relative overflow-hidden transition-all",
                    module.enabled && "border-primary/30"
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        module.enabled ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          module.enabled ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <Switch 
                        checked={module.enabled}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                    </div>
                    <CardTitle className="text-sm mt-2">
                      {isRTL ? module.nameAr : module.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isRTL ? module.descriptionAr : module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Select 
                        value={module.mode} 
                        onValueChange={(v) => setModuleMode(module.id, v as any)}
                        disabled={!module.enabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spoof">{isRTL ? 'تزييف' : 'Spoof'}</SelectItem>
                          <SelectItem value="randomize">{isRTL ? 'تعشيق' : 'Randomize'}</SelectItem>
                          <SelectItem value="noise">{isRTL ? 'تشويش' : 'Noise'}</SelectItem>
                          <SelectItem value="block">{isRTL ? 'حظر' : 'Block'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          module.risk === 'high' && "border-red-500/50 text-red-400",
                          module.risk === 'medium' && "border-yellow-500/50 text-yellow-400",
                          module.risk === 'low' && "border-green-500/50 text-green-400"
                        )}
                      >
                        {module.risk}
                      </Badge>
                    </div>
                  </CardContent>
                  {module.enabled && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="canvas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                {isRTL ? 'إعدادات بصمة الكانفاس' : 'Canvas Fingerprint Settings'}
              </CardTitle>
              <CardDescription>
                {isRTL ? 'تخصيص كيفية التعامل مع بصمة الكانفاس' : 'Customize how canvas fingerprint is handled'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'مستوى التشويش' : 'Noise Level'}: {canvasSettings.noiseLevel}%
                </label>
                <Slider 
                  value={[canvasSettings.noiseLevel]} 
                  max={100} 
                  step={1}
                  onValueChange={([v]) => setCanvasSettings(s => ({ ...s, noiseLevel: v }))}
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? 'قيمة أعلى = تشويش أكبر ولكن قد يؤثر على بعض المواقع'
                    : 'Higher value = more noise but may affect some sites'
                  }
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    {isRTL ? 'حفظ لكل بروفايل' : 'Persist Per Profile'}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'نفس البصمة لكل بروفايل' : 'Same fingerprint for each profile'}
                  </p>
                </div>
                <Switch 
                  checked={canvasSettings.persistPerProfile}
                  onCheckedChange={(v) => setCanvasSettings(s => ({ ...s, persistPerProfile: v }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'وضع الهاش' : 'Hash Mode'}</label>
                <Select 
                  value={canvasSettings.hashMode}
                  onValueChange={(v) => setCanvasSettings(s => ({ ...s, hashMode: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unique">{isRTL ? 'فريد' : 'Unique'}</SelectItem>
                    <SelectItem value="common">{isRTL ? 'شائع' : 'Common'}</SelectItem>
                    <SelectItem value="random">{isRTL ? 'عشوائي' : 'Random'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webgl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                {isRTL ? 'إعدادات WebGL' : 'WebGL Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor</label>
                  <Input 
                    value={webglSettings.vendor}
                    onChange={(e) => setWebglSettings(s => ({ ...s, vendor: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Renderer</label>
                  <Input 
                    value={webglSettings.renderer}
                    onChange={(e) => setWebglSettings(s => ({ ...s, renderer: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unmasked Vendor</label>
                  <Input 
                    value={webglSettings.unmaskedVendor}
                    onChange={(e) => setWebglSettings(s => ({ ...s, unmaskedVendor: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unmasked Renderer</label>
                  <Input 
                    value={webglSettings.unmaskedRenderer}
                    onChange={(e) => setWebglSettings(s => ({ ...s, unmaskedRenderer: e.target.value }))}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => toast.success(isRTL ? 'تم التعشيق' : 'Randomized')}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {isRTL ? 'تعشيق القيم' : 'Randomize Values'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {isRTL ? 'خصائص المتصفح' : 'Navigator Properties'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select 
                    value={navigatorSettings.platform}
                    onValueChange={(v) => setNavigatorSettings(s => ({ ...s, platform: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Win32">Win32</SelectItem>
                      <SelectItem value="MacIntel">MacIntel</SelectItem>
                      <SelectItem value="Linux x86_64">Linux x86_64</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hardware Concurrency</label>
                  <Select 
                    value={String(navigatorSettings.hardwareConcurrency)}
                    onValueChange={(v) => setNavigatorSettings(s => ({ ...s, hardwareConcurrency: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 4, 6, 8, 12, 16, 24, 32].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} cores</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Memory</label>
                  <Select 
                    value={String(navigatorSettings.deviceMemory)}
                    onValueChange={(v) => setNavigatorSettings(s => ({ ...s, deviceMemory: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 4, 8, 16, 32].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} GB</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Touch Points</label>
                  <Select 
                    value={String(navigatorSettings.maxTouchPoints)}
                    onValueChange={(v) => setNavigatorSettings(s => ({ ...s, maxTouchPoints: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (Desktop)</SelectItem>
                      <SelectItem value="5">5 (Touch)</SelectItem>
                      <SelectItem value="10">10 (Multi-touch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    {isRTL ? 'إخفاء WebDriver' : 'Hide WebDriver'}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'إخفاء علامة الأتمتة' : 'Hide automation flag'}
                  </p>
                </div>
                <Switch 
                  checked={!navigatorSettings.webdriver}
                  onCheckedChange={(v) => setNavigatorSettings(s => ({ ...s, webdriver: !v }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-primary" />
                {isRTL ? 'واجهة البطارية' : 'Battery API'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{isRTL ? 'تعشيق تلقائي' : 'Auto Randomize'}</label>
                <Switch 
                  checked={batterySettings.randomize}
                  onCheckedChange={(v) => setBatterySettings(s => ({ ...s, randomize: v }))}
                />
              </div>

              {!batterySettings.randomize && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isRTL ? 'مستوى البطارية' : 'Battery Level'}: {batterySettings.level}%
                    </label>
                    <Slider 
                      value={[batterySettings.level]} 
                      max={100} 
                      step={1}
                      onValueChange={([v]) => setBatterySettings(s => ({ ...s, level: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{isRTL ? 'قيد الشحن' : 'Charging'}</label>
                    <Switch 
                      checked={batterySettings.charging}
                      onCheckedChange={(v) => setBatterySettings(s => ({ ...s, charging: v }))}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
