import { 
  Users, Puzzle, Settings, Key, ChevronLeft, Download, Shield, Database, Network,
  LayoutDashboard, Calendar, ShieldCheck, Brain, User, Fingerprint, Bot, Thermometer,
  MousePointer2, Cookie, Dna
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import appLogo from '@/assets/app-logo.png';

export function Sidebar() {
  const { activeView, setActiveView, profiles, license, notifications } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const { t, isRTL } = useTranslation();

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  const menuItems = [
    { id: 'dashboard' as const, label: t('dashboard'), icon: LayoutDashboard },
    { id: 'profiles' as const, label: t('profiles'), icon: Users },
    { id: 'autonomous' as const, label: isRTL ? 'الوضع التلقائي' : 'Autonomous', icon: Bot },
    { id: 'dna' as const, label: isRTL ? 'DNA الهوية' : 'Identity DNA', icon: Dna },
    { id: 'thermal' as const, label: isRTL ? 'التحكم الحراري' : 'Thermal', icon: Thermometer },
    { id: 'behavioral' as const, label: isRTL ? 'المحاكاة' : 'Behavioral', icon: MousePointer2 },
    { id: 'session' as const, label: isRTL ? 'الجلسات' : 'Sessions', icon: Cookie },
    { id: 'aiHub' as const, label: isRTL ? 'مركز AI' : 'AI Hub', icon: Brain },
    { id: 'captcha' as const, label: isRTL ? 'حل CAPTCHA' : 'CAPTCHA Solver', icon: Bot },
    { id: 'identity' as const, label: isRTL ? 'الهويات' : 'Identity', icon: User },
    { id: 'fingerprint' as const, label: isRTL ? 'البصمة' : 'Fingerprint', icon: Fingerprint },
    { id: 'extensions' as const, label: t('extensions'), icon: Puzzle },
    { id: 'proxy' as const, label: t('proxyManager'), icon: Network },
    { id: 'schedule' as const, label: t('schedule'), icon: Calendar },
    { id: 'leakTest' as const, label: t('leakTest'), icon: ShieldCheck },
    { id: 'security' as const, label: t('security'), icon: Shield },
    { id: 'backup' as const, label: t('backup'), icon: Database },
    { id: 'settings' as const, label: t('settings'), icon: Settings },
    { id: 'license' as const, label: t('license'), icon: Key },
    { id: 'updates' as const, label: t('updates'), icon: Download },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-sidebar-border flex flex-col transition-all duration-300",
        isRTL ? "border-l" : "border-r",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden glow-effect flex-shrink-0">
            <img src={appLogo} alt="Profile Manager Pro" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg gradient-text">Profile Manager Pro</h1>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'إدارة المتصفحات الاحترافية' : 'Professional Browser Manager'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-primary/20 text-primary glow-effect" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
              {!collapsed && item.id === 'profiles' && profiles.length > 0 && (
                <span className={cn(
                  "bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full",
                  isRTL ? "mr-auto" : "ml-auto"
                )}>
                  {profiles.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* License Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "rounded-lg p-3",
          license?.status === 'active' 
            ? "bg-success/10 border border-success/20" 
            : "bg-warning/10 border border-warning/20"
        )}>
          {!collapsed ? (
            <div className="animate-fade-in">
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'حالة الترخيص' : 'License Status'}
              </p>
              <p className={cn(
                "font-semibold",
                license?.status === 'active' ? "text-success" : "text-warning"
              )}>
                {license?.status === 'active' 
                  ? (isRTL ? 'مفعّل' : 'Active') 
                  : (isRTL ? 'غير مفعّل' : 'Inactive')}
              </p>
            </div>
          ) : (
            <div className={cn(
              "w-3 h-3 rounded-full mx-auto",
              license?.status === 'active' ? "bg-success" : "bg-warning"
            )} />
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full"
        >
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform",
            collapsed && "rotate-180",
            !isRTL && "rotate-180",
            !isRTL && collapsed && "rotate-0"
          )} />
        </Button>
      </div>
    </aside>
  );
}
