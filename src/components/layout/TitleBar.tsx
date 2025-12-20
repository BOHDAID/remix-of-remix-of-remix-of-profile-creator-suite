import { Minus, Square, X, Globe } from 'lucide-react';
import { isElectron, getElectronAPI } from '@/lib/electron';
import { cn } from '@/lib/utils';

export function TitleBar() {
  const electronAPI = getElectronAPI();
  
  if (!isElectron()) {
    return null;
  }

  return (
    <div className="h-10 bg-card border-b border-border flex items-center justify-between select-none app-drag">
      {/* App Title */}
      <div className="flex items-center gap-2 px-4">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Browser Manager</span>
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
