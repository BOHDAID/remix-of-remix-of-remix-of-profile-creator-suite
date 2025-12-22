import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  LayoutDashboard, 
  Users, 
  Puzzle, 
  Network, 
  Clock, 
  Activity,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Bell,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export function DashboardView() {
  const { 
    profiles, 
    extensions, 
    proxyChains, 
    schedules, 
    activityLogs, 
    notifications,
    usageStats,
    license
  } = useAppStore();
  const { isRTL } = useTranslation();

  const runningProfiles = profiles.filter(p => p.status === 'running').length;
  const stoppedProfiles = profiles.filter(p => p.status === 'stopped').length;
  const enabledExtensions = extensions.filter(e => e.enabled).length;
  const activeProxies = proxyChains.filter(c => c.proxies[0]?.status === 'active').length;
  const failedProxies = proxyChains.filter(c => c.proxies[0]?.status === 'failed').length;
  const activeSchedules = schedules.filter(s => s.enabled).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Generate usage chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayStats = usageStats.filter(s => s.date === dateStr);
    return {
      name: date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'short' }),
      launches: dayStats.reduce((sum, s) => sum + s.launchCount, 0),
      runtime: Math.round(dayStats.reduce((sum, s) => sum + s.runTime, 0) / 60)
    };
  });

  // Profile status pie chart data
  const profileStatusData = [
    { name: isRTL ? 'يعمل' : 'Running', value: runningProfiles, color: 'hsl(var(--success))' },
    { name: isRTL ? 'متوقف' : 'Stopped', value: stoppedProfiles, color: 'hsl(var(--muted-foreground))' }
  ];

  // Proxy status pie chart data
  const proxyStatusData = [
    { name: isRTL ? 'نشط' : 'Active', value: activeProxies, color: 'hsl(var(--success))' },
    { name: isRTL ? 'فاشل' : 'Failed', value: failedProxies, color: 'hsl(var(--destructive))' },
    { name: isRTL ? 'غير مختبر' : 'Untested', value: proxyChains.length - activeProxies - failedProxies, color: 'hsl(var(--muted-foreground))' }
  ];

  // Recent activity
  const recentActivity = activityLogs.slice(0, 5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'profile_launch': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'profile_stop': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            {isRTL ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'نظرة عامة على نظامك' : 'Overview of your system'}
          </p>
        </div>
        {unreadNotifications > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg">
            <Bell className="w-5 h-5 text-warning" />
            <span className="text-warning font-medium">
              {unreadNotifications} {isRTL ? 'إشعار جديد' : 'new notifications'}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'البروفايلات' : 'Profiles'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{profiles.length}</span>
                  {runningProfiles > 0 && (
                    <span className="text-xs text-success">({runningProfiles} {isRTL ? 'يعمل' : 'running'})</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Puzzle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الإضافات' : 'Extensions'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{extensions.length}</span>
                  <span className="text-xs text-muted-foreground">({enabledExtensions} {isRTL ? 'مفعل' : 'enabled'})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Network className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'البروكسيات' : 'Proxies'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{proxyChains.length}</span>
                  <span className={cn("text-xs", activeProxies > 0 ? "text-success" : "text-muted-foreground")}>
                    ({activeProxies} {isRTL ? 'نشط' : 'active'})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الجدولة' : 'Schedules'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{schedules.length}</span>
                  <span className="text-xs text-muted-foreground">({activeSchedules} {isRTL ? 'نشط' : 'active'})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {isRTL ? 'نشاط الأسبوع' : 'Weekly Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorLaunches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="launches" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorLaunches)" 
                    name={isRTL ? 'التشغيلات' : 'Launches'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {isRTL ? 'حالة النظام' : 'System Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profileStatusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {profileStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {profileStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{isRTL ? 'لا يوجد نشاط حتى الآن' : 'No activity yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {getActivityIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{log.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* License Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {isRTL ? 'حالة الترخيص' : 'License Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {license ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'النوع' : 'Type'}</span>
                  <span className="font-medium capitalize">{license.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    license.status === 'active' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {license.status === 'active' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'منتهي' : 'Expired')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isRTL ? 'البروفايلات' : 'Profiles'}</span>
                  <span>{profiles.length} / {license.maxProfiles === -1 ? '∞' : license.maxProfiles}</span>
                </div>
                {license.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'ينتهي في' : 'Expires'}</span>
                    <span>{new Date(license.expiresAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                  </div>
                )}
                <Progress 
                  value={license.maxProfiles === -1 ? 0 : (profiles.length / license.maxProfiles) * 100} 
                  className="h-2"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>{isRTL ? 'لم يتم تفعيل الترخيص' : 'No license activated'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
