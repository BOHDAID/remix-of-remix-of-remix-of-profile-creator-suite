import { Minus, Square, X } from 'lucide-react';
import { isElectron, getElectronAPI } from '@/lib/electron';
import appLogo from '@/assets/app-logo.png';
import { QuickSessionsPanel } from '@/components/session/QuickSessionsPanel';

export function TitleBar() {
  const electronAPI = getElectronAPI();
  
  if (!isElectron()) {
    return null;
  }

  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between select-none app-drag">
      {/* App Title */}
      <div className="flex items-center gap-2 px-4">
        <img src={appLogo} alt="Logo" className="w-5 h-5 rounded" />
        <span className="text-sm font-semibold gradient-text">Profile Manager Pro</span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 app-no-drag">
        <QuickSessionsPanel />
      </div>

      {/* Window Controls */}
      <div className="flex app-no-drag">
        <button
          onClick={() => electronAPI?.minimizeWindow()}
          className="h-10 w-12 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => electronAPI?.maximizeWindow()}
          className="h-10 w-12 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => electronAPI?.closeWindow()}
          className="h-10 w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}