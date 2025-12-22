import { Sidebar } from '@/components/layout/Sidebar';
import { TitleBar } from '@/components/layout/TitleBar';
import { ProfilesView } from '@/components/profiles/ProfilesView';
import { ExtensionsView } from '@/components/extensions/ExtensionsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { LicenseView } from '@/components/license/LicenseView';
import { UpdatesView } from '@/components/updates/UpdatesView';
import { SecurityView } from '@/components/security/SecurityView';
import { ProxyManagerView } from '@/components/proxy/ProxyManagerView';
import { BackupView } from '@/components/backup/BackupView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { LeakTestView } from '@/components/leaktest/LeakTestView';
import { AIHubView } from '@/components/ai/AIHubView';
import { IdentityGeneratorView } from '@/components/identity/IdentityGeneratorView';
import { AdvancedFingerprintView } from '@/components/fingerprint/AdvancedFingerprintView';
import { AdvancedSecurityView } from '@/components/security/AdvancedSecurityView';
import { AdvancedProxyView } from '@/components/proxy/AdvancedProxyView';
import { CollaborationView } from '@/components/collaboration/CollaborationView';
import { useAppStore } from '@/stores/appStore';
import { Helmet } from 'react-helmet-async';
import { isElectron } from '@/lib/electron';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';

export default function Index() {
  const { activeView, settings } = useAppStore();
  const { isRTL } = useTranslation();

  // Apply language direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.style.direction = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  // Apply font size
  useEffect(() => {
    const sizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
  }, [settings.fontSize]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'profiles':
        return <ProfilesView />;
      case 'extensions':
        return <ExtensionsView />;
      case 'settings':
        return <SettingsView />;
      case 'license':
        return <LicenseView />;
      case 'updates':
        return <UpdatesView />;
      case 'security':
        return <AdvancedSecurityView />;
      case 'proxy':
        return <AdvancedProxyView />;
      case 'backup':
        return <BackupView />;
      case 'schedule':
        return <ScheduleView />;
      case 'leakTest':
        return <LeakTestView />;
      case 'aiHub':
        return <AIHubView />;
      case 'identity':
        return <IdentityGeneratorView />;
      case 'fingerprint':
        return <AdvancedFingerprintView />;
      case 'collaboration':
        return <CollaborationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Browser Manager - {isRTL ? 'إدارة المتصفحات' : 'Profile Manager'}</title>
        <meta name="description" content={isRTL ? 'تطبيق إدارة بروفايلات المتصفح مع دعم البروكسي والملحقات' : 'Browser profile manager with proxy and extension support'} />
      </Helmet>
      
      <div className="flex flex-col min-h-screen bg-background">
        {isElectron() && <TitleBar />}
        <div className={`flex flex-1 overflow-hidden ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
          <Sidebar />
          <main className="flex-1 overflow-auto scrollbar-thin">
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
}
