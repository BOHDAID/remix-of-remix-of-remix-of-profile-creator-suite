import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Profile } from '@/types';
import { ProfileCard } from './ProfileCard';
import { CreateProfileModal } from './CreateProfileModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfilesView() {
  const { profiles } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        <Button variant="glow" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إنشاء بروفايل
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="البحث في البروفايلات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-input"
          />
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === 'grid' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
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
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profiles Grid/List */}
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
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-3"
        )}>
          {filteredProfiles.map((profile, index) => (
            <div 
              key={profile.id} 
              className="animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProfileCard profile={profile} onEdit={handleEdit} />
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
