import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Zap,
  Save,
  RotateCcw,
  User,
  History,
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';

const SETTINGS_STORAGE_KEY = 'behavioral_simulation_settings';
const STATS_STORAGE_KEY = 'behavioral_simulation_stats';
const HISTORY_STORAGE_KEY = 'behavioral_simulation_history';

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

interface CustomSettings {
  mouseJitter: number;
  typingMistakes: number;
  scrollVariation: number;
  idleMovements: boolean;
  tabSwitching: boolean;
  randomPauses: boolean;
  cursorDrift: boolean;
  pauseDuration: { min: number; max: number };
  readingTime: { min: number; max: number };
}

interface SimulationStats {
  mouseMovements: number;
  keystrokes: number;
  scrollEvents: number;
  pauses: number;
  humanScore: number;
  totalDuration: number;
  sessionsCount: number;
  lastSession: string | null;
}

interface ProfileSimulation {
  profileId: string;
  profileName: string;
  patternId: string;
  customSettings: CustomSettings;
  stats: SimulationStats;
  isActive: boolean;
  lastUpdated: string;
}

interface SimulationEvent {
  id: string;
  timestamp: string;
  type: 'mouse' | 'keyboard' | 'scroll' | 'pause' | 'start' | 'stop';
  details: string;
  profileId?: string;
}

const defaultPatterns: BehaviorPattern[] = [
  {
    id: 'casual',
    name: 'مستخدم عادي',
    description: 'سلوك طبيعي لمستخدم عادي يتصفح بهدوء',
    mouseCurve: 'natural',
    typingSpeed: { min: 80, max: 150 },
    scrollBehavior: 'smooth',
    pauseFrequency: 0.3,
    humanScore: 92
  },
  {
    id: 'professional',
    name: 'مستخدم محترف',
    description: 'كتابة سريعة وتنقل دقيق ومركز',
    mouseCurve: 'bezier',
    typingSpeed: { min: 150, max: 250 },
    scrollBehavior: 'stepped',
    pauseFrequency: 0.15,
    humanScore: 85
  },
  {
    id: 'elderly',
    name: 'مستخدم كبير السن',
    description: 'حركات بطيئة ومتأنية مع توقفات',
    mouseCurve: 'linear',
    typingSpeed: { min: 30, max: 60 },
    scrollBehavior: 'stepped',
    pauseFrequency: 0.5,
    humanScore: 96
  },
  {
    id: 'gamer',
    name: 'لاعب',
    description: 'حركات سريعة ودقيقة مع ردود فعل سريعة',
    mouseCurve: 'erratic',
    typingSpeed: { min: 200, max: 400 },
    scrollBehavior: 'natural',
    pauseFrequency: 0.1,
    humanScore: 78
  },
  {
    id: 'researcher',
    name: 'باحث',
    description: 'قراءة مطولة مع تمرير بطيء ونقرات مدروسة',
    mouseCurve: 'bezier',
    typingSpeed: { min: 100, max: 180 },
    scrollBehavior: 'smooth',
    pauseFrequency: 0.4,
    humanScore: 94
  }
];

const defaultCustomSettings: CustomSettings = {
  mouseJitter: 5,
  typingMistakes: 0.02,
  scrollVariation: 15,
  idleMovements: true,
  tabSwitching: true,
  randomPauses: true,
  cursorDrift: true,
  pauseDuration: { min: 500, max: 3000 },
  readingTime: { min: 2000, max: 8000 }
};

const defaultStats: SimulationStats = {
  mouseMovements: 0,
  keystrokes: 0,
  scrollEvents: 0,
  pauses: 0,
  humanScore: 0,
  totalDuration: 0,
  sessionsCount: 0,
  lastSession: null
};

