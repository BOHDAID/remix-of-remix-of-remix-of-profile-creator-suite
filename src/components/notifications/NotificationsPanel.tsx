import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationsPanel() {
  const { notifications, markNotificationRead, clearNotifications } = useAppStore();
  const { isRTL } = useTranslation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'error': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'proxy': return 'bg-warning/20 text-warning';
      case 'profile': return 'bg-primary/20 text-primary';
      case 'schedule': return 'bg-success/20 text-success';
      case 'security': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
    toast.success(isRTL ? 'تم قراءة جميع الإشعارات' : 'All notifications marked as read');
  };

  if (notifications.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{isRTL ? 'الإشعارات' : 'Notifications'}</h2>
        </div>
        <div className="text-center py-12 glass-card rounded-xl">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">{isRTL ? 'لا توجد إشعارات' : 'No notifications'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">{isRTL ? 'الإشعارات' : 'Notifications'}</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4" />
              {isRTL ? 'قراءة الكل' : 'Mark all read'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearNotifications}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            {isRTL ? 'مسح الكل' : 'Clear all'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => markNotificationRead(notification.id)}
            className={cn(
              "glass-card rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/30",
              !notification.read && "border-primary/50 bg-primary/5"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn("font-medium", !notification.read && "font-bold")}>
                    {notification.title}
                  </h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", getCategoryColor(notification.category))}>
                    {notification.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
