'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProcessStore } from '@/lib/store';
import { formatDuration } from '@/lib/helpers';
import { useI18n } from '@/lib/i18n-context';
import { Play, Pause, RotateCcw, Clock, Timer } from 'lucide-react';

export default function ProcessTimer() {
  const { t } = useI18n();
  const process = useProcessStore((state) => state.process);
  const startProcessTimer = useProcessStore((state) => state.startProcessTimer);
  const pauseProcessTimer = useProcessStore((state) => state.pauseProcessTimer);
  const getElapsedTime = useProcessStore((state) => state.getElapsedTime);
  
  const [displayTime, setDisplayTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const timeTracking = process?.timeTracking;
  const status = timeTracking?.status || 'idle';
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';
  const sessionsCount = timeTracking?.sessions?.length || 0;

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
      {/* Timer Icon and Display */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-full ${
          isRunning 
            ? 'bg-green-100 text-green-600 animate-pulse' 
            : isPaused 
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-gray-100 text-gray-500'
        }`}>
          <Timer className="w-4 h-4" />
        </div>
        
        <div className="flex flex-col">
          <span className={`font-mono text-lg font-bold ${
            isRunning 
              ? 'text-green-600' 
              : isPaused 
                ? 'text-yellow-600'
                : 'text-gray-600'
          }`}>
            {formatDuration(displayTime)}
          </span>
          <span className="text-xs text-gray-500">
            {isRunning && t('timer.running')}
            {isPaused && t('timer.paused')}
            {isIdle && t('timer.idle')}
            {sessionsCount > 0 && ` (${sessionsCount} ${sessionsCount === 1 ? 'sesión' : 'sesiones'})`}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1 ml-2">
        {(isIdle || isPaused) && (
          <button
            onClick={handleStart}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            title={isIdle ? t('timer.start') : t('timer.resume')}
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">{isIdle ? t('timer.start') : t('timer.resume')}</span>
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
            title={t('timer.pause')}
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">{t('timer.pause')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