export function BehavioralSimulationView() {
  const { profiles } = useAppStore();
  
  const [isActive, setIsActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<BehaviorPattern>(defaultPatterns[0]);
  const [customSettings, setCustomSettings] = useState<CustomSettings>(defaultCustomSettings);
  const [globalStats, setGlobalStats] = useState<SimulationStats>(defaultStats);
  const [profileSimulations, setProfileSimulations] = useState<ProfileSimulation[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [history, setHistory] = useState<SimulationEvent[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const mouseTracker = useRef({ x: 0, y: 0 });
  const lastActionTime = useRef<number>(Date.now());

  // Load saved data
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setCustomSettings(parsed.customSettings || defaultCustomSettings);
        setProfileSimulations(parsed.profileSimulations || []);
        if (parsed.selectedPatternId) {
          const pattern = defaultPatterns.find(p => p.id === parsed.selectedPatternId);
          if (pattern) setSelectedPattern(pattern);
        }
      } catch (e) {
        console.error('Failed to load behavioral settings:', e);
      }
    }

    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
    if (savedStats) {
      try {
        setGlobalStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }

    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    const data = {
      customSettings,
      profileSimulations,
      selectedPatternId: selectedPattern.id
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
  }, [customSettings, profileSimulations, selectedPattern]);

  // Save stats
  useEffect(() => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(globalStats));
  }, [globalStats]);

  // Save history (keep last 100 events)
  useEffect(() => {
    const trimmedHistory = history.slice(-100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  }, [history]);

  const addEvent = useCallback((type: SimulationEvent['type'], details: string, profileId?: string) => {
    const event: SimulationEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      details,
      profileId
    };
    setHistory(prev => [...prev, event]);
  }, []);

  const calculateHumanScore = useCallback(() => {
    let score = selectedPattern.humanScore;
    
    // Adjust based on custom settings
    if (customSettings.mouseJitter > 0 && customSettings.mouseJitter < 10) score += 2;
    if (customSettings.typingMistakes > 0.01 && customSettings.typingMistakes < 0.05) score += 3;
    if (customSettings.randomPauses) score += 2;
    if (customSettings.idleMovements) score += 2;
    if (customSettings.cursorDrift) score += 1;
    
    // Penalize extreme settings
    if (customSettings.mouseJitter > 15) score -= 5;
    if (customSettings.typingMistakes > 0.08) score -= 3;
    
    return Math.min(100, Math.max(0, score));
  }, [selectedPattern, customSettings]);

  const simulateMouseMovement = useCallback(() => {
    const jitter = customSettings.mouseJitter;
    const dx = (Math.random() - 0.5) * jitter * 2;
    const dy = (Math.random() - 0.5) * jitter * 2;
    
    mouseTracker.current.x += dx;
    mouseTracker.current.y += dy;
    
    // Apply curve based on pattern
    let curveMultiplier = 1;
    switch (selectedPattern.mouseCurve) {
      case 'bezier':
        curveMultiplier = Math.sin(Date.now() / 1000) * 0.5 + 1;
        break;
      case 'natural':
        curveMultiplier = 0.8 + Math.random() * 0.4;
        break;
      case 'erratic':
        curveMultiplier = 0.5 + Math.random() * 1.5;
        break;
    }
    
    return {
      x: mouseTracker.current.x * curveMultiplier,
      y: mouseTracker.current.y * curveMultiplier,
      timestamp: Date.now()
    };
  }, [customSettings.mouseJitter, selectedPattern.mouseCurve]);

  const simulateKeypress = useCallback(() => {
    const { min, max } = selectedPattern.typingSpeed;
    const wpm = min + Math.random() * (max - min);
    const delay = (60000 / wpm) / 5; // Average word length
    
    // Simulate typing mistake
    const hasMistake = Math.random() < customSettings.typingMistakes;
    
    return {
      delay,
      hasMistake,
      correctionDelay: hasMistake ? 200 + Math.random() * 300 : 0
    };
  }, [selectedPattern.typingSpeed, customSettings.typingMistakes]);

  const simulateScroll = useCallback(() => {
    const variation = customSettings.scrollVariation / 100;
    const baseAmount = 100;
    const amount = baseAmount * (1 + (Math.random() - 0.5) * variation * 2);
    
    let behavior: ScrollBehavior = 'smooth';
    switch (selectedPattern.scrollBehavior) {
      case 'stepped':
        behavior = 'auto';
        break;
      case 'natural':
        behavior = Math.random() > 0.5 ? 'smooth' : 'auto';
        break;
    }
    
    return { amount, behavior };
  }, [customSettings.scrollVariation, selectedPattern.scrollBehavior]);

  const runSimulation = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime.current;
    
    // Random pause
    if (customSettings.randomPauses && Math.random() < selectedPattern.pauseFrequency * 0.1) {
      const { min, max } = customSettings.pauseDuration;
      const pauseTime = min + Math.random() * (max - min);
      
      setGlobalStats(prev => ({
        ...prev,
        pauses: prev.pauses + 1
      }));
      addEvent('pause', `توقف لمدة ${Math.round(pauseTime)}ms`);
      
      lastActionTime.current = now + pauseTime;
      return;
    }
    
    // Simulate actions
    const actionType = Math.random();
    
    if (actionType < 0.5) {
      // Mouse movement
      const movement = simulateMouseMovement();
      setGlobalStats(prev => ({
        ...prev,
        mouseMovements: prev.mouseMovements + 1
      }));
      
      if (Math.random() < 0.1) {
        addEvent('mouse', `حركة ماوس (${movement.x.toFixed(1)}, ${movement.y.toFixed(1)})`);
      }
    } else if (actionType < 0.8) {
      // Keypress
      const keypress = simulateKeypress();
      setGlobalStats(prev => ({
        ...prev,
        keystrokes: prev.keystrokes + 1
      }));
      
      if (keypress.hasMistake) {
        addEvent('keyboard', 'ضغطة مفتاح مع خطأ وتصحيح');
      }
    } else {
      // Scroll
      const scroll = simulateScroll();
      setGlobalStats(prev => ({
        ...prev,
        scrollEvents: prev.scrollEvents + 1
      }));
      
      if (Math.random() < 0.2) {
        addEvent('scroll', `تمرير ${Math.round(scroll.amount)}px`);
      }
    }
    
    // Update human score
    const newScore = calculateHumanScore();
    setGlobalStats(prev => ({
      ...prev,
      humanScore: newScore
    }));
    
    lastActionTime.current = now;
  }, [
    customSettings,
    selectedPattern,
    simulateMouseMovement,
    simulateKeypress,
    simulateScroll,
    calculateHumanScore,
    addEvent
  ]);

  const startSimulation = useCallback(() => {
    setIsActive(true);
    setSessionStartTime(Date.now());
    
    setGlobalStats(prev => ({
      ...prev,
      sessionsCount: prev.sessionsCount + 1,
      lastSession: new Date().toISOString()
    }));
    
    addEvent('start', `بدء المحاكاة بنمط "${selectedPattern.name}"`);
    toast.success('تم بدء المحاكاة السلوكية');
    
    // Start simulation loop
    simulationInterval.current = setInterval(() => {
      runSimulation();
    }, 100 + Math.random() * 200);
  }, [selectedPattern, addEvent, runSimulation]);

  const stopSimulation = useCallback(() => {
    setIsActive(false);
    
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    
    if (sessionStartTime) {
      const duration = Date.now() - sessionStartTime;
      setGlobalStats(prev => ({
        ...prev,
        totalDuration: prev.totalDuration + duration
      }));
      setSessionStartTime(null);
    }
    
    addEvent('stop', 'إيقاف المحاكاة');
    toast.info('تم إيقاف المحاكاة');
  }, [sessionStartTime, addEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  const handlePatternChange = (patternId: string) => {
    const pattern = defaultPatterns.find(p => p.id === patternId);
    if (pattern) {
      setSelectedPattern(pattern);
      toast.success(`تم تغيير النمط إلى "${pattern.name}"`);
    }
  };

  const applyToProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const existingIndex = profileSimulations.findIndex(ps => ps.profileId === profileId);
    
    const newSimulation: ProfileSimulation = {
      profileId,
      profileName: profile.name,
      patternId: selectedPattern.id,
      customSettings: { ...customSettings },
      stats: { ...defaultStats },
      isActive: false,
      lastUpdated: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      setProfileSimulations(prev => {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newSimulation, stats: updated[existingIndex].stats };
        return updated;
      });
    } else {
      setProfileSimulations(prev => [...prev, newSimulation]);
    }
    
    toast.success(`تم تطبيق إعدادات المحاكاة على "${profile.name}"`);
  };

  const removeProfileSimulation = (profileId: string) => {
    setProfileSimulations(prev => prev.filter(ps => ps.profileId !== profileId));
    toast.success('تم إزالة إعدادات المحاكاة');
  };

  const resetStats = () => {
    setGlobalStats(defaultStats);
    toast.success('تم إعادة تعيين الإحصائيات');
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success('تم مسح السجل');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}س ${minutes % 60}د`;
    if (minutes > 0) return `${minutes}د ${seconds % 60}ث`;
    return `${seconds}ث`;
  };

  const getEventIcon = (type: SimulationEvent['type']) => {
    switch (type) {
      case 'mouse': return <MousePointer2 className="w-3 h-3" />;
      case 'keyboard': return <Keyboard className="w-3 h-3" />;
      case 'scroll': return <Scroll className="w-3 h-3" />;
      case 'pause': return <Clock className="w-3 h-3" />;
      case 'start': return <Play className="w-3 h-3 text-success" />;
      case 'stop': return <Pause className="w-3 h-3 text-destructive" />;
    }
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
            <p className="text-muted-foreground">تقليد السلوك الطبيعي للمستخدمين لتجنب الكشف</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetStats}>
            <RotateCcw className="w-4 h-4 ml-1" />
            إعادة تعيين
          </Button>
          <Button
            size="lg"
            onClick={() => {
              if (isActive) {
                stopSimulation();
              } else {
                startSimulation();
              }
            }}
            className={cn(
              "gap-2",
              isActive ? "bg-destructive hover:bg-destructive/90" : ""
            )}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isActive ? 'إيقاف المحاكاة' : 'بدء المحاكاة'}
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <MousePointer2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{globalStats.mouseMovements.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">حركات الماوس</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Keyboard className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold">{globalStats.keystrokes.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">ضغطات المفاتيح</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Scroll className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold">{globalStats.scrollEvents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">أحداث التمرير</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <p className="text-2xl font-bold">{globalStats.pauses}</p>
            <p className="text-xs text-muted-foreground">فترات التوقف</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold">{formatDuration(globalStats.totalDuration)}</p>
            <p className="text-xs text-muted-foreground">إجمالي الوقت</p>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{globalStats.humanScore.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">نتيجة البشرية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Behavior Patterns */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5" />
              أنماط السلوك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
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
                        pattern.humanScore >= 90 ? 'text-success border-success' :
                        pattern.humanScore >= 80 ? 'text-yellow-400 border-yellow-400' : 'text-orange-400 border-orange-400'
                      )}>
                        {pattern.humanScore}% بشري
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-muted-foreground">الماوس</p>
                        <p className="font-medium">{pattern.mouseCurve}</p>
                      </div>
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-muted-foreground">الكتابة</p>
                        <p className="font-medium">{pattern.typingSpeed.min}-{pattern.typingSpeed.max}</p>
                      </div>
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-muted-foreground">التوقف</p>
                        <p className="font-medium">{(pattern.pauseFrequency * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
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
          <CardContent className="space-y-4">
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
                  <Select 
                    value={selectedPattern.mouseCurve}
                    onValueChange={(value: 'linear' | 'bezier' | 'natural' | 'erratic') => {
                      setSelectedPattern(prev => ({ ...prev, mouseCurve: value }));
                    }}
                  >
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
                  <Progress value={calculateHumanScore()} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    الإعدادات الحالية ستحقق نتيجة بشرية تقريبية {calculateHumanScore()}%
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Apply to Profile */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">تطبيق على بروفايل</p>
              <div className="flex gap-2">
                <Select value={selectedProfileId || ''} onValueChange={setSelectedProfileId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر بروفايل" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => selectedProfileId && applyToProfile(selectedProfileId)}
                  disabled={!selectedProfileId}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Simulations */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                بروفايلات المحاكاة ({profileSimulations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {profileSimulations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لم يتم تطبيق المحاكاة على أي بروفايل
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profileSimulations.map(ps => {
                      const pattern = defaultPatterns.find(p => p.id === ps.patternId);
                      return (
                        <div 
                          key={ps.profileId}
                          className="p-3 rounded-lg border border-border bg-card/50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{ps.profileName}</p>
                              <p className="text-xs text-muted-foreground">
                                النمط: {pattern?.name || 'غير معروف'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-success">
                                <CheckCircle className="w-3 h-3 ml-1" />
                                مفعل
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeProfileSimulation(ps.profileId)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="glass-effect">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  سجل النشاط
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا يوجد نشاط مسجل
                  </p>
                ) : (
                  <div className="space-y-1">
                    {history.slice().reverse().slice(0, 50).map(event => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-2 p-2 rounded text-xs hover:bg-muted/50"
                      >
                        {getEventIcon(event.type)}
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString('ar')}
                        </span>
                        <span className="flex-1">{event.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
