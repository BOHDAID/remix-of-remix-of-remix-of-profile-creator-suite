import { 
  Users, 
  Puzzle, 
  Settings, 
  Key,
  ChevronLeft,
  Globe,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const menuItems = [
  { id: 'profiles', label: 'البروفايلات', icon: Users },
  { id: 'extensions', label: 'الملحقات', icon: Puzzle },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'license', label: 'الترخيص', icon: Key },
  { id: 'updates', label: 'التحديثات', icon: Download },
] as const;

export function Sidebar() {
  const { activeView, setActiveView, profiles, license } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-l border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-effect">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg gradient-text">Browser Manager</h1>
              <p className="text-xs text-muted-foreground">إدارة المتصفحات</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
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
                <span className="mr-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
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
              <p className="text-xs text-muted-foreground">حالة الترخيص</p>
              <p className={cn(
                "font-semibold",
                license?.status === 'active' ? "text-success" : "text-warning"
              )}>
                {license?.status === 'active' ? 'مفعّل' : 'غير مفعّل'}
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
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>
    </aside>
  );
}
