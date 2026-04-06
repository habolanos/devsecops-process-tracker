'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSessionStore } from '@/lib/session-store';
import { useProcessStore } from '@/lib/store';
import { Play, Pause, CheckCircle2, XCircle, X, MoreHorizontal } from 'lucide-react';
import { ProcessTrayStatus } from '@/lib/session-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ProcessTabsProps {
  language?: 'es' | 'en';
  maxVisibleTabs?: number;
}

const STATUS_CONFIG: Record<ProcessTrayStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  active: { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { icon: Pause, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  completed: { icon: CheckCircle2, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export function ProcessTabs({ language = 'es', maxVisibleTabs = 4 }: ProcessTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Optimized selectors to prevent unnecessary re-renders
  const processes = useSessionStore((state) => state.processes);
  const activeTrayId = useSessionStore((state) => state.activeTrayId);
  const switchToProcess = useSessionStore((state) => state.switchToProcess);
  const removeFromTray = useSessionStore((state) => state.removeFromTray);
  const updateSnapshot = useSessionStore((state) => state.updateSnapshot);
  const loadProcess = useProcessStore((state) => state.loadProcess);

  if (processes.length === 0) return null;

  const visibleProcesses = processes.slice(0, maxVisibleTabs);
  const overflowProcesses = processes.slice(maxVisibleTabs);

  const handleSwitchProcess = (trayId: string) => {
    const currentProcess = useProcessStore.getState().process;
    if (currentProcess && activeTrayId) {
      updateSnapshot(activeTrayId, currentProcess);
    }

    const snapshot = switchToProcess(trayId);
    if (snapshot) {
      loadProcess(snapshot);
      toast.success(language === 'es' ? 'Proceso reanudado' : 'Process resumed');
      if (pathname !== '/process') {
        router.push('/process');
      }
    }
  };

  const handleCloseTab = (e: React.MouseEvent, trayId: string) => {
    e.stopPropagation();
    removeFromTray(trayId);
    toast.success(language === 'es' ? 'Proceso removido' : 'Process removed');
  };

  const renderTab = (process: typeof processes[0], isOverflow = false) => {
    const config = STATUS_CONFIG[process.status];
    const StatusIcon = config.icon;
    const isActive = process.trayId === activeTrayId;

    if (isOverflow) {
      return (
        <DropdownMenuItem
          key={process.trayId}
          onClick={() => handleSwitchProcess(process.trayId)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-3 h-3 ${config.color}`} />
          </div>
          <span className="truncate max-w-[150px]">{process.processName}</span>
          <span className="text-xs text-muted-foreground ml-auto">{Math.round(process.snapshot.progress * 100)}%</span>
        </DropdownMenuItem>
      );
    }

    return (
      <button
        key={process.trayId}
        onClick={() => handleSwitchProcess(process.trayId)}
        className={`
          group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-x border-t
          transition-all duration-150 max-w-[180px] min-w-[100px]
          ${isActive 
            ? 'bg-background border-border shadow-sm z-10' 
            : 'bg-secondary border-border hover:bg-accent'
          }
        `}
      >
        <div className={`w-5 h-5 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <StatusIcon className={`w-3 h-3 ${config.color}`} />
        </div>
        
        <span className={`text-sm truncate ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {process.processName}
        </span>

        <div
          onClick={(e) => handleCloseTab(e, process.trayId)}
          className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 rounded hover:bg-accent transition-opacity cursor-pointer"
          title={language === 'es' ? 'Cerrar' : 'Close'}
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              process.status === 'completed' ? 'bg-blue-500' :
              process.status === 'active' ? 'bg-green-500' :
              process.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${process.snapshot.progress * 100}%` }}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex items-end gap-1 overflow-x-auto">
        {visibleProcesses.map(p => renderTab(p))}
      
      {overflowProcesses.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-xs font-medium">+{overflowProcesses.length}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {overflowProcesses.map(p => renderTab(p, true))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      </div>
    </div>
  );
}
