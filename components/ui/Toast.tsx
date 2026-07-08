'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';

// Top pill toast: green-check icon, message, and an optional inline action
// (e.g. "Edit" / "Undo"). Auto-dismisses after `duration` ms.
export function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div className="pill-toast" role="status">
      <span className="pill-toast-icon" aria-hidden="true">
        <Check size={13} strokeWidth={3} />
      </span>
      <span className="pill-toast-msg">{message}</span>
      {actionLabel ? (
        <button type="button" className="pill-toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
