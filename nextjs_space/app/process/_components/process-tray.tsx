'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  LayoutList,
  Clock,
  MoreVertical,
  RefreshCw,
  Trash2,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useSessionStore,
  ProcessTrayItem,
  ProcessTrayStatus,
} from '@/lib/session-store';
import { formatDuration } from '@/lib/helpers';
import { cn } from '@/lib/utils';

// ============================================
// Status Configuration
// ============================================

const statusConfig: Record<
  ProcessTrayStatus,
  {
    icon: typeof Play;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    labelEn: string;
  }
> = {
  active: {
    icon: Play,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Activo',
    labelEn: 'Active',
  },
  paused: {
    icon: Pause,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'En Pausa',
    labelEn: 'Paused',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Completado',
    labelEn: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Cancelado',
    labelEn: 'Cancelled',
  },
};

// ============================================
// Process Tray Component
// ============================================

interface ProcessTrayProps {
  onSwitchProcess: (trayId: string) => void;
  onExportProcess: (trayId: string) => void;
  language?: 'es' | 'en';
}

export function ProcessTray({
  onSwitchProcess,
  onExportProcess,
  language = 'es',
}: ProcessTrayProps) {
  const [open, setOpen] = useState(false);
  const { processes, activeTrayId, cancelProcess, removeFromTray } =
    useSessionStore();

  const processCount = processes.length;
  const activeCount = processes.filter(
    (p) => p.status === 'active' || p.status === 'paused'
  ).length;

  const handleSwitch = (trayId: string) => {
    onSwitchProcess(trayId);
    setOpen(false);
  };

  const handleExport = (trayId: string) => {
    onExportProcess(trayId);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-6 right-6 z-50 h-12 px-4 shadow-lg hover:shadow-xl transition-all rounded-full bg-white"
          data-testid="process-tray-trigger"
        >
          <LayoutList className="w-5 h-5 mr-2" />
          <span className="font-medium">
            {language === 'es' ? 'Procesos' : 'Processes'}
          </span>
          {processCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-100 text-blue-700"
            >
              {activeCount}/{processCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutList className="w-5 h-5" />
            {language === 'es' ? 'Procesos de Sesión' : 'Session Processes'}
            <Badge variant="outline" className="ml-auto">
              {processCount}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          {processes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <LayoutList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>
                {language === 'es'
                  ? 'No hay procesos en esta sesión'
                  : 'No processes in this session'}
              </p>
            </div>
          ) : (
            processes.map((item) => (
              <ProcessTrayItemCard
                key={item.trayId}
                item={item}
                isActive={item.trayId === activeTrayId}
                language={language}
                onSwitch={() => handleSwitch(item.trayId)}
                onCancel={() => cancelProcess(item.trayId)}
                onRemove={() => removeFromTray(item.trayId)}
                onExport={() => handleExport(item.trayId)}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// Process Tray Item Card
// ============================================

interface ProcessTrayItemCardProps {
  item: ProcessTrayItem;
  isActive: boolean;
  language: 'es' | 'en';
  onSwitch: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onExport: () => void;
}

function ProcessTrayItemCard({
  item,
  isActive,
  language,
  onSwitch,
  onCancel,
  onRemove,
  onExport,
}: ProcessTrayItemCardProps) {
  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  const canResume = item.status === 'paused';
  const canCancel = item.status === 'active' || item.status === 'paused';
  // `canRemove` intentionally excludes `isActive` on top of the status
  // check. Today `completeProcess` / `cancelProcess` always null out
  // `activeTrayId`, so any item with status `completed` or `cancelled`
  // is also non-active. We still gate on `!isActive` here so that if
  // that coupling is ever loosened the Remove option remains disabled
  // for the process the user is currently working on. The store-level
  // guard in `removeFromTray` is the authoritative invariant.
  const canRemove =
    !isActive && (item.status === 'completed' || item.status === 'cancelled');
  const canExport = item.status === 'completed';

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all',
        config.bgColor,
        config.borderColor,
        isActive && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      data-testid={`tray-item-${item.trayId}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-5 h-5', config.color)} />
          <h4 className="font-semibold text-gray-900 truncate max-w-[220px]">
            {item.processName}
          </h4>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canResume && (
              <DropdownMenuItem onClick={onSwitch}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Reanudar' : 'Resume'}
              </DropdownMenuItem>
            )}
            {canExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Exportar' : 'Export'}
              </DropdownMenuItem>
            )}
            {canCancel && (
              <DropdownMenuItem onClick={onCancel} className="text-red-600">
                <XCircle className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </DropdownMenuItem>
            )}
            {canRemove && (
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Eliminar' : 'Remove'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className={cn('font-medium', config.color)}>
            {language === 'es' ? config.label : config.labelEn}
          </span>
          <span className="text-gray-600">{item.progress}%</span>
        </div>
        <Progress value={item.progress} className="h-2" />
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{formatDuration(item.totalActiveTime)}</span>
      </div>

      {/* Action button */}
      {canResume && (
        <Button
          onClick={onSwitch}
          size="sm"
          className="w-full mt-3"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {language === 'es' ? 'Reanudar Proceso' : 'Resume Process'}
        </Button>
      )}
    </div>
  );
}

export default ProcessTray;
