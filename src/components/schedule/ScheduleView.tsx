import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { ProfileSchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Play,
  Pause,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAYS = [
  { value: 0, label: { ar: 'الأحد', en: 'Sunday' } },
  { value: 1, label: { ar: 'الاثنين', en: 'Monday' } },
  { value: 2, label: { ar: 'الثلاثاء', en: 'Tuesday' } },
  { value: 3, label: { ar: 'الأربعاء', en: 'Wednesday' } },
  { value: 4, label: { ar: 'الخميس', en: 'Thursday' } },
  { value: 5, label: { ar: 'الجمعة', en: 'Friday' } },
  { value: 6, label: { ar: 'السبت', en: 'Saturday' } }
];

export function ScheduleView() {
  const { profiles, schedules, addSchedule, updateSchedule, deleteSchedule } = useAppStore();
  const { isRTL } = useTranslation();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProfileSchedule | null>(null);
  
  // Form state
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'daily' | 'weekly'>('daily');
  const [time, setTime] = useState('09:00');
  const [date, setDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [duration, setDuration] = useState(60);

  const resetForm = () => {
    setSelectedProfileId('');
    setScheduleType('daily');
    setTime('09:00');
    setDate('');
    setSelectedDays([1, 2, 3, 4, 5]);
    setDuration(60);
    setEditingSchedule(null);
  };

  const handleOpenDialog = (schedule?: ProfileSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setSelectedProfileId(schedule.profileId);
      setScheduleType(schedule.type === 'custom' ? 'weekly' : schedule.type);
      setTime(schedule.time);
      setDate(schedule.date || '');
      setSelectedDays(schedule.days || [1, 2, 3, 4, 5]);
      setDuration(schedule.duration || 60);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!selectedProfileId) {
      toast.error(isRTL ? 'يرجى اختيار بروفايل' : 'Please select a profile');
      return;
    }

    if (scheduleType === 'once' && !date) {
      toast.error(isRTL ? 'يرجى تحديد التاريخ' : 'Please select a date');
      return;
    }

    if (scheduleType === 'weekly' && selectedDays.length === 0) {
      toast.error(isRTL ? 'يرجى اختيار يوم واحد على الأقل' : 'Please select at least one day');
      return;
    }

    const scheduleData: ProfileSchedule = {
      id: editingSchedule?.id || crypto.randomUUID(),
      profileId: selectedProfileId,
      enabled: true,
      type: scheduleType,
      time,
      days: scheduleType === 'weekly' ? selectedDays : undefined,
      date: scheduleType === 'once' ? date : undefined,
      duration
    };

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleData);
      toast.success(isRTL ? 'تم تحديث الجدولة' : 'Schedule updated');
    } else {
      addSchedule(scheduleData);
      toast.success(isRTL ? 'تم إضافة الجدولة' : 'Schedule added');
    }

    setShowDialog(false);
    resetForm();
  };

  const handleToggleSchedule = (id: string, enabled: boolean) => {
    updateSchedule(id, { enabled });
    toast.success(enabled 
      ? (isRTL ? 'تم تفعيل الجدولة' : 'Schedule enabled')
      : (isRTL ? 'تم إيقاف الجدولة' : 'Schedule disabled')
    );
  };

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id);
    toast.success(isRTL ? 'تم حذف الجدولة' : 'Schedule deleted');
  };

  const getProfileName = (profileId: string) => {
    return profiles.find(p => p.id === profileId)?.name || (isRTL ? 'غير معروف' : 'Unknown');
  };

  const formatScheduleTime = (schedule: ProfileSchedule) => {
    if (schedule.type === 'once') {
      return `${schedule.date} ${schedule.time}`;
    }
    if (schedule.type === 'daily') {
      return `${isRTL ? 'يومياً' : 'Daily'} @ ${schedule.time}`;
    }
    if (schedule.type === 'weekly' && schedule.days) {
      const dayNames = schedule.days
        .map(d => DAYS.find(day => day.value === d)?.label[isRTL ? 'ar' : 'en'].slice(0, 3))
        .join(', ');
      return `${dayNames} @ ${schedule.time}`;
    }
    return schedule.time;
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            {isRTL ? 'جدولة البروفايلات' : 'Profile Scheduling'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'جدولة تشغيل البروفايلات تلقائياً' : 'Schedule profiles to run automatically'}
          </p>
        </div>
        <Button variant="glow" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة جدولة' : 'Add Schedule'}
        </Button>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">
            {isRTL ? 'لا توجد جدولات' : 'No schedules yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {isRTL ? 'أنشئ جدولة لتشغيل البروفايلات تلقائياً' : 'Create a schedule to run profiles automatically'}
          </p>
          <Button variant="glow" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4" />
            {isRTL ? 'إنشاء أول جدولة' : 'Create first schedule'}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <div 
              key={schedule.id}
              className={cn(
                "glass-card rounded-xl p-5 transition-all duration-300 group",
                schedule.enabled ? "border-primary/30" : "opacity-60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    schedule.enabled ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Clock className={cn(
                      "w-6 h-6",
                      schedule.enabled ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-bold">{getProfileName(schedule.profileId)}</h3>
                    <p className="text-sm text-muted-foreground">{formatScheduleTime(schedule)}</p>
                    {schedule.duration && (
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? `مدة التشغيل: ${schedule.duration} دقيقة` : `Duration: ${schedule.duration} min`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                  />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(schedule)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowDialog(open); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {editingSchedule 
                ? (isRTL ? 'تعديل الجدولة' : 'Edit Schedule')
                : (isRTL ? 'إضافة جدولة جديدة' : 'Add New Schedule')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Profile Selection */}
            <div className="space-y-2">
              <Label>{isRTL ? 'البروفايل' : 'Profile'}</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="bg-input">
                  <SelectValue placeholder={isRTL ? 'اختر بروفايل' : 'Select profile'} />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label>{isRTL ? 'نوع الجدولة' : 'Schedule Type'}</Label>
              <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as any)}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">{isRTL ? 'مرة واحدة' : 'Once'}</SelectItem>
                  <SelectItem value="daily">{isRTL ? 'يومياً' : 'Daily'}</SelectItem>
                  <SelectItem value="weekly">{isRTL ? 'أسبوعياً' : 'Weekly'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date (for once) */}
            {scheduleType === 'once' && (
              <div className="space-y-2">
                <Label>{isRTL ? 'التاريخ' : 'Date'}</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-input"
                />
              </div>
            )}

            {/* Days (for weekly) */}
            {scheduleType === 'weekly' && (
              <div className="space-y-2">
                <Label>{isRTL ? 'الأيام' : 'Days'}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        selectedDays.includes(day.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {day.label[isRTL ? 'ar' : 'en'].slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time */}
            <div className="space-y-2">
              <Label>{isRTL ? 'الوقت' : 'Time'}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-input"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>{isRTL ? 'مدة التشغيل (بالدقائق)' : 'Duration (minutes)'}</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                min={0}
                placeholder={isRTL ? 'اتركه فارغاً للتشغيل بدون حد' : 'Leave empty for unlimited'}
                className="bg-input"
              />
              <p className="text-xs text-muted-foreground">
                {isRTL ? '0 = بدون إيقاف تلقائي' : '0 = no auto-stop'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="glow" onClick={handleSave}>
              {editingSchedule ? (isRTL ? 'حفظ' : 'Save') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
