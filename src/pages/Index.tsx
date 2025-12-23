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
import { AutonomousModeView } from '@/components/autonomous/AutonomousModeView';
import { ThermalControlView } from '@/components/thermal/ThermalControlView';
import { BehavioralSimulationView } from '@/components/behavioral/BehavioralSimulationView';
import { SessionManagerView } from '@/components/session/SessionManagerView';
import { IdentityDNAView } from '@/components/dna/IdentityDNAView';
import { QuickSessionsPanel } from '@/components/session/QuickSessionsPanel';
import { CaptchaSolverView } from '@/components/captcha/CaptchaSolverView';
import { VisionMonitorView } from '@/components/vision/VisionMonitorView';
import { useAppStore } from '@/stores/appStore';
import { Helmet } from 'react-helmet-async';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function Index() {
  const { activeView, settings, updateProfile, profiles } = useAppStore();
  const { isRTL } = useTranslation();
  const electronAPI = getElectronAPI();
  
  // Use refs to avoid re-registering listeners on every profiles change
  const profilesRef = useRef(profiles);
  const updateProfileRef = useRef(updateProfile);
  
  // Keep refs updated
  useEffect(() => {
    profilesRef.current = profiles;
    updateProfileRef.current = updateProfile;
  }, [profiles, updateProfile]);

  // Listen for profile-closed event from Electron (when browser is closed manually)
  useEffect(() => {
    if (!isElectron() || !electronAPI) return;

    const handleProfileClosed = (profileId: string) => {
      // Use refs to get latest values
      const currentProfiles = profilesRef.current;
      const profile = currentProfiles.find(p => p.id === profileId);
      if (profile && profile.status === 'running') {
        updateProfileRef.current(profileId, { status: 'stopped' });
        toast.info(`تم إغلاق المتصفح: ${profile.name}`);
      }
    };

    // Subscribe to profile closed events - only once
    electronAPI.onProfileClosed(handleProfileClosed);
  }, [electronAPI]); // Only depend on electronAPI

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.style.direction = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  useEffect(() => {
    const sizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
    document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
  }, [settings.fontSize]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'profiles': return <ProfilesView />;
      case 'extensions': return <ExtensionsView />;
      case 'settings': return <SettingsView />;
      case 'license': return <LicenseView />;
      case 'updates': return <UpdatesView />;
      case 'security': return <AdvancedSecurityView />;
      case 'proxy': return <AdvancedProxyView />;
      case 'backup': return <BackupView />;
      case 'schedule': return <ScheduleView />;
      case 'leakTest': return <LeakTestView />;
      case 'aiHub': return <AIHubView />;
      case 'vision': return <VisionMonitorView />;
      case 'captcha': return <CaptchaSolverView />;
      case 'identity': return <IdentityGeneratorView />;
      case 'fingerprint': return <AdvancedFingerprintView />;
      case 'autonomous': return <AutonomousModeView />;
      case 'thermal': return <ThermalControlView />;
      case 'behavioral': return <BehavioralSimulationView />;
      case 'session': return <SessionManagerView />;
      case 'dna': return <IdentityDNAView />;
      default: return <DashboardView />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Manager Pro - {isRTL ? 'إدارة المتصفحات الاحترافية' : 'Professional Browser Manager'}</title>
        <meta name="description" content={isRTL ? 'تطبيق احترافي لإدارة بروفايلات المتصفح مع دعم البروكسي وتزوير البصمة الرقمية' : 'Professional browser profile manager with proxy and fingerprint spoofing support'} />
      </Helmet>
      
      <div className="flex flex-col min-h-screen bg-background">
        {isElectron() && <TitleBar />}
        
        {/* Quick Sessions Button - Always visible */}
        {!isElectron() && (
          <div className="fixed top-4 left-4 z-50">
            <QuickSessionsPanel />
          </div>
        )}
        
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
