'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getSeverityStyles, useReducedMotion } from '@/lib/alert-feedback';
import { useI18n } from '@/lib/i18n-context';
import type { CompletionAlertConfig } from '@/lib/types';

interface CompletionAlertDialogProps {
  /** Dialog open state controlled by the parent. */
  open: boolean;
  /** Setter for the open state (also invoked when the user dismisses). */
  onOpenChange: (open: boolean) => void;
  /** Alert configuration from the task YAML. */
  alert: CompletionAlertConfig;
  /** Fallback title when the YAML omits `title`. Typically the task name. */
  taskName: string;
  /** Fired when the user presses the confirm button. */
  onConfirm: () => void;
}

/**
 * Confirmation dialog shown before a task is finalized, when its YAML
 * declares `completionAlert`. Cancel keeps the task pending.
 *
 * Styling is driven entirely by `alert.severity` via `getSeverityStyles`
 * to keep a single source of truth (see docs Parte I.10).
 */
export function CompletionAlertDialog({
  open,
  onOpenChange,
  alert,
  taskName,
  onConfirm,
}: CompletionAlertDialogProps) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();
  const styles = getSeverityStyles(alert.severity);
  const { Icon } = styles;

  const title = alert.title ?? `${t('alert.completion.defaultTitle')}: ${taskName}`;
  const confirmLabel = alert.confirmLabel ?? t('common.confirm');
  const cancelLabel = alert.cancelLabel ?? t('common.cancel');

  const animationClass = reducedMotion ? '' : styles.flashAnimationClass;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-testid="completion-alert-dialog"
        data-severity={alert.severity ?? 'info'}
        aria-label={styles.ariaLabel}
        className={`${styles.containerClass} ${animationClass}`.trim()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`w-6 h-6 ${styles.iconClass}`} aria-hidden="true" />
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {alert.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid="completion-alert-cancel"
            className={styles.cancelButtonClass}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="completion-alert-confirm"
            onClick={onConfirm}
            className={styles.confirmButtonClass}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
