'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProcessStore } from '@/lib/store';
import { DynamicLinkYAML, CapturedVariables } from '@/lib/types';
import { ExternalLink, Lock, Rocket, Link2 } from 'lucide-react';

interface DynamicLinkButtonProps {
  link: DynamicLinkYAML;
  taskId?: string;
  phaseId?: string;
}

function interpolateUrl(template: string, variables: CapturedVariables): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

function hasUnresolvedVariables(url: string): boolean {
  return /\{(\w+)\}/.test(url);
}

export default function DynamicLinkButton({ link, taskId, phaseId }: DynamicLinkButtonProps) {
  const process = useProcessStore((state) => state?.process);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const capturedVariables = process?.capturedVariables || {};
  const interpolatedUrl = interpolateUrl(link.urlTemplate, capturedVariables);
  const isActive = !hasUnresolvedVariables(interpolatedUrl);
  
  // Check if specific required variables are filled
  const requiredVarsFilled = link.requiresVariables 
    ? link.requiresVariables.every((v) => capturedVariables[v] && capturedVariables[v].trim() !== '')
    : true;

  const canActivate = isActive && requiredVarsFilled;

  // Auto-open logic
  const handleAutoOpen = useCallback(() => {
    if (link.behavior === 'auto' && canActivate && !hasAutoOpened) {
      const delay = (link.delay || 0) * 1000;
      const timeoutId = setTimeout(() => {
        const newTab = link.newTab !== false;
        window.open(interpolatedUrl, newTab ? '_blank' : '_self');
        setHasAutoOpened(true);
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [link.behavior, link.delay, link.newTab, canActivate, hasAutoOpened, interpolatedUrl]);

  useEffect(() => {
    const cleanup = handleAutoOpen();
    return cleanup;
  }, [handleAutoOpen]);

  // Reset auto-open state when URL changes (variables updated)
  useEffect(() => {
    setHasAutoOpened(false);
  }, [interpolatedUrl]);

  const handleClick = () => {
    if (!canActivate) return;
    
    const newTab = link.newTab !== false;
    window.open(interpolatedUrl, newTab ? '_blank' : '_self');
    
    if (link.behavior === 'auto') {
      setHasAutoOpened(true);
    }
  };

  // Render based on state
  if (!canActivate) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed border border-gray-200"
        title="Complete las variables requeridas para activar este link"
      >
        <Lock className="w-4 h-4" />
        <span>{link.label}</span>
      </button>
    );
  }

  // Active link - auto behavior
  if (link.behavior === 'auto') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative inline-flex"
      >
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
            hasAutoOpened
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 animate-pulse'
          }`}
        >
          <Rocket className="w-4 h-4" />
          <span>{link.label}</span>
          {hasAutoOpened && <span className="text-xs">(abierto)</span>}
        </button>
        
        {isHovered && (
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
            {hasAutoOpened ? 'Click para reabrir' : 'Se abrirá automáticamente'}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    );
  }

  // Active link - click behavior
  return (
    <a
      href={interpolatedUrl}
      target={link.newTab !== false ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100 transition-colors border border-indigo-200"
    >
      <Link2 className="w-4 h-4" />
      <span>{link.label}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

interface DynamicLinksListProps {
  links: DynamicLinkYAML[];
  taskId?: string;
  phaseId?: string;
}

export function DynamicLinksList({ links, taskId, phaseId }: DynamicLinksListProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Links Dinámicos
      </h4>
      <div className="flex flex-wrap gap-2">
        {links.map((link, idx) => (
          <DynamicLinkButton
            key={`${taskId || phaseId}-link-${idx}`}
            link={link}
            taskId={taskId}
            phaseId={phaseId}
          />
        ))}
      </div>
    </div>
  );
}
