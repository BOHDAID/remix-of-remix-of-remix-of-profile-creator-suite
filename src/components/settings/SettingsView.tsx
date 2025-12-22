import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  FolderOpen, 
  Globe,
  RefreshCw,
  Minimize2,
  X,
  AlertCircle,
  Languages,
  Palette,
  Type,
  Puzzle
} from 'lucide-react';
import { toast } from 'sonner';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { useTranslation } from '@/hooks/useTranslation';

export function SettingsView() {
  const { settings, updateSettings } = useAppStore();
  const electronAPI = getElectronAPI();
  const { t, isRTL } = useTranslation();

  const handleSelectChromiumPath = async () => {
    if (!isElectron()) {
      toast.error(isRTL ? 'هذه الميزة متاحة فقط في تطبيق سطح المكتب' : 'This feature is only available in desktop app');
      return;
    }

    const chromiumPath = await electronAPI?.selectChromiumPath();
    if (chromiumPath) {
      updateSettings({ chromiumPath });
      toast.success(isRTL ? 'تم تحديد مسار Chromium' : 'Chromium path selected');
    }
  };

  const handleSave = () => {
    toast.success(t('settingsSaved'));
  };

  const handleLanguageChange = (value: 'ar' | 'en') => {
    updateSettings({ language: value });
    // Update document direction
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
    document.body.style.direction = value === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          {t('settingsTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('settingsDesc')}
        </p>
      </div>

      {/* Web Mode Notice */}
      {!isElectron() && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-warning font-medium">{t('previewMode')}</p>
            <p className="text-sm text-muted-foreground">
              {t('previewModeDesc')}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Language Settings */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Languages className="w-5 h-5 text-primary" />
            {t('language')}
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('languageDesc')}</Label>
              <Select value={settings.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">
                    <span className="flex items-center gap-2">
                      🇸🇦 {t('arabic')}
                    </span>
                  </SelectItem>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">
                      🇺🇸 {t('english')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {t('theme')}
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('themeDesc')}</Label>
              <Select value={settings.theme} onValueChange={(value: 'dark' | 'light' | 'system') => updateSettings({ theme: value })}>
                <SelectTrigger className="w-full bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t('darkTheme')}</SelectItem>
                  <SelectItem value="light">{t('lightTheme')}</SelectItem>
                  <SelectItem value="system">{t('systemTheme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Font Size Settings */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            {t('fontSize')}
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('fontSizeDesc')}</Label>
              <Select value={settings.fontSize} onValueChange={(value: 'small' | 'medium' | 'large' | 'xlarge') => updateSettings({ fontSize: value })}>
                <SelectTrigger className="w-full bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t('fontSmall')}</SelectItem>
                  <SelectItem value="medium">{t('fontMedium')}</SelectItem>
                  <SelectItem value="large">{t('fontLarge')}</SelectItem>
                  <SelectItem value="xlarge">{t('fontExtraLarge')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Chromium Path */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {t('browserPath')}
          </h2>
          <div className="space-y-2">
            <Label htmlFor="chromiumPath">{t('chromiumPath')}</Label>
            <div className="flex gap-2">
              <Input
                id="chromiumPath"
                value={settings.chromiumPath}
                onChange={(e) => updateSettings({ chromiumPath: e.target.value })}
                placeholder="C:\Program Files\Chromium\chromium.exe"
                className="bg-input flex-1"
                dir="ltr"
              />
              {isElectron() && (
                <Button variant="outline" onClick={handleSelectChromiumPath}>
                  <FolderOpen className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مسار ملف تشغيل متصفح Chromium على جهازك' : 'Path to Chromium executable on your device'}
            </p>
          </div>

          {/* Common Chromium Paths */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t('commonPaths')}</p>
            <div className="flex flex-wrap gap-2">
              {[
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files\\Chromium\\Application\\chrome.exe',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => updateSettings({ chromiumPath: p })}
                  className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
                  dir="ltr"
                >
                  {p.split('\\').pop()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Default User Agent */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t('defaultUserAgent')}
          </h2>
          <div className="space-y-2">
            <Textarea
              value={settings.defaultUserAgent}
              onChange={(e) => updateSettings({ defaultUserAgent: e.target.value })}
              className="bg-input resize-none font-mono text-sm"
              rows={3}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'سيتم استخدامه كـ User Agent افتراضي للبروفايلات الجديدة' : 'Will be used as default User Agent for new profiles'}
            </p>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{t('appBehavior')}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Puzzle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="autoLoadExtensions" className="cursor-pointer">
                    {isRTL ? 'تشغيل الإضافات تلقائياً' : 'Auto-load Extensions'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'تشغيل الإضافات المحددة تلقائياً عند فتح البروفايل' : 'Automatically load extensions when profile starts'}
                  </p>
                </div>
              </div>
              <Switch
                id="autoLoadExtensions"
                checked={settings.autoLoadExtensions}
                onCheckedChange={(checked) => updateSettings({ autoLoadExtensions: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="autoUpdate" className="cursor-pointer">{t('autoUpdate')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('autoUpdateDesc')}
                  </p>
                </div>
              </div>
              <Switch
                id="autoUpdate"
                checked={settings.autoUpdate}
                onCheckedChange={(checked) => updateSettings({ autoUpdate: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Minimize2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="startMinimized" className="cursor-pointer">{t('startMinimized')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('startMinimizedDesc')}
                  </p>
                </div>
              </div>
              <Switch
                id="startMinimized"
                checked={settings.startMinimized}
                onCheckedChange={(checked) => updateSettings({ startMinimized: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="closeToTray" className="cursor-pointer">{t('closeToTray')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('closeToTrayDesc')}
                  </p>
                </div>
              </div>
              <Switch
                id="closeToTray"
                checked={settings.closeToTray}
                onCheckedChange={(checked) => updateSettings({ closeToTray: checked })}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button variant="glow" onClick={handleSave} className="w-full">
          {t('saveSettings')}
        </Button>
      </div>
    </div>
  );
}
