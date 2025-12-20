import { Sidebar } from '@/components/layout/Sidebar';
import { ProfilesView } from '@/components/profiles/ProfilesView';
import { ExtensionsView } from '@/components/extensions/ExtensionsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { LicenseView } from '@/components/license/LicenseView';
import { useAppStore } from '@/stores/appStore';
import { Helmet } from 'react-helmet-async';

export default function Index() {
  const { activeView } = useAppStore();

  const renderView = () => {
    switch (activeView) {
      case 'profiles':
        return <ProfilesView />;
      case 'extensions':
        return <ExtensionsView />;
      case 'settings':
        return <SettingsView />;
      case 'license':
        return <LicenseView />;
      default:
        return <ProfilesView />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Browser Manager - إدارة المتصفحات</title>
        <meta name="description" content="تطبيق إدارة بروفايلات المتصفح مع دعم البروكسي والملحقات" />
      </Helmet>
      
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto scrollbar-thin">
          {renderView()}
        </main>
      </div>
    </>
  );
}
