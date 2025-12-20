import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Extension } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Puzzle, 
  Trash2, 
  Edit,
  FolderOpen,
  Power,
  Upload,
  FileArchive,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isElectron, getElectronAPI } from '@/lib/electron';

export function ExtensionsView() {
  const { extensions, addExtension, updateExtension, deleteExtension } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editExtension, setEditExtension] = useState<Extension | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [path, setPath] = useState('');

  const electronAPI = getElectronAPI();

  const filteredExtensions = extensions.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (ext?: Extension) => {
    if (ext) {
      setEditExtension(ext);
      setName(ext.name);
      setDescription(ext.description);
      setPath(ext.path);
    } else {
      setEditExtension(null);
      setName('');
      setDescription('');
      setPath('');
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditExtension(null);
    setName('');
    setDescription('');
    setPath('');
  };

  const handleSelectFolder = async () => {
    if (!isElectron()) {
      toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
      return;
    }
    
    const folderPath = await electronAPI?.selectExtensionFolder();
    if (folderPath) {
      setPath(folderPath);
      // Auto-fill name from folder name
      const folderName = folderPath.split(/[/\\]/).pop() || '';
      if (!name) {
        setName(folderName);
      }
      toast.success('تم اختيار المجلد');
    }
  };

  const handleSelectZip = async () => {
    if (!isElectron()) {
      toast.error('هذه الميزة متاحة فقط في تطبيق سطح المكتب');
      return;
    }
    
    const zipPath = await electronAPI?.selectExtensionZip();
    if (zipPath) {
      toast.loading('جاري استخراج الملحق...');
      const result = await electronAPI?.extractExtensionZip(zipPath);
      
      if (result?.success && result.path) {
        setPath(result.path);
        // Auto-fill name from zip name
        const zipName = zipPath.split(/[/\\]/).pop()?.replace(/\.(zip|crx)$/i, '') || '';
        if (!name) {
          setName(zipName);
        }
        toast.success('تم استخراج الملحق بنجاح');
      } else {
        toast.error(result?.error || 'فشل استخراج الملحق');
      }
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الملحق');
      return;
    }
    if (!path.trim()) {
      toast.error('يرجى اختيار مسار الملحق');
      return;
    }

    if (editExtension) {
      updateExtension(editExtension.id, { name, description, path });
      toast.success('تم تحديث الملحق بنجاح');
    } else {
      const newExtension: Extension = {
        id: crypto.randomUUID(),
        name,
        description,
        icon: '🧩',
        enabled: true,
        path,
      };
      addExtension(newExtension);
      toast.success('تم إضافة الملحق بنجاح');
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    deleteExtension(id);
    toast.success('تم حذف الملحق بنجاح');
  };

  const toggleEnabled = (ext: Extension) => {
    updateExtension(ext.id, { enabled: !ext.enabled });
    toast.info(ext.enabled ? 'تم تعطيل الملحق' : 'تم تفعيل الملحق');
  };

  const handleOpenFolder = async (folderPath: string) => {
    if (isElectron()) {
      await electronAPI?.openFolder(folderPath);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-primary" />
            الملحقات
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة ملحقات Chromium
          </p>
        </div>
        <div className="flex gap-2">
          {isElectron() && (
            <>
              <Button variant="outline" onClick={handleSelectZip}>
                <FileArchive className="w-4 h-4 ml-2" />
                رفع ZIP
              </Button>
              <Button variant="outline" onClick={handleSelectFolder}>
                <Folder className="w-4 h-4 ml-2" />
                اختيار مجلد
              </Button>
            </>
          )}
          <Button variant="glow" onClick={() => handleOpen()}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة ملحق
          </Button>
        </div>
      </div>

      {/* Web Mode Notice */}
      {!isElectron() && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-warning font-medium">وضع المعاينة</p>
          <p className="text-sm text-muted-foreground">
            لإضافة ملحقات حقيقية، قم بتشغيل التطبيق كبرنامج سطح مكتب
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الملحقات..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-input"
        />
      </div>

      {/* Extensions Grid */}
      {filteredExtensions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Puzzle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد ملحقات'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? 'جرب البحث بكلمات مختلفة'
              : 'أضف ملحقات Chromium لاستخدامها في البروفايلات'
            }
          </p>
          {!searchQuery && (
            <div className="flex justify-center gap-2">
              {isElectron() && (
                <>
                  <Button variant="outline" onClick={handleSelectZip}>
                    <FileArchive className="w-4 h-4 ml-2" />
                    رفع ZIP
                  </Button>
                  <Button variant="outline" onClick={handleSelectFolder}>
                    <Folder className="w-4 h-4 ml-2" />
                    اختيار مجلد
                  </Button>
                </>
              )}
              <Button variant="glow" onClick={() => handleOpen()}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة يدوي
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExtensions.map((ext, index) => (
            <div 
              key={ext.id}
              className={cn(
                "glass-card rounded-xl p-5 transition-all duration-300 hover:border-primary/30 group animate-slide-in",
                !ext.enabled && "opacity-60"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                    {ext.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{ext.name}</h3>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      ext.enabled
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {ext.enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEnabled(ext)}
                    className="h-8 w-8"
                  >
                    <Power className={cn("w-4 h-4", ext.enabled && "text-success")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpen(ext)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ext.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {ext.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {ext.description}
                </p>
              )}

              <button
                onClick={() => handleOpenFolder(ext.path)}
                className="w-full flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
              >
                <FolderOpen className="w-3 h-3" />
                <span className="truncate" dir="ltr">{ext.path}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Puzzle className="w-5 h-5 text-primary" />
              {editExtension ? 'تعديل الملحق' : 'إضافة ملحق جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick Add Buttons */}
            {!editExtension && isElectron() && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSelectZip}
                  className="h-20 flex-col gap-2"
                >
                  <FileArchive className="w-6 h-6 text-primary" />
                  <span>رفع ملف ZIP/CRX</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSelectFolder}
                  className="h-20 flex-col gap-2"
                >
                  <Folder className="w-6 h-6 text-primary" />
                  <span>اختيار مجلد</span>
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="extName">اسم الملحق</Label>
              <Input
                id="extName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: uBlock Origin"
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extPath">مسار الملحق</Label>
              <div className="flex gap-2">
                <Input
                  id="extPath"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="C:\Extensions\ublock"
                  className="bg-input flex-1"
                  dir="ltr"
                />
                {isElectron() && (
                  <Button variant="outline" onClick={handleSelectFolder}>
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                مسار مجلد الملحق المستخرج على جهازك
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extDesc">الوصف (اختياري)</Label>
              <Textarea
                id="extDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر للملحق..."
                className="bg-input resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              إلغاء
            </Button>
            <Button variant="glow" onClick={handleSubmit} className="flex-1">
              {editExtension ? 'حفظ التغييرات' : 'إضافة الملحق'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
