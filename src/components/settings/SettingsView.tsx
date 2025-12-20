import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  FolderOpen, 
  Globe,
  RefreshCw,
  Minimize2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const { settings, updateSettings } = useAppStore();

  const handleSave = () => {
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground mt-1">
          إعدادات التطبيق العامة
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Chromium Path */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            مسار المتصفح
          </h2>
          <div className="space-y-2">
            <Label htmlFor="chromiumPath">مسار Chromium</Label>
            <Input
              id="chromiumPath"
              value={settings.chromiumPath}
              onChange={(e) => updateSettings({ chromiumPath: e.target.value })}
              placeholder="C:\Program Files\Chromium\chromium.exe"
              className="bg-input"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              مسار ملف تشغيل متصفح Chromium على جهازك
            </p>
          </div>
        </div>

        {/* Default User Agent */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            User Agent الافتراضي
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
              سيتم استخدامه كـ User Agent افتراضي للبروفايلات الجديدة
            </p>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">سلوك التطبيق</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="autoUpdate" className="cursor-pointer">التحديث التلقائي</Label>
                  <p className="text-xs text-muted-foreground">
                    تحديث التطبيق تلقائياً عند توفر إصدار جديد
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
                  <Label htmlFor="startMinimized" className="cursor-pointer">البدء مصغراً</Label>
                  <p className="text-xs text-muted-foreground">
                    تشغيل التطبيق مصغراً في شريط المهام
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
                  <Label htmlFor="closeToTray" className="cursor-pointer">الإغلاق إلى شريط النظام</Label>
                  <p className="text-xs text-muted-foreground">
                    تصغير التطبيق إلى شريط النظام عند الإغلاق
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
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}
