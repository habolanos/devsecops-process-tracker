/**
 * Single source of truth for visual styling of the completion-alert dialog.
 * Maps `CompletionAlertSeverity` -> icon + Tailwind classes + ARIA semantics.
 *
 * Per docs/features/completion-alerts-and-decision-tasks.md (Parte I.10):
 *  - `info`     => blue, thin border, no pulse
 *  - `warning`  => amber, thick border + soft pulse
 *  - `critical` => red, thick border + stronger pulse, destructive confirm button
 *
 * Animation respects `prefers-reduced-motion: reduce`: the hook
 * `useReducedMotion()` returns the OS-level preference so the dialog
 * can opt out of animation while keeping color + icon (WCAG 1.4.1).
 */

import { useEffect, useState } from 'react';
import { Info, AlertTriangle, AlertOctagon, type LucideIcon } from 'lucide-react';
import type { CompletionAlertSeverity } from './types';

export interface SeverityStyles {
  /** Lucide icon component to render in the dialog header. */
  Icon: LucideIcon;
  /** Tailwind color classes for the icon element. */
  iconClass: string;
  /** Tailwind classes for the dialog border + subtle background. */
  containerClass: string;
  /** Tailwind classes for the confirm button. */
  confirmButtonClass: string;
  /** Tailwind classes for the cancel button. */
  cancelButtonClass: string;
  /** Tailwind class for the opening-flash animation (empty if none). */
  flashAnimationClass: string;
  /** ARIA role for assistive tech (alert vs alertdialog default). */
  ariaRole: 'alertdialog';
  /** Short label read aloud by screen readers. */
  ariaLabel: string;
}

const STYLES: Record<CompletionAlertSeverity, SeverityStyles> = {
  info: {
    Icon: Info,
    iconClass: 'text-blue-500',
    containerClass: 'border-blue-200 bg-blue-50/50',
    confirmButtonClass: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium',
    cancelButtonClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium',
    flashAnimationClass: '',
    ariaRole: 'alertdialog',
    ariaLabel: 'Confirmación informativa',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-amber-500',
    containerClass: 'border-amber-300 border-2 bg-amber-50/60',
    confirmButtonClass: 'bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-md font-medium',
    cancelButtonClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium',
    flashAnimationClass: 'animate-pulse-once',
    ariaRole: 'alertdialog',
    ariaLabel: 'Advertencia de confirmación',
  },
  critical: {
    Icon: AlertOctagon,
    iconClass: 'text-red-600',
    containerClass: 'border-red-500 border-2 bg-red-50',
    confirmButtonClass: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-medium',
    cancelButtonClass: 'bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md font-medium',
    flashAnimationClass: 'animate-pulse-strong',
    ariaRole: 'alertdialog',
    ariaLabel: 'Acción crítica: confirmación requerida',
  },
};

/**
 * Returns the canonical styling for a completion-alert severity.
 * Unknown severities fall back to 'info'.
 */
export function getSeverityStyles(
  severity: CompletionAlertSeverity | undefined,
): SeverityStyles {
  return STYLES[severity ?? 'info'] ?? STYLES.info;
}

/**
 * React hook that reflects the user's OS-level `prefers-reduced-motion` setting.
 * Returns `true` when animations should be suppressed.
 * Safe on SSR (returns `false` until mount).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mql) return;
    const update = () => setReduced(!!mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);
  return reduced;
}
