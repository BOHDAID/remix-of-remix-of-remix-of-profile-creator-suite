import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MousePointer2,
  Keyboard,
  Clock,
  Scroll,
  Eye,
  Brain,
  Activity,
  Settings,
  Play,
  Pause,
  Target,
  Shuffle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  mouseCurve: 'linear' | 'bezier' | 'natural' | 'erratic';
  typingSpeed: { min: number; max: number };
  scrollBehavior: 'smooth' | 'stepped' | 'natural';
  pauseFrequency: number;
  humanScore: number;
}

const defaultPatterns: BehaviorPattern[] = [
  {
    id: 'casual',
    name: 'مستخدم عادي',
    description: 'سلوك طبيعي لمستخدم عادي',
    mouseCurve: 'natural',
    typingSpeed: { min: 80, max: 150 },
    scrollBehavior: 'smooth',
    pauseFrequency: 0.3,
    humanScore: 92
  },
  {
    id: 'professional',
    name: 'مستخدم محترف',
    description: 'كتابة سريعة وتنقل دقيق',
    mouseCurve: 'bezier',
    typingSpeed: { min: 150, max: 250 },
    scrollBehavior: 'stepped',
    pauseFrequency: 0.15,
    humanScore: 85
  },
  {
    id: 'elderly',
    name: 'مستخدم كبير السن',
    description: 'حركات بطيئة ومتأنية',
    mouseCurve: 'linear',
    typingSpeed: { min: 30, max: 60 },
    scrollBehavior: 'stepped',
    pauseFrequency: 0.5,
    humanScore: 96
  },
  {
    id: 'gamer',
    name: 'لاعب',
    description: 'حركات سريعة ودقيقة',
    mouseCurve: 'erratic',
    typingSpeed: { min: 200, max: 400 },
    scrollBehavior: 'natural',
    pauseFrequency: 0.1,
    humanScore: 78
  }
];

