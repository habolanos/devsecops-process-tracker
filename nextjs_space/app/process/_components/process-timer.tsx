'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProcessStore } from '@/lib/store';
import { formatDuration, formatDurationLong, getTimeStatus } from '@/lib/helpers';
import { useI18n } from '@/lib/i18n-context';
import { Play, Pause, Timer, AlertTriangle } from 'lucide-react';

export default function ProcessTimer() {
  const { t } = useI18n();
  const process = useProcessStore((state) => state.process);
  const startProcessTimer = useProcessStore((state) => state.startProcessTimer);
  const pauseProcessTimer = useProcessStore((state) => state.pauseProcessTimer);
  const getElapsedTime = useProcessStore((state) => state.getElapsedTime);
  const hasStartedInteraction = useProcessStore((state) => state.hasStartedInteraction);
  
  const [displayTime, setDisplayTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const hasAutoStarted = useRef(false);

  const timeTracking = process?.timeTracking;
  const estimatedTime = process?.estimatedTime;
  const status = timeTracking?.status || 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const sessionsCount = timeTracking?.sessions?.length || 0;

  // Calculate time status for semaphore colors
  const timeStatus = getTimeStatus(displayTime, estimatedTime || 0);
  const hasEstimate = !!estimatedTime && estimatedTime > 0;

  // Color configurations based on time status
  const getStatusColors = () => {
    if (!hasEstimate) {
      // No estimate: use default colors based on running state
      if (isRunning) return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' };
      if (isPaused) return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' };
      return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' };
    }
    
    // With estimate: use semaphore colors
    switch (timeStatus) {
      case 'on-time':
        return { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' };
      case 'warning':
        return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' };
      case 'exceeded':
        return { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' };
    }
  };

  const colors = getStatusColors();

  // Get status message
  const getStatusMessage = () => {
    if (!hasEstimate) {
      if (isRunning) return t('timer.running');
      if (isPaused) return t('timer.paused');
      return t('timer.idle');
    }

    const percentage = Math.round((displayTime / estimatedTime!) * 100);
    
    switch (timeStatus) {
      case 'on-time':
        return `${t('timer.onTime')} (${percentage}%)`;
      case 'warning':
        return `${t('timer.warning')} (${percentage}%)`;
      case 'exceeded':
        const exceededMs = displayTime - estimatedTime!;
        return `${t('timer.exceeded')} +${formatDurationLong(exceededMs)}`;
      default:
        return t('timer.idle');
    }
  };

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-start timer on first interaction (only once)
  useEffect(() => {
    if (isClient && hasStartedInteraction && !hasAutoStarted.current && (isIdle || isPaused)) {
      hasAutoStarted.current = true;
      startProcessTimer();
    }
  }, [isClient, hasStartedInteraction, isIdle, isPaused, startProcessTimer]);

  // Update display time
  const updateDisplayTime = useCallback(() => {
    setDisplayTime(getElapsedTime());
  }, [getElapsedTime]);

  // Timer interval for running state
  useEffect(() => {
    if (!isClient) return;
    
    updateDisplayTime();
    
    if (isRunning) {
      const interval = setInterval(updateDisplayTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isClient, isRunning, updateDisplayTime]);

  const handleStart = () => {
    startProcessTimer();
  };

  const handlePause = () => {
    pauseProcessTimer();
  };

  if (!isClient || !process) return null;

  // Build tooltip text for estimated time
  const tooltipText = hasEstimate 
    ? `${t('timer.estimated')}: ${formatDurationLong(estimatedTime!)}` 
    : '';

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
        timeStatus === 'exceeded' && hasEstimate
          ? 'bg-red-50 border-red-200'
          : timeStatus === 'warning' && hasEstimate
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-gray-50 border-gray-200'
      }`}
      title={tooltipText}
    >
      {/* Timer Icon and Display */}
      <div className={`p-1 rounded-full ${colors.bg} ${
        isRunning ? 'animate-pulse' : ''
      }`}>
        {timeStatus === 'exceeded' && hasEstimate ? (
          <AlertTriangle className={`w-3.5 h-3.5 ${colors.icon}`} />
        ) : (
          <Timer className={`w-3.5 h-3.5 ${colors.icon}`} />
        )}
      </div>
      
      <div className="flex flex-col leading-tight">
        <span className={`font-mono text-base font-bold ${colors.text}`}>
          {formatDuration(displayTime)}
        </span>
        <span className={`text-[10px] ${
          timeStatus === 'exceeded' && hasEstimate 
            ? 'text-red-600 font-medium' 
            : timeStatus === 'warning' && hasEstimate
              ? 'text-yellow-600'
              : 'text-gray-400'
        }`}>
          {getStatusMessage()}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center">
        {(isIdle || isPaused) && (
          <button
            onClick={handleStart}
            className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
            title={isIdle ? t('timer.start') : t('timer.resume')}
          >
            <Play className="w-3 h-3" />
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium transition-colors"
            title={t('timer.pause')}
          >
            <Pause className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
