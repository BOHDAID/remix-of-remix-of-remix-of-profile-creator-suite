import { useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Profile } from '@/types';
import { ProfileCard } from './ProfileCard';
import { CreateProfileModal } from './CreateProfileModal';
import { ProfileTableView } from './ProfileTableView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { HorizontalScrollActions } from '@/components/ui/horizontal-scroll-actions';
import { 
  Plus, Search, Users, LayoutGrid, List, Play, Square, 
  CheckSquare, XSquare, Loader2, Grid3X3, Minimize2, 
  Maximize2, Monitor, Download, Upload, Copy, Table2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { checkLicenseStatus } from '@/lib/licenseUtils';

export function ProfilesView() {
  const { profiles, updateProfile, addProfile, deleteProfile, extensions, settings, license, setActiveView } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [launchingBatch, setLaunchingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const electronAPI = getElectronAPI();
  const licenseCheck = checkLicenseStatus(license, profiles.length);

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (profile: Profile) => {
    setEditProfile(profile);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditProfile(null);
  };

  const toggleProfileSelection = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const selectAll = () => {
    const stoppedProfiles = filteredProfiles.filter(p => p.status === 'stopped');
    setSelectedProfiles(new Set(stoppedProfiles.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedProfiles(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedProfiles(new Set());
    }
  };

  const launchSelectedProfiles = async () => {
    if (selectedProfiles.size === 0) {
      toast.error('يرجى اختيار بروفايلات للتشغيل');
      return;
    }

    if (!licenseCheck.canRun) {
      toast.error(licenseCheck.message, {
        action: {
          label: 'تفعيل الترخيص',
          onClick: () => setActiveView('license'),
        },
      });
      return;
    }

    if (!isElectron()) {
      toast.error('تشغيل المتصفح متاح فقط في تطبيق سطح المكتب');
      return;
    }

    if (!settings.chromiumPath) {
      toast.error('يرجى تحديد مسار Chromium في الإعدادات أولاً');
      return;
    }

    setLaunchingBatch(true);
    let successCount = 0;
    let failCount = 0;

    for (const profileId of selectedProfiles) {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile || profile.status === 'running') continue;

      try {
        // Get extension paths based on profile's individual setting
        const shouldLoadExtensions = profile.autoLoadExtensions ?? true;
        const profileExtensions = shouldLoadExtensions
          ? extensions.filter(e => profile.extensions.includes(e.id) && e.enabled).map(e => e.path)
          : [];

        const result = await electronAPI?.launchProfile({
          chromiumPath: settings.chromiumPath,
          proxy: profile.proxy,
          extensions: profileExtensions,
          userAgent: profile.userAgent || settings.defaultUserAgent,
          profileId: profile.id,
          fingerprint: profile.fingerprint
        });

        if (result?.success) {
          updateProfile(profile.id, { status: 'running' });
          successCount++;
        } else {
          failCount++;
        }

        // Small delay between launches
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
      }
    }

    setLaunchingBatch(false);
    setSelectedProfiles(new Set());
    setIsSelectionMode(false);

    if (successCount > 0) {
      toast.success(`تم تشغيل ${successCount} بروفايل بنجاح`);
    }
    if (failCount > 0) {
      toast.error(`فشل تشغيل ${failCount} بروفايل`);
    }
  };

  const stopSelectedProfiles = async () => {
    if (selectedProfiles.size === 0) return;

    let successCount = 0;

    for (const profileId of selectedProfiles) {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile || profile.status === 'stopped') continue;

      try {
        const result = await electronAPI?.stopProfile(profile.id);
        if (result?.success) {
          updateProfile(profile.id, { status: 'stopped' });
          successCount++;
        }
      } catch (error) {
        // Continue with others
      }
    }

    setSelectedProfiles(new Set());
    if (successCount > 0) {
      toast.success(`تم إيقاف ${successCount} بروفايل`);
    }
  };

  const runningSelectedCount = Array.from(selectedProfiles).filter(id => 
    profiles.find(p => p.id === id)?.status === 'running'
  ).length;

  const stoppedSelectedCount = selectedProfiles.size - runningSelectedCount;

  // Count all running profiles
  const runningProfiles = profiles.filter(p => p.status === 'running');
  const runningCount = runningProfiles.length;

  // Window management functions
  const handleTileWindows = async (layout: 'grid' | 'horizontal' | 'vertical') => {
    if (!isElectron()) {
      toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
      return;
    }
    try {
      const result = await electronAPI?.tileProfileWindows(layout);
      if (result?.success) {
        toast.success('تم ترتيب النوافذ');
      } else {
        toast.error(result?.error || 'فشل ترتيب النوافذ');
      }
    } catch {
      toast.error('حدث خطأ أثناء ترتيب النوافذ');
    }
  };

  const handleMinimizeAll = async () => {
    if (!isElectron()) {
      toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
      return;
    }
    try {
      await electronAPI?.minimizeAllProfiles();
      toast.success('تم تصغير جميع النوافذ');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleRestoreAll = async () => {
    if (!isElectron()) {
      toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
      return;
    }
    try {
      await electronAPI?.restoreAllProfiles();
      toast.success('تم استعادة جميع النوافذ');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  // Clone profile
  const handleCloneProfile = (profile: Profile) => {
    const clonedProfile: Profile = {
      ...profile,
      id: crypto.randomUUID(),
      name: `${profile.name} (نسخة)`,
      status: 'stopped',
      createdAt: new Date()
    };
    addProfile(clonedProfile);
    toast.success('تم استنساخ البروفايل بنجاح');
  };

  // Export profiles
  const handleExportProfiles = () => {
    const profilesToExport = selectedProfiles.size > 0
      ? profiles.filter(p => selectedProfiles.has(p.id))
      : profiles;
    
    if (profilesToExport.length === 0) {
      toast.error('لا توجد بروفايلات للتصدير');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      profiles: profilesToExport.map(p => ({
        ...p,
        status: 'stopped', // Always export as stopped
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profiles-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`تم تصدير ${profilesToExport.length} بروفايل`);
  };

  // Import profiles
  const handleImportProfiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.profiles || !Array.isArray(data.profiles)) {
          toast.error('ملف غير صالح');
          return;
        }

        let importedCount = 0;
        for (const profileData of data.profiles) {
          const newProfile: Profile = {
            ...profileData,
            id: crypto.randomUUID(), // New ID to avoid conflicts
            status: 'stopped',
            createdAt: new Date()
          };
          addProfile(newProfile);
          importedCount++;
        }

        toast.success(`تم استيراد ${importedCount} بروفايل`);
      } catch (error) {
        toast.error('فشل قراءة الملف');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            البروفايلات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتشغيل بروفايلات المتصفح
          </p>
        </div>
        <HorizontalScrollActions className="py-1">
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportProfiles}
            className="hidden"
          />

          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 ml-2" />
            استيراد
          </Button>
          <Button variant="outline" onClick={handleExportProfiles}>
            <Download className="w-4 h-4 ml-2" />
            تصدير {selectedProfiles.size > 0 ? `(${selectedProfiles.size})` : ''}
          </Button>
          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            onClick={toggleSelectionMode}
          >
            <CheckSquare className="w-4 h-4 ml-2" />
            {isSelectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}
          </Button>
          <Button variant="glow" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إنشاء بروفايل
          </Button>
        </HorizontalScrollActions>
      </div>

      {/* Selection Actions Bar */}
      {isSelectionMode && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
          <span className="text-sm font-medium">
            تم تحديد {selectedProfiles.size} بروفايل
          </span>
          <div className="flex gap-2 mr-auto">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              <CheckSquare className="w-4 h-4 ml-1" />
              تحديد الكل
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              <XSquare className="w-4 h-4 ml-1" />
              إلغاء الكل
            </Button>
          </div>
          <div className="flex gap-2">
            {stoppedSelectedCount > 0 && (
              <Button 
                variant="glow" 
                size="sm" 
                onClick={launchSelectedProfiles}
                disabled={launchingBatch || !licenseCheck.canRun}
              >
                {launchingBatch ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 ml-1" />
                )}
                تشغيل ({stoppedSelectedCount})
              </Button>
            )}
            {runningSelectedCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopSelectedProfiles}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Square className="w-4 h-4 ml-1" />
                إيقاف ({runningSelectedCount})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filters with Window Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في البروفايلات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-input"
          />
        </div>
        
        {/* Window Controls - Only show when profiles are running */}
        {runningCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
            <Monitor className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">{runningCount}</span>
            <div className="w-px h-4 bg-success/30" />
            <button
              onClick={() => handleTileWindows('grid')}
              className="p-1.5 rounded hover:bg-success/20 transition-colors"
              title="ترتيب شبكي"
            >
              <Grid3X3 className="w-4 h-4 text-success" />
            </button>
            <button
              onClick={() => handleTileWindows('horizontal')}
              className="p-1.5 rounded hover:bg-success/20 transition-colors"
              title="ترتيب أفقي"
            >
              <LayoutGrid className="w-4 h-4 text-success" />
            </button>
            <button
              onClick={handleMinimizeAll}
              className="p-1.5 rounded hover:bg-success/20 transition-colors"
              title="تصغير الكل"
            >
              <Minimize2 className="w-4 h-4 text-success" />
            </button>
            <button
              onClick={handleRestoreAll}
              className="p-1.5 rounded hover:bg-success/20 transition-colors"
              title="استعادة الكل"
            >
              <Maximize2 className="w-4 h-4 text-success" />
            </button>
          </div>
        )}

        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'table' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title="جدول متقدم"
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'grid' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title="شبكة"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'list' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            title="قائمة"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profiles Display */}
      {filteredProfiles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد بروفايلات'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? 'جرب البحث بكلمات مختلفة'
              : 'أنشئ بروفايلك الأول للبدء'
            }
          </p>
          {!searchQuery && (
            <Button variant="glow" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بروفايل
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ProfileTableView 
          profiles={filteredProfiles}
          onEdit={handleEdit}
          onDelete={(profile) => {
            deleteProfile(profile.id);
            toast.success(`تم حذف ${profile.name}`);
          }}
          searchQuery={searchQuery}
        />
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-3"
        )}>
          {filteredProfiles.map((profile, index) => (
            <div 
              key={profile.id} 
              className="animate-slide-in relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isSelectionMode && (
                <div 
                  className="absolute top-3 right-3 z-10 cursor-pointer"
                  onClick={() => toggleProfileSelection(profile.id)}
                >
                  <Checkbox 
                    checked={selectedProfiles.has(profile.id)}
                    className="h-5 w-5 border-2"
                  />
                </div>
              )}
              <div 
                className={cn(
                  isSelectionMode && "cursor-pointer",
                  isSelectionMode && selectedProfiles.has(profile.id) && "ring-2 ring-primary rounded-xl"
                )}
                onClick={isSelectionMode ? () => toggleProfileSelection(profile.id) : undefined}
              >
                <ProfileCard profile={profile} onEdit={handleEdit} onClone={handleCloneProfile} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateProfileModal
        open={showModal}
        onClose={handleClose}
        editProfile={editProfile}
      />
    </div>
  );
}