export function BehavioralSimulationView() {
  const [isActive, setIsActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<BehaviorPattern>(defaultPatterns[0]);
  const [customSettings, setCustomSettings] = useState({
    mouseJitter: 5,
    typingMistakes: 0.02,
    scrollVariation: 15,
    idleMovements: true,
    tabSwitching: true,
    randomPauses: true,
    cursorDrift: true
  });
  const [simulationStats, setSimulationStats] = useState({
    mouseMovements: 0,
    keystrokes: 0,
    scrollEvents: 0,
    pauses: 0,
    humanScore: 0
  });

  const handlePatternChange = (patternId: string) => {
    const pattern = defaultPatterns.find(p => p.id === patternId);
    if (pattern) setSelectedPattern(pattern);
  };

  const startSimulation = () => {
    setIsActive(true);
    // Simulate activity
    const interval = setInterval(() => {
      setSimulationStats(prev => ({
        mouseMovements: prev.mouseMovements + Math.floor(Math.random() * 5),
        keystrokes: prev.keystrokes + Math.floor(Math.random() * 3),
        scrollEvents: prev.scrollEvents + (Math.random() > 0.7 ? 1 : 0),
        pauses: prev.pauses + (Math.random() > 0.9 ? 1 : 0),
        humanScore: Math.min(100, prev.humanScore + Math.random() * 0.5)
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">محاكاة السلوك البشري</h1>
            <p className="text-muted-foreground">تقليد السلوك الطبيعي للمستخدمين</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => {
            if (!isActive) startSimulation();
            setIsActive(!isActive);
          }}
          className={cn(
            "gap-2",
            isActive ? "bg-destructive hover:bg-destructive/90" : ""
          )}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isActive ? 'إيقاف' : 'تشغيل'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <MousePointer2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{simulationStats.mouseMovements}</p>
            <p className="text-xs text-muted-foreground">حركات الماوس</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Keyboard className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold">{simulationStats.keystrokes}</p>
            <p className="text-xs text-muted-foreground">ضغطات المفاتيح</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Scroll className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold">{simulationStats.scrollEvents}</p>
            <p className="text-xs text-muted-foreground">أحداث التمرير</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <p className="text-2xl font-bold">{simulationStats.pauses}</p>
            <p className="text-xs text-muted-foreground">فترات التوقف</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{simulationStats.humanScore.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">نتيجة البشرية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavior Patterns */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              أنماط السلوك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {defaultPatterns.map((pattern) => (
              <div
                key={pattern.id}
                onClick={() => handlePatternChange(pattern.id)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all",
                  selectedPattern.id === pattern.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{pattern.name}</span>
                  <Badge variant="outline" className={cn(
                    pattern.humanScore >= 90 ? 'text-success' :
                    pattern.humanScore >= 80 ? 'text-yellow-400' : 'text-orange-400'
                  )}>
                    {pattern.humanScore}% بشري
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-muted-foreground">منحنى الماوس</p>
                    <p className="font-medium">{pattern.mouseCurve}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-muted-foreground">سرعة الكتابة</p>
                    <p className="font-medium">{pattern.typingSpeed.min}-{pattern.typingSpeed.max}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <p className="text-muted-foreground">التمرير</p>
                    <p className="font-medium">{pattern.scrollBehavior}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom Settings */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات مخصصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="mouse">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="mouse">الماوس</TabsTrigger>
                <TabsTrigger value="keyboard">الكيبورد</TabsTrigger>
                <TabsTrigger value="behavior">السلوك</TabsTrigger>
              </TabsList>

              <TabsContent value="mouse" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">اهتزاز المؤشر</span>
                    <span className="text-sm text-primary">{customSettings.mouseJitter}px</span>
                  </div>
                  <Slider
                    value={[customSettings.mouseJitter]}
                    onValueChange={([v]) => setCustomSettings(s => ({...s, mouseJitter: v}))}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>انحراف المؤشر</span>
                  <Switch
                    checked={customSettings.cursorDrift}
                    onCheckedChange={(v) => setCustomSettings(s => ({...s, cursorDrift: v}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>حركات الخمول</span>
                  <Switch
                    checked={customSettings.idleMovements}
                    onCheckedChange={(v) => setCustomSettings(s => ({...s, idleMovements: v}))}
                  />
                </div>

                <div className="p-4 rounded-lg bg-card/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">نوع منحنى الحركة</p>
                  <Select value={selectedPattern.mouseCurve}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">خطي</SelectItem>
                      <SelectItem value="bezier">بيزيه</SelectItem>
                      <SelectItem value="natural">طبيعي</SelectItem>
                      <SelectItem value="erratic">متقلب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="keyboard" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">نسبة الأخطاء</span>
                    <span className="text-sm text-primary">{(customSettings.typingMistakes * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[customSettings.typingMistakes * 100]}
                    onValueChange={([v]) => setCustomSettings(s => ({...s, typingMistakes: v / 100}))}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">أقل سرعة (WPM)</p>
                    <p className="text-2xl font-bold">{selectedPattern.typingSpeed.min}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-card/50 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">أعلى سرعة (WPM)</p>
                    <p className="text-2xl font-bold">{selectedPattern.typingSpeed.max}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>تبديل التابات</span>
                  <Switch
                    checked={customSettings.tabSwitching}
                    onCheckedChange={(v) => setCustomSettings(s => ({...s, tabSwitching: v}))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">تنوع التمرير</span>
                    <span className="text-sm text-primary">{customSettings.scrollVariation}%</span>
                  </div>
                  <Slider
                    value={[customSettings.scrollVariation]}
                    onValueChange={([v]) => setCustomSettings(s => ({...s, scrollVariation: v}))}
                    min={0}
                    max={50}
                    step={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>توقفات عشوائية</span>
                  <Switch
                    checked={customSettings.randomPauses}
                    onCheckedChange={(v) => setCustomSettings(s => ({...s, randomPauses: v}))}
                  />
                </div>

                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">نتيجة البشرية المتوقعة</span>
                  </div>
                  <Progress value={selectedPattern.humanScore} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    الإعدادات الحالية ستحقق نتيجة بشرية تقريبية {selectedPattern.humanScore}%
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
