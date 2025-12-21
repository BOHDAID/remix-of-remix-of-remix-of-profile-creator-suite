import { useState, useEffect } from 'react';
import { FingerprintSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cpu, Monitor, Globe, Shuffle, HardDrive } from 'lucide-react';

// GPU options
const GPU_OPTIONS = [
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4090' },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 4080' },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3090' },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080' },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3070' },
  { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1080 Ti' },
  { vendor: 'AMD', renderer: 'AMD Radeon RX 7900 XTX' },
  { vendor: 'AMD', renderer: 'AMD Radeon RX 6900 XT' },
  { vendor: 'AMD', renderer: 'AMD Radeon RX 6800 XT' },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Xe Graphics' },
  { vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 770' },
  { vendor: 'Apple', renderer: 'Apple M2 Pro' },
  { vendor: 'Apple', renderer: 'Apple M1 Max' },
];

// CPU options
const CPU_OPTIONS = [
  { name: 'Intel Core i9-13900K', cores: 24 },
  { name: 'Intel Core i9-12900K', cores: 16 },
  { name: 'Intel Core i7-13700K', cores: 16 },
  { name: 'Intel Core i7-12700K', cores: 12 },
  { name: 'Intel Core i5-13600K', cores: 14 },
  { name: 'Intel Core i5-12600K', cores: 10 },
  { name: 'AMD Ryzen 9 7950X', cores: 16 },
  { name: 'AMD Ryzen 9 5950X', cores: 16 },
  { name: 'AMD Ryzen 7 7700X', cores: 8 },
  { name: 'AMD Ryzen 7 5800X', cores: 8 },
  { name: 'AMD Ryzen 5 7600X', cores: 6 },
  { name: 'Apple M2 Pro', cores: 12 },
  { name: 'Apple M1 Max', cores: 10 },
];

// Screen resolutions
const SCREEN_RESOLUTIONS = [
  { width: 3840, height: 2160, label: '4K (3840x2160)' },
  { width: 2560, height: 1440, label: '2K (2560x1440)' },
  { width: 1920, height: 1080, label: 'Full HD (1920x1080)' },
  { width: 1680, height: 1050, label: 'WSXGA+ (1680x1050)' },
  { width: 1440, height: 900, label: 'WXGA+ (1440x900)' },
  { width: 1366, height: 768, label: 'HD (1366x768)' },
  { width: 2560, height: 1600, label: 'MacBook Pro 13"' },
  { width: 2880, height: 1800, label: 'MacBook Pro 15"' },
];

// Timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'نيويورك (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'لوس أنجلوس (UTC-8)' },
  { value: 'America/Chicago', label: 'شيكاغو (UTC-6)' },
  { value: 'Europe/London', label: 'لندن (UTC+0)' },
  { value: 'Europe/Paris', label: 'باريس (UTC+1)' },
  { value: 'Europe/Berlin', label: 'برلين (UTC+1)' },
  { value: 'Europe/Moscow', label: 'موسكو (UTC+3)' },
  { value: 'Asia/Dubai', label: 'دبي (UTC+4)' },
  { value: 'Asia/Riyadh', label: 'الرياض (UTC+3)' },
  { value: 'Asia/Tokyo', label: 'طوكيو (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'شنغهاي (UTC+8)' },
  { value: 'Asia/Singapore', label: 'سنغافورة (UTC+8)' },
  { value: 'Australia/Sydney', label: 'سيدني (UTC+11)' },
];

// Languages
const LANGUAGES = [
  { code: 'en-US', label: 'الإنجليزية (الولايات المتحدة)' },
  { code: 'en-GB', label: 'الإنجليزية (المملكة المتحدة)' },
  { code: 'ar-SA', label: 'العربية (السعودية)' },
  { code: 'ar-AE', label: 'العربية (الإمارات)' },
  { code: 'fr-FR', label: 'الفرنسية' },
  { code: 'de-DE', label: 'الألمانية' },
  { code: 'es-ES', label: 'الإسبانية' },
  { code: 'zh-CN', label: 'الصينية المبسطة' },
  { code: 'ja-JP', label: 'اليابانية' },
  { code: 'ru-RU', label: 'الروسية' },
];

// Platforms
const PLATFORMS = [
  { value: 'Win32', label: 'Windows' },
  { value: 'MacIntel', label: 'macOS (Intel)' },
  { value: 'MacARM', label: 'macOS (Apple Silicon)' },
  { value: 'Linux x86_64', label: 'Linux' },
];

interface FingerprintTabProps {
  fingerprint: FingerprintSettings | undefined;
  onChange: (fingerprint: FingerprintSettings) => void;
}

const defaultFingerprint: FingerprintSettings = {
  gpu: 'NVIDIA GeForce RTX 3080',
  gpuVendor: 'NVIDIA Corporation',
  cpu: 'Intel Core i7-12700K',
  cpuCores: 12,
  deviceMemory: 16,
  screenWidth: 1920,
  screenHeight: 1080,
  colorDepth: 24,
  pixelRatio: 1,
  timezone: 'America/New_York',
  language: 'en-US',
  languages: ['en-US', 'en'],
  platform: 'Win32',
  hardwareConcurrency: 12,
  webglVendor: 'NVIDIA Corporation',
  webglRenderer: 'NVIDIA GeForce RTX 3080',
  randomize: false,
};

export function FingerprintTab({ fingerprint, onChange }: FingerprintTabProps) {
  const [fp, setFp] = useState<FingerprintSettings>(fingerprint || defaultFingerprint);

  useEffect(() => {
    if (fingerprint) {
      setFp(fingerprint);
    }
  }, [fingerprint]);

  const updateFp = (updates: Partial<FingerprintSettings>) => {
    const newFp = { ...fp, ...updates };
    setFp(newFp);
    onChange(newFp);
  };

  const handleGpuChange = (renderer: string) => {
    const gpu = GPU_OPTIONS.find(g => g.renderer === renderer);
    if (gpu) {
      updateFp({
        gpu: gpu.renderer,
        gpuVendor: gpu.vendor,
        webglVendor: gpu.vendor,
        webglRenderer: gpu.renderer,
      });
    }
  };

  const handleCpuChange = (name: string) => {
    const cpu = CPU_OPTIONS.find(c => c.name === name);
    if (cpu) {
      updateFp({
        cpu: cpu.name,
        cpuCores: cpu.cores,
        hardwareConcurrency: cpu.cores,
      });
    }
  };

  const handleResolutionChange = (label: string) => {
    const res = SCREEN_RESOLUTIONS.find(r => r.label === label);
    if (res) {
      updateFp({
        screenWidth: res.width,
        screenHeight: res.height,
      });
    }
  };

  const randomizeAll = () => {
    const randomGpu = GPU_OPTIONS[Math.floor(Math.random() * GPU_OPTIONS.length)];
    const randomCpu = CPU_OPTIONS[Math.floor(Math.random() * CPU_OPTIONS.length)];
    const randomRes = SCREEN_RESOLUTIONS[Math.floor(Math.random() * SCREEN_RESOLUTIONS.length)];
    const randomTz = TIMEZONES[Math.floor(Math.random() * TIMEZONES.length)];
    const randomLang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
    const randomPlatform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const randomMemory = [4, 8, 16, 32][Math.floor(Math.random() * 4)];

    const newFp: FingerprintSettings = {
      gpu: randomGpu.renderer,
      gpuVendor: randomGpu.vendor,
      cpu: randomCpu.name,
      cpuCores: randomCpu.cores,
      deviceMemory: randomMemory,
      screenWidth: randomRes.width,
      screenHeight: randomRes.height,
      colorDepth: 24,
      pixelRatio: [1, 1.5, 2][Math.floor(Math.random() * 3)],
      timezone: randomTz.value,
      language: randomLang.code,
      languages: [randomLang.code, randomLang.code.split('-')[0]],
      platform: randomPlatform.value,
      hardwareConcurrency: randomCpu.cores,
      webglVendor: randomGpu.vendor,
      webglRenderer: randomGpu.renderer,
      randomize: true,
    };

    setFp(newFp);
    onChange(newFp);
  };

  return (
    <div className="space-y-6">
      {/* Randomize button */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
        <div className="flex items-center gap-3">
          <Shuffle className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">توليد عشوائي</p>
            <p className="text-sm text-muted-foreground">إنشاء بصمة وهمية عشوائية</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={randomizeAll}>
          <Shuffle className="w-4 h-4 ml-2" />
          عشوائي
        </Button>
      </div>

      {/* Hardware Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
          <HardDrive className="w-4 h-4" />
          العتاد
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GPU */}
          <div className="space-y-2">
            <Label>كرت الشاشة (GPU)</Label>
            <Select value={fp.gpu} onValueChange={handleGpuChange}>
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="اختر GPU" />
              </SelectTrigger>
              <SelectContent>
                {GPU_OPTIONS.map((gpu) => (
                  <SelectItem key={gpu.renderer} value={gpu.renderer}>
                    {gpu.renderer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CPU */}
          <div className="space-y-2">
            <Label>المعالج (CPU)</Label>
            <Select value={fp.cpu} onValueChange={handleCpuChange}>
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="اختر CPU" />
              </SelectTrigger>
              <SelectContent>
                {CPU_OPTIONS.map((cpu) => (
                  <SelectItem key={cpu.name} value={cpu.name}>
                    {cpu.name} ({cpu.cores} أنوية)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <Label>الذاكرة (RAM)</Label>
            <Select value={fp.deviceMemory.toString()} onValueChange={(v) => updateFp({ deviceMemory: parseInt(v) })}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 GB</SelectItem>
                <SelectItem value="8">8 GB</SelectItem>
                <SelectItem value="16">16 GB</SelectItem>
                <SelectItem value="32">32 GB</SelectItem>
                <SelectItem value="64">64 GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label>نظام التشغيل</Label>
            <Select value={fp.platform} onValueChange={(v) => updateFp({ platform: v })}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Screen Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
          <Monitor className="w-4 h-4" />
          الشاشة
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resolution */}
          <div className="space-y-2">
            <Label>دقة الشاشة</Label>
            <Select 
              value={SCREEN_RESOLUTIONS.find(r => r.width === fp.screenWidth && r.height === fp.screenHeight)?.label || ''}
              onValueChange={handleResolutionChange}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="اختر الدقة" />
              </SelectTrigger>
              <SelectContent>
                {SCREEN_RESOLUTIONS.map((res) => (
                  <SelectItem key={res.label} value={res.label}>
                    {res.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pixel Ratio */}
          <div className="space-y-2">
            <Label>نسبة البكسل</Label>
            <Select value={fp.pixelRatio.toString()} onValueChange={(v) => updateFp({ pixelRatio: parseFloat(v) })}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x (عادي)</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x (Retina)</SelectItem>
                <SelectItem value="3">3x</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Depth */}
          <div className="space-y-2">
            <Label>عمق الألوان</Label>
            <Select value={fp.colorDepth.toString()} onValueChange={(v) => updateFp({ colorDepth: parseInt(v) })}>
              <SelectTrigger className="bg-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24-bit</SelectItem>
                <SelectItem value="32">32-bit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Locale Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
          <Globe className="w-4 h-4" />
          الموقع واللغة
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timezone */}
          <div className="space-y-2">
            <Label>المنطقة الزمنية</Label>
            <Select value={fp.timezone} onValueChange={(v) => updateFp({ timezone: v })}>
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="اختر المنطقة" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>اللغة</Label>
            <Select 
              value={fp.language} 
              onValueChange={(v) => updateFp({ language: v, languages: [v, v.split('-')[0]] })}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="اختر اللغة" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
        <h4 className="font-medium text-sm">ملخص البصمة</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>GPU: {fp.gpu}</span>
          <span>CPU: {fp.cpu}</span>
          <span>الشاشة: {fp.screenWidth}x{fp.screenHeight}</span>
          <span>الذاكرة: {fp.deviceMemory} GB</span>
          <span>المنطقة: {fp.timezone}</span>
          <span>اللغة: {fp.language}</span>
        </div>
      </div>
    </div>
  );
